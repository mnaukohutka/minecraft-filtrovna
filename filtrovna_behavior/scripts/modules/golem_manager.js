// golem_manager.js — Mini Copper Golem: sběr, oxidace, ender truhla, paměť, teamwork.
import { world, system } from "@minecraft/server";
import { getEntityData, setEntityData, getBlockData, setBlockData, KEYS, blockKey } from "./storage.js";
import { get } from "./config.js";
import { getGolemOwner, setGolemOwner, canModifyGolem } from "./owner.js";
import { getGolemStats, updateGolemStats, grantAchievement } from "./stats.js";
import { spawnCopperTrail } from "./effects.js";
import { getBlockContainer } from "./inventory_manager.js";

const GOLEM_TYPE = "filtrovna:mini_copper_golem";
const FILTR_TYPE = "filtrovna:filtr";
const STORAGE_TYPES = ["minecraft:chest", "minecraft:barrel", "minecraft:hopper",
  "minecraft:shulker_box", "minecraft:ender_chest",
  "minecraft:white_shulker_box", "minecraft:orange_shulker_box", "minecraft:magenta_shulker_box",
  "minecraft:light_blue_shulker_box", "minecraft:yellow_shulker_box", "minecraft:lime_shulker_box",
  "minecraft:pink_shulker_box", "minecraft:gray_shulker_box", "minecraft:light_gray_shulker_box",
  "minecraft:cyan_shulker_box", "minecraft:purple_shulker_box", "minecraft:blue_shulker_box",
  "minecraft:brown_shulker_box", "minecraft:green_shulker_box", "minecraft:red_shulker_box",
  "minecraft:black_shulker_box"];
const OXIDATION_MAX = 3;
const OXIDATION_INTERVAL_MS = 10 * 60 * 1000; // 10 minut na fázi.
const SCAN_RADIUS = 8;

export function registerGolemManager() {
  // Tick pro AI golemů.
  const tickInterval = get("golem.tick_interval") ?? 20;
  system.runInterval(() => {
    for (const dim of ["overworld", "nether", "the_end"]) {
      let dimension;
      try { dimension = world.getDimension(dim); } catch { continue; }
      let golems = [];
      try { golems = dimension.getEntities({ type: GOLEM_TYPE }); } catch { continue; }
      for (const golem of golems) {
        try { tickGolem(golem, dimension); } catch (e) {
          console.warn(`[Filtrovna] tickGolem chyba: ${e}`);
        }
      }
    }
  }, tickInterval);

  // Učení golema: sneak + pravý klik na Filtr/truhlu.
  world.afterEvents.playerInteractWithBlock.subscribe((event) => {
    if (!event.player.isSneaking) return;
    const hand = event.player.getComponent("minecraft:inventory").container.getItem(event.player.selectedSlotIndex);
    // Pokud drží copper_ingot, je to učení.
    if (hand?.typeId !== "minecraft:copper_ingot") return;
    const block = event.block;
    if (block.typeId !== FILTR_TYPE && !STORAGE_TYPES.includes(block.typeId)) return;

    // Najdi nejbližšího golema v dosahu.
    const dim = block.dimension;
    const golems = dim.getEntities({ type: GOLEM_TYPE, location: block.location, maxDistance: 6 });
    if (golems.length === 0) {
      event.player.sendMessage("§cŽádný golem v dosahu (do 6 bloků).");
      return;
    }
    const golem = golems[0];
    if (!canModifyGolem(event.player, golem)) {
      event.player.sendMessage("§cTento golem není tvůj.");
      return;
    }
    teachGolem(golem, block, event.player);
    // Spotřebuj jeden copper_ingot.
    if (hand.amount > 1) {
      hand.amount -= 1;
    } else {
      event.player.getComponent("minecraft:inventory").container.setItem(event.player.selectedSlotIndex, undefined);
    }
  });

  // Spawn golema → nastav majitele (kdo vyvolal).
  world.afterEvents.entitySpawn.subscribe((event) => {
    if (event.entity.typeId !== GOLEM_TYPE) return;
    // Majitel bude nastaven při učení, výchozí = null.
    setEntityData(event.entity, KEYS.GOLEM_OXIDATION, { level: 0, lastUpdate: Date.now() });
    try {
      event.entity.setProperty("filtrovna:oxidation", 0);
    } catch {}
  });

  // Voskování: pravý klik s honeycomb (bez sneak) resetuje oxidaci.
  world.afterEvents.playerInteractWithEntity.subscribe((event) => {
    if (event.targetEntity.typeId !== GOLEM_TYPE) return;
    const hand = event.player.getComponent("minecraft:inventory").container.getItem(event.player.selectedSlotIndex);
    if (hand?.typeId !== "minecraft:honeycomb") return;
    if (!canModifyGolem(event.player, event.targetEntity)) return;
    resetOxidation(event.targetEntity);
    event.player.sendMessage("§aGolem voskován — vrátil se do měděného stavu.");
    if (hand.amount > 1) {
      hand.amount -= 1;
    } else {
      event.player.getComponent("minecraft:inventory").container.setItem(event.player.selectedSlotIndex, undefined);
    }
  });
}

function tickGolem(golem, dimension) {
  // Oxidace.
  oxidizeTick(golem);

  // Particle trail.
  spawnCopperTrail(golem.location, dimension);

  // AI cyklus: sběr → Filtr → třídění → MATCH → sklad.
  const inv = golem.getComponent("minecraft:inventory")?.container;
  if (!inv) return;

  // Krok 1: Pokud má golem předměty, dones je do Filtru.
  const hasItems = countItems(inv) > 0;
  const filtrMemory = getEntityData(golem, KEYS.GOLEM_FILTR_MEMORY, []);
  const storageMemory = getEntityData(golem, KEYS.GOLEM_STORAGE_MEMORY, []);

  if (hasItems && filtrMemory.length > 0) {
    // Najdi nejbližší Filtr v paměti a dones předměty.
    const target = findNearestMemoryTarget(golem, filtrMemory, dimension, FILTR_TYPE);
    if (target) {
      const dist = distance(golem.location, target.location);
      if (dist < 2.0) {
        // Vlož předměty do VSTUP slotů Filtru.
        depositToFiltr(golem, inv, target);
      } else {
        // Jdi k Filtru.
        moveTo(golem, target.location);
      }
      return;
    }
  }

  // Krok 2: Pokud má předměty a není Filtr, dones do skladu.
  if (hasItems && storageMemory.length > 0) {
    const target = findNearestMemoryTarget(golem, storageMemory, dimension, null);
    if (target) {
      const dist = distance(golem.location, target.location);
      if (dist < 2.0) {
        depositToStorage(golem, inv, target);
      } else {
        moveTo(golem, target.location);
      }
      return;
    }
  }

  // Krok 3: Pokud nemá předměty, hledej item entity na zemi.
  if (!hasItems) {
    collectItems(golem, inv, dimension);
  }
}

// ---- Oxidace / nabíjení ----
export function getOxidation(entity) {
  if (get("golem.enable_oxidation") !== true) return 0;
  const data = getEntityData(entity, KEYS.GOLEM_OXIDATION, { level: 0, lastUpdate: Date.now() });
  return data.level ?? 0;
}

export function setOxidation(entity, level) {
  if (get("golem.enable_oxidation") !== true) return;
  const clamped = Math.max(0, Math.min(OXIDATION_MAX, level));
  setEntityData(entity, KEYS.GOLEM_OXIDATION, { level: clamped, lastUpdate: Date.now() });
  try { entity.setProperty("filtrovna:oxidation", clamped); } catch {}
}

export function oxidizeTick(entity) {
  if (get("golem.enable_oxidation") !== true) return;
  const data = getEntityData(entity, KEYS.GOLEM_OXIDATION, { level: 0, lastUpdate: Date.now() });
  const now = Date.now();
  if (now - data.lastUpdate >= OXIDATION_INTERVAL_MS && data.level < OXIDATION_MAX) {
    data.level += 1;
    data.lastUpdate = now;
    setEntityData(entity, KEYS.GOLEM_OXIDATION, data);
    try { entity.setProperty("filtrovna:oxidation", data.level); } catch {}
  }
}

export function resetOxidation(entity) {
  if (get("golem.enable_oxidation") !== true) return;
  setEntityData(entity, KEYS.GOLEM_OXIDATION, { level: 0, lastUpdate: Date.now() });
  try { entity.setProperty("filtrovna:oxidation", 0); } catch {}
}

// Rychlostní multiplikátor podle oxidace (-10% na fázi).
export function getSpeedMultiplier(entity) {
  const base = get("golem.speed_multiplier") ?? 1.0;
  if (get("golem.enable_oxidation") !== true) return base;
  const level = getOxidation(entity);
  return base * (1 - 0.1 * level);
}

// ---- Paměť ----
function teachGolem(golem, block, player) {
  if (block.typeId === FILTR_TYPE) {
    const memory = getEntityData(golem, KEYS.GOLEM_FILTR_MEMORY, []);
    const max = get("golem.max_filtr_memory") ?? 15;
    const key = blockKey(block);
    if (memory.includes(key)) {
      player.sendMessage("§eGolem už tento Filtr zná.");
      return;
    }
    if (memory.length >= max) {
      player.sendMessage("§cGolem má plnou paměť Filtrů.");
      return;
    }
    memory.push(key);
    setEntityData(golem, KEYS.GOLEM_FILTR_MEMORY, memory);
    setGolemOwner(golem, player.id);
    player.sendMessage("§aGolem si zapamatoval Filtr.");
  } else if (STORAGE_TYPES.includes(block.typeId)) {
    const memory = getEntityData(golem, KEYS.GOLEM_STORAGE_MEMORY, []);
    const max = get("golem.max_storage_memory") ?? 15;
    const key = blockKey(block);
    if (memory.includes(key)) {
      player.sendMessage("§eGolem už tento sklad zná.");
      return;
    }
    if (memory.length >= max) {
      player.sendMessage("§cGolem má plnou paměť skladů.");
      return;
    }
    memory.push(key);
    setEntityData(golem, KEYS.GOLEM_STORAGE_MEMORY, memory);
    if (block.typeId === "minecraft:ender_chest") {
      player.sendMessage("§aGolem si zapamatoval ender truhlu.");
    } else {
      player.sendMessage("§aGolem si zapamatoval skladovací truhlu.");
    }
  }
}

function findNearestMemoryTarget(golem, memory, dimension, expectedType) {
  let best = null;
  let bestDist = Infinity;
  for (const key of memory) {
    const parts = key.split("|");
    const dimId = parts[0];
    if (dimId !== dimension.id) continue;
    const loc = { x: parseFloat(parts[1]), y: parseFloat(parts[2]), z: parseFloat(parts[3]) };
    const d = distance(golem.location, loc);
    if (d < bestDist) {
      const block = dimension.getBlock({ x: Math.floor(loc.x), y: Math.floor(loc.y), z: Math.floor(loc.z) });
      if (block && (expectedType === null || block.typeId === expectedType)) {
        best = block;
        bestDist = d;
      }
    }
  }
  return best;
}

// ---- Sběr předmětů ----
function collectItems(golem, inv, dimension) {
  let items = [];
  try {
    items = dimension.getEntities({
      type: "minecraft:item",
      location: golem.location,
      maxDistance: SCAN_RADIUS
    });
  } catch { return; }

  for (const itemEntity of items) {
    const dist = distance(golem.location, itemEntity.location);
    if (dist < 1.5) {
      // Seber.
      const itemComp = itemEntity.getComponent("minecraft:item");
      if (itemComp?.itemStack) {
        const rem = inv.addItem(itemComp.itemStack);
        if (rem === undefined) {
          try { itemEntity.remove(); } catch {}
          const stats = getGolemStats(golem);
          updateGolemStats(golem, { collected: stats.collected + 1 });
        }
      }
    } else {
      moveTo(golem, itemEntity.location);
      return;
    }
  }
}

// ---- Vkládání do Filtru ----
function depositToFiltr(golem, inv, block) {
  const container = getBlockContainer(block);
  if (!container) return;
  let deposited = 0;
  for (let i = 0; i < inv.size; i++) {
    const item = inv.getItem(i);
    if (!item) continue;
    // Vlož do VSTUP slotů (0–8).
    for (let slot = 0; slot < 9; slot++) {
      if (!container.getItem(slot)) {
        container.setItem(slot, item.clone());
        inv.setItem(i, undefined);
        deposited++;
        break;
      }
    }
  }
  if (deposited > 0) {
    try { golem.playSound("mob.copper_golem.chest_interaction.put_item", { volume: 0.5, pitch: 1.2 }); } catch {}
    const stats = getGolemStats(golem);
    updateGolemStats(golem, { sorted: stats.sorted + deposited });
  }
}

// ---- Vkládání do skladu ----
function depositToStorage(golem, inv, block) {
  if (block.typeId === "minecraft:ender_chest" && get("golem.enable_ender_chest_support") === true) {
    // Ender truhla: vlož do ender inventáře majitele.
    const ownerId = getGolemOwner(golem);
    if (ownerId) {
      try {
        const player = world.getEntity(ownerId);
        if (player) {
          const enderInv = player.getComponent("minecraft:inventory")?.container;
          if (enderInv) {
            for (let i = 0; i < inv.size; i++) {
              const item = inv.getItem(i);
              if (item) {
                const rem = enderInv.addItem(item);
                if (rem === undefined) inv.setItem(i, undefined);
              }
            }
            try { golem.playSound("mob.copper_golem.chest_interaction.put_item", { volume: 0.5, pitch: 1.2 }); } catch {}
            return;
          }
        }
      } catch {}
    }
  }
  // Běžná truhla/barrel/hopper/shulker.
  const invComp = block.getComponent("minecraft:inventory");
  if (!invComp?.container) return;
  for (let i = 0; i < inv.size; i++) {
    const item = inv.getItem(i);
    if (item) {
      const rem = invComp.container.addItem(item);
      if (rem === undefined) inv.setItem(i, undefined);
    }
  }
  try { golem.playSound("mob.copper_golem.chest_interaction.put_item", { volume: 0.5, pitch: 1.2 }); } catch {}
}

// ---- Pomocné funkce ----
function countItems(inv) {
  let count = 0;
  for (let i = 0; i < inv.size; i++) {
    if (inv.getItem(i)) count++;
  }
  return count;
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function moveTo(golem, target) {
  try {
    golem.applyImpulse({
      x: Math.sign(target.x - golem.location.x) * 0.2,
      y: 0,
      z: Math.sign(target.z - golem.location.z) * 0.2
    });
  } catch {}
}

// inventory_manager.js — Správa neviditelné inventář entity pro Filtr blok (Část 6).
import { world } from "@minecraft/server";
import { KEYS, getBlockData, setBlockData } from "./storage.js";

const ENTITY_TYPE = "filtrovna:filtr_entity";

// Bloky, které používají inventářovou entitu (jinak by repairTrackingOnLoad
// entity Masteru/Smart Hopperu omylem odstranil).
const BLOCKS_WITH_ENTITY = new Set([
  "filtrovna:filtr",
  "filtrovna:filtr_master",
  "filtrovna:smart_hopper"
]);

export function getInventoryEntity(block) {
  const entityId = getBlockData(block, KEYS.FILTR_ENTITY, null);
  if (entityId && typeof entityId === "string") {
    try {
      const entity = world.getEntity(entityId);
      if (entity) return entity;
    } catch {}
  }
  // Fallback: najdi entitu podle pozice (např. po zničení bloku už
  // dynamic properties bloku neexistují a ID by se jinak ztratilo).
  try {
    const center = {
      x: block.location.x + 0.5,
      y: block.location.y + 0.5,
      z: block.location.z + 0.5
    };
    const found = block.dimension.getEntities({
      type: ENTITY_TYPE,
      location: center,
      maxDistance: 0.75
    });
    return found[0];
  } catch {
    return undefined;
  }
}

export function getBlockContainer(block) {
  const entity = getInventoryEntity(block);
  if (!entity) return undefined;
  const inv = entity.getComponent("minecraft:inventory");
  return inv?.container;
}

export function createInventoryForBlock(block) {
  const existing = getInventoryEntity(block);
  if (existing) return existing;
  const loc = {
    x: block.location.x + 0.5,
    y: block.location.y + 0.5,
    z: block.location.z + 0.5
  };
  try {
    const entity = block.dimension.spawnEntity(ENTITY_TYPE, loc);
    setBlockData(block, KEYS.FILTR_ENTITY, entity.id);
    return entity;
  } catch (e) {
    console.warn(`[Filtrovna] createInventoryForBlock spawn selhal: ${e}`);
    return undefined;
  }
}

export function removeInventoryForBlock(block) {
  const entity = getInventoryEntity(block);
  if (entity) {
    try { entity.remove(); } catch {}
  }
  setBlockData(block, KEYS.FILTR_ENTITY, undefined);
}

export function ensureInventoryForBlock(block) {
  // Pokus 1: Vrať existující kontejner (bez loggingu pro běžný případ).
  const existing = getBlockContainer(block);
  if (existing) return existing;

  // Pokus 2-4: Vytvoř a ověř inventář entitu.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const entity = createInventoryForBlock(block);
      if (!entity) {
        if (attempt === 0) console.warn(`[Filtrovna] ensureInventoryForBlock: create vrátil null`);
        continue;
      }

      const inv = entity.getComponent("minecraft:inventory");
      if (inv?.container) {
        return inv.container; // Úspěch!
      }

      // Komponenta chybí — entita je špatná, odstraň ji
      try {
        entity.remove();
        if (attempt === 0) console.warn(`[Filtrovna] ensureInventoryForBlock: entita bez inventory komponenty`);
      } catch {}
    } catch (e) {
      if (attempt === 0) console.warn(`[Filtrovna] ensureInventoryForBlock pokus ${attempt + 1} selhalo: ${e}`);
      try { 
        const entity = getInventoryEntity(block);
        if (entity) entity.remove();
      } catch {}
    }
  }

  console.warn(`[Filtrovna] ensureInventoryForBlock: nelze vytvořit funkční inventář pro ${block.typeId} na [${block.location.x},${block.location.y},${block.location.z}] po 3 pokusech`);
  return undefined;
}

// Oprava po reloadu světa: odstranění osiřelých entit (bez bloku).
export function repairTrackingOnLoad() {
  for (const dim of ["overworld", "nether", "the_end"]) {
    let dimension;
    try { dimension = world.getDimension(dim); } catch { continue; }
    const entities = dimension.getEntities({ type: ENTITY_TYPE });
    for (const e of entities) {
      const bx = Math.floor(e.location.x);
      const by = Math.floor(e.location.y);
      const bz = Math.floor(e.location.z);
      const b = dimension.getBlock({ x: bx, y: by, z: bz });
      if (!b || !BLOCKS_WITH_ENTITY.has(b.typeId)) {
        try { e.remove(); } catch {}
      }
    }
  }
}

export function registerInventoryManager() {
  try {
    const obj = world.scoreboard.getObjective("filtrovna_stats");
    if (!obj) {
      world.scoreboard.addObjective("filtrovna_stats", "Filtrovna Stats");
    }
  } catch {}
}

export function initLoadedChunks() {
  repairTrackingOnLoad();
}

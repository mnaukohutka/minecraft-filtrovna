// ui_handler.js — Custom UI přes server-ui (Část 5) + custom komponenty pro interakci.
import { world, system } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { getBlockContainer, ensureInventoryForBlock } from "./inventory_manager.js";
import { getBlockData, setBlockData, KEYS } from "./storage.js";
import { getBlockState, getStateName, playSound } from "./animation_controller.js";
import { get } from "./config.js";

const FILTR_ID = "filtrovna:filtr";

// Registrace custom komponenty pro interakci (pravý klik → otevře UI).
export function registerBlockComponents() {
  try {
    world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
      const block = event.block;
      if (block.typeId !== FILTR_ID) return;
      const player = event.player;
      // Pokud hráč sneakuje, necháme default interakci.
      if (player.isSneaking) return;
      event.cancel = true;
      system.run(() => openFiltrUI(player, block));
    });
  } catch (e) {
    console.warn(`[Filtrovna] registerBlockComponents chyba: ${e}`);
  }
}

export function registerUIHandler() {
  // Filtr Master interakce.
  try {
    world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
      if (event.block.typeId !== "filtrovna:filtr_master") return;
      if (event.player.isSneaking) return;
      event.cancel = true;
      system.run(() => openMasterUI(event.player, event.block));
    });
  } catch {}
}

async function openFiltrUI(player, block) {
  const container = ensureInventoryForBlock(block);
  if (!container) {
    player.sendMessage("§c" + getLang(player, "filtrovna.command.error.no_container"));
    return;
  }

  // Zvuk otevření.
  playSound(block, "filtrovna.ui_open");

  const mode = getBlockData(block, KEYS.FILTR_MODE, "exact");
  const priority = getBlockData(block, KEYS.FILTR_PRIORITY, true);
  const batchSize = getBlockData(block, KEYS.FILTR_BATCH, 1);
  const state = getBlockState(block);

  const form = new ActionFormData()
    .title(getLang(player, "filtrovna.ui.title"))
    .body(`§7${getLang(player, "filtrovna.ui.status." + getStateName(state))}\n§7Mód: §e${mode}\n§7Priorita: §e${priority ? "ANO" : "NE"}\n§7Batch: §e${batchSize}`);

  // Sekce VSTUP (9 slotů).
  form.button("§e" + getLang(player, "filtrovna.ui.section.input"));
  // Sekce FILTR (nastavení).
  form.button("§b" + getLang(player, "filtrovna.ui.section.filter") + " — Nastavení");
  // Sekce MATCH (náhled).
  form.button("§a" + getLang(player, "filtrovna.ui.section.match"));
  // Sekce NE (náhled).
  form.button("§c" + getLang(player, "filtrovna.ui.section.ne"));
  // Vysypat.
  form.button("§6Vysypat MATCH");
  form.button("§6Vysypat NE");

  const response = await form.show(player);
  if (response.canceled) {
    playSound(block, "filtrovna.ui_close");
    return;
  }

  switch (response.selection) {
    case 0: await showSlotGrid(player, block, container, 0, 9, "VSTUP", true); break;
    case 1: await showFilterSettings(player, block, container); break;
    case 2: await showSlotGrid(player, block, container, 19, 9, "MATCH", false); break;
    case 3: await showSlotGrid(player, block, container, 28, 9, "NE", false); break;
    case 4: dumpSlotsToPlayer(player, container, 19, 9); break;
    case 5: dumpSlotsToPlayer(player, container, 28, 9); break;
  }
  playSound(block, "filtrovna.ui_close");
}

async function showSlotGrid(player, block, container, start, count, name, interactive) {
  const form = new ActionFormData().title(name).body(interactive ? "Klikni na slot pro akci." : "Read-only náhled.");
  for (let i = start; i < start + count; i++) {
    const item = container.getItem(i);
    const label = item ? `${item.typeId.replace("minecraft:", "")} x${item.amount}` : "— prázdné —";
    form.button(label, item ? undefined : undefined);
  }
  const resp = await form.show(player);
  if (resp.canceled) return;
  if (!interactive) return;
  const slot = start + resp.selection;
  const item = container.getItem(slot);
  const inv = player.getComponent("minecraft:inventory").container;
  if (item) {
    // Vrať hráči.
    inv.addItem(item);
    container.setItem(slot, undefined);
  } else {
    // Vlož z ruky.
    const hand = inv.getItem(player.selectedSlotIndex);
    if (hand) {
      container.setItem(slot, hand.clone());
      inv.setItem(player.selectedSlotIndex, undefined);
    }
  }
}

async function showFilterSettings(player, block, container) {
  const mode = getBlockData(block, KEYS.FILTR_MODE, "exact");
  const priority = getBlockData(block, KEYS.FILTR_PRIORITY, true);
  const batch = getBlockData(block, KEYS.FILTR_BATCH, 1);

  const form = new ModalFormData()
    .title("Filtr — Nastavení")
    .dropdown("Režim shody", ["exact (přesná)", "tag (tagy)", "mod (namespace)"],
      mode === "tag" ? 1 : mode === "mod" ? 2 : 0)
    .toggle("Prioritní fronta", { defaultValue: priority })
    .slider("Batch zpracování", 1, 9, 1, { defaultValue: batch });

  const resp = await form.show(player);
  if (resp.canceled) return;
  setBlockData(block, KEYS.FILTR_MODE, ["exact", "tag", "mod"][resp.formValues[0]]);
  setBlockData(block, KEYS.FILTR_PRIORITY, resp.formValues[1]);
  setBlockData(block, KEYS.FILTR_BATCH, resp.formValues[2]);
  player.sendMessage("§aNastavení uloženo.");
}

function dumpSlotsToPlayer(player, container, start, count) {
  if (get("ui.allow_item_dump_to_player") !== true) {
    player.sendMessage("§cVysypání není povoleno.");
    return;
  }
  const inv = player.getComponent("minecraft:inventory").container;
  let dumped = 0;
  for (let i = start; i < start + count; i++) {
    const item = container.getItem(i);
    if (item) {
      const rem = inv.addItem(item);
      if (rem === undefined) {
        container.setItem(i, undefined);
        dumped++;
      }
    }
  }
  player.sendMessage(`§aVysypáno ${dumped} stacků.`);
}

async function openMasterUI(player, block) {
  const linked = getBlockData(block, KEYS.MASTER_LINKED, []);
  const stats = getBlockData(block, KEYS.MASTER_STATS, { sorted: 0, redirected: 0, attempts: 0 });
  const form = new ActionFormData()
    .title("Filtr Master")
    .body(`§7Propojeno Filtrů: §e${linked.length}/${get("master.max_linked_filters") ?? 8}\n§7Vytříděno: §e${stats.sorted}\n§7Přesměrováno: §e${stats.redirected}`)
    .button("Propojit nejbližší Filtr")
    .button("Odpojit poslední Filtr")
    .button("Synchronizovat šablonu")
    .button("Zavřít");
  const resp = await form.show(player);
  if (resp.canceled) return;
  if (resp.selection === 0) {
    // Najdi nejbližší Filtr v dosahu 16 bloků.
    let found = null;
    for (const off of nearbyOffsets()) {
      const b = block.dimension.getBlock({ x: block.location.x + off.x, y: block.location.y + off.y, z: block.location.z + off.z });
      if (b && b.typeId === "filtrovna:filtr") {
        found = b;
        break;
      }
    }
    if (found && !linked.includes(storageKey(found))) {
      linked.push(storageKey(found));
      setBlockData(block, KEYS.MASTER_LINKED, linked);
      player.sendMessage("§aFiltr propojen.");
    } else {
      player.sendMessage("§cŽádný volný Filtr v dosahu.");
    }
  } else if (resp.selection === 1) {
    if (linked.length > 0) {
      linked.pop();
      setBlockData(block, KEYS.MASTER_LINKED, linked);
      player.sendMessage("§aFiltr odpojen.");
    }
  } else if (resp.selection === 2) {
    // Synchronizace FILTR slotů (9–18) z Master entity do všech propojených.
    const masterContainer = getBlockContainer(block);
    if (!masterContainer) return;
    const template = [];
    for (let i = 9; i < 19; i++) {
      const it = masterContainer.getItem(i);
      template.push(it ? { typeId: it.typeId, amount: it.amount } : null);
    }
    for (const key of linked) {
      const parts = key.split("|");
      const b = block.dimension.getBlock({ x: parseInt(parts[1]), y: parseInt(parts[2]), z: parseInt(parts[3]) });
      if (b && b.typeId === "filtrovna:filtr") {
        const c = getBlockContainer(b);
        if (c) {
          for (let i = 0; i < template.length; i++) {
            const t = template[i];
            c.setItem(9 + i, t ? new (await import("@minecraft/server")).ItemStack(t.typeId, t.amount) : undefined);
          }
        }
      }
    }
    player.sendMessage("§aŠablona synchronizována.");
  }
}

function storageKey(block) {
  return `${block.dimension.id}|${block.location.x}|${block.location.y}|${block.location.z}`;
}

function nearbyOffsets() {
  const offsets = [];
  for (let r = 1; r <= 16; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        for (let dz = -r; dz <= r; dz++) {
          if (Math.abs(dx) === r || Math.abs(dz) === r) {
            offsets.push({ x: dx, y: dy, z: dz });
          }
        }
      }
    }
  }
  return offsets;
}

function getLang(player, key) {
  // Zjednodušená lokalizace — vrací klíč pokud není CS.
  return key;
}

// smart_hopper.js — Smart Hopper: prioritní filtr + count mode (Nové funkce #5).
//
// OPRAVENO (2 fatální chyby):
//  1) dimension.getBlocks({ type }, ...) neexistuje → registr bloků (registry.js).
//  2) block.getComponent("minecraft:inventory") na CUSTOM BLOKU vrací vždy
//     undefined — custom bloky nemohou mít inventářovou komponentu (stejný
//     problém, pro který má Filtr inventářovou entitu, viz specifikace Část 6).
//     Smart Hopper proto používá stejnou neviditelnou inventářovou entitu:
//     sloty 0–4 = FILTR, sloty 5–36 = buffer.
import { system } from "@minecraft/server";
import { get } from "./config.js";
import { getItemValue } from "./item_data.js";
import { iterateBlocks } from "./registry.js";
import { ensureInventoryForBlock } from "./inventory_manager.js";
import { showSlotGrid } from "./ui_handler.js";

const HOPPER_TYPE = "filtrovna:smart_hopper";
const FILTER_SLOTS = 5; // 0–4 filtr, 5+ buffer

// Custom komponenta "filtrovna:on_interact_hopper" → náhled filtru.
export function handleInteract(player, block) {
  const container = ensureInventoryForBlock(block);
  if (!container) {
    player.sendMessage("§cChyba: Nelze získat inventář Smart Hopperu!");
    return;
  }
  system.run(() => showSlotGrid(player, block, container, 0, FILTER_SLOTS, "Smart Hopper — Filtr", true));
}

export function registerSmartHopperManager() {
  const cooldown = get("smart_hopper.transfer_cooldown_ticks") ?? 8;
  system.runInterval(() => {
    for (const block of iterateBlocks(HOPPER_TYPE)) {
      try { tickHopper(block, block.dimension); } catch (e) {
        console.warn(`[Filtrovna] tickHopper chyba: ${e}`);
      }
    }
  }, cooldown);
}

function tickHopper(block, dimension) {
  const container = ensureInventoryForBlock(block);
  if (!container) return;

  // Filtr (sloty 0–4).
  const filterIds = [];
  for (let i = 0; i < FILTER_SLOTS; i++) {
    const f = container.getItem(i);
    if (f) filterIds.push(f.typeId);
  }

  // Konfigurace režimu (strict vs priority) a limit pickupů za tick.
  const strictFilter = get("smart_hopper.strict_filter") === true;
  const maxPickups = Math.max(1, get("smart_hopper.max_pickups_per_tick") ?? 1);

  // Najdi item entity nad hopperem a seber prioritní.
  let items = [];
  try {
    items = dimension.getEntities({
      type: "minecraft:item",
      location: { x: block.location.x + 0.5, y: block.location.y + 1.0, z: block.location.z + 0.5 },
      maxDistance: 1.0
    });
  } catch { return; }

  // Seřaď podle priority (filtrované a vzácnější první). Comparator používá čitelný score.
  items.sort((a, b) => {
    const aItem = a.getComponent("minecraft:item")?.itemStack;
    const bItem = b.getComponent("minecraft:item")?.itemStack;
    if (!aItem || !bItem) return 0;
    const aFiltered = filterIds.includes(aItem.typeId) ? 1000 : 0;
    const bFiltered = filterIds.includes(bItem.typeId) ? 1000 : 0;
    const aScore = aFiltered + getItemValue(aItem.typeId);
    const bScore = bFiltered + getItemValue(bItem.typeId);
    return bScore - aScore;
  });

  let pickups = 0;
  for (const itemEntity of items) {
    if (pickups >= maxPickups) break;
    const itemComp = itemEntity.getComponent("minecraft:item");
    if (!itemComp?.itemStack) continue;
    const item = itemComp.itemStack;

    // Strict mode: pokud filtr obsahuje něco a item není v něm → přeskočit.
    if (strictFilter && filterIds.length > 0 && !filterIds.includes(item.typeId)) continue;

    // Priority mode: pokud není v filtru, pokračovat (má nižší prioritu díky comparatoru).

    // Vlož do bufferu (slot 5+).
    let placed = false;
    for (let i = FILTER_SLOTS; i < container.size; i++) {
      const existing = container.getItem(i);
      if (!existing) {
        container.setItem(i, item);
        placed = true;
        break;
      }
      if (existing.typeId === item.typeId && existing.isStackableWith(item) && existing.amount < existing.maxAmount) {
        existing.amount = Math.min(existing.maxAmount, existing.amount + item.amount);
        container.setItem(i, existing);
        placed = true;
        break;
      }
    }
    if (placed) {
      try { itemEntity.remove(); } catch {}
      pickups += 1;
    }
  }

  // Přenos dolů do kontejneru (vanilla blok inventář existuje jen u vanilla bloků).
  const below = dimension.getBlock({ x: block.location.x, y: block.location.y - 1, z: block.location.z });
  if (below) {
    const belowInv = below.getComponent("minecraft:inventory");
    if (belowInv?.container) {
      for (let i = FILTER_SLOTS; i < container.size; i++) {
        const item = container.getItem(i);
        if (item) {
          const rem = belowInv.container.addItem(item);
          if (rem === undefined) {
            container.setItem(i, undefined);
          }
          break;
        }
      }
    }
  }
}

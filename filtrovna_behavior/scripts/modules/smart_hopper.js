// smart_hopper.js — Smart Hopper: prioritní filtr + count mode (Nové funkce #5).
import { world, system } from "@minecraft/server";
import { getBlockData, setBlockData, KEYS } from "./storage.js";
import { get } from "./config.js";
import { getItemValue } from "./item_data.js";

const HOPPER_TYPE = "filtrovna:smart_hopper";

export function registerSmartHopperManager() {
  const cooldown = get("smart_hopper.transfer_cooldown_ticks") ?? 8;
  system.runInterval(() => {
    for (const dim of ["overworld", "nether", "the_end"]) {
      let dimension;
      try { dimension = world.getDimension(dim); } catch { continue; }
      let hoppers = [];
      try { hoppers = dimension.getBlocks({ type: HOPPER_TYPE }, { maxBlocks: 500 }); } catch { continue; }
      for (const hopper of hoppers) {
        try { tickHopper(hopper, dimension); } catch {}
      }
    }
  }, cooldown);
}

function tickHopper(block, dimension) {
  const invComp = block.getComponent("minecraft:inventory");
  if (!invComp?.container) return;
  const container = invComp.container;

  // Filtr (sloty 0–4), buffer (5+).
  const filterIds = [];
  for (let i = 0; i < 5; i++) {
    const f = container.getItem(i);
    if (f) filterIds.push(f.typeId);
  }

  // Najdi item entity nad hopperem a seber prioritní.
  let items = [];
  try {
    items = dimension.getEntities({
      type: "minecraft:item",
      location: { x: block.location.x + 0.5, y: block.location.y + 1.0, z: block.location.z + 0.5 },
      maxDistance: 1.0
    });
  } catch { return; }

  // Seřaď podle priority (filtrované a vzácnější první).
  items.sort((a, b) => {
    const aItem = a.getComponent("minecraft:item")?.itemStack;
    const bItem = b.getComponent("minecraft:item")?.itemStack;
    if (!aItem || !bItem) return 0;
    const aFiltered = filterIds.includes(aItem.typeId) ? 1000 : 0;
    const bFiltered = filterIds.includes(bItem.typeId) ? 1000 : 0;
    return (bFiltered + getItemValue(bItem.typeId)) - (aFiltered + getItemValue(aItem.typeId));
  });

  for (const itemEntity of items) {
    const itemComp = itemEntity.getComponent("minecraft:item");
    if (!itemComp?.itemStack) continue;
    const item = itemComp.itemStack;
    // Pokud je filtr a předmět nepasuje, přeskoč.
    if (filterIds.length > 0 && !filterIds.includes(item.typeId)) continue;
    // Vlož do bufferu (slot 5+).
    const rem = container.addItem(item);
    if (rem === undefined) {
      try { itemEntity.remove(); } catch {}
    } else {
      itemComp.itemStack = rem;
    }
    break;
  }

  // Přenos dolů do kontejneru.
  const below = dimension.getBlock({ x: block.location.x, y: block.location.y - 1, z: block.location.z });
  if (below) {
    const belowInv = below.getComponent("minecraft:inventory");
    if (belowInv?.container) {
      for (let i = 5; i < container.size; i++) {
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

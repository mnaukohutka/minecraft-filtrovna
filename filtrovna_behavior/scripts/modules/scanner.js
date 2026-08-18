// scanner.js — Item Scanner: redstone signál podle hodnoty předmětu (Nové funkce #7).
import { world, system } from "@minecraft/server";
import { getBlockData, setBlockData, KEYS } from "./storage.js";
import { getItemValue } from "./item_data.js";

const SCANNER_TYPE = "filtrovna:scanner";

export function registerScannerManager() {
  system.runInterval(() => {
    for (const dim of ["overworld", "nether", "the_end"]) {
      let dimension;
      try { dimension = world.getDimension(dim); } catch { continue; }
      let scanners = [];
      try { scanners = dimension.getBlocks({ type: SCANNER_TYPE }, { maxBlocks: 500 }); } catch { continue; }
      for (const scanner of scanners) {
        try { tickScanner(scanner, dimension); } catch {}
      }
    }
  }, 5);
}

function tickScanner(block, dimension) {
  // Najdi item entity na scanneru.
  let items = [];
  try {
    items = dimension.getEntities({
      type: "minecraft:item",
      location: block.location,
      maxDistance: 0.8
    });
  } catch { return; }

  let maxSignal = 0;
  const whitelist = getBlockData(block, KEYS.SCANNER_WHITELIST, []);
  const blacklist = getBlockData(block, KEYS.SCANNER_BLACKLIST, []);

  for (const item of items) {
    const itemComp = item.getComponent("minecraft:item");
    if (!itemComp?.itemStack) continue;
    const typeId = itemComp.itemStack.typeId;
    // Blacklist kontrola.
    if (blacklist.includes(typeId)) continue;
    // Whitelist: pokud je neprázdný, pouze whitelist předměty.
    if (whitelist.length > 0 && !whitelist.includes(typeId)) continue;
    const value = getItemValue(typeId);
    if (value > maxSignal) maxSignal = value;
  }

  // Emituj redstone signál — uložíme do stavu (scanner nemá nativní redstone,
  // ale můžeme nastavit block state nebo použít sousední redstone).
  // Zde ukládáme hodnotu pro případné použití.
  setBlockData(block, "filtrovna:scanner_signal", maxSignal);
}

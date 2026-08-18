// master.js — Filtr Master: propojení Filtrů, synchronizace, global matching (Nové funkce #3).
import { system } from "@minecraft/server";
import { iterateBlocks } from "./registry.js";
import { openMasterUI } from "./ui_handler.js";
import { getBlockData, setBlockData, KEYS, blockKey } from "./storage.js";
import { getBlockContainer } from "./inventory_manager.js";
import { get } from "./config.js";

const MASTER_TYPE = "filtrovna:filtr_master";
const FILTR_TYPE = "filtrovna:filtr";

// OPRAVENO: dimension.getBlocks({ type }, ...) neexistuje → registr bloků.
export function registerMasterManager() {
  system.runInterval(() => {
    for (const master of iterateBlocks(MASTER_TYPE)) {
      try { tickMaster(master, master.dimension); } catch (e) {
        console.warn(`[Filtrovna] tickMaster chyba: ${e}`);
      }
    }
  }, 40); // každé 2 sekundy.
}

// Custom komponenta "filtrovna:on_interact_master" → otevře Master UI.
// (Dříve ji main.js hledal jako master.handleInteract, která neexistovala.)
export function handleInteract(player, block) {
  openMasterUI(player, block);
}

function tickMaster(masterBlock, dimension) {
  const linked = getBlockData(masterBlock, KEYS.MASTER_LINKED, []);
  if (linked.length === 0) return;

  const stats = getBlockData(masterBlock, KEYS.MASTER_STATS, { sorted: 0, redirected: 0, attempts: 0 });
  stats.attempts++;

  // Global matching: pokud jeden Filtr má plný MATCH, přesměruj na jiný.
  if (get("master.enable_global_matching") === true) {
    for (const key of linked) {
      const parts = key.split("|");
      if (parts[0] !== dimension.id) continue;
      const loc = { x: parseInt(parts[1]), y: parseInt(parts[2]), z: parseInt(parts[3]) };
      const filtr = dimension.getBlock(loc);
      if (!filtr || filtr.typeId !== FILTR_TYPE) continue;
      const container = getBlockContainer(filtr);
      if (!container) continue;
      // Zkontroluj zda MATCH (19–27) je plný.
      let matchFull = true;
      for (let i = 19; i < 28; i++) {
        if (!container.getItem(i)) { matchFull = false; break; }
      }
      if (matchFull) {
        // Najdi jiný Filtr s volným MATCH.
        for (const otherKey of linked) {
          if (otherKey === key) continue;
          const op = otherKey.split("|");
          if (op[0] !== dimension.id) continue;
          const oLoc = { x: parseInt(op[1]), y: parseInt(op[2]), z: parseInt(op[3]) };
          const oFiltr = dimension.getBlock(oLoc);
          if (!oFiltr || oFiltr.typeId !== FILTR_TYPE) continue;
          const oContainer = getBlockContainer(oFiltr);
          if (!oContainer) continue;
          for (let i = 19; i < 28; i++) {
            if (!oContainer.getItem(i)) {
              // Přesuň jeden stack.
              for (let j = 19; j < 28; j++) {
                const item = container.getItem(j);
                if (item) {
                  oContainer.setItem(i, item.clone());
                  container.setItem(j, undefined);
                  stats.redirected++;
                  break;
                }
              }
              break;
            }
          }
        }
      }
    }
  }

  setBlockData(masterBlock, KEYS.MASTER_STATS, stats);
}

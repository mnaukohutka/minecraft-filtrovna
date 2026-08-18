// events.js — Event-driven architektura (Část 10): pokládka, zničení, registry.
//
// OPRAVENO:
//  - Registrace položených bloků do registry.js (původně žádná evidence
//    neexistovala a getBlocks workaround v tickerech nefungoval).
//  - Inventářová entita se vytváří i pro Filtr Master a Smart Hopper
//    (oba v UI používají getBlockContainer — bez entity by UI spadlo).
//  - Při zničení se odstraní záznam z registru a inventářová entita.
import { world } from "@minecraft/server";
import { ensureInventoryForBlock, removeInventoryForBlock } from "./inventory_manager.js";
import { setBlockData, KEYS } from "./storage.js";
import { registerBlockPos, unregisterBlockPos } from "./registry.js";

const FILTR_ID = "filtrovna:filtr";

// Všechny custom bloky addonu, které se mají evidovat v registru.
const TRACKED_BLOCKS = new Set([
  FILTR_ID,
  "filtrovna:filtr_master",
  "filtrovna:conveyor",
  "filtrovna:smart_hopper",
  "filtrovna:golem_dock",
  "filtrovna:scanner"
]);

// Bloky, které mají inventářovou entitu (custom bloky inventář nemohou mít).
const INVENTORY_BLOCKS = new Set([
  FILTR_ID,
  "filtrovna:filtr_master",
  "filtrovna:smart_hopper"
]);

export function registerEvents() {
  // Pokládka bloku → registr + případně inventářová entita + majitel.
  world.afterEvents.playerPlaceBlock.subscribe((event) => {
    const block = event.block;
    if (!TRACKED_BLOCKS.has(block.typeId)) return;

    registerBlockPos(block);

    if (INVENTORY_BLOCKS.has(block.typeId)) {
      ensureInventoryForBlock(block);
    }

    if (block.typeId === FILTR_ID) {
      setBlockData(block, KEYS.FILTR_OWNER, event.player.id);
      setBlockData(block, KEYS.FILTR_MODE, "exact");
      setBlockData(block, KEYS.FILTR_PRIORITY, true);
      setBlockData(block, KEYS.FILTR_BATCH, 1);
      setBlockData(block, KEYS.FILTR_ENERGY, { value: 100, lastRegen: Date.now() });
    }
  });

  // Zničení bloku → drop obsahu inventáře + zánik entity + odregistrace.
  // POZOR: v playerBreakBlock je blok už vzduch — proto se typ čte
  // z brokenBlockPermutation a obsah se vysype z entity (ta ještě existuje).
  world.afterEvents.playerBreakBlock.subscribe((event) => {
    const { block, brokenBlockPermutation } = event;
    const typeId = brokenBlockPermutation.type.id;
    if (!TRACKED_BLOCKS.has(typeId)) return;

    if (INVENTORY_BLOCKS.has(typeId)) {
      const container = ensureInventoryForBlock(block);
      if (container) {
        const dim = block.dimension;
        const base = {
          x: block.location.x + 0.5,
          y: block.location.y + 0.5,
          z: block.location.z + 0.5
        };
        for (let i = 0; i < container.size; i++) {
          const item = container.getItem(i);
          if (item) {
            try { dim.spawnItem(item, base); } catch {}
          }
        }
      }
      removeInventoryForBlock(block);
    }

    unregisterBlockPos(block.dimension.id, block.location.x, block.location.y, block.location.z);
  });

  // Exploze → vyčistit inventář a registr pro zasažené bloky.
  world.afterEvents.explosion.subscribe((event) => {
    for (const blk of event.getImpactedBlocks()) {
      if (!blk || !TRACKED_BLOCKS.has(blk.typeId)) continue;
      if (INVENTORY_BLOCKS.has(blk.typeId)) {
        removeInventoryForBlock(blk);
      }
      unregisterBlockPos(blk.dimension.id, blk.location.x, blk.location.y, blk.location.z);
    }
  });
}

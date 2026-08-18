// events.js — Event-driven architektura (Část 10): pokládka, zničení, interakce s bloky.
import { world } from "@minecraft/server";
import { ensureInventoryForBlock, removeInventoryForBlock, repairTrackingOnLoad } from "./inventory_manager.js";
import { setBlockData, getBlockData, KEYS } from "./storage.js";

const FILTR_ID = "filtrovna:filtr";

export function registerEvents() {
  // Pokládka bloku → spawn entity inventáře + nastavení majitele.
  world.afterEvents.playerPlaceBlock.subscribe((event) => {
    const block = event.block;
    if (block.typeId !== FILTR_ID) return;
    ensureInventoryForBlock(block);
    setBlockData(block, KEYS.FILTR_OWNER, event.player.id);
    setBlockData(block, KEYS.FILTR_MODE, "exact");
    setBlockData(block, KEYS.FILTR_PRIORITY, true);
    setBlockData(block, KEYS.FILTR_BATCH, 1);
    setBlockData(block, KEYS.FILTR_ENERGY, { value: 100, lastRegen: Date.now() });
  });

  // Zničení bloku → drop obsahu inventáře + zánik entity.
  world.afterEvents.playerBreakBlock.subscribe((event) => {
    const { block, brokenBlockPermutation } = event;
    if (brokenBlockPermutation.type.id !== FILTR_ID) return;
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
  });

  // Exploze → vyčistit inventář pokud je blok zničen.
  world.afterEvents.explosion.subscribe((event) => {
    for (const blk of event.getImpactedBlocks()) {
      if (blk.typeId === FILTR_ID) {
        removeInventoryForBlock(blk);
      }
    }
  });
}

export { repairTrackingOnLoad };

// tick_handler.js — Tick cyklus Filtru (Část 4.1) s prioritní frontou, batch a energií.
import { system, world } from "@minecraft/server";
import { getBlockContainer } from "./inventory_manager.js";
import { tryTransfer, tryDrop, checkFilter, itemPriority } from "./transfer_logic.js";
import { playBlockAnimation, getBlockState, setBlockState, regenerateEnergy, consumeEnergy } from "./animation_controller.js";
import { getBlockData, setBlockData, KEYS } from "./storage.js";
import { get } from "./config.js";

const PROCESSING = new Set();
const DIMENSIONS = ["overworld", "nether", "the_end"];
const FILTR_ID = "filtrovna:filtr";

function makeKey(block) {
  return `${block.dimension.id}|${block.location.x}|${block.location.y}|${block.location.z}`;
}

export function registerTickHandler() {
  system.runInterval(() => {
    for (const dimId of DIMENSIONS) {
      let dimension;
      try { dimension = world.getDimension(dimId); } catch { continue; }
      let blocks;
      try {
        blocks = dimension.getBlocks({ type: FILTR_ID }, { maxBlocks: 500 });
      } catch { continue; }
      for (const block of blocks) {
        if (PROCESSING.has(makeKey(block))) continue;
        try { processBlock(block); } catch (e) {
          console.warn(`[Filtrovna] processBlock chyba: ${e}`);
          PROCESSING.delete(makeKey(block));
        }
      }
    }
  }, 1);
}

function processBlock(block) {
  // Energie: regenerace každý tick.
  if (get("filtr.enable_energy_system") === true) {
    regenerateEnergy(block);
  }

  const container = getBlockContainer(block);
  if (!container) return;

  const state = getBlockState(block);
  if (state === 1) return; // processing

  // Najdi předmět ve VSTUPU (sloty 0–8) s prioritou vzácnosti.
  const priorityQueue = get("filtr.enable_priority_queue") === true;
  const batchSize = getBlockData(block, KEYS.FILTR_BATCH, 1);
  const maxBatch = get("filtr.batch_max_items") ?? 9;
  const effectiveBatch = Math.max(1, Math.min(batchSize, maxBatch));

  let candidates = [];
  for (let i = 0; i < 9; i++) {
    const item = container.getItem(i);
    if (item) candidates.push({ slot: i, item });
  }

  if (candidates.length === 0) {
    if (state !== 5) setBlockState(block, 0); // idle
    return;
  }

  // Prioritní řazení: vzácnější první.
  if (priorityQueue) {
    candidates.sort((a, b) => itemPriority(b.item.typeId) - itemPriority(a.item.typeId));
  }

  // Batch processing — vezmi až effectiveBatch předmětů stejného typu.
  const batch = [];
  const firstType = candidates[0].item.typeId;
  for (const c of candidates) {
    if (batch.length >= effectiveBatch) break;
    if (c.item.typeId === firstType) batch.push(c);
  }

  // Energie.
  if (get("filtr.enable_energy_system") === true) {
    const cost = get("filtr.energy_cost_per_item") ?? 2;
    if (!consumeEnergy(block, cost * batch.length)) {
      playBlockAnimation(block, "stuck");
      return;
    }
  }

  const key = makeKey(block);
  PROCESSING.add(key);
  setBlockState(block, 1);
  playBlockAnimation(block, "inspect");

  const inspectTicks = get("filtr.inspect_ticks") ?? 21;
  system.runTimeout(() => {
    try {
      finishProcessing(block, container, batch);
    } catch (e) {
      console.warn(`[Filtrovna] finishProcessing chyba: ${e}`);
    } finally {
      PROCESSING.delete(key);
    }
  }, inspectTicks);
}

function finishProcessing(block, container, batch) {
  // Načti filtr (sloty 9–18).
  const filterTypeIds = [];
  for (let i = 9; i < 19; i++) {
    const f = container.getItem(i);
    if (f) filterTypeIds.push(f.typeId);
  }
  const mode = getBlockData(block, KEYS.FILTR_MODE, "exact");

  // Zpracuj batch.
  let allOk = true;
  for (const entry of batch) {
    const isMatch = checkFilter(entry.item, filterTypeIds, mode);
    const dir = isMatch ? "down" : "right";

    if (tryTransfer(block, entry.item, dir)) {
      container.setItem(entry.slot, undefined);
      playBlockAnimation(block, isMatch ? "sort_match" : "sort_ne");
    } else if (tryDrop(block, entry.item, dir)) {
      container.setItem(entry.slot, undefined);
      playBlockAnimation(block, "drop");
    } else {
      allOk = false;
    }
  }

  if (!allOk) {
    playBlockAnimation(block, "stuck");
  } else {
    setBlockState(block, 0); // idle
  }

  // Statistiky.
  if (get("scoreboard.enable_tracking") === true) {
    const stats = getBlockData(block, KEYS.FILTR_STATISTICS, { sorted: 0 });
    stats.sorted += batch.length;
    setBlockData(block, KEYS.FILTR_STATISTICS, stats);
  }
}

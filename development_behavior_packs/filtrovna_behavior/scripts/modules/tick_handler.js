import { world } from "@minecraft/server";
import { getBlockContainer } from "./inventory_manager.js";
import { tryTransfer, tryDrop } from "./transfer_logic.js";

const PROCESSING_BLOCKS = new Set();

export function registerTickHandler(system, worldRef) {
  system.runInterval(() => {
    const overworld = worldRef.getDimension("overworld");
    const blocks = overworld.getBlocks({ type: "filtrovna:filtr", maxBlocks: 1000 });
    for (const block of blocks) {
      if (PROCESSING_BLOCKS.has(block)) continue;
      processBlock(block);
    }
  }, 1);
}

function processBlock(block) {
  const container = getBlockContainer(block);
  if (!container) return;

  let itemToProcess = null;
  let sourceSlot = -1;
  for (let i = 0; i < 9; i++) {
    const item = container.getItem(i);
    if (item) {
      itemToProcess = item;
      sourceSlot = i;
      break;
    }
  }

  if (!itemToProcess) {
    return;
  }

  PROCESSING_BLOCKS.add(block);

  // Zde by se spustila animace "inspect"

  system.runTimeout(() => {
    finishProcessing(block, itemToProcess, sourceSlot, container);
    PROCESSING_BLOCKS.delete(block);
  }, 21);
}

function finishProcessing(block, item, sourceSlot, container) {
  const filterSlots = [];
  for (let i = 9; i < 19; i++) {
    const filterItem = container.getItem(i);
    if (filterItem) filterSlots.push(filterItem.typeId);
  }

  const isMatch = filterSlots.length === 0 || filterSlots.includes(item.typeId);
  const targetDir = isMatch ? "down" : "right";

  const transferSuccess = tryTransfer(block, item, targetDir);
  if (transferSuccess) {
    container.setItem(sourceSlot, undefined);
    // animace sortmatch / sortne
    return;
  }

  const dropSuccess = tryDrop(block, item, targetDir);
  if (dropSuccess) {
    container.setItem(sourceSlot, undefined);
    // animace drop
    return;
  }

  // animace stuck
}

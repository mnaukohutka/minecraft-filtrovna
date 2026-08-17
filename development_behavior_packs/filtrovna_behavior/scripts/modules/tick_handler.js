import { system } from "@minecraft/server";
import { getBlockContainer } from "./inventory_manager.js";
import { tryTransfer, tryDrop } from "./transfer_logic.js";
import { getRegisteredFilters } from "./filter_registry.js";

const PROCESSING = new Set();
const PROCESSING_TICKS = 21;

export function registerTickHandler() {
  system.runInterval(() => {
    const dimensions = [
      "overworld",
      "nether",
      "the_end"
    ];

    for (const dimensionId of dimensions) {
      const dimension = system.getDimension(dimensionId);
      const filters = getRegisteredFilters(dimension);

      for (const block of filters) {
        if (PROCESSING.has(makeKey(block))) {
          continue;
        }

        processFilter(block);
      }
    }
  }, 1);
}

function makeKey(block) {
  return [
    block.dimension.id,
    block.location.x,
    block.location.y,
    block.location.z
  ].join("|");
}

function processFilter(block) {
  const container = getBlockContainer(block);

  if (!container) {
    return;
  }

  let sourceSlot = -1;
  let sourceItem;

  for (let slot = 0; slot < 9; slot++) {
    const item = container.getItem(slot);

    if (item) {
      sourceSlot = slot;
      sourceItem = item;
      break;
    }
  }

  if (!sourceItem) {
    return;
  }

  const key = makeKey(block);
  PROCESSING.add(key);

  system.runTimeout(() => {
    try {
      finishProcessing(block, container, sourceSlot, sourceItem);
    } catch (error) {
      console.warn(`[Filtrovna] Chyba při zpracování: ${error}`);
    } finally {
      PROCESSING.delete(key);
    }
  }, PROCESSING_TICKS);
}

function finishProcessing(block, container, sourceSlot, item) {
  const filterItems = [];

  for (let slot = 9; slot <= 18; slot++) {
    const filterItem = container.getItem(slot);

    if (filterItem) {
      filterItems.push(filterItem.typeId);
    }
  }

  const matches =
    filterItems.length === 0 ||
    filterItems.includes(item.typeId);

  const direction = matches ? "down" : "right";

  if (tryTransfer(block, item, direction)) {
    container.setItem(sourceSlot, undefined);
    return;
  }

  if (tryDrop(block, item, direction)) {
    container.setItem(sourceSlot, undefined);
  }
}

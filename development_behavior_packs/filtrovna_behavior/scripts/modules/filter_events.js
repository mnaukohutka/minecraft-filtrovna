import { world } from "@minecraft/server";
import {
  registerFilter,
  unregisterFilter
} from "./filter_registry.js";
import {
  ensureInventoryForBlock,
  removeInventoryForBlock
} from "./inventory_manager.js";

const FILTER_TYPE_ID = "filtrovna:filtr";

export function registerFilterEvents() {
  world.afterEvents.playerPlaceBlock.subscribe((event) => {
    const block = event.block;

    if (block.typeId !== FILTER_TYPE_ID) {
      return;
    }

    registerFilter(block);
    ensureInventoryForBlock(block);
  });

  // event.block je po rozbiti vzduch, proto cteme brokenBlockPermutation.
  world.afterEvents.playerBreakBlock.subscribe((event) => {
    const { block, brokenBlockPermutation } = event;

    if (brokenBlockPermutation.type.id !== FILTER_TYPE_ID) {
      return;
    }

    removeInventoryForBlock(block);
    unregisterFilter(block);
  });
}

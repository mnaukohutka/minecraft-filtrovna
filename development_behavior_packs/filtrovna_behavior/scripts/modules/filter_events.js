import { world } from "@minecraft/server";
import {
  registerFilter,
  unregisterFilter
} from "./filter_registry.js";
import {
  ensureInventoryForBlock,
  removeInventoryForBlock
} from "./inventory_manager.js";

export function registerFilterEvents() {
  world.afterEvents.playerPlaceBlock.subscribe((event) => {
    const block = event.block;

    if (block.typeId !== "filtrovna:filtr") {
      return;
    }

    registerFilter(block);
    ensureInventoryForBlock(block);
  });

  world.afterEvents.playerBreakBlock.subscribe((event) => {
    const block = event.block;

    if (block.typeId !== "filtrovna:filtr") {
      return;
    }

    removeInventoryForBlock(block);
    unregisterFilter(block);
  });
}

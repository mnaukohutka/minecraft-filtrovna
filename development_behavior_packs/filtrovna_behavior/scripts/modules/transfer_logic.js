import { getBlockContainer } from "./inventory_manager.js";

const DIRECTIONS = {
  south: {
    left: { x: -1, y: 0, z: 0 },
    right: { x: 1, y: 0, z: 0 },
    down: { x: 0, y: -1, z: 0 }
  },
  west: {
    left: { x: 0, y: 0, z: -1 },
    right: { x: 0, y: 0, z: 1 },
    down: { x: 0, y: -1, z: 0 }
  },
  north: {
    left: { x: 1, y: 0, z: 0 },
    right: { x: -1, y: 0, z: 0 },
    down: { x: 0, y: -1, z: 0 }
  },
  east: {
    left: { x: 0, y: 0, z: 1 },
    right: { x: 0, y: 0, z: -1 },
    down: { x: 0, y: -1, z: 0 }
  }
};

export function getRelativePos(block, direction) {
  const facing =
    block.permutation.getState("minecraft:cardinal_direction") ?? "south";

  const vector = DIRECTIONS[facing]?.[direction];

  if (!vector) {
    return undefined;
  }

  return {
    x: block.location.x + vector.x,
    y: block.location.y + vector.y,
    z: block.location.z + vector.z
  };
}

export function tryTransfer(sourceBlock, item, direction) {
  const targetPos = getRelativePos(sourceBlock, direction);

  if (!targetPos) {
    return false;
  }

  const targetBlock = sourceBlock.dimension.getBlock(targetPos);

  if (!targetBlock) {
    return false;
  }

  if (targetBlock.typeId === "filtrovna:filtr") {
    const targetContainer = getBlockContainer(targetBlock);

    if (!targetContainer) {
      return false;
    }

    for (let slot = 0; slot < 9; slot++) {
      if (!targetContainer.getItem(slot)) {
        targetContainer.setItem(slot, item.clone());
        return true;
      }
    }

    return false;
  }

  const inventory = targetBlock.getComponent("minecraft:inventory");

  if (!inventory?.container) {
    return false;
  }

  const remainder = inventory.container.addItem(item.clone());

  return remainder === undefined;
}

export function tryDrop(sourceBlock, item, direction) {
  const targetPos = getRelativePos(sourceBlock, direction);

  if (!targetPos) {
    return false;
  }

  const targetBlock = sourceBlock.dimension.getBlock(targetPos);

  if (!targetBlock) {
    return false;
  }

  if (!targetBlock.isAir && !targetBlock.isLiquid) {
    return false;
  }

  const spawnPosition = {
    x: targetPos.x + 0.5,
    y: targetPos.y + 0.2,
    z: targetPos.z + 0.5
  };

  const entity = sourceBlock.dimension.spawnEntity(
    "minecraft:item",
    spawnPosition
  );

  const itemComponent = entity.getComponent("minecraft:item");

  if (!itemComponent) {
    entity.remove();
    return false;
  }

  itemComponent.itemStack = item.clone();

  return true;
}

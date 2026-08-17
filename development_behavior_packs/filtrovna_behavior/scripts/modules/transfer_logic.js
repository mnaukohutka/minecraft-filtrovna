export function tryTransfer(sourceBlock, item, direction) {
  const targetPos = getRelativePos(sourceBlock, direction);
  const targetBlock = sourceBlock.dimension.getBlock(targetPos);
  if (!targetBlock) return false;

  if (targetBlock.typeId === "filtrovna:filtr") {
    const targetContainer = getBlockContainer(targetBlock);
    if (!targetContainer) return false;
    for (let i = 0; i < 9; i++) {
      if (!targetContainer.getItem(i)) {
        targetContainer.setItem(i, item.clone());
        return true;
      }
    }
    return false;
  }

  const invComp = targetBlock.getComponent("minecraft:inventory");
  if (invComp?.container) {
    const result = invComp.container.addItem(item.clone());
    return result === undefined;
  }

  return false;
}

export function tryDrop(sourceBlock, item, direction) {
  const targetPos = getRelativePos(sourceBlock, direction);
  const targetBlock = sourceBlock.dimension.getBlock(targetPos);
  if (!targetBlock || (!targetBlock.isAir && !targetBlock.isLiquid)) return false;

  const spawnPos = {
    x: targetPos.x + 0.5,
    y: targetPos.y + 0.5,
    z: targetPos.z + 0.5
  };

  const itemEntity = sourceBlock.dimension.spawnEntity("minecraft:item", spawnPos);
  const itemComp = itemEntity.getComponent("minecraft:item");
  if (itemComp) {
    itemComp.itemStack = item.clone();
  }

  return true;
}

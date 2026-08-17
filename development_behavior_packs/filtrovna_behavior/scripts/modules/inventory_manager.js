import { world } from "@minecraft/server";

const ENTITY_ID_PROPERTY = "filtrovna:inventory_entity";

export function getInventoryEntity(block) {
  const entityId = block.getDynamicProperty(ENTITY_ID_PROPERTY);

  if (!entityId || typeof entityId !== "string") {
    return undefined;
  }

  return world.getEntity(entityId);
}

export function getBlockContainer(block) {
  const entity = getInventoryEntity(block);

  if (!entity) {
    return undefined;
  }

  const inventory = entity.getComponent("minecraft:inventory");

  return inventory?.container;
}

export function createInventoryForBlock(block) {
  const existing = getInventoryEntity(block);

  if (existing) {
    return existing;
  }

  const location = {
    x: block.location.x + 0.5,
    y: block.location.y + 0.5,
    z: block.location.z + 0.5
  };

  const entity = block.dimension.spawnEntity(
    "filtrovna:filtr_inventory",
    location
  );

  entity.setDynamicProperty("filtrovna:block_x", block.location.x);
  entity.setDynamicProperty("filtrovna:block_y", block.location.y);
  entity.setDynamicProperty("filtrovna:block_z", block.location.z);

  block.setDynamicProperty(ENTITY_ID_PROPERTY, entity.id);

  return entity;
}

export function removeInventoryForBlock(block) {
  const entity = getInventoryEntity(block);

  if (entity) {
    entity.remove();
  }

  block.setDynamicProperty(ENTITY_ID_PROPERTY, undefined);
}

export function ensureInventoryForBlock(block) {
  const existing = getBlockContainer(block);

  if (existing) {
    return existing;
  }

  const entity = createInventoryForBlock(block);
  const inventory = entity.getComponent("minecraft:inventory");

  return inventory?.container;
}

export function findAllInventoryEntities(dimension) {
  return dimension.getEntities({
    type: "filtrovna:filtr_inventory"
  });
}

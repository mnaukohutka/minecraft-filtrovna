// inventory_manager.js — Správa neviditelné inventář entity pro Filtr blok (Část 6).
import { world } from "@minecraft/server";
import { KEYS, getBlockData, setBlockData } from "./storage.js";

const ENTITY_TYPE = "filtrovna:filtr_entity";

// Bloky, které používají inventářovou entitu (jinak by repairTrackingOnLoad
// entity Masteru/Smart Hopperu omylem odstranil).
const BLOCKS_WITH_ENTITY = new Set([
  "filtrovna:filtr",
  "filtrovna:filtr_master",
  "filtrovna:smart_hopper"
]);

export function getInventoryEntity(block) {
  const entityId = getBlockData(block, KEYS.FILTR_ENTITY, null);
  if (entityId && typeof entityId === "string") {
    try {
      const entity = world.getEntity(entityId);
      if (entity) return entity;
    } catch {}
  }
  // Fallback: najdi entitu podle pozice (např. po zničení bloku už
  // dynamic properties bloku neexistují a ID by se jinak ztratilo).
  try {
    const center = {
      x: block.location.x + 0.5,
      y: block.location.y + 0.5,
      z: block.location.z + 0.5
    };
    const found = block.dimension.getEntities({
      type: ENTITY_TYPE,
      location: center,
      maxDistance: 0.75
    });
    return found[0];
  } catch {
    return undefined;
  }
}

export function getBlockContainer(block) {
  const entity = getInventoryEntity(block);
  if (!entity) return undefined;
  const inv = entity.getComponent("minecraft:inventory");
  return inv?.container;
}

export function createInventoryForBlock(block) {
  const existing = getInventoryEntity(block);
  if (existing) return existing;
  const loc = {
    x: block.location.x + 0.5,
    y: block.location.y + 0.5,
    z: block.location.z + 0.5
  };
  const entity = block.dimension.spawnEntity(ENTITY_TYPE, loc);
  setBlockData(block, KEYS.FILTR_ENTITY, entity.id);
  return entity;
}

export function removeInventoryForBlock(block) {
  const entity = getInventoryEntity(block);
  if (entity) {
    try { entity.remove(); } catch {}
  }
  setBlockData(block, KEYS.FILTR_ENTITY, undefined);
}

export function ensureInventoryForBlock(block) {
  const existing = getBlockContainer(block);
  if (existing) return existing;
  const entity = createInventoryForBlock(block);
  const inv = entity.getComponent("minecraft:inventory");
  return inv?.container;
}

// Oprava po reloadu světa: odstranění osiřelých entit (bez bloku).
export function repairTrackingOnLoad() {
  for (const dim of ["overworld", "nether", "the_end"]) {
    let dimension;
    try { dimension = world.getDimension(dim); } catch { continue; }
    const entities = dimension.getEntities({ type: ENTITY_TYPE });
    for (const e of entities) {
      const bx = Math.floor(e.location.x);
      const by = Math.floor(e.location.y);
      const bz = Math.floor(e.location.z);
      const b = dimension.getBlock({ x: bx, y: by, z: bz });
      if (!b || !BLOCKS_WITH_ENTITY.has(b.typeId)) {
        try { e.remove(); } catch {}
      }
    }
  }
}

export function registerInventoryManager() {
  try {
    const obj = world.scoreboard.getObjective("filtrovna_stats");
    if (!obj) {
      world.scoreboard.addObjective("filtrovna_stats", "Filtrovna Stats");
    }
  } catch {}
}

export function initLoadedChunks() {
  repairTrackingOnLoad();
}

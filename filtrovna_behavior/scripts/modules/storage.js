// storage.js — Perzistentní data přes entity/block/world DynamicProperties.
import { world } from "@minecraft/server";

export const KEYS = {
  GOLEM_OWNER: "filtrovna:owner",
  GOLEM_FILTR_MEMORY: "filtrovna:filtr_memory",
  GOLEM_STORAGE_MEMORY: "filtrovna:storage_memory",
  GOLEM_OXIDATION: "filtrovna:oxidation",
  GOLEM_STATS: "filtrovna:golem_stats",
  GOLEM_TEAM_ROLE: "filtrovna:team_role",
  GOLEM_LAST_ACTIVE: "filtrovna:last_active",
  FILTR_ENTITY: "filtrovna:inventory_entity",
  FILTR_OWNER: "filtrovna:owner",
  FILTR_MODE: "filtrovna:match_mode",
  FILTR_PRIORITY: "filtrovna:priority_queue",
  FILTR_BATCH: "filtrovna:batch_size",
  FILTR_ENERGY: "filtrovna:energy",
  FILTR_STATISTICS: "filtrovna:filtr_stats",
  MASTER_LINKED: "filtrovna:master_linked",
  MASTER_TEMPLATE: "filtrovna:master_template",
  MASTER_STATS: "filtrovna:master_stats",
  HOPPER_FILTER: "filtrovna:hopper_filter",
  HOPPER_COUNT: "filtrovna:hopper_count",
  SCANNER_WHITELIST: "filtrovna:scanner_whitelist",
  SCANNER_BLACKLIST: "filtrovna:scanner_blacklist",
  DOCK_HOME: "filtrovna:dock_home"
};

export function getEntityData(entity, key, fallback) {
  try {
    const raw = entity.getDynamicProperty(key);
    if (raw == null) return fallback;
    if (typeof raw === "string") {
      try { return JSON.parse(raw); } catch { return raw; }
    }
    return raw;
  } catch {
    return fallback;
  }
}

export function setEntityData(entity, key, value) {
  try {
    const v = typeof value === "object" ? JSON.stringify(value) : value;
    entity.setDynamicProperty(key, v);
  } catch (e) {
    console.warn(`[Filtrovna] setEntityData selhalo (${key}): ${e}`);
  }
}

export function getBlockData(block, key, fallback) {
  try {
    const raw = block.getDynamicProperty(key);
    if (raw == null) return fallback;
    if (typeof raw === "string") {
      try { return JSON.parse(raw); } catch { return raw; }
    }
    return raw;
  } catch {
    return fallback;
  }
}

export function setBlockData(block, key, value) {
  try {
    const v = typeof value === "object" ? JSON.stringify(value) : value;
    block.setDynamicProperty(key, v);
  } catch (e) {
    console.warn(`[Filtrovna] setBlockData selhalo (${key}): ${e}`);
  }
}

export function getWorldData(key, fallback) {
  try {
    const raw = world.getDynamicProperty(key);
    if (raw == null) return fallback;
    if (typeof raw === "string") {
      try { return JSON.parse(raw); } catch { return raw; }
    }
    return raw;
  } catch {
    return fallback;
  }
}

export function setWorldData(key, value) {
  try {
    const v = typeof value === "object" ? JSON.stringify(value) : value;
    world.setDynamicProperty(key, v);
  } catch (e) {
    console.warn(`[Filtrovna] setWorldData selhalo (${key}): ${e}`);
  }
}

export function blockKey(block) {
  return `${block.dimension.id}|${Math.floor(block.location.x)}|${Math.floor(block.location.y)}|${Math.floor(block.location.z)}`;
}

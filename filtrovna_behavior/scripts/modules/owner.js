// owner.js — Owner lock (Část 16): majitel Filtru i golema.
import { getBlockData, getEntityData, setBlockData, setEntityData, KEYS } from "./storage.js";
import { get } from "./config.js";

export function getBlockOwner(block) {
  return getBlockData(block, KEYS.FILTR_OWNER, null);
}

export function setBlockOwner(block, playerId) {
  setBlockData(block, KEYS.FILTR_OWNER, playerId);
}

export function getGolemOwner(entity) {
  return getEntityData(entity, KEYS.GOLEM_OWNER, null);
}

export function setGolemOwner(entity, playerId) {
  setEntityData(entity, KEYS.GOLEM_OWNER, playerId);
}

// Kontrola, zda může hráč měnit nastavení.
export function canModifyBlock(player, block) {
  if (get("security.enable_owner_lock") !== true) return true;
  const owner = getBlockOwner(block);
  if (!owner) return true;
  if (owner === player.id) return true;
  if (get("security.allow_owner_override") === true && player.isOp()) return true;
  return false;
}

export function canModifyGolem(player, entity) {
  if (get("security.enable_owner_lock") !== true) return true;
  const owner = getGolemOwner(entity);
  if (!owner) return true;
  if (owner === player.id) return true;
  return false;
}

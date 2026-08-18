// transfer_logic.js — Přenos a drop předmětů (Část 4.3, 4.4, 4.5).
import { getBlockContainer } from "./inventory_manager.js";

// Směrové vektory relativní k facing bloku (Část 4.5).
// VSTUP je vlevo, NE vpravo, MATCH vždy dolů.
const DIRECTIONS = {
  south: { left: { x: 1, y: 0, z: 0 }, right: { x: -1, y: 0, z: 0 }, down: { x: 0, y: -1, z: 0 } },
  west: { left: { x: 0, y: 0, z: -1 }, right: { x: 0, y: 0, z: 1 }, down: { x: 0, y: -1, z: 0 } },
  north: { left: { x: -1, y: 0, z: 0 }, right: { x: 1, y: 0, z: 0 }, down: { x: 0, y: -1, z: 0 } },
  east: { left: { x: 0, y: 0, z: 1 }, right: { x: 0, y: 0, z: -1 }, down: { x: 0, y: -1, z: 0 } }
};

export function getRelativePos(block, direction) {
  const facing = block.permutation.getState("minecraft:cardinal_direction") ?? "south";
  const vec = DIRECTIONS[facing]?.[direction];
  if (!vec) return undefined;
  return {
    x: block.location.x + vec.x,
    y: block.location.y + vec.y,
    z: block.location.z + vec.z
  };
}

export function tryTransfer(sourceBlock, item, direction) {
  const targetPos = getRelativePos(sourceBlock, direction);
  if (!targetPos) return false;
  const targetBlock = sourceBlock.dimension.getBlock(targetPos);
  if (!targetBlock) return false;

  // Případ A: Cíl je jiný Filtr → vloží do VSTUP slotů (0–8).
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

  // Případ B: Vanilla kontejner (truhla, hopper, barrel...).
  const invComp = targetBlock.getComponent("minecraft:inventory");
  if (invComp?.container) {
    const remainder = invComp.container.addItem(item.clone());
    return remainder === undefined;
  }

  return false;
}

export function tryDrop(sourceBlock, item, direction) {
  const targetPos = getRelativePos(sourceBlock, direction);
  if (!targetPos) return false;
  const targetBlock = sourceBlock.dimension.getBlock(targetPos);
  if (!targetBlock) return false;
  if (!targetBlock.isAir && !targetBlock.isLiquid) return false;

  const spawnPos = {
    x: targetPos.x + 0.5,
    y: targetPos.y + 0.2,
    z: targetPos.z + 0.5
  };
  try {
    sourceBlock.dimension.spawnItem(item.clone(), spawnPos);
  } catch (e) {
    console.warn(`[Filtrovna] spawnItem selhal: ${e}`);
    return false;
  }
  return true;
}

// Kontrola filtru (Část 4.2).
export function checkFilter(item, filterTypeIds, mode) {
  if (!filterTypeIds || filterTypeIds.length === 0) return true;

  if (mode === "exact") {
    return filterTypeIds.includes(item.typeId);
  }
  if (mode === "mod") {
    const ns = item.typeId.split(":")[0];
    for (const f of filterTypeIds) {
      if (f.split(":")[0] === ns) return true;
    }
    return false;
  }
  if (mode === "tag") {
    const tags = inferTags(item.typeId);
    for (const f of filterTypeIds) {
      const fTags = inferTags(f);
      for (const t of fTags) {
        if (tags.includes(t)) return true;
      }
    }
    return false;
  }
  return filterTypeIds.includes(item.typeId);
}

function inferTags(typeId) {
  const tags = [];
  const id = typeId.replace("minecraft:", "");
  if (id.endsWith("_log") || id.endsWith("_planks") || id.includes("wood")) tags.push("logs");
  if (id.endsWith("_ore")) tags.push("ores");
  if (id.endsWith("_ingot")) tags.push("ingots");
  if (id.endsWith("_dye")) tags.push("dyes");
  if (id.includes("redstone")) tags.push("redstone");
  if (id.endsWith("_sword") || id.endsWith("_axe") || id.endsWith("_pickaxe") || id.endsWith("_shovel") || id.endsWith("_hoe")) tags.push("tools");
  if (id.endsWith("_helmet") || id.endsWith("_chestplate") || id.endsWith("_leggings") || id.endsWith("_boots")) tags.push("armor");
  return tags;
}

export function itemPriority(typeId) {
  const id = typeId.replace("minecraft:", "");
  if (id.includes("netherite")) return 100;
  if (id.includes("diamond")) return 90;
  if (id.includes("emerald")) return 80;
  if (id.includes("gold")) return 70;
  if (id.includes("iron")) return 60;
  if (id.includes("redstone") || id.includes("lapis") || id.includes("quartz")) return 50;
  if (id.includes("copper")) return 40;
  if (id.endsWith("_ore")) return 55;
  return 10;
}

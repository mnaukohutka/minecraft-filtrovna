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
  // Normalizuj cardinal_direction: může být string, object s .name, nebo StateEnum
  let facing = "south"; // Fallback default
  try {
    const facingRaw = block.permutation.getState("minecraft:cardinal_direction");
    if (typeof facingRaw === "string") {
      facing = facingRaw;
    } else if (facingRaw && typeof facingRaw === "object") {
      // StateEnum nebo jiný objekt s .name nebo .toString()
      if (typeof facingRaw.name === "string") {
        facing = facingRaw.name;
      } else if (typeof facingRaw.toString === "function") {
        facing = facingRaw.toString();
      }
    }
  } catch (e) {
    console.warn(`[Filtrovna] getRelativePos: Neznámý facing state, fallback na 'south': ${e}`);
  }

  // Validuj, že facing je v DIRECTIONS
  if (!DIRECTIONS[facing]) {
    console.warn(`[Filtrovna] getRelativePos: Neznámá orientace '${facing}', použiji 'south'`);
    facing = "south";
  }

  const vec = DIRECTIONS[facing][direction];
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

export function inferTags(typeId) {
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
  
  // Tabulka priorit dle materiálu (čím vyšší, tím vzácnější).
  // Struktura: materiál → base score; ore varianty jsou -5 od ingotu/bloku
  const materialScores = {
    netherite: 100,      // Nejvzácnější
    diamond: 90,
    emerald: 80,
    gold: 70,
    iron: 60,
    lapis: 50,
    redstone: 50,
    quartz: 50,
    copper: 40,
    default: 10
  };

  let base = materialScores.default;
  for (const [material, score] of Object.entries(materialScores)) {
    if (material !== 'default' && id.includes(material)) {
      base = score;
      break;
    }
  }

  // Ore suffix adjustment: ore je vždy o 5 bodů nižší než ingot/block
  if (id.endsWith("_ore")) {
    base = Math.max(0, base - 5);
  }

  return base;
}

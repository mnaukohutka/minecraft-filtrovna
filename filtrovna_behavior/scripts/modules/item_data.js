// item_data.js — Hodnocení předmětů pro scanner a prioritní frontu.
// Hodnoty 1–15 odpovídají síle redstone signálu.

const ITEM_VALUES = {
  "minecraft:netherite_block": 15,
  "minecraft:netherite_ingot": 15,
  "minecraft:ancient_debris": 15,
  "minecraft:diamond_block": 14,
  "minecraft:diamond": 13,
  "minecraft:emerald_block": 12,
  "minecraft:emerald": 11,
  "minecraft:gold_block": 10,
  "minecraft:gold_ingot": 9,
  "minecraft:iron_block": 8,
  "minecraft:iron_ingot": 7,
  "minecraft:redstone_block": 6,
  "minecraft:redstone": 5,
  "minecraft:lapis_lazuli": 5,
  "minecraft:quartz": 4,
  "minecraft:copper_ingot": 3,
  "minecraft:coal": 2,
  "minecraft:stick": 1
};

export function getItemValue(typeId) {
  if (ITEM_VALUES[typeId]) return ITEM_VALUES[typeId];
  const id = typeId.replace("minecraft:", "");
  if (id.includes("netherite")) return 15;
  if (id.includes("diamond")) return 13;
  if (id.includes("emerald")) return 11;
  if (id.includes("gold")) return 9;
  if (id.includes("iron")) return 7;
  if (id.endsWith("_ore")) return 8;
  if (id.includes("copper")) return 3;
  return 1;
}

export function isRare(typeId) {
  return getItemValue(typeId) >= 10;
}

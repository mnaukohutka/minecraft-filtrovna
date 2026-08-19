// test_suite.js — POC Test Suite pro čisté funkce Filtrovna modulu.
// Spouštěj s: node test_suite.js

import { itemPriority, checkFilter, inferTags } from "./transfer_logic.js";

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (e) {
    console.error(`❌ ${name}: ${e}`);
    testsFailed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) throw new Error(`${message} — expected ${expected}, got ${actual}`);
}

console.log("========== FILTROVNA TEST SUITE ==========\n");

// ============= itemPriority TESTY =============
console.log("📊 itemPriority():");

test("iron_ore < iron_ingot", () => {
  const oreScore = itemPriority("minecraft:iron_ore");
  const ingotScore = itemPriority("minecraft:iron_ingot");
  assert(oreScore < ingotScore, `iron_ore (${oreScore}) should be < iron_ingot (${ingotScore})`);
});

test("diamond > iron", () => {
  const diamondScore = itemPriority("minecraft:diamond");
  const ironScore = itemPriority("minecraft:iron_ingot");
  assert(diamondScore > ironScore, `diamond (${diamondScore}) should be > iron_ingot (${ironScore})`);
});

test("netherite highest", () => {
  const scores = [
    itemPriority("minecraft:netherite_ingot"),
    itemPriority("minecraft:diamond"),
    itemPriority("minecraft:gold_ingot"),
    itemPriority("minecraft:stone")
  ];
  assertEqual(scores[0], 100, "Netherite should be 100");
  assert(scores[0] > scores[1] && scores[1] > scores[2], "Score order should be netherite > diamond > gold");
});

test("unknown items get default score", () => {
  const score = itemPriority("minecraft:dirt");
  assertEqual(score, 10, "Unknown item should get default score 10");
});

test("ore penalty is -5", () => {
  const goldOre = itemPriority("minecraft:gold_ore");
  const goldIngot = itemPriority("minecraft:gold_ingot");
  assertEqual(goldOre, goldIngot - 5, "Ore should be exactly -5 from ingot");
});

// ============= checkFilter TESTY =============
console.log("\n🔍 checkFilter():");

test("exact mode — item in filter", () => {
  const result = checkFilter(
    { typeId: "minecraft:iron_ingot" },
    ["minecraft:iron_ingot"],
    "exact"
  );
  assert(result === true, "Should match when exact");
});

test("exact mode — item not in filter", () => {
  const result = checkFilter(
    { typeId: "minecraft:gold_ingot" },
    ["minecraft:iron_ingot"],
    "exact"
  );
  assert(result === false, "Should not match when not exact");
});

test("exact mode — empty filter allows all", () => {
  const result = checkFilter(
    { typeId: "minecraft:dirt" },
    [],
    "exact"
  );
  assert(result === true, "Empty filter should allow all");
});

test("mod mode — same namespace", () => {
  const result = checkFilter(
    { typeId: "minecraft:iron_ingot" },
    ["minecraft:gold_ingot"],
    "mod"
  );
  assert(result === true, "Same namespace (minecraft:) should match in mod mode");
});

test("mod mode — different namespace", () => {
  const result = checkFilter(
    { typeId: "mymod:custom_item" },
    ["minecraft:iron_ingot"],
    "mod"
  );
  assert(result === false, "Different namespace should not match in mod mode");
});

// ============= inferTags TESTY =============
console.log("\n🏷️  inferTags():");

test("iron_ore tagged as 'ores'", () => {
  const tags = inferTags("minecraft:iron_ore");
  assert(tags.includes("ores"), "Should be tagged as ores");
});

test("iron_ingot tagged as 'ingots'", () => {
  const tags = inferTags("minecraft:iron_ingot");
  assert(tags.includes("ingots"), "Should be tagged as ingots");
});

test("diamond_sword tagged as 'tools'", () => {
  const tags = inferTags("minecraft:diamond_sword");
  assert(tags.includes("tools"), "Should be tagged as tools");
});

test("oak_log tagged as 'logs'", () => {
  const tags = inferTags("minecraft:oak_log");
  assert(tags.includes("logs"), "Should be tagged as logs");
});

test("iron_helmet tagged as 'armor'", () => {
  const tags = inferTags("minecraft:iron_helmet");
  assert(tags.includes("armor"), "Should be tagged as armor");
});

test("redstone_dust tagged as 'redstone'", () => {
  const tags = inferTags("minecraft:redstone_dust");
  assert(tags.includes("redstone"), "Should be tagged as redstone");
});

// ============= VÝSLEDKY =============
console.log("\n========================================");
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📊 Total: ${testsPassed + testsFailed}`);
console.log("========================================");

if (testsFailed > 0) {
  process.exit(1);
}

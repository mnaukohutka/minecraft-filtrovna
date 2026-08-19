// registry.js — Registr položených custom bloků.
//
// PROČ EXISTUJE: Script API NEMÁ žádnou funkci pro "najdi všechny bloky typu X
// v dimenzi". Původní kód volal dimension.getBlocks({ type: "..." }, ...),
// což je neexistující signatura (getBlocks vyžaduje BlockVolume + BlockFilter),
// takže tick/conveyor/scanner/hopper/master/dock nikdy žádný blok nenašly.
//
// Řešení: pozice bloků se zapisují do world dynamic property při položení
// (events.js) a odebírají při zničení / explozi. Iterátor navíc sám čistí
// záznamy, které už ve světě neexistují.
import { world } from "@minecraft/server";

const REG_KEY = "filtrovna:block_registry";

let cache = null;

function load() {
  if (cache) return cache;
  try {
    const raw = world.getDynamicProperty(REG_KEY);
    cache = typeof raw === "string" ? JSON.parse(raw) : [];
  } catch {
    cache = [];
  }
  if (!Array.isArray(cache)) cache = [];
  return cache;
}

function save() {
  try {
    world.setDynamicProperty(REG_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn(`[Filtrovna] registry save selhalo: ${e}`);
  }
}

export function blockPosKey(block) {
  const l = block.location;
  return `${block.dimension.id}|${l.x}|${l.y}|${l.z}`;
}

export function registerBlockPos(block) {
  const list = load();
  const key = blockPosKey(block);
  if (!list.some((e) => e.key === key)) {
    list.push({ key, typeId: block.typeId });
    save();
  }
}

export function unregisterBlockPos(dimensionId, x, y, z) {
  const list = load();
  const key = `${dimensionId}|${x}|${y}|${z}`;
  const i = list.findIndex((e) => e.key === key);
  if (i >= 0) {
    list.splice(i, 1);
    save();
  }
}

// Iterátor přes všechny registrované bloky daného typu.
// Neplatné záznamy (blok už neexistuje) automaticky odstraní.
export function* iterateBlocks(typeId) {
  const list = load();
  let dirty = false;
  for (let i = list.length - 1; i >= 0; i--) {
    const entry = list[i];
    if (entry.typeId !== typeId) continue;
    const [dimId, x, y, z] = entry.key.split("|");
    let dimension;
    try {
      dimension = world.getDimension(dimId);
    } catch {
      continue;
    }
    let block;
    try {
      block = dimension.getBlock({ x: +x, y: +y, z: +z });
    } catch {
      block = undefined; // chunk není načtený — ponecháme záznam
    }
    if (block && block.typeId !== typeId) {
      // Blok byl odstraněn/nahrazen bez eventu → očista.
      list.splice(i, 1);
      dirty = true;
      continue;
    }
    if (block) yield block;
  }
  if (dirty) save();
}

// animation_controller.js — Stavové animace golema + zvuky (Část 2.3, 3, 8).
import { world } from "@minecraft/server";
import { getBlockData, setBlockData, KEYS } from "./storage.js";

// Stavy bloku: 0=idle(zelená), 1=inspect(žlutá), 2=sort_match(modrá),
// 3=sort_ne(oranžová), 4=drop(bílá), 5=stuck(červená).
const STATE_NAMES = ["idle", "processing", "sort_match", "sort_ne", "drop", "stuck"];

export function getStateName(state) {
  return STATE_NAMES[state] ?? "idle";
}

export function setBlockState(block, state) {
  try {
    const perm = block.permutation.withState("filtrovna:state", state);
    block.setPermutation(perm);
  } catch (e) {
    console.warn(`[Filtrovna] setBlockState selhal: ${e}`);
  }
}

export function getBlockState(block) {
  try {
    return block.permutation.getState("filtrovna:state") ?? 0;
  } catch {
    return 0;
  }
}

// Přehrání zvuku u bloku.
export function playSound(block, soundId, options = {}) {
  try {
    block.dimension.playSound(soundId, block.location, {
      volume: options.volume ?? 0.6,
      pitch: options.pitch ?? 1.0
    });
  } catch {}
}

// Spuštění animace golema uvnitř bloku přes particle efekt (block nemá přímou animaci,
// golem je součástí geometrie — animace golema uvnitř bloku je vizuálně řešena přes
// střídání stavů/textur. Pro samostatného golema se animace přehrávají přes entity).
export function playBlockAnimation(block, animName) {
  const soundMap = {
    inspect: { sound: "filtrovna.inspect", state: 1, opts: { volume: 0.6, pitch: 1.0 } },
    sort_match: { sound: "filtrovna.sort_match", state: 2, opts: { volume: 0.7, pitch: 1.2 } },
    sort_ne: { sound: "filtrovna.sort_ne", state: 3, opts: { volume: 0.7, pitch: 0.8 } },
    drop: { sound: "filtrovna.drop", state: 4, opts: { volume: 0.7, pitch: 1.0 } },
    stuck: { sound: "filtrovna.stuck", state: 5, opts: { volume: 0.7, pitch: 0.8 } },
    idle: { sound: null, state: 0, opts: {} }
  };
  const entry = soundMap[animName] ?? soundMap.idle;
  setBlockState(block, entry.state);
  if (entry.sound) {
    playSound(block, entry.sound, entry.opts);
  }
  // Particle efekty (Část 11).
  if (animName === "sort_match" || animName === "sort_ne") {
    try {
      block.dimension.spawnParticle("minecraft:basic_flame_particle", {
        x: block.location.x + 0.5,
        y: block.location.y + 0.8,
        z: block.location.z + 0.5
      });
    } catch {}
  }
}

// Energetický systém (Část 1 vylepšení).
export function getEnergy(block) {
  const data = getBlockData(block, KEYS.FILTR_ENERGY, { value: 100, lastRegen: Date.now() });
  return data;
}

export function consumeEnergy(block, amount) {
  const data = getEnergy(block);
  if (data.value < amount) return false;
  data.value -= amount;
  setBlockData(block, KEYS.FILTR_ENERGY, data);
  return true;
}

export function regenerateEnergy(block) {
  const data = getEnergy(block);
  const now = Date.now();
  const maxRegen = 100;
  if (data.value >= maxRegen) {
    data.lastRegen = now;
    return;
  }
  const regenRate = 1; // za tick
  data.value = Math.min(maxRegen, data.value + regenRate);
  data.lastRegen = now;
  setBlockData(block, KEYS.FILTR_ENERGY, data);
}

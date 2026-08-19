// effects.js — Particle efekty (Část 11).
import { get } from "./config.js";

export function spawnSparkles(location, dimension, color = "basic_flame_particle") {
  if (get("filtr.enable_particles") !== true) return;
  try {
    dimension.spawnParticle(`minecraft:${color}`, {
      x: location.x + 0.5,
      y: location.y + 0.8,
      z: location.z + 0.5
    });
  } catch {}
}

export function spawnCopperTrail(location, dimension) {
  if (get("golem.enable_particle_trail") !== true) return;
  try {
    dimension.spawnParticle("minecraft:basic_flame_particle", {
      x: location.x,
      y: location.y + 0.1,
      z: location.z
    });
  } catch {}
}

export function spawnDropEffect(location, dimension) {
  try {
    for (let i = 0; i < 3; i++) {
      dimension.spawnParticle("minecraft:basic_flame_particle", {
        x: location.x + 0.5 + (Math.random() - 0.5) * 0.3,
        y: location.y + 0.5,
        z: location.z + 0.5 + (Math.random() - 0.5) * 0.3
      });
    }
  } catch {}
}

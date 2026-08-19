// config.js — Načítání konfigurace z config.json s runtime override.
import { world } from "@minecraft/server";

let CONFIG = null;
const OVERRIDES = new Map();

function deepMerge(base, override) {
  if (typeof base !== "object" || base === null) return override;
  if (typeof override !== "object" || override === null) return override;
  const out = Array.isArray(base) ? base.slice() : { ...base };
  for (const key of Object.keys(override)) {
    out[key] = key in base ? deepMerge(base[key], override[key]) : override[key];
  }
  return out;
}

export function loadConfig() {
  try {
    const raw = world.getDynamicProperty("filtrovna:config");
    if (typeof raw === "string") {
      const parsed = JSON.parse(raw);
      CONFIG = deepMerge(getDefaultConfig(), parsed);
    }
  } catch (e) {
    console.warn(`[Filtrovna] Konfiguraci nelze načíst: ${e}`);
  }
  if (!CONFIG) {
    CONFIG = getDefaultConfig();
  }
  validateConfig(CONFIG);
}

export function getDefaultConfig() {
  return {
    golem: {
      speed_multiplier: 1.0,
      max_filtr_memory: 15,
      max_storage_memory: 15,
      tick_interval: 20,
      enable_ender_chest_support: true,
      enable_oxidation: true,
      enable_pathfind_cache: true,
      enable_teamwork: true,
      enable_idle_animations: true,
      enable_particle_trail: true
    },
    filtr: {
      inspect_ticks: 21,
      batch_processing: true,
      batch_max_items: 9,
      batch_mode: "group_by_type",
      light_emission_idle: 8,
      default_match_mode: "exact",
      enable_priority_queue: true,
      enable_energy_system: true,
      energy_max: 100,
      energy_per_tick_regen: 1,
      energy_cost_per_item: 2,
      enable_particles: true
    },
    master: {
      max_linked_filters: 8,
      enable_global_matching: true,
      enable_statistics: true
    },
    conveyor: {
      speed_blocks_per_second: 1.0
    },
    smart_hopper: {
      transfer_cooldown_ticks: 8,
      default_count_mode: 0,
      max_pickups_per_tick: 1,
      strict_filter: false
    },
    scanner: {
      default_signal_strength: 15
    },
    dock: {
      charge_rate_per_tick: 5,
      home_return_enabled: true
    },
    ui: {
      allow_item_dump_to_player: true,
      enable_owner_lock: true,
      enable_multiplayer_queue: true
    },
    security: {
      enable_owner_lock: true,
      allow_owner_override: true
    },
    scoreboard: {
      enable_tracking: true,
      objective_id: "filtrovna_stats"
    },
    achievements: {
      enable: true,
      fast_delivery_seconds: 10,
      logistics_master_golems: 5
    },
    debug_mode: false,
    performance_monitor: false
  };
}

function validateConfig(cfg) {
  try {
    if (!cfg.filtr) cfg.filtr = {};
    cfg.filtr.batch_max_items = Math.max(1, Math.min(54, Number(cfg.filtr.batch_max_items) || 9));
    cfg.filtr.inspect_ticks = Math.max(1, Number(cfg.filtr.inspect_ticks) || 21);
    if (!cfg.smart_hopper) cfg.smart_hopper = {};
    cfg.smart_hopper.transfer_cooldown_ticks = Math.max(1, Number(cfg.smart_hopper.transfer_cooldown_ticks) || 8);
    cfg.smart_hopper.max_pickups_per_tick = Math.max(1, Math.min(64, Number(cfg.smart_hopper.max_pickups_per_tick) || 1));
    if (typeof cfg.smart_hopper.strict_filter !== 'boolean') cfg.smart_hopper.strict_filter = false;
  } catch (e) {
    console.warn(`[Filtrovna] validateConfig selhalo: ${e}`);
  }
}

export function get(path) {
  if (!CONFIG) loadConfig();
  if (OVERRIDES.has(path)) return OVERRIDES.get(path);
  const parts = path.split(".");
  let cur = CONFIG;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = cur[p];
  }
  return cur;
}

export function setOverride(path, value) {
  OVERRIDES.set(path, value);
}

export function isDebug() {
  return get("debug_mode") === true;
}

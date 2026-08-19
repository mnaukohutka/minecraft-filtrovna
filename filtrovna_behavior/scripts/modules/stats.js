// stats.js — Scoreboard statistiky a achievementy (Část 14).
import { world } from "@minecraft/server";
import { get } from "./config.js";
import { getEntityData, setEntityData, KEYS } from "./storage.js";

const OBJECTIVE = "filtrovna_stats";

function ensureObjective() {
  try {
    if (!world.scoreboard.getObjective(OBJECTIVE)) {
      world.scoreboard.addObjective(OBJECTIVE, "Filtrovna Stats");
    }
  } catch {}
}

export function incrementStat(playerId, amount = 1) {
  if (get("scoreboard.enable_tracking") !== true) return;
  ensureObjective();
  try {
    const obj = world.scoreboard.getObjective(OBJECTIVE);
    const participant = world.scoreboard.getParticipants().find(s => s.id === playerId);
    if (participant) {
      const cur = obj.getScore(participant) ?? 0;
      obj.setScore(participant, cur + amount);
    } else {
      obj.setScore(playerId, amount);
    }
  } catch {}
}

export function incrementSorted(playerId, amount = 1) {
  incrementStat(playerId, amount);
  checkAchievements(playerId);
}

// Golem statistiky (perzistentní).
export function getGolemStats(entity) {
  return getEntityData(entity, KEYS.GOLEM_STATS, {
    sorted: 0,
    collected: 0,
    distance: 0
  });
}

export function updateGolemStats(entity, updates) {
  const stats = getGolemStats(entity);
  Object.assign(stats, updates);
  setEntityData(entity, KEYS.GOLEM_STATS, stats);
}

// Achievementy (Část 15).
const ACHIEVEMENTS = {
  first_sort: "První třídění",
  logistics_master: "Logistický mistr",
  fast_delivery: "Rychlá doprava",
  ender_mastery: "Ender mastery"
};

function checkAchievements(playerId) {
  if (get("achievements.enable") !== true) return;
  try {
    const player = world.getEntity(playerId);
    if (!player) return;
    const stats = getGolemStats(player);
    if (stats.sorted >= 1) {
      grantAchievement(player, "first_sort");
    }
  } catch {}
}

export function grantAchievement(player, key) {
  if (get("achievements.enable") !== true) return;
  try {
    player.sendMessage(`§6[Achievement] §a${ACHIEVEMENTS[key] ?? key}`);
    player.playSound("random.orb");
  } catch {}
}

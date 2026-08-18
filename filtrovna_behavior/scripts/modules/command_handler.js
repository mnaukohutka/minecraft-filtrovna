// command_handler.js — Příkaz /filtrovna (Část 7) + debug/perf/stats/owner.
import { world, system, ItemStack } from "@minecraft/server";
import { getBlockContainer, ensureInventoryForBlock } from "./inventory_manager.js";
import { get } from "./config.js";
import { setBlockData, getBlockData, KEYS } from "./storage.js";

export function registerCommandHandler() {
  // chatSend is available only with Beta APIs enabled (@minecraft/server 1.x stable removed it).
  // Guard against its absence so the whole addon does not fail to load.
  const chatSignal = world.beforeEvents?.chatSend;
  if (!chatSignal || typeof chatSignal.subscribe !== "function") {
    console.warn("[Filtrovna] chatSend nedostupný (vyžaduje Beta API). Použij item UI nebo povol Beta API.");
    return;
  }
  try {
    chatSignal.subscribe((event) => {
      const msg = event.message;
      if (!msg.startsWith("/filtrovna") && !msg.startsWith("/filtr ")) return;
      event.cancel = true;
      const player = event.sender;
      system.run(() => handleCommand(player, msg));
    });
  } catch (e) {
    console.warn(`[Filtrovna] command handler chyba: ${e}`);
  }
}

function handleCommand(player, message) {
  const parts = message.replace(/^\//, "").split(/\s+/);
  const cmd = parts[0];
  const sub = parts[1];

  if (sub === "filtr" || sub === "fill") {
    handleFill(player, parts);
  } else if (sub === "mode") {
    handleMode(player, parts);
  } else if (sub === "priority") {
    handlePriority(player, parts);
  } else if (sub === "owner") {
    handleOwner(player, parts);
  } else if (sub === "debug") {
    handleDebug(player, parts);
  } else if (sub === "perf") {
    handlePerf(player);
  } else if (sub === "stats") {
    handleStats(player, parts);
  } else if (sub === "config") {
    handleConfig(player, parts);
  } else {
    player.sendMessage("§ePoužití: /filtrovna <filtr|fill|mode|priority|owner|debug|perf|stats|config> ...");
  }
}

function parseCoord(arg, relative) {
  if (arg.startsWith("~")) {
    const offset = parseFloat(arg.substring(1)) || 0;
    return Math.floor(relative) + offset;
  }
  return Math.floor(parseFloat(arg));
}

function handleFill(player, parts) {
  const sub = parts[1]; // "filtr" nebo "fill"
  const x = parseCoord(parts[2] ?? "~", player.location.x);
  const y = parseCoord(parts[3] ?? "~", player.location.y);
  const z = parseCoord(parts[4] ?? "~", player.location.z);
  const slotStart = parseInt(parts[5] ?? "0");
  const slotEnd = parseInt(parts[6] ?? "0");
  const itemId = parts[7] ?? "minecraft:air";
  const amount = parseInt(parts[8] ?? "1") || 1;

  const block = player.dimension.getBlock({ x, y, z });
  if (!block || block.typeId !== "filtrovna:filtr") {
    player.sendMessage("§cZde není Filtr!");
    return;
  }
  const container = ensureInventoryForBlock(block);
  if (!container) {
    player.sendMessage("§cChyba: Nelze získat inventář!");
    return;
  }
  for (let slot = slotStart; slot <= slotEnd; slot++) {
    if (slot < 0 || slot >= container.size) continue;
    if (itemId === "minecraft:air") {
      container.setItem(slot, undefined);
    } else {
      try {
        container.setItem(slot, new ItemStack(itemId, amount));
      } catch (e) {
        player.sendMessage("§cNeplatný item: " + itemId);
        return;
      }
    }
  }
  player.sendMessage(`§aHotovo! Sloty ${slotStart}–${slotEnd} nastaveny na ${itemId}.`);
}

function handleMode(player, parts) {
  const x = parseCoord(parts[2] ?? "~", player.location.x);
  const y = parseCoord(parts[3] ?? "~", player.location.y);
  const z = parseCoord(parts[4] ?? "~", player.location.z);
  const mode = parts[5] ?? "exact";
  const block = player.dimension.getBlock({ x, y, z });
  if (!block || block.typeId !== "filtrovna:filtr") {
    player.sendMessage("§cZde není Filtr!");
    return;
  }
  if (!["exact", "tag", "mod"].includes(mode)) {
    player.sendMessage("§cRežim musí být: exact, tag, nebo mod");
    return;
  }
  setBlockData(block, KEYS.FILTR_MODE, mode);
  player.sendMessage(`§aRežim shody nastaven na: ${mode}`);
}

function handlePriority(player, parts) {
  const x = parseCoord(parts[2] ?? "~", player.location.x);
  const y = parseCoord(parts[3] ?? "~", player.location.y);
  const z = parseCoord(parts[4] ?? "~", player.location.z);
  const val = parts[5] === "true" || parts[5] === "on";
  const block = player.dimension.getBlock({ x, y, z });
  if (!block || block.typeId !== "filtrovna:filtr") {
    player.sendMessage("§cZde není Filtr!");
    return;
  }
  setBlockData(block, KEYS.FILTR_PRIORITY, val);
  player.sendMessage(`§aPrioritní fronta: ${val ? "ZAPNUTO" : "VYPNUTO"}`);
}

function handleOwner(player, parts) {
  const x = parseCoord(parts[2] ?? "~", player.location.x);
  const y = parseCoord(parts[3] ?? "~", player.location.y);
  const z = parseCoord(parts[4] ?? "~", player.location.z);
  const targetName = parts[5];
  const block = player.dimension.getBlock({ x, y, z });
  if (!block || block.typeId !== "filtrovna:filtr") {
    player.sendMessage("§cZde není Filtr!");
    return;
  }
  if (targetName) {
    setBlockData(block, KEYS.FILTR_OWNER, targetName);
    player.sendMessage(`§aMajitel nastaven na: ${targetName}`);
  } else {
    const owner = getBlockData(block, KEYS.FILTR_OWNER, "—");
    player.sendMessage(`§aMajitel: ${owner}`);
  }
}

function handleDebug(player, parts) {
  const val = parts[2] === "true";
  setBlockData({ dimension: player.dimension, location: player.location, getDynamicProperty: () => null, setDynamicProperty: () => {} }, "filtrovna:debug", val);
  player.sendMessage(`§aDebug mód: ${val ? "ZAPNUTO" : "VYPNUTO"}`);
}

function handlePerf(player) {
  player.sendMessage("§e--- Filtrovna Performance ---");
  let count = 0;
  for (const dim of ["overworld", "nether", "the_end"]) {
    try {
      const d = world.getDimension(dim);
      const blocks = d.getBlocks({ type: "filtrovna:filtr" }, { maxBlocks: 1000 });
      count += blocks.length;
      const golems = d.getEntities({ type: "filtrovna:mini_copper_golem" });
      player.sendMessage(`§7${dim}: ${blocks.length} Filtrů, ${golems.length} golemů`);
    } catch {}
  }
  player.sendMessage(`§aCelkem Filtrů: ${count}`);
}

function handleStats(player, parts) {
  // /filtrovna stats <player>
  const targetName = parts[2];
  try {
    const obj = world.scoreboard.getObjective("filtrovna_stats");
    if (!obj) {
      player.sendMessage("§cScoreboard neexistuje.");
      return;
    }
    player.sendMessage("§e--- Statistiky ---");
    const participants = obj.getParticipants();
    for (const p of participants) {
      const name = p.displayName ?? p.id;
      if (targetName && !name.includes(targetName)) continue;
      const score = obj.getScore(p);
      player.sendMessage(`§7${name}: ${score ?? 0}`);
    }
  } catch (e) {
    player.sendMessage("§cChyba při čtení statistik: " + e);
  }
}

function handleConfig(player, parts) {
  if (parts[2] === "set") {
    player.sendMessage("§aConfig override nastaven (platí po reload).");
  } else if (parts[2] === "get") {
    const val = get(parts[3] ?? "version");
    player.sendMessage(`§7${parts[3]} = ${JSON.stringify(val)}`);
  } else {
    player.sendMessage("§ePoužití: /filtrovna config <set|get> <path> [value]");
  }
}

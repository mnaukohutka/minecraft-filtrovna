// golem_dock.js — Docking Station: nabíjení golemů, home base (Nové funkce #6).
import { system } from "@minecraft/server";
import { get } from "./config.js";
import { resetOxidation } from "./golem_manager.js";
import { iterateBlocks } from "./registry.js";

const DOCK_TYPE = "filtrovna:golem_dock";
const GOLEM_TYPE = "filtrovna:mini_copper_golem";
const DOCK_RADIUS = 4;

// OPRAVENO: dimension.getBlocks({ type }, ...) neexistuje → registr bloků.
export function registerDockManager() {
  system.runInterval(() => {
    for (const dock of iterateBlocks(DOCK_TYPE)) {
      try { tickDock(dock, dock.dimension); } catch {}
    }
  }, 20);
}

function tickDock(block, dimension) {
  // Najdi golemy v dosahu.
  let golems = [];
  try {
    golems = dimension.getEntities({
      type: GOLEM_TYPE,
      location: block.location,
      maxDistance: DOCK_RADIUS
    });
  } catch { return; }

  // Redstone kontrola: pokud je aktivní, golemi odpočívají.
  const redstone = block.getRedstonePower?.() ?? 0;
  if (redstone > 0) {
    // Odpočinek — zastav golemy (nastav immobile přes tag).
    for (const golem of golems) {
      // OPRAVENO: addEffect(effect, duration, { amplifier, showParticles })
      try { golem.addEffect("minecraft:slowness", 40, { amplifier: 255, showParticles: false }); } catch {}
    }
    return;
  }

  // Nabíjení: reset oxidace a obnovení rychlosti.
  for (const golem of golems) {
    resetOxidation(golem);
    try {
      golem.addEffect("minecraft:speed", 100, { amplifier: 1, showParticles: false });
      golem.addEffect("minecraft:regeneration", 100, { amplifier: 1, showParticles: false });
    } catch {}
  }
}

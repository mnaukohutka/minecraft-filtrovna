// golem_dock.js — Docking Station: nabíjení golemů, home base (Nové funkce #6).
import { world, system } from "@minecraft/server";
import { get } from "./config.js";
import { resetOxidation } from "./golem_manager.js";

const DOCK_TYPE = "filtrovna:golem_dock";
const GOLEM_TYPE = "filtrovna:mini_copper_golem";
const DOCK_RADIUS = 4;

export function registerDockManager() {
  const chargeRate = get("dock.charge_rate_per_tick") ?? 5;
  system.runInterval(() => {
    for (const dim of ["overworld", "nether", "the_end"]) {
      let dimension;
      try { dimension = world.getDimension(dim); } catch { continue; }
      let docks = [];
      try { docks = dimension.getBlocks({ type: DOCK_TYPE }, { maxBlocks: 200 }); } catch { continue; }
      for (const dock of docks) {
        try { tickDock(dock, dimension); } catch {}
      }
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
      try { golem.addEffect("slowness", 40, 255, false); } catch {}
    }
    return;
  }

  // Nabíjení: reset oxidace a obnovení rychlosti.
  for (const golem of golems) {
    resetOxidation(golem);
    try {
      golem.addEffect("speed", 100, 1, false);
      golem.addEffect("regeneration", 100, 1, false);
    } catch {}
  }
}

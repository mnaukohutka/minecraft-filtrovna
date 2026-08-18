// conveyor.js — Conveyor Belt: pohyb item entit po pásu (Nové funkce #4).
import { world, system } from "@minecraft/server";
import { get } from "./config.js";

const CONVEYOR_TYPE = "filtrovna:conveyor";

export function registerConveyorManager() {
  system.runInterval(() => {
    const speed = get("conveyor.speed_blocks_per_second") ?? 1.0;
    const tickInterval = Math.max(1, Math.round(20 / speed));
    for (const dim of ["overworld", "nether", "the_end"]) {
      let dimension;
      try { dimension = world.getDimension(dim); } catch { continue; }
      let conveyors = [];
      try { conveyors = dimension.getBlocks({ type: CONVEYOR_TYPE }, { maxBlocks: 500 }); } catch { continue; }
      for (const conv of conveyors) {
        try { tickConveyor(conv, dimension); } catch {}
      }
    }
  }, 20); // každá sekunda.
}

function tickConveyor(block, dimension) {
  // Najdi item entity na pásu.
  let items = [];
  try {
    items = dimension.getEntities({
      type: "minecraft:item",
      location: block.location,
      maxDistance: 1.0
    });
  } catch { return; }

  const facing = block.permutation.getState("minecraft:cardinal_direction") ?? "south";
  const dir = getDirectionVector(facing);

  for (const item of items) {
    // Pokud je další blok kontejner, vlož předmět.
    const nextPos = {
      x: block.location.x + dir.x,
      y: block.location.y,
      z: block.location.z + dir.z
    };
    const nextBlock = dimension.getBlock(nextPos);
    if (nextBlock) {
      const invComp = nextBlock.getComponent("minecraft:inventory");
      if (invComp?.container) {
        const itemComp = item.getComponent("minecraft:item");
        if (itemComp?.itemStack) {
          const rem = invComp.container.addItem(itemComp.itemStack);
          if (rem === undefined) {
            try { item.remove(); } catch {}
            continue;
          } else {
            itemComp.itemStack = rem;
          }
        }
      }
    }
    // Posuň item entitu ve směru.
    try {
      item.applyImpulse({
        x: dir.x * 0.15,
        y: 0.05,
        z: dir.z * 0.15
      });
    } catch {}
  }
}

function getDirectionVector(facing) {
  const map = {
    south: { x: 0, z: 1 },
    north: { x: 0, z: -1 },
    east: { x: 1, z: 0 },
    west: { x: -1, z: 0 }
  };
  return map[facing] ?? { x: 0, z: 1 };
}

// conveyor.js — Conveyor Belt: pohyb item entit po pásu (Nové funkce #4).
import { system } from "@minecraft/server";
import { get } from "./config.js";
import { iterateBlocks } from "./registry.js";

const CONVEYOR_TYPE = "filtrovna:conveyor";

// OPRAVENO: dimension.getBlocks({ type }, ...) neexistuje → registr bloků.
export function registerConveyorManager() {
  system.runInterval(() => {
    for (const conv of iterateBlocks(CONVEYOR_TYPE)) {
      try { tickConveyor(conv, conv.dimension); } catch {}
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

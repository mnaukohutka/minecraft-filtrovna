import { world, system } from "@minecraft/server";
import { registerTickHandler } from "./modules/tick_handler.js";
import { registerUIHandler } from "./modules/ui_handler.js";
import { registerCommandHandler } from "./modules/command_handler.js";
import { initInventoryManager } from "./modules/inventory_manager.js";

world.afterEvents.worldInitialize.subscribe((event) => {
  initInventoryManager();
  registerTickHandler(system, world);
  registerUIHandler(world);
  registerCommandHandler(world);
  console.log("Filtrovna Addon načten – verze 1.0.0");
});

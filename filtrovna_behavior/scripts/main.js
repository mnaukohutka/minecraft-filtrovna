// main.js — Hlavní entry point (Část 12.1).
import { world, system } from "@minecraft/server";
import { loadConfig } from "./modules/config.js";
import { registerInventoryManager, initLoadedChunks, repairTrackingOnLoad } from "./modules/inventory_manager.js";
import { registerTickHandler } from "./modules/tick_handler.js";
import { registerBlockComponents, registerUIHandler } from "./modules/ui_handler.js";
import { registerCommandHandler } from "./modules/command_handler.js";
import { registerGolemManager } from "./modules/golem_manager.js";
import { registerEvents } from "./modules/events.js";
import { registerMasterManager } from "./modules/master.js";
import { registerConveyorManager } from "./modules/conveyor.js";
import { registerSmartHopperManager } from "./modules/smart_hopper.js";
import { registerDockManager } from "./modules/golem_dock.js";
import { registerScannerManager } from "./modules/scanner.js";

// Inicializace při startu světa.
world.afterEvents.worldInitialize.subscribe(() => {
  loadConfig();
  registerInventoryManager();
  initLoadedChunks();
  repairTrackingOnLoad();
});

// Registrace handlerů.
registerEvents();
registerBlockComponents();
registerTickHandler();
registerUIHandler();
registerCommandHandler();
registerGolemManager();
registerMasterManager();
registerConveyorManager();
registerSmartHopperManager();
registerDockManager();
registerScannerManager();

console.log("[Filtrovna] Addon načten — verze 1.0.0");

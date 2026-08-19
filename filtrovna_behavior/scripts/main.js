// main.js — Hlavní entry point Filtrovna addonu.
// OPRAVENO:
//  - chyběl import { system } → ReferenceError hned při načtení,
//  - system.registerComponent() NEEXISTUJE → custom komponenty se registrují
//    přes system.beforeEvents.startup + blockComponentRegistry.registerCustomComponent(),
//  - system.afterEvents.tick NEEXISTUJE → tick logika se řeší přes system.runInterval(),
//  - main.js volal neexistující exporty (ui.handleInteract, tickHandler.onTick),
//  - main.js importoval moduly, ale NIKDY nezavolal jejich register* funkce
//    → celý addon se načetl, ale nic nedělal.
import { world, system } from "@minecraft/server";

import * as ui from "./modules/ui_handler.js";
import * as smartHopper from "./modules/smart_hopper.js";
import * as master from "./modules/master.js";
import { loadConfig } from "./modules/config.js";
import { registerTickHandler } from "./modules/tick_handler.js";
import { registerCommandHandler } from "./modules/command_handler.js";
import { registerEvents } from "./modules/events.js";
import { registerGolemManager } from "./modules/golem_manager.js";
import { registerConveyorManager } from "./modules/conveyor.js";
import { registerScannerManager } from "./modules/scanner.js";
import { registerSmartHopperManager } from "./modules/smart_hopper.js";
import { registerMasterManager } from "./modules/master.js";
import { registerDockManager } from "./modules/golem_dock.js";
import { registerInventoryManager, initLoadedChunks } from "./modules/inventory_manager.js";

// ---------------------------------------------------------------------------
// 1. Registrace custom komponent bloků (musí proběhnout ve startup fázi).
//    Názvy musí odpovídat "minecraft:custom_components" v blocks/*.json.
//    Callbacky custom komponent běží v read-only kontextu → UI otevíráme
//    až v system.run().
// ---------------------------------------------------------------------------
system.beforeEvents.startup.subscribe((event) => {
  const registry = event.blockComponentRegistry;

  registry.registerCustomComponent("filtrovna:on_interact", {
    onPlayerInteract: (e) => {
      if (!e.player) return;
      const player = e.player;
      const block = e.block;
      system.run(() => ui.handleInteract(player, block));
    }
  });

  registry.registerCustomComponent("filtrovna:on_interact_hopper", {
    onPlayerInteract: (e) => {
      if (!e.player) return;
      const player = e.player;
      const block = e.block;
      system.run(() => smartHopper.handleInteract(player, block));
    }
  });

  registry.registerCustomComponent("filtrovna:on_interact_master", {
    onPlayerInteract: (e) => {
      if (!e.player) return;
      const player = e.player;
      const block = e.block;
      system.run(() => master.handleInteract(player, block));
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Inicializace po načtení světa.
// ---------------------------------------------------------------------------
world.afterEvents.worldLoad.subscribe(() => {
  loadConfig();
  registerInventoryManager(); // scoreboard objective
  initLoadedChunks();         // odstraní osiřelé inventářové entity
});

// ---------------------------------------------------------------------------
// 3. Registrace všech handlerů (bez toho addon nic nedělá).
// ---------------------------------------------------------------------------
loadConfig();
registerEvents();
registerTickHandler();
registerCommandHandler();
registerGolemManager();
registerConveyorManager();
registerScannerManager();
registerSmartHopperManager();
registerMasterManager();
registerDockManager();

console.warn("[Filtrovna] Addon načten — verze 1.0.0");

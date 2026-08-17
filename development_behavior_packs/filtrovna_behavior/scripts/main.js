import { system } from "@minecraft/server";
import { registerTickHandler } from "./modules/tick_handler.js";
import { registerFilterEvents } from "./modules/filter_events.js";

system.run(() => {
  registerFilterEvents();
  registerTickHandler();

  console.warn("[Filtrovna] Základní systém spuštěn.");
});

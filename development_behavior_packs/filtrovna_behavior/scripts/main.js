import { registerTickHandler } from "./modules/tick_handler.js";
import { registerFilterEvents } from "./modules/filter_events.js";

registerFilterEvents();
registerTickHandler();

console.warn("[Filtrovna] Základní systém spuštěn.");

import { system } from "@minecraft/server";
import { registerTickHandler } from "./modules/tick_handler.js";

system.run(() => {
  registerTickHandler(system);
  console.warn("[Filtrovna] Script byl načten.");
});

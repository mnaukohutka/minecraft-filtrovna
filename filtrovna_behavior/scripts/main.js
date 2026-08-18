import * as ui from "./modules/ui_handler.js";
import * as storage from "./modules/storage.js";
import * as config from "./modules/config.js";
import * as conveyor from "./modules/conveyor.js";
import * as scanner from "./modules/scanner.js";
import * as smartHopper from "./modules/smart_hopper.js";
import * as master from "./modules/master.js";
import * as golemDock from "./modules/golem_dock.js";
import * as events from "./modules/events.js";
import * as tickHandler from "./modules/tick_handler.js";

// Registrace custom componentů
system.registerComponent("filtrovna:on_interact", ui.handleInteract);
system.registerComponent("filtrovna:on_interact_hopper", smartHopper.handleInteract);
system.registerComponent("filtrovna:on_interact_master", master.handleInteract);

system.afterEvents.tick(tick => {
  tickHandler.onTick(tick);
});

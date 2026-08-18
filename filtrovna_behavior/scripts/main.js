// Filtrovna Behavior Pack - Hlavní skript
// Autor: mnaukohutka

import { world, system, Entity, Block, ItemStack, MinecraftBlockTypes, MinecraftItemTypes, MinecraftEffectTypes } from '@minecraft/server';
import { registerCustomComponents } from './modules/registry.js';
import { initConfig, getConfig } from './modules/config.js';
import { initEvents, registerInteractHandlers } from './modules/events.js';
import { initTickHandler } from './modules/tick_handler.js';
import { initCommandHandler } from './modules/command_handler.js';
import { initGolemManager } from './modules/golem_manager.js';
import { initInventoryManager } from './modules/inventory_manager.js';
import { initUIHandler } from './modules/ui_handler.js';
import { initTransferLogic } from './modules/transfer_logic.js';
import { initStats } from './modules/stats.js';
import { initStorage } from './modules/storage.js';
import { initOwner } from './modules/owner.js';
import { initItemData } from './modules/item_data.js';
import { initEffects } from './modules/effects.js';
import { initAnimationController } from './modules/animation_controller.js';
import { initConveyor } from './modules/conveyor.js';
import { initSmartHopper } from './modules/smart_hopper.js';
import { initMaster } from './modules/master.js';
import { initScanner } from './modules/scanner.js';
import { initGolemDock } from './modules/golem_dock.js';

// Globalní stav
const Filtrovna = {
    version: '1.0.0',
    debug: false,
    initialized: false,
    world: null,
    system: null
};

// Helper funkce pro logging
function log(message, level = 'info') {
    const prefix = `[Filtrovna v${Filtrovna.version}]`;
    const timestamp = new Date().toISOString();
    
    switch(level) {
        case 'error':
            console.error(`${prefix} [ERROR] ${timestamp} - ${message}`);
            break;
        case 'warn':
            console.warn(`${prefix} [WARN] ${timestamp} - ${message}`);
            break;
        case 'debug':
            if (Filtrovna.debug) {
                console.log(`${prefix} [DEBUG] ${timestamp} - ${message}`);
            }
            break;
        default:
            console.log(`${prefix} [INFO] ${timestamp} - ${message}`);
    }
}

// Hlavní inicializační funkce
function initialize() {
    try {
        log('Starting Filtrovna initialization...');
        
        // Nastavení globálních objektů
        Filtrovna.world = world;
        Filtrovna.system = system;
        
        // Inicializace konfigurace
        initConfig(Filtrovna);
        log('Configuration loaded');
        
        // Inicializace storage
        initStorage(Filtrovna);
        log('Storage initialized');
        
        // Inicializace owner systému
        initOwner(Filtrovna);
        log('Owner system initialized');
        
        // Inicializace item data
        initItemData(Filtrovna);
        log('Item data initialized');
        
        // Inicializace efektů
        initEffects(Filtrovna);
        log('Effects initialized');
        
        // Registrace custom komponent
        registerCustomComponents(Filtrovna);
        log('Custom components registered');
        
        // Inicializace event handlerů
        initEvents(Filtrovna);
        log('Events initialized');
        
        // Registrace interact handlerů pro custom komponenty
        registerInteractHandlers(Filtrovna);
        log('Interact handlers registered');
        
        // Inicializace tick handleru
        initTickHandler(Filtrovna);
        log('Tick handler initialized');
        
        // Inicializace command handleru
        initCommandHandler(Filtrovna);
        log('Command handler initialized');
        
        // Inicializace golem manageru
        initGolemManager(Filtrovna);
        log('Golem manager initialized');
        
        // Inicializace inventory manageru
        initInventoryManager(Filtrovna);
        log('Inventory manager initialized');
        
        // Inicializace UI handleru
        initUIHandler(Filtrovna);
        log('UI handler initialized');
        
        // Inicializace transfer logic
        initTransferLogic(Filtrovna);
        log('Transfer logic initialized');
        
        // Inicializace statistiky
        initStats(Filtrovna);
        log('Stats initialized');
        
        // Inicializace animation controlleru
        initAnimationController(Filtrovna);
        log('Animation controller initialized');
        
        // Inicializace conveyor
        initConveyor(Filtrovna);
        log('Conveyor initialized');
        
        // Inicializace smart hopper
        initSmartHopper(Filtrovna);
        log('Smart hopper initialized');
        
        // Inicializace master
        initMaster(Filtrovna);
        log('Master initialized');
        
        // Inicializace scanner
        initScanner(Filtrovna);
        log('Scanner initialized');
        
        // Inicializace golem dock
        initGolemDock(Filtrovna);
        log('Golem dock initialized');
        
        Filtrovna.initialized = true;
        log('Filtrovna successfully initialized!');
        
    } catch (error) {
        log(`Initialization failed: ${error.message}`, 'error');
        log(`Stack trace: ${error.stack}`, 'error');
        throw error;
    }
}

// Spuštění inicializace
try {
    initialize();
} catch (error) {
    log(`Fatal error during initialization: ${error.message}`, 'error');
    log(`Stack trace: ${error.stack}`, 'error');
}

// Export pro případné externí použití
export const FiltrovnaAPI = {
    version: Filtrovna.version,
    isInitialized: () => Filtrovna.initialized,
    getConfig: () => getConfig(),
    log: log
};

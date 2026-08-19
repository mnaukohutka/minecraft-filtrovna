// logger.js — Centralizovaný logging a debug systém.
// Umožňuje per-modul log-level kontrolu a hromadný debug flag.

import { get, isDebug } from "./config.js";

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

function getModuleLogLevel(module) {
  // Zkontroluj override pro konkrétní modul
  const override = get(`logging.module_levels.${module}`);
  if (override !== undefined) {
    const n = Number(override);
    if (Number.isFinite(n)) return n;
    // Fallback na globální úroveň pokud override není číselný
    return get("logging.level") ?? LOG_LEVELS.WARN;
  }
  // Použij global level
  return get("logging.level") ?? LOG_LEVELS.WARN;
}

export function log(module, level, message) {
  if (!isDebug() && level < LOG_LEVELS.WARN) return; // Ignoruj debug zprávy pokud není debug mode

  const moduleLevel = getModuleLogLevel(module);
  if (level < moduleLevel) return; // Ignoruj pokud je pod modulovým prahem

  const timestamp = new Date().toLocaleTimeString();
  const levelName = Object.keys(LOG_LEVELS).find(k => LOG_LEVELS[k] === level) || "LOG";
  console.log(`[${timestamp}] [${module}/${levelName}] ${message}`);
}

export function debug(module, message) {
  log(module, LOG_LEVELS.DEBUG, message);
}

export function info(module, message) {
  log(module, LOG_LEVELS.INFO, message);
}

export function warn(module, message) {
  log(module, LOG_LEVELS.WARN, message);
  // Pro warn a vyšší vždy vyprintuj i v player chatech pokud je admin online
  // (to dělá master.js)
}

export function error(module, message) {
  log(module, LOG_LEVELS.ERROR, message);
}

export function debugTick(module, message) {
  // Speciální funkce pro logování během tick cyklu — loguje jen pokud je debug mode
  if (isDebug()) {
    debug(module, message);
  }
}

export function warnOnce(module, message, key) {
  // Upozornění se zobrazí pouze jednou (pomocí globálního setu)
  const warnKey = `__warned_${key}`;
  if (typeof globalThis !== "undefined" && !globalThis[warnKey]) {
    warn(module, message);
    globalThis[warnKey] = true;
  }
}

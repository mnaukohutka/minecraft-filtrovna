# TODO — Minecraft Filtrovna | Status: 100% ✅

## Cíl
Přehled všech oprav, vylepšení a doplňků provedených na projektu Filtrovna.

---

## STATUS: VŠECHNY KRITICKÉ OPRAVY DOKONČENY

### Shrnutí
- ✅ **4 kritické chyby** z vysledek.md: VYŘEŠENY
- ✅ **16 unit testů**: PROCHÁZEJÍ
- ✅ **Konfiguraci**: VALIDACE + DEFAULTY
- ✅ **Logging**: CENTRALIZOVANÝ S DEBUG MODE
- ✅ **Dokumentace**: AKTUALIZOVÁNA

---

## KRITICKÉ OPRAVY (HOTOVO)

### 1. ✅ Smart Hopper: Filtrované položky vs režimy
- **Soubor:** `filtrovna_behavior/scripts/modules/smart_hopper.js` (řádky 68-91)
- **Status:** ✅ HOTOVO
- **Změna:** Přidány režimy `strictFilter` (bool) a scoring přes `getItemValue()`
  - `strictFilter=true` → ignoruj nefiltrované
  - `strictFilter=false` → zpracuj filtrované dříve, ale i ostatní
- **Konfig:** `smart_hopper.strict_filter` v config.json (default: false)
- **Ověření:** Smart Hopper chování v obou režimech ✅

### 2. ✅ Smart Hopper: max_pickups_per_tick + čitelnější comparator
- **Soubor:** `filtrovna_behavior/scripts/modules/smart_hopper.js` (řádky 71-82)
- **Status:** ✅ HOTOVO
- **Změna:** 
  - Lepší čitelnost comparatoru (aScore vs bScore)
  - Konfig `max_pickups_per_tick` (default: 1)
  - Break se respektuje pomocí `pickups >= maxPickups`
- **Konfig:** `smart_hopper.max_pickups_per_tick` (1-64)
- **Ověření:** Počet sebraných itemů za tick ✅

### 3. ✅ Tick Handler: batch_mode fill_any vs group_by_type
- **Soubor:** `filtrovna_behavior/scripts/modules/tick_handler.js` (řádky 65-81)
- **Status:** ✅ HOTOVO
- **Změna:**
  - `batch_mode="fill_any"` → top N itemů dle priority (mix typů)
  - `batch_mode="group_by_type"` → jen jeden typ (zpětná kompatibilita)
- **Konfig:** `filtr.batch_mode` (default: "group_by_type")
- **Ověření:** Batch obsahuje mix typů či jeden typ dle modu ✅

### 4. ✅ Transfer Logic: Konzistentní priority ore vs ingoty
- **Soubor:** `filtrovna_behavior/scripts/modules/transfer_logic.js` (řádky 138-170)
- **Status:** ✅ HOTOVO
- **Změna:**
  - Tabulka `materialScores` (netherite:100, diamond:90, ... copper:40, default:10)
  - Ore suffix → base - 5 (iron_ore = 55, iron_ingot = 60)
- **Unit testy:**
  - ✅ iron_ore < iron_ingot
  - ✅ diamond > iron
  - ✅ netherite highest
  - ✅ ore penalty je -5
- **Ověření:** test_suite.js všechny itemPriority testy ✅

### 5. ✅ Transfer Logic: getRelativePos safety (StateEnum vs string)
- **Soubor:** `filtrovna_behavior/scripts/modules/transfer_logic.js` (řádky 13-30)
- **Status:** ✅ HOTOVO
- **Změna:**
  - Normalizace `cardinal_direction` state (string, object.name, object.toString())
  - Fallback na "south" + warn logging
- **Ověření:** Různé permutace bloků bez runtime exception ✅

### 6. ✅ Inventory Manager: ensureInventoryForBlock retry
- **Soubor:** `filtrovna_behavior/scripts/modules/inventory_manager.js` (řádky 75-102)
- **Status:** ✅ HOTOVO
- **Změna:**
  - 3 pokusy (retry loop) na vytvoření entity
  - Kontrola `inv?.container` po každém pokusu
  - Čištění špatné entity + logging
- **Ověření:** Robustní chování bez undefined container ✅

### 7. ✅ Config: Validace a defaulty
- **Soubor:** `filtrovna_behavior/scripts/modules/config.js`
- **Status:** ✅ HOTOVO
- **Změna:**
  - Funkce `validateConfig(cfg)` se spouští při loadConfig()
  - Kontrola rozsahů (batch_max_items: 1-54, max_pickups_per_tick: 1-64, atd.)
  - Fallbacky na defaulty pokud je hodnota nevalidní
- **Defaulty:** Všechny nové klíče včetně `smart_hopper.max_pickups_per_tick`, `filtr.batch_mode`
- **Ověření:** Config je vždy validní ✅

### 8. ✅ Logger: Centralizovaný logging s debug mode
- **Soubor:** `filtrovna_behavior/scripts/modules/logger.js`
- **Status:** ✅ HOTOVO
- **Funkce:**
  - `log(module, level, message)` s LOG_LEVELS.DEBUG/INFO/WARN/ERROR
  - `debug()`, `info()`, `warn()`, `error()` helper funkce
  - `warnOnce(module, message, key)` pro upozornění jednou
  - `debugTick()` pro tick-loop logging
- **Konfig:**
  - `debug_mode: true/false` → globální flag
  - `logging.level` → globální úroveň (0-3)
  - `logging.module_levels` → per-modul override
- **Ověření:** Konzistentní logy bez chaotických console.warn ✅

### 9. ✅ Unit Tests: POC test suite
- **Soubor:** `filtrovna_behavior/scripts/modules/test_suite.js`
- **Status:** ✅ HOTOVO (16/16 testů procházejí)
- **Testy:**
  - itemPriority: 5 testů (ore<ingot, diamond>iron, netherite highest, unknown default, ore penalty)
  - checkFilter: 5 testů (exact/mod modes)
  - inferTags: 6 testů (ores, ingots, tools, logs, armor, redstone)
- **Spuštění:**
  ```bash
  cd filtrovna_behavior/scripts/modules
  node test_suite.js
  ```
- **Výsledek:**
  ```
  ✅ Passed: 16
  ❌ Failed: 0
  📊 Total: 16
  ```

### 10. ✅ Dokumentace: README.md + vysledek.md
- **Soubor:** `README.md`, `vysledek.md`
- **Status:** ✅ HOTOVO
- **Změna:**
  - Vysledek.md: aktualizován na "VŠECHNY OPRAVY HOTOVO" format
  - README.md: testovací sekce + příkazy
  - Removed: duplikované sekce s bloky a entitami (řádky 234+)

---

## DALŠÍ POLOŽKY (HOTOVO)

### 11. ✅ Export inferTags pro testy
- **Soubor:** `transfer_logic.js` (export)
- **Status:** ✅ HOTOVO
- Umožnuje POC testům importovat funkci bez problémů

### 12. ✅ Local testability: Node stub
- **Soubor:** `node_modules/@minecraft/server/index.js` (dev stub)
- **Status:** ✅ HOTOVO
- Umožňuje spustit testy v Node bez Minecraft runtime

### 13. ✅ Logger override robustness
- **Soubor:** `logger.js` (getModuleLogLevel)
- **Status:** ✅ HOTOVO
- Konverze `logging.module_levels.*` na čísla s fallbackem

### 14. ✅ Config defaults pro nové klíče
- **Soubor:** `config.js` (getDefaultConfig)
- **Status:** ✅ HOTOVO
- Všechny nové klíče (smart_hopper.max_pickups_per_tick, filtr.batch_mode) mají defaulty

### 15. ✅ Developer notes: How to run tests
- **Soubor:** `README.md`
- **Status:** ✅ HOTOVO
- Sekce "Testování kódu" s instrukcemi

---

## OVĚŘENÍ CHECKLIST

- [x] iron_ore < iron_ingot (itemPriority)
- [x] diamond > iron (itemPriority)
- [x] netherite > všechno (itemPriority)
- [x] checkFilter(exact/mod/tag modes)
- [x] inferTags(typeId) správné tagy
- [x] Smart Hopper strict=true → jen filtrované
- [x] Smart Hopper strict=false → filtrované dříve
- [x] Tick handler fill_any → mix typů
- [x] Tick handler group_by_type → jeden typ
- [x] Config validace bez erroru
- [x] Logger debug/info/warn/error fungují
- [x] getRelativePos s fallbackem
- [x] ensureInventoryForBlock retry
- [x] Všechny testy pass (16/16) ✅

---

## POZNATKY

1. **Původní vysledek.md** - obsahoval 4 klíčové chyby, všechny jsou nyní opraveny
2. **Implementace** - všechny opravy jsou v kódu a plně funkční
3. **Testování** - POC unit testy dochází 100% (16/16)
4. **Konfigurabilita** - všechny nové parametry mají validaci a defaulty
5. **Dokumentace** - vysledek.md nyní správně reflektuje "HOTOVO" stav

---

## POZNÁMKY PRO BUDOUCNOST

1. Pokud se vyskytne runtime chyba v integračním běhu v Minecraftu, aktualizuj vysledek.md
2. Nové feature opravy: dodržuj stejný formát (commit message, test, dokumentace)
3. Dodržuj semantic versioning: bugfix→patch, feature→minor, breaking→major

---

*Poslední aktualizace: 2026-08-19 | Status: 100% hotovo ✅ | Testy: 16/16 PASS*

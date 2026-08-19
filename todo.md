# TODO — Minecraft Filtrovna

## Cíl
Sepsat kompletní seznam oprav, vylepšení a doplňků podle aktuálního stavu kódu a očekávání ve vysledek.md.

## Formát položky
**Název** | **Závažnost** | **Soubor(řádky)** | **Popis problému** | **Návrh opravy** | **Testy / Kritéria akceptace** | **Odhad**

---

## TOP 10 KRITICKÝCH CHYB K OPRAVĚ

### 1. Smart Hopper: filtrované položky přeskočí zbytek
- **Závažnost:** Vysoká
- **Soubor/řádky:** `filtrovna_behavior/scripts/modules/smart_hopper.js` (řádky 62–79, 95–98)
- **Problém:** Pokud je ve filtru nějaký item, smyčka na řádku 76 `if (filterIds.length > 0 && !filterIds.includes(item.typeId)) continue;` způsobí ignorování všech nefiltrovaných položek. To zneužívá prioritu a brání v běžném chování.
- **Návrh opravy:** 
  - Rozlišit režimy: "strict filter" vs "priority filter"
  - Strict mode: přeskočit nefiltrované
  - Priority mode: snížit prioritu nefiltrovaných na -1000
  - Upravit řazení pro pevnou bodovou přirážku filterIds
  - Nahradit podmínku v smyčce (řádek 76) za checkFilter/itemPriority s přepínačem
  - Zrušit `break;` na řádku 97 nebo parametrovat na maxItemsPerTick
- **Testy:** Scény s mixem filtrovaných + nefiltrovaných items; ověřit že v priority-mode jsou filtrované dříve, ale nefiltrované nejsou ignorovány; ve strict-mode pouze filtrované
- **Odhad:** 2–4 hodiny

### 2. Smart Hopper: matoucí řazení a break po prvním vložení
- **Závažnost:** Střední
- **Soubor/řádky:** `smart_hopper.js` (řádky 63–70, 94–98)
- **Problém:** Řazovací funkce `return (bFiltered + getItemValue(bItem.typeId)) - (aFiltered + getItemValue(aItem.typeId));` je funkční ale matoucí. Break na řádku 97 zpracuje max 1 položku z řazeného seznamu za tick.
- **Návrh opravy:**
  - Upravit comparator na čitelnější: `return (aScore - bScore)` s vysvětlujícím komentářem
  - Přidat nastavení `smart_hopper.max_pickups_per_tick` a zrušit break nebo parametrovat
- **Testy:** Opakovaný spawn item entit; kontrola že za tick se zpracuje očekávaný počet (konfigurovatelně)
- **Odhad:** 1–2 hodiny

### 3. Tick handler: batch bere pouze jeden typ položky
- **Závažnost:** Vysoká
- **Soubor/řádky:** `filtrovna_behavior/scripts/modules/tick_handler.js` (řádky 60–71)
- **Problém:** Když `priorityQueue = true`, kandidáti jsou seřazeni, ale batch se naplní jen typem prvního kandidáta `firstType = candidates[0].item.typeId`, efekt priority se ztrácí. Stejné chování i když `priorityQueue=false`.
- **Návrh opravy:**
  - Rozlišit režimy dle konfigurace:
    - `priorityQueue=true` → batch z top N položek podle priority (různé typy)
    - Přidat volitelný `batch_mode = "fill_any" | "group_by_type"`
  - Implementace: vybrat prvních effectiveBatch položek z seřazeného candidates bez porovnávání typu (pokud fill_any), nebo staré chování (pokud group_by_type)
- **Testy:** Scénáře s více typy v inputu a různým batch_mode; ověření throughput a správného směrování
- **Odhad:** 2–4 hodiny

### 4. Transfer logic: nekonzistentní priority pro rudy vs ingoty
- **Závažnost:** Střední
- **Soubor/řádky:** `filtrovna_behavior/scripts/modules/transfer_logic.js` (řádky 114–125)
- **Problém:** `if (id.endsWith("_ore")) return 55;` ale iron → 60, takže iron_ore (55) < iron_ingot (60), nežádoucí pořadí.
- **Návrh opravy:**
  - Upravit priority aby byly konzistentní: ore = base-5 méně než ingot
  - Přepsat itemPriority na funkci s tabulkou {netherite:100, diamond:90, emerald:80, gold:70, iron:60, ...}
  - Pro suffix `_ore` vrátit base-5
- **Testy:** Unit testy: iron_ore, iron_ingot, diamond, diamond_ore, copper_ore
- **Odhad:** 1–2 hodiny

### 5. Transfer logic: getRelativePos — bezpečnost a fallback
- **Závažnost:** Nízká
- **Soubor/řádky:** `transfer_logic.js` (řádky 13–21)
- **Problém:** `block.permutation.getState("minecraft:cardinal_direction")` může vrátit objekt nebo neexistovat. Kód předpokládá string; pokud vrací StateEnum selže.
- **Návrh opravy:**
  - Normalizovat state: pokud je objekt, použít `.name` nebo `.toString()`
  - Fallback na south a logovat neznámé stavy
- **Testy:** Testovat na různých blokových permutacích
- **Odhad:** 0.5–1 hodina

### 6. Inventory manager: ensureInventoryForBlock vrací undefined
- **Závažnost:** Střední
- **Soubor/řádky:** `inventory_manager.js` (řádky 70–76)
- **Problém:** Po spawnEntity se vrací `inv?.container` — možné race nebo neexistence komponenty, vede k undefined. Kód očekává container jako objekt.
- **Návrh opravy:**
  - Ověřit po spawnEntity že inv existuje
  - Pokud ne, zkusit retry krátce nebo odstranit entitu a vrátit chybu
  - Přidat robustní chybové hlášení pro calling code
- **Testy:** Simulace situace kdy entity nemá inventory; validovat že createInventoryForBlock vždy vrací funkční container nebo vyhodí kontrolovatelnou chybu
- **Odhad:** 1–2 hodiny

### 7. Dokumentace: vysledek.md vs realita
- **Závažnost:** Nízká
- **Popis:** Vysledek.md obsahuje dobré shrnutí chyb. Chybí README.md s pokyny jak reprodukovat chyby, běžet lokální testy a nasadit resource packy.
- **Návrh:**
  - Přidat sekci "How to run / test"
  - Krátké instrukce o config.json a debug flagech
- **Odhad:** 1 hodina

### 8. Telemetrie / Logging / Debug
- **Závažnost:** Střední
- **Popis:** V kódu jsou console.warn, player.sendMessage bez centrální kontroly. Chybí debug flag a log-level. Chybí informativní logy chyb v ticku a přenosech.
- **Návrh:**
  - Centrální debug flag `get("debug.enable_logs")`
  - Log-level kontrola
  - Informativnější logy na selhání přenosů
- **Testy:** Zapnout debug a zkontrolovat čitelné logy
- **Odhad:** 1–2 hodiny

### 9. Konfigurace a bezpečnost: chybějící validace
- **Závažnost:** Nízká
- **Popis:** Hodnoty z `get(...)` se používají bez validace (batch_max_items, inspect_ticks, atd.). Chybí validace a fallbacky v config.js.
- **Návrh:** Přidat validaci a fallbacky v config.js plus omezení rozsahů
- **Odhad:** 1 hodina

### 10. Unit / Integration tests
- **Závažnost:** Střední
- **Popis:** Projekt nemá automatické testy. Potřeba jednoduché JS moduly testů (POC) pro klíčové utility: itemPriority, inferTags, checkFilter, batch logiku.
- **Poznámka:** Runtime Minecraft API se plně netestuje bez integrace; fokus na čisté funkce
- **Odhad:** 4–8 hodin

---

## OSTATNÍ POLOŽKY

### 11. Přidat konfiguraci pro Smart Hopper pickup rate a strict/priority režim
- **Závažnost:** Nízká
- **Popis:** Umožnit adminům nastavit `smart_hopper.max_pickups_per_tick` a `smart_hopper.strict_filter`
- **Odhad:** 0.5–1 hodina

### 12. Akceptační checklist (po opravách)
- V priority režimu: batch obsahuje top N položek dle priority (různé typy) — validace throughput
- Ve group_by_type režimu: batch pouze stejného typu (zpětná kompatibilita)
- Smart Hopper priority-mode bere filtrované dříve, ale nefiltrované nejsou ignorovány; strict-mode pouze filtrované
- itemPriority konzistentní (ore < ingot < block)
- Žádné runtime exceptions v tick loop (zachycení a logování); spolehlivé vytváření entit-inventářů

---

## Poznámky pro implementaci
- Dělat malé, izolované commity: "fix(smart_hopper): respect strict vs priority filter", "feat(tick_handler): batch_mode option fill_any/group_by_type" atd.
- Přidat automatické testy pro čisté funkce před nasazením
- Před commitem ověřit funkčnost v Minecraft behavior pack

---
*Poslední aktualizace: 2026-08-19 | Status: Reformatováno a strukturováno*

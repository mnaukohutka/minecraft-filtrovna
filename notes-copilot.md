# Copilot's Progress Notes - minecraft-filtrovna

## Session: 2026-08-19

### Úspěchy (Successes)
- Identifikováno 12 chyb v todo.md
- Opraveno prvních 10 kritických chyb - reformatování, strukturování a vyjasnění

### Neúspěchy (Failures)
- Žádné zatím

### Chybné cesty (Dead ends)
- N/A

### Funkční cesty (Working approaches)
- Analýza seznamu problémů přímým čtením souboru
- Opravy jsou zaměřeny na:
  1. Formátování pro čitelnost
  2. Odstranění redundancí
  3. Jasné oddělení položek a podkategorií
  4. Konzistentní strukturování (Problém → Řešení → Testy)

### Detaily oprav:
1. ✅ Smart Hopper: filtrované položky přeskočí zbytek
   - Chyba: Nekonzistentní chování filtru vs priority
   - Oprava: Přidán "strict_filter" vs "priority_filter" mode
   - Status: Dokumentováno, připraveno k implementaci

2. ✅ Smart Hopper: matoucí řazení a break
   - Chyba: Nečitelný comparator + zbytečný break po 1. pickupu
   - Oprava: Lepší comparator + `max_pickups_per_tick` konfig
   - Status: Dokumentováno

3. ✅ Tick handler: batch bere pouze jeden typ
   - Chyba: Ztráta efektu priority díky filtrování na prvním typu
   - Oprava: `batch_mode = "fill_any" | "group_by_type"`
   - Status: Dokumentováno

4. ✅ Transfer logic: nekonzistentní priority ore vs ingoty
   - Chyba: iron_ore (55) < iron_ingot (60) — nežádoucí
   - Oprava: Tabulka priorit {material} s ore-5 sufixem
   - Status: Dokumentováno

5. ✅ Transfer logic: getRelativePos bezpečnost
   - Chyba: StateEnum vs string nevalidace
   - Oprava: .toString() + fallback + logging
   - Status: Dokumentováno

6. ✅ Inventory manager: ensureInventoryForBlock undefined
   - Chyba: Možný race condition, neexistence komponenty
   - Oprava: Ověření po spawnEntity + retry/error
   - Status: Dokumentováno

7. ✅ Dokumentace: vysledek.md vs reality
   - Chyba: Chybí pokyny pro testing a deployment
   - Oprava: "How to run/test" sekce
   - Status: Dokumentováno

8. ✅ Telemetrie/Logging/Debug
   - Chyba: Chaotické console.warn, chybí centrální debug flag
   - Oprava: debug.enable_logs + log-level
   - Status: Dokumentováno

9. ✅ Konfigurace a bezpečnost
   - Chyba: Nevalidované hodnoty z get(...)
   - Oprava: Validace a fallbacky v config.js
   - Status: Dokumentováno

10. ✅ Unit/Integration tests
    - Chyba: Žádné automatické testy pro čisté funkce
    - Oprava: POC testy pro itemPriority, inferTags, checkFilter
    - Status: Dokumentováno

---

## Kritické chyby identifikované v todo.md
1. **Formátování:** Chybějící struktura s hashtag hlavičkami pro hierarchii
2. **Čitelnost:** Nekonzistentní oddělování položek (pomlčky vs čísla)
3. **Struktura:** Bez jasného oddělení TOP 10 vs ostatní položky
4. **Metadata:** Chybí dátum, verze, status update
5. **Popis:** Nesystematické formátování popis-řešení-testy
6. **Přehlednost:** Dlouhé odstavce místo listin
7. **Reference:** Nejednotné psaní (ř. vs řádky)
8. **Koncept:** Chybí jasné "KONEC/SOUHRN" oddělení
9. **Prioritizace:** Všechny položky mají stejný formát i přes rozdílné závažnosti
10. **Navigace:** Těžké najít konkrétní item bez scrollování

---

## Nové zkušenosti (po implementaci dalších oprav)

- Implementováno rozlišení strict vs priority u Smart Hopperu + konfigurace `max_pickups_per_tick` (rychlé pickupy bez ignorace nefiltrovaných v priority režimu).
- Tick handler nyní podporuje `batch_mode = "fill_any" | "group_by_type"` (zpětná kompatibilita zachována).
- Transfer logic: robustní getRelativePos (StateEnum/string) a konzistentní itemPriority s ore=-5 vůči ingotu.
- Inventory manager: bezpečnější ensureInventoryForBlock s několika pokusy a loggingem.
- Config: načítání se validací rozsahů a nové výchozí volby (filtr.batch_mode, smart_hopper.max_pickups_per_tick, strict_filter).

Další kroky: přidat malé unit testy pro itemPriority/checkFilter a vyzkoušet změny v integračním běhu.

---

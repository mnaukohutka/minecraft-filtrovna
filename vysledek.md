# Chyby v logice třídění - Minecraft Filtrovna

## 1. ⚠️ KRITICKÁ CHYBA - Chybné řazení v `smart_hopper.js` (řádek 69)

**Problém:** Logika prioritizace má opačný smysl. 
```javascript
return (bFiltered + getItemValue(bItem.typeId)) - (aFiltered + getItemValue(aItem.typeId));
```

- Vrací `(b) - (a)`, což znamená **sestupné** řazení (vyšší priority první)
- Ale filtrované items získávají +1000, takže filtrované se objeví **na začátku**
- Pak se berou jejich **sloty od pozice 0** - to je správně
- ✅ Tato část je OKÉ, ale logika je zbytečně matoucí

**Skutečná chyba:** Řádek 77 - po setřídění se přeskakují **NEfiltrované** items:
```javascript
if (filterIds.length > 0 && !filterIds.includes(item.typeId)) continue;
```
- Filtr je nastavený, ale položka **neodpovídá** → ignoruj ji
- **Problém:** To znamená, že priority sorting je k ničemu - vezmou se vždy pouze filtrované items, zbytek se ignoruje
- V tomto případě by mělo být: `if (filterIds.length > 0 && !filterIds.includes(item.typeId) && priorityMode) continue;`

---

## 2. ⚠️ STŘEDNÍ CHYBA - Neúplný batch v `tick_handler.js` (řádky 66-71)

**Problém:** Batch se vytváří pouze z **prvního typu** předmětu:
```javascript
const firstType = candidates[0].item.typeId;
for (const c of candidates) {
  if (batch.length >= effectiveBatch) break;
  if (c.item.typeId === firstType) batch.push(c);
}
```

- Když candidates = [čeadit diament, železo, uhlí] a effectiveBatch=5
- Batch obsahuje jen diament (až 5 ks)
- Železo a uhlí se nikdy nezoberou v tomto cyklu

**Důsledek:** Pokud je prvního typu málo items, zbývající kapacita batch se nevyužije - neefektivní

---

## 3. ⚠️ LOGICKÁ CHYBA - Třídění vs. Filtrování v `transfer_logic.js`

**Problém v `itemPriority` (řádky 114-125):**
```javascript
if (id.endsWith("_ore")) return 55;  // OBECNÁ ORE = 55
```
Ale výše:
```javascript
if (id.includes("netherite")) return 100;
if (id.includes("diamond")) return 90;
```

- Diamond ore vrací **90** (diamond match) ✓ OK
- **ALE:** iron_ore vrátí 55 (generic ore), ale iron = 60
- **Výsledek:** iron_ore (55) < iron_ingot (60) 
- **Chyba:** Rudy nejsou konzistentní s jejich ingoty/materiály

---

## 4. ⚠️ LOGICKÁ CHYBA - Statické priority v `tick_handler.js` (řádek 62)

**Problém:** Když `priorityQueue = true`:
```javascript
candidates.sort((a, b) => itemPriority(b.item.typeId) - itemPriority(a.item.typeId));
```

Pak se vždy vezme **prvý typ** (`candidates[0].item.typeId`):
```javascript
const firstType = candidates[0].item.typeId;
```

- Priority sorting je ignorován!
- Batch vždy obsahuje items stejného typu, čekují si na sebe
- Opravdu chcete filtrovat pouze jeden typ najednou? To není prioritní řazení, to je **sekvenční zpracování**

---

## ZÁVĚR

| Chyba | Závažnost | Dopad |
|-------|-----------|-------|
| Smart Hopper: Opačná logika filtru | Vysoká | Filtr se vůbec nepoužívá |
| Batch: Neúplné plnění | Střední | Pomalý výkon, nevyužitá kapacita |
| Item Priority: Nekonzistentní rudy | Střední | Chybné pořadí třídění |
| Priority Queue: Ignorován | Vysoká | Prioritizace se nepoužívá |

**Doporučená oprava priorit:**
- Definovat priority konsistentně: ore < ingot/crystal < block
- Nebo: ore + ingot mají stejnou prioritu jako jejich materiál


================================================================================
  TECHNICKÁ SPECIFIKACE: FILTROVNA — CUSTOM BLOK PRO MINECRAFT BEDROCK EDITION
  Verze: 1.21+ (kompatibilní s iOS Bedrock 1.21.30+)
  Formát: Behavior Pack + Resource Pack + Script API
  Autor konceptu: Uživatel
  Cílová platforma: iOS, Android, Windows, Xbox, PlayStation, Switch
================================================================================


================================================================================
ČÁST 1: PŘEHLED SYSTÉMU
================================================================================

1.1 NÁZEV A IDENTIFIKACE
--------------------------
  Název systému:        Filtrovna
  ID bloku:             filtrovna:filtr
  Display name:         Filtr
  Kategorie:            Redstone / Item Transport
  Stackable:            Ano (64)
  Hardness:             3.5
  Resistance:           6.0
  Sound group:          Copper
  Map color:            #B87333 (měděná)

1.2 KONCEPT
-----------
  Filtr je 1×1×1 blok, který vizuálně obsahuje miniaturizovaného měděného golema
  viditelného přes průhlednou přední stěnu. Golem je čistě vizuální prvek — nejedná
  se o fyzickou entitu, nýbrž o animovaný model vykreslovaný jako součást bloku.

  Blok provádí inteligentní třídění předmětů:
  - VSTUP:    Levá strana (označena žlutým plus)
  - MATCH:    Spodní strana (označena zeleným kolečkem) — tříděné předměty
  - NE:       Pravá strana (označena červeným mínus) — odpad

  Pokud na výstupní straně není kontejner (truhla, hopper, jiný Filtr), předmět
  je vyhozen jako item entity (stejně jako dropper).

1.3 INVENTÁŘ BLOKU
------------------
  Celkový počet slotů: 37
  Rozdělení:
    Sloty 0–8:    VSTUP (9 slotů, 3×3)
    Sloty 9–18:   FILTR (10 slotů — definice, co se má třídit)
    Sloty 19–27:  MATCH (9 slotů, 3×3 — výstup dolů)
    Sloty 28–36:  NE (9 slotů, 3×3 — výstup vpravo)

  Poznámka: Inventář není přístupný přímo jako truhla. Při pravém kliku se otevře
  custom UI formulář (server-ui), nikoli nativní container UI.


================================================================================
ČÁST 2: VIZUÁLNÍ SPECIFIKACE BLOKU
================================================================================

2.1 STRANY BLOKU
----------------

  HORNÍ STRANA (Y+):
    - Textura: waxed_copper_grate
    - Render method: opaque
    - Popis: Voskovaný měděný rošt, identický s vanilla blokem

  SPODNÍ STRANA (Y-):
    - Textura: waxed_copper_bulb_green
    - Render method: opaque
    - Speciální prvek: Zelené kolečko (◯) uprostřed, identické s vanilla
      waxed copper bulb v rozsvíceném stavu
    - Emisivní: Ano, svítí slabě zeleně (light level 8)

  LEVÁ STRANA (X- / VSTUP):
    - Textura: waxed_copper_hammered (tepaná měď)
    - Render method: opaque
    - Speciální prvek: Žlutý symbol plus (+) uprostřed
    - Plus je vykresleno jako overlay textura (16×16, žlutá #FFD700)

  PRAVÁ STRANA (X+ / NE):
    - Textura: waxed_copper_hammered (tepaná měď)
    - Render method: opaque
    - Speciální prvek: Červený symbol mínus (−) uprostřed
    - Mínus je vykresleno jako overlay textura (16×16, červená #DC143C)

  ZADNÍ STRANA (Z-):
    - Textura: waxed_copper_grate
    - Render method: opaque
    - Identická s horní stranou

  PŘEDNÍ STRANA (Z+ / VÝHLED):
    - Rozdělena horizontálně na dvě části:

      Horní 3/4 (pixelově 12×16 z celkových 16×16):
        - Materiál: Sklo (glass)
        - Render method: blend
        - Průhlednost: 30% (viditelnost golema uvnitř)
        - Face dimming: false
        - Ambient occlusion: false
        - Nezobrazuje se jako vanilla sklo — jde o custom materiál s nižší
          průhledností pro lepší viditelnost golema

      Spodní 1/4 (pixelově 4×16):
        - Materiál: waxed_copper_bulb (dynamická textura)
        - Render method: opaque
        - Emisivní: Ano, mění barvu podle stavu (viz 2.3)
        - Tvar: Měděná žárovka s kulatým středem

2.2 GOLEM UVNITŘ BLOKU
----------------------
  Golem je součástí block geometry, nikoli samostatná entita.

  Rozměry golema:
    - Šířka:  0.5 bloků (8 pixelů z 16)
    - Výška:  0.625 bloků (10 pixelů z 16)
    - Hloubka: 0.375 bloků (6 pixelů z 16)

  Pozice uvnitř bloku:
    - X: 0.25 (vycentrováno)
    - Y: 0.1875 (stojí na "plošině" ve spodní třetině)
    - Z: 0.3125 (posunutý dopředu směrem ke sklu)

  Struktura modelu golema:
    - Hlava:  4×4×4 pixely (kost "head")
    - Tělo:   4×5×3 pixely (kost "body")
    - Ruce:   2×4×2 pixely každá (kosti "left_arm", "right_arm")
    - Nohy:   2×2×2 pixely každá (kosti "left_leg", "right_leg")
    - Oči:    2×1×1 pixel (kost "eyes" — emisivní, oranžová #FF8C00)

 Kompletní díly originálních cooper golemů naleznete zde: https://github.com/ZtechNetwork/MCBVanillaResourcePack/tree/b6bdfc80f0b218c0119002967df2479299642be0/textures/entity/copper_golem

2.3 STAVOVÝ INDIKÁTOR (SPODNÍ 1/4 PŘEDNÍ STRANY)
-------------------------------------------------
  Barva světla se mění dynamicky podle stavu bloku. Implementováno přes
  material_instances s variantami nebo přes Script API particle efekty.

  Stavová tabulka:
  ┌──────────────────┬─────────────────┬─────────────┬─────────────────────────────┐
  │ Stav             │ Barva (RGB)     │ Light Level │ Popis                       │
  ├──────────────────┼─────────────────┼─────────────┼─────────────────────────────┤
  │ Čeká             │ #00FF00 (zelená)│ 8           │ Připraven, nic nedělá       │
  │ Kontroluje       │ #FFFF00 (žlutá) │ 10          │ Zpracovává předmět          │
  │ Třídí MATCH      │ #0080FF (modrá) │ 12          │ Posílá dolů                 │
  │ Třídí NE         │ #FF8000 (oranž.)│ 12          │ Posílá vpravo               │
  │ Drop aktivní     │ #FFFFFF (bílá)  │ 15          │ Právě vyhazuje předmět      │
  │ Zaseknutý        │ #FF0000 (červ.) │ 6 (bliká)   │ Nemůže poslat ani dropnout  │
  └──────────────────┴─────────────────┴─────────────┴─────────────────────────────┘

  Přechody mezi stavy: Plynulé interpolace (lerp) po dobu 5 ticků.
  Blikání při zaseknutém stavu: 10 ticků ON, 10 ticků OFF.


================================================================================
ČÁST 3: ANIMACE GOLEMA
================================================================================

3.1 ANIMACE — PŘEHLED
---------------------
  Všechny animace jsou definovány v animation_controllers a .animation.json
  souborech. Golem má 5 základních stavů + 1 přechodový.

3.2 DETAILNÍ POPIS ANIMACÍ
----------------------------

  ANIMACE 1: "idle"
  ─────────────────
  Délka: Smyčková (loop: true)
  Rychlost: 1.0

  Hlava:
    - Rotace Y: sin(cas * 0.5) * 10° (pomalé otáčení do stran)
    - Rotace X: sin(cas * 0.3) * 3° (jemné přikývání)

  Tělo:
    - Posun Y: sin(cas * 0.8) * 0.02 (dýchání)

  Ruce:
    - Rotace X: sin(cas * 0.4) * 5° (volné kývání)

  Oči:
    - Scale Y: 1.0 (normální) → 0.1 (mrknutí, každých 3–5 sekund náhodně)
    - Mrknutí trvá 3 ticky

  ──────────────────────────────────────────────────────────────────────────────

  ANIMACE 2: "inspect"
  ────────────────────
  Délka: 21 ticků (1.05 sekundy)
  Spouštěč: Při detekci předmětu ve VSTUPU

  Tick 0–5 (Sebrání):
    - Pravá ruka: Rotace X z 0° → −45° (natáhne se k VSTUPU)
    - Hlava: Rotace Y z 0° → −30° (otočí se doleva)

  Tick 6–15 (Prohlížení):
    - Hlava: Rotace X −10° (nakloní se k předmětu)
    - Oči: Scale Y 1.2 (zamžourání)
    - Pravá ruka: Jemné kývání ±5° ("váhání")

  Tick 16–21 (Rozhodnutí):
    - Hlava: Návrat na 0°
    - Pravá ruka: Návrat na 0°
    - Přechod do "sort_match" nebo "sort_ne" podle výsledku filtru

  ──────────────────────────────────────────────────────────────────────────────

  ANIMACE 3: "sort_match"
  ──────────────────────
  Délka: 10 ticků (0.5 sekundy)
  Spouštěč: Předmět pasuje do FILTRU

  Tick 0–3 (Radost):
    - Hlava: Rotace X −15° (přikývne)
    - Ruce: Obě zvednuty nahoru, Rotace X −60°

  Tick 4–7 (Hod):
    - Pravá ruka: Prudký pohyb dolů, Rotace X 30°
    - Tělo: Posun Z −0.05 (nakloní se dopředu)

  Tick 8–10 (Návrat):
    - Všechny kosti na výchozí pozice
    - Přechod do "idle"

  ──────────────────────────────────────────────────────────────────────────────

  ANIMACE 4: "sort_ne"
  ───────────────────
  Délka: 10 ticků (0.5 sekundy)
  Spouštěč: Předmět NEpasuje do FILTRU

  Tick 0–4 (Pokrčení ramen):
    - Ruce: Rotace X −20°, Rotace Z ±15° (pokrčí rameny)
    - Hlava: Rotace X 10° (zakloní se)

  Tick 5–7 (Hod stranou):
    - Levá ruka: Rotace Y −45° (hodí vpravo)
    - Tělo: Posun X 0.03 (nakloní se doprava)

  Tick 8–10 (Návrat):
    - Všechny kosti na výchozí pozice
    - Přechod do "idle"

  ──────────────────────────────────────────────────────────────────────────────

  ANIMACE 5: "drop"
  ────────────────
  Délka: 5 ticků (0.25 sekundy)
  Spouštěč: Výstupní strana je volná (drop mód)

  Tick 0–2 (Příprava):
    - Odpovídající ruka (doleva/vpravo) se zvedne

  Tick 3–5 (Výstřel):
    - Prudké trhnutí rukou směrem výstupu
    - Particle efekt: 3–5 copper spark partiklů

  ──────────────────────────────────────────────────────────────────────────────

  ANIMACE 6: "stuck"
  ────────────────
  Délka: Smyčková (loop: true)
  Spouštěč: Výstup zablokován, buffer plný

  Hlava:
    - Rotace Y: sin(cas * 8) * 20° (rychlé třesení)
    - Rotace X: sin(cas * 6) * 10°

  Ruce:
    - Rotace X: −90° (zvednuty vzhůru ve zmatku)
    - Rychlé kývání: sin(cas * 10) * 10°

  Tělo:
    - Posun Y: sin(cas * 12) * 0.03 (třes)


================================================================================
ČÁST 4: FUNKČNÍ LOGIKA — TICK SYSTEM
================================================================================

4.1 TICK CYKLUS
---------------
  Blok tickuje každý tick (interval: 1) prostřednictvím Script API.
  Tick handler je registrován přes world.beforeEvents / system.runInterval.

  PSEUDOKÓD TICKU:
  ────────────────
  function onTick(block: Block, dimension: Dimension):

    // 1. Získání komponentů
    const container = getCustomContainer(block)  // viz Část 6
    if (!container) return

    // 2. Kontrola stavu
    const state = block.permutation.getState("filtrovna:state")
    if (state === "processing") return  // Již zpracovává, čekej

    // 3. Kontrola VSTUPU
    const inputSlots = container.getItems(0, 9)
    const firstItem = findFirstNonEmpty(inputSlots)

    if (!firstItem):
      setState(block, "idle")
      return

    // 4. Zahájení zpracování
    setState(block, "processing")
    playAnimation(block, "inspect")

    // 5. Čekání 21 ticků (kontrola)
    system.runTimeout(() => {
      processItem(block, firstItem, container)
    }, 21)

  function processItem(block, item, container):

    // 5a. Kontrola filtru
    const filterSlots = container.getItems(9, 10)
    const matches = checkFilter(item, filterSlots)

    // 5b. Určení cíle
    const targetDir = matches ? "down" : "right"
    const targetSlots = matches ? (19, 27) : (28, 36)

    // 5c. Pokus o přenos
    const success = tryTransfer(item, block, targetDir, targetSlots)

    if (success):
      removeFromInput(container, item.slot)
      playAnimation(block, matches ? "sort_match" : "sort_ne")
      setState(block, "idle")
    else:
      // 5d. Zkus drop
      const dropSuccess = tryDrop(item, block, targetDir)
      if (dropSuccess):
        removeFromInput(container, item.slot)
        playAnimation(block, "drop")
        setState(block, "idle")
      else:
        // 5e. Zaseknuto
        setState(block, "stuck")
        playAnimation(block, "stuck")

4.2 LOGIKA FILTRU
-----------------
  Funkce checkFilter(item, filterSlots):

    // Filtr je prázdný = všechno jde do MATCH (passthrough)
    if (allFilterSlotsEmpty(filterSlots)):
      return true

    // Přesná shoda typeId
    for slot in filterSlots:
      if (slot.typeId === item.typeId):
        return true

    // Volitelně: shoda podle tagů (např. #minecraft:swords)
    // for slot in filterSlots:
    //   if (item.hasTag(slot.typeId)):
    //     return true

    return false

  Poznámka: Filtr porovnává pouze typeId, nikoli NBT (enchanty, jména, damage).
  Pokud je požadováno rozlišování podle NBT, musí se rozšířit logika.

4.3 PŘENOS PŘEDMĚTŮ
--------------------
  Funkce tryTransfer(item, sourceBlock, direction, targetSlotRange):

    const targetBlock = getRelativeBlock(sourceBlock, direction)
    if (!targetBlock) return false

    // Případ A: Cíl je jiný Filtr
    if (targetBlock.typeId === "filtrovna:filtr"):
      const targetContainer = getCustomContainer(targetBlock)
      if (!targetContainer) return false

      // Vstupní sloty cílového Filtru (0–8)
      const targetInputSlots = targetContainer.getItems(0, 9)
      const emptySlot = findFirstEmpty(targetInputSlots)

      if (emptySlot !== -1):
        targetContainer.setItem(emptySlot, item.clone())
        return true
      return false

    // Případ B: Cíl má vanilla inventář (truhla, hopper, barrel...)
    const targetInvComp = targetBlock.getComponent("minecraft:inventory")
    if (targetInvComp && targetInvComp.container):
      const targetContainer = targetInvComp.container
      const result = targetContainer.addItem(item.clone())
      // addItem vrací ItemStack | undefined
      // Pokud vrátí undefined, vše se vešlo
      return result === undefined

    // Případ C: Cíl je hopper (zvláštní chování)
    if (targetBlock.typeId === "minecraft:hopper"):
      // Hopper má vlastní logiku příjmu, addItem by mělo fungovat
      const hopperInv = targetBlock.getComponent("minecraft:inventory")
      if (hopperInv && hopperInv.container):
        return hopperInv.container.addItem(item.clone()) === undefined

    return false

4.4 DROP LOGIKA
---------------
  Funkce tryDrop(item, sourceBlock, direction):

    const targetPos = getRelativePosition(sourceBlock, direction)
    const targetBlock = sourceBlock.dimension.getBlock(targetPos)

    // Kontrola, zda je prostor volný
    if (!targetBlock || targetBlock.isAir || targetBlock.isLiquid):

      // Spawn item entity
      const spawnPos = {
        x: targetPos.x + 0.5,
        y: targetPos.y + 0.5,
        z: targetPos.z + 0.5
      }

      const itemEntity = sourceBlock.dimension.spawnEntity(
        "minecraft:item",
        spawnPos
      )

      // Nastavení item stacku
      const itemComp = itemEntity.getComponent("minecraft:item")
      if (itemComp):
        itemComp.itemStack = item.clone()

      // Impulz směrem od bloku
      const impulse = getDirectionVector(direction)
      itemEntity.applyImpulse({
        x: impulse.x * 0.3,
        y: impulse.y * 0.1 + 0.2,  // Mírný oblouk nahoru
        z: impulse.z * 0.3
      })

      // Pickup delay (nelze okamžitě sebrat)
      itemEntity.setProperty("pickup_delay", 10)

      return true

    return false

4.5 SMĚROVÉ VEKTORY
-------------------
  Orientace bloku je uložena v block permutation state "minecraft:cardinal_direction".
  Výchozí: Přední strana (sklo) směřuje na jih (Z+), VSTUP je vlevo (X−).

  Při rotaci bloku se relativní směry přepočítávají:

  ┌─────────────────┬─────────┬─────────┬─────────┐
  │ Facing (předek) │ VSTUP   │ NE      │ MATCH   │
  ├─────────────────┼─────────┼─────────┼─────────┤
  │ South (Z+)      │ East    │ West    │ Down    │
  │ West (X−)       │ South   │ North   │ Down    │
  │ North (Z−)      │ West    │ East    │ Down    │
  │ East (X+)       │ North   │ South   │ Down    │
  └─────────────────┴─────────┴─────────┴─────────┘

  MATCH je vždy dolů (Y−). VSTUP a NE jsou vždy kolmé na předek,
  VSTUP je po směru hodinových ručiček od předku.


================================================================================
ČÁST 5: CUSTOM UI (SERVER-UI)
================================================================================

5.1 FORMULÁŘ PŘI PRAVÉM KLIKU
-------------------------------
  Při pravém kliku hráče na blok se neotevře nativní inventář,
  nýbrž custom ActionForm nebo ModalForm z @minecraft/server-ui.

  DŮVOD: Nativní container UI nepodporuje custom slotové rozdělení
  (VSTUP/FILTR/MATCH/NE) a neumožňuje zakázat interakci s určitými sloty.

5.2 STRUKTURA UI
----------------

  Formulář typu: ModalForm (s dropdowny a slotovými selektory)
  Název: "Filtr — Nastavení"

  Sekce 1: VSTUP (Náhled)
  ─────────────────────────
  Zobrazí 9 slotů jako grid 3×3.
  Každý slot je tlačítko s ikonou předmětu nebo prázdné.
  Kliknutí: Přesune předmět z hráčova inventáře do VSTUPU (pokud je prázdný)
           nebo vrátí předmět hráči (pokud obsazený).

  Sekce 2: FILTR (Nastavení)
  ──────────────────────────
  Zobrazí 10 slotů jako grid 2×5.
  Každý slot je tlačítko.
  Kliknutí: Otevře dropdown s inventářem hráče pro výběr filtračního předmětu.
  Long-press: Vymaže slot.

  Sekce 3: MATCH (Náhled)
  ────────────────────────
  Zobrazí 9 slotů jako grid 3×3.
  Read-only — hráč nemůže přímo manipulovat.
  Zobrazuje aktuální obsah výstupu.

  Sekce 4: NE (Náhled)
  ─────────────────────
  Zobrazí 9 slotů jako grid 3×3.
  Read-only — hráč nemůže přímo manipulovat.
  Zobrazuje aktuální obsah odpadu.

  Sekce 5: Status
  ───────────────
  Text: "Stav: [ikona] [text]"
  Ikony: 🟢🟡🔵🟠⚪🔴 (odpovídají stavům z 2.3)

  Tlačítka dole:
  - "Zavřít" — zavře formulář
  - "Vysypat MATCH" — přesune vše z MATCH do hráčova inventáře
  - "Vysypat NE" — přesune vše z NE do hráčova inventáře

5.3 ALTERNATIVNÍ UI: CHEST-LIKE
-------------------------------
  Pokud server-ui není žádoucí (např. kvůli komplexitě), lze použít
  nativní container UI s omezeními:

  - Vytvořit entitu (např. armor_stand) s inventářem 54 slotů (double chest)
  - Mapovat sloty:
    0–8  → VSTUP (viditelné, interaktivní)
    9–18 → FILTR (viditelné, interaktivní)
    19–27 → MATCH (viditelné, read-only — zakázat interakci skriptem)
    28–36 → NE (viditelné, read-only)
    37–53 → nepoužito (skryté pod texturou)

  Toto je ale MÉNĚ DOPORUČENO kvůli složitosti synchronizace.


================================================================================
ČÁST 6: PERSISTENCE DAT — INVENTÁŘ BLOKU
================================================================================

6.1 PROBLÉM
-----------
  Custom bloky v Bedrock Edition NEMAJÍ nativní podporu pro vlastní inventáře
  prostřednictvím JSON komponentů. Komponenta "minecraft:inventory" funguje
  pouze pro vanilla bloky (truhly, pece, hoppery).

  ŘEŠENÍ: Kombinace několika přístupů:

6.2 PŘÍSTUP A: BLOCK ENTITY (DOPORUČENO)
-----------------------------------------
  Vytvořit custom entitu (např. "filtrovna:filtr_entity"), která je neviditelná,
  nemá hitbox a je trvale spojena s blokem.

  Vlastnosti entity:
    - Type: filtrovna:filtr_entity
    - Physics: false (neovlivňována gravitací)
    - Pushable: false
    - Hitbox: width 0, height 0 (neinteraktivní)
    - Persistent: true (nepřijde o data při unloadu chunku)

  Spojení blok ↔ entity:
    - Při položení bloku: Spawn entity na stejných souřadnicích
    - Při zničení bloku: Kill entity
    - Při načtení chunku: Pokud existuje blok bez entity, spawn entity
    - Při načtení chunku: Pokud existuje entity bez bloku, kill entity

  Entity má komponentu "minecraft:inventory" s 37 sloty.
  Script API přistupuje k inventáři přes entity.getComponent("inventory").

  PSEUDOKÓD:
  ──────────
  function onBlockPlace(event):
    const block = event.block
    const entity = event.dimension.spawnEntity(
      "filtrovna:filtr_entity",
      { x: block.x + 0.5, y: block.y + 0.5, z: block.z + 0.5 }
    )
    // Uložení ID entity do block data (přes dynamic property nebo scoreboard)
    block.setDynamicProperty("entity_uuid", entity.id)

  function getBlockContainer(block):
    const entityId = block.getDynamicProperty("entity_uuid")
    const entity = world.getEntity(entityId)
    if (!entity) {
      // Entity chybí, respawn
      const newEntity = block.dimension.spawnEntity(...)
      block.setDynamicProperty("entity_uuid", newEntity.id)
      return newEntity.getComponent("inventory").container
    }
    return entity.getComponent("inventory").container

6.3 PŘÍSTUP B: WORLD DYNAMIC PROPERTIES (ZÁLOHA)
------------------------------------------------
  Jako záloha pro případ ztráty entity lze ukládat serializovaný inventář
  do world dynamic properties:

  function saveInventory(block, container):
    const key = `filtrovna:${block.x},${block.y},${block.z},${block.dimension.id}`
    const items = []
    for (let i = 0; i < container.size; i++):
      const item = container.getItem(i)
      if (item):
        items.push({
          slot: i,
          typeId: item.typeId,
          amount: item.amount,
          data: item.data
        })
    world.setDynamicProperty(key, JSON.stringify(items))

  Toto se volá při každé změně inventáře (throttled, např. každých 5 sekund).

6.4 PŘÍSTUP C: STRUCTURE BLOCK (PRO PŘENOS)
-------------------------------------------
  Pro možnost "přenést Filtr jako item" lze použít structure block přístup:

  - Při zničení bloku: Uložit strukturu 1×1×1 s entity do structure blocku
  - Item nese NBT tag s názvem struktury
  - Při položení: Načíst strukturu

  Toto je ale KOMPLIKOVANÉ a pro základní verzi NENÍ DOPORUČENO.


================================================================================
ČÁST 7: PŘÍKAZ PRO PLNĚNÍ FILTRU
================================================================================

7.1 PŘÍKAZ: /filtrovna
----------------------
  Registrovaný přes Script API (beforeEvents.chatSend nebo custom command).

  Syntaxe:
    /filtrovna <filtr|fill> <x> <y> <z> <slot_start> <slot_end> <item> [amount] [data]

  Alias:
    /filtr

  Oprávnění: Operator (level 1) nebo povolené pro všechny (konfigurovatelné)

7.2 PARAMETRY
-------------
  ┌─────────────┬──────────┬──────────────────────────────────────────────────┐
  │ Parametr    │ Typ      │ Popis                                            │
  ├─────────────┼──────────┼──────────────────────────────────────────────────┤
  │ filtr|fill  │ string   │ Podpříkaz — "filtr" pro nastavení filtru,        │
  │             │          │ "fill" pro naplnění slotů                        │
  ├─────────────┼──────────┼──────────────────────────────────────────────────┤
  │ x y z       │ int      │ Souřadnice cílového Filtru                       │
  ├─────────────┼──────────┼──────────────────────────────────────────────────┤
  │ slot_start  │ int      │ První slot (0–36)                                │
  ├─────────────┼──────────┼──────────────────────────────────────────────────┤
  │ slot_end    │ int      │ Poslední slot (0–36, včetně)                     │
  ├─────────────┼──────────┼──────────────────────────────────────────────────┤
  │ item        │ string   │ ID předmětu (např. "minecraft:diamond_sword")    │
  ├─────────────┼──────────┼──────────────────────────────────────────────────┤
  │ amount      │ int      │ Počet (1–64, default 1)                          │
  ├─────────────┼──────────┼──────────────────────────────────────────────────┤
  │ data        │ int      │ Data value (default 0)                           │
  └─────────────┴──────────┴──────────────────────────────────────────────────┘

7.3 PŘÍKLADY POUŽITÍ
--------------------

  // Nastavení filtru — sloty 9–18 (FILTR sekce) naplněny diamondy
  /filtrovna filtr ~ ~ ~ 9 18 minecraft:diamond 1

  // Naplnění VSTUPU — sloty 0–8 naplněny kamenem
  /filtrovna fill ~ ~1 ~ 0 8 minecraft:stone 64

  // Nastavení filtru na meče — slot 9
  /filtrovna filtr 100 64 -200 9 9 minecraft:iron_sword 1

  // Naplnění MATCH výstupu — sloty 19–27
  /filtrovna fill ~ ~ ~ 19 27 minecraft:oak_planks 64

  // Vymazání filtru — nahrazení vzduchem
  /filtrovna filtr ~ ~ ~ 9 18 minecraft:air 1

7.4 IMPLEMENTACE PŘÍKAZU
------------------------
  PSEUDOKÓD:
  ──────────
  import { world, ItemStack } from "@minecraft/server"

  world.beforeEvents.chatSend.subscribe((event) => {
    const message = event.message
    if (!message.startsWith("/filtrovna") && !message.startsWith("/filtr")) return

    event.cancel = true

    const args = message.split(" ")
    const subcommand = args[1]  // "filtr" nebo "fill"
    const x = parseCoord(args[2], event.sender.location.x)
    const y = parseCoord(args[3], event.sender.location.y)
    const z = parseCoord(args[4], event.sender.location.z)
    const slotStart = parseInt(args[5])
    const slotEnd = parseInt(args[6])
    const itemId = args[7]
    const amount = parseInt(args[8]) || 1
    const data = parseInt(args[9]) || 0

    const block = event.sender.dimension.getBlock({ x, y, z })
    if (!block || block.typeId !== "filtrovna:filtr") {
      event.sender.sendMessage("§cZde není Filtr!")
      return
    }

    const container = getBlockContainer(block)
    if (!container) {
      event.sender.sendMessage("§cChyba: Nelze získat inventář!")
      return
    }

    for (let slot = slotStart; slot <= slotEnd; slot++) {
      if (slot < 0 || slot >= container.size) continue

      if (itemId === "minecraft:air") {
        container.setItem(slot, undefined)
      } else {
        const item = new ItemStack(itemId, amount)
        container.setItem(slot, item)
      }
    }

    event.sender.sendMessage(
      `§aHotovo! Sloty ${slotStart}–${slotEnd} nastaveny na ${itemId}.`
    )
  })

  function parseCoord(arg: string, relative: number): number {
    if (arg.startsWith("~")) {
      const offset = parseFloat(arg.substring(1)) || 0
      return relative + offset
    }
    return parseFloat(arg)
  }

7.5 ALTERNATIVA: /replaceitem KOMPATIBILITA
-------------------------------------------
  Pro kompatibilitu s vanilla příkazy lze podporovat i /replaceitem,
  pokud by Filtr používal standardní block inventory component.
  Vzhledem k použití entity-inventáře (Přístup A z Části 6) to ale
  přímo nefunguje — /replaceitem pracuje s block slot.container,
  nikoli s entity inventářem.

  WORKAROUND: Příkaz /filtrovna může interně volat logiku podobnou
  /replaceitem, ale přes Script API.


================================================================================
ČÁST 8: SOUND DESIGN
================================================================================

8.1 ZVUKY BLOKU
---------------
  Základní zvuková skupina: copper

  Custom zvuky (registrované v sounds.json):

  ┌─────────────────────┬──────────────────────────────────────────────────────┐
  │ Událost             │ Zvuk                                                 │
  ├─────────────────────┼──────────────────────────────────────────────────────┤
  │ Položení bloku      │ block.copper.place + jemný mechanický klik          │
  │ Zničení bloku       │ block.copper.break + rozbití skla (pokud je sklo)  │
  │ Krok na blok        │ block.copper.step                                    │
  │ Kontrola předmětu   │ block.note_block.iron_xylophone (krátký, tlumený)   │
  │ Třídění MATCH       │ block.copper_bulb.turn_on (radostný tón)            │
  │ Třídění NE          │ block.copper_bulb.turn_off (zamrznutý tón)          │
  │ Drop předmětu       │ block.dispenser.dispense + block.copper.hit         │
  │ Zaseknutý stav      │ block.note_block.bass (nízký, naléhavý, smyčka)     │
  │ Otevření UI         │ block.chest.open (měděná varianta)                  │
  │ Zavření UI          │ block.chest.close (měděná varianta)                 │
  └─────────────────────┴──────────────────────────────────────────────────────┘

  Hlasitost: 0.5–0.8 (měděné zvuky jsou tlumené)
  Pitch: 1.0 pro základ, 1.2 pro "radostné" události, 0.8 pro "neúspěch"


================================================================================
ČÁST 9: FILE STRUKTURA ADDONU
================================================================================

9.1 BEHAVIOR PACK (filtrovna_behavior/)
---------------------------------------
  manifest.json
  pack_icon.png

  blocks/
    filtr.json                    # Definice custom bloku

  entities/
    filtr_entity.json             # Invisible inventory entity

  scripts/
    main.js                       # Hlavní entry point
    modules/
      tick_handler.js             # Tick logika bloku
      inventory_manager.js        # Správa entity inventáře
      ui_handler.js               # Server-ui formuláře
      command_handler.js          # /filtrovna příkaz
      transfer_logic.js           # Přenos a drop logika
      animation_controller.js     # Stavové animace

  functions/
    (volitelné)                   # MCFunctions pro zálohu

9.2 RESOURCE PACK (filtrovna_resource/)
---------------------------------------
  manifest.json
  pack_icon.png

  textures/
    blocks/
      filtr_front_glass.png       # Průhledné sklo (horní 3/4)
      filtr_front_bulb_green.png  # Žárovka — zelená (výchozí)
      filtr_front_bulb_yellow.png # Žárovka — žlutá
      filtr_front_bulb_blue.png   # Žárovka — modrá
      filtr_front_bulb_orange.png # Žárovka — oranžová
      filtr_front_bulb_white.png  # Žárovka — bílá
      filtr_front_bulb_red.png    # Žárovka — červená
      filtr_side_plus.png         # Levá strana s plus
      filtr_side_minus.png        # Pravá strana s mínus
      filtr_top_grate.png         # Horní rošt
      filtr_bottom_bulb.png       # Spodní žárovka se zeleným kolečkem
      filtr_back_grate.png        # Zadní rošt

    entities/
      golem_mini.png              # Textura mini golema
      golem_mini_eyes.png         # Emisivní oči

  models/
    blocks/
      filtr.geo.json              # Geometrie bloku (včetně golema uvnitř)

    entity/
      golem_mini.geo.json         # Geometrie mini golema (alternativa)

  animations/
    golem_mini.animation.json     # Animace golema

  animation_controllers/
    golem_mini.ac.json            # Animation controller (stavový stroj)

  render_controllers/
    golem_mini.rc.json            # Render controller (materiály, viditelnost)

  sounds/
    filtr_sounds.json             # Definice custom zvuků

  texts/
    en_US.lang
    cs_CZ.lang                    # Česká lokalizace


================================================================================
ČÁST 10: MANIFEST SOUBORY
================================================================================

10.1 BEHAVIOR PACK manifest.json
--------------------------------
{
  "format_version": 2,
  "header": {
    "name": "Filtrovna Behavior Pack",
    "description": "Inteligentní třídící blok s měděným golemem",
    "uuid": "[GENERUJ UUID v4]",
    "version": [1, 0, 0],
    "min_engine_version": [1, 21, 0]
  },
  "modules": [
    {
      "type": "data",
      "uuid": "[GENERUJ UUID v4]",
      "version": [1, 0, 0]
    },
    {
      "type": "script",
      "language": "javascript",
      "uuid": "[GENERUJ UUID v4]",
      "entry": "scripts/main.js",
      "version": [1, 0, 0]
    }
  ],
  "dependencies": [
    {
      "module_name": "@minecraft/server",
      "version": "1.14.0"
    },
    {
      "module_name": "@minecraft/server-ui",
      "version": "1.2.0"
    }
  ]
}

10.2 RESOURCE PACK manifest.json
--------------------------------
{
  "format_version": 2,
  "header": {
    "name": "Filtrovna Resource Pack",
    "description": "Resource pack pro Filtrovna blok",
    "uuid": "[GENERUJ UUID v4]",
    "version": [1, 0, 0],
    "min_engine_version": [1, 21, 0]
  },
  "modules": [
    {
      "type": "resources",
      "uuid": "[GENERUJ UUID v4]",
      "version": [1, 0, 0]
    }
  ]
}


================================================================================
ČÁST 11: JSON DEFINICE BLOKU
================================================================================

11.1 blocks/filtr.json
----------------------
{
  "format_version": "1.21.0",
  "minecraft:block": {
    "description": {
      "identifier": "filtrovna:filtr",
      "menu_category": {
        "category": "items_to_blocks",
        "group": "itemGroup.name.redstone"
      },
      "traits": {
        "minecraft:placement_direction": {
          "enabled_states": ["minecraft:cardinal_direction"]
        }
      },
      "states": {
        "filtrovna:state": {
          "values": { "min": 0, "max": 5 },
          "default": 0
        }
      }
    },
    "components": {
      "minecraft:geometry": "geometry.filtrovna_filtr",
      "minecraft:material_instances": {
        "*": {
          "texture": "waxed_copper_block",
          "render_method": "opaque"
        },
        "top": {
          "texture": "waxed_copper_grate",
          "render_method": "opaque"
        },
        "bottom": {
          "texture": "waxed_copper_bulb_green",
          "render_method": "opaque",
          "face_dimming": false
        },
        "left": {
          "texture": "waxed_copper_hammered",
          "render_method": "opaque"
        },
        "right": {
          "texture": "waxed_copper_hammered",
          "render_method": "opaque"
        },
        "back": {
          "texture": "waxed_copper_grate",
          "render_method": "opaque"
        },
        "front_glass": {
          "texture": "filtr_front_glass",
          "render_method": "blend",
          "face_dimming": false,
          "ambient_occlusion": false
        },
        "front_bulb": {
          "texture": "filtr_front_bulb_green",
          "render_method": "opaque",
          "face_dimming": false
        }
      },
      "minecraft:collision_box": true,
      "minecraft:selection_box": true,
      "minecraft:destructible_by_mining": {
        "seconds": 3.5
      },
      "minecraft:destructible_by_explosion": {
        "explosion_resistance": 6.0
      },
      "minecraft:friction": 0.4,
      "minecraft:map_color": "#B87333",
      "minecraft:light_emission": {
        "emission": 8
      },
      "minecraft:tick": {
        "interval_range": [1, 1]
      },
      "minecraft:custom_components": [
        "filtrovna:tick_handler"
      ]
    },
    "permutations": [
      {
        "condition": "query.block_state('minecraft:cardinal_direction') == 'south'",
        "components": {
          "minecraft:transformation": { "rotation": [0, 0, 0] }
        }
      },
      {
        "condition": "query.block_state('minecraft:cardinal_direction') == 'west'",
        "components": {
          "minecraft:transformation": { "rotation": [0, 90, 0] }
        }
      },
      {
        "condition": "query.block_state('minecraft:cardinal_direction') == 'north'",
        "components": {
          "minecraft:transformation": { "rotation": [0, 180, 0] }
        }
      },
      {
        "condition": "query.block_state('minecraft:cardinal_direction') == 'east'",
        "components": {
          "minecraft:transformation": { "rotation": [0, 270, 0] }
        }
      }
    ]
  }
}


================================================================================
ČÁST 12: SCRIPT API — HLAVNÍ MODULY
================================================================================

12.1 scripts/main.js
--------------------
import { world, system } from "@minecraft/server"
import { registerTickHandler } from "./modules/tick_handler.js"
import { registerUIHandler } from "./modules/ui_handler.js"
import { registerCommandHandler } from "./modules/command_handler.js"
import { initInventoryManager } from "./modules/inventory_manager.js"

// Inicializace při startu světa
world.afterEvents.worldInitialize.subscribe(() => {
  initInventoryManager()
})

// Registrace handlerů
registerTickHandler()
registerUIHandler()
registerCommandHandler()

console.log("[Filtrovna] Addon načten — verze 1.0.0")

12.2 scripts/modules/tick_handler.js
-------------------------------------
import { world, system } from "@minecraft/server"
import { getBlockContainer, getBlockState, setBlockState } from "./inventory_manager.js"
import { tryTransfer, tryDrop } from "./transfer_logic.js"
import { playBlockAnimation } from "./animation_controller.js"

const PROCESSING_BLOCKS = new Set()  // Bloky, které právě zpracovávají

export function registerTickHandler() {
  system.runInterval(() => {
    const blocks = world.getDimension("overworld").getBlocks(
      { "type": "filtrovna:filtr" },
      { maxBlocks: 1000 }
    )

    for (const block of blocks) {
      if (PROCESSING_BLOCKS.has(block)) continue
      processBlock(block)
    }
  }, 1)
}

function processBlock(block) {
  const container = getBlockContainer(block)
  if (!container) return

  const state = getBlockState(block)
  if (state === "processing") return

  // Najdi první předmět ve VSTUPU (sloty 0–8)
  let itemToProcess = null
  let sourceSlot = -1

  for (let i = 0; i < 9; i++) {
    const item = container.getItem(i)
    if (item) {
      itemToProcess = item
      sourceSlot = i
      break
    }
  }

  if (!itemToProcess) {
    setBlockState(block, "idle")
    return
  }

  // Zahaj zpracování
  PROCESSING_BLOCKS.add(block)
  setBlockState(block, "processing")
  playBlockAnimation(block, "inspect")

  // Čekej 21 ticků (kontrola)
  system.runTimeout(() => {
    finishProcessing(block, itemToProcess, sourceSlot, container)
  }, 21)
}

function finishProcessing(block, item, sourceSlot, container) {
  PROCESSING_BLOCKS.delete(block)

  // Kontrola filtru (sloty 9–18)
  const filterSlots = []
  for (let i = 9; i < 19; i++) {
    const filterItem = container.getItem(i)
    if (filterItem) filterSlots.push(filterItem.typeId)
  }

  const isMatch = filterSlots.length === 0 || filterSlots.includes(item.typeId)
  const targetDir = isMatch ? "down" : "right"

  // Pokus o přenos
  const transferSuccess = tryTransfer(block, item, targetDir)

  if (transferSuccess) {
    container.setItem(sourceSlot, undefined)
    playBlockAnimation(block, isMatch ? "sort_match" : "sort_ne")
    setBlockState(block, "idle")
    return
  }

  // Pokus o drop
  const dropSuccess = tryDrop(block, item, targetDir)

  if (dropSuccess) {
    container.setItem(sourceSlot, undefined)
    playBlockAnimation(block, "drop")
    setBlockState(block, "idle")
    return
  }

  // Zaseknuto
  playBlockAnimation(block, "stuck")
  setBlockState(block, "stuck")
}

12.3 scripts/modules/transfer_logic.js
---------------------------------------
import { ItemStack } from "@minecraft/server"

export function tryTransfer(sourceBlock, item, direction) {
  const targetPos = getRelativePos(sourceBlock, direction)
  const targetBlock = sourceBlock.dimension.getBlock(targetPos)

  if (!targetBlock) return false

  // Případ A: Cíl je Filtr
  if (targetBlock.typeId === "filtrovna:filtr") {
    const targetContainer = getBlockContainer(targetBlock)
    if (!targetContainer) return false

    for (let i = 0; i < 9; i++) {
      if (!targetContainer.getItem(i)) {
        targetContainer.setItem(i, item.clone())
        return true
      }
    }
    return false
  }

  // Případ B: Vanilla kontejner
  const invComp = targetBlock.getComponent("minecraft:inventory")
  if (invComp?.container) {
    const result = invComp.container.addItem(item.clone())
    return result === undefined
  }

  return false
}

export function tryDrop(sourceBlock, item, direction) {
  const targetPos = getRelativePos(sourceBlock, direction)
  const targetBlock = sourceBlock.dimension.getBlock(targetPos)

  if (targetBlock && !targetBlock.isAir && !targetBlock.isLiquid) {
    return false
  }

  const spawnPos = {
    x: targetPos.x + 0.5,
    y: targetPos.y + 0.5,
    z: targetPos.z + 0.5
  }

  const itemEntity = sourceBlock.dimension.spawnEntity("minecraft:item", spawnPos)
  const itemComp = itemEntity.getComponent("minecraft:item")

  if (itemComp) {
    itemComp.itemStack = item.clone()
  }

  // Impulz
  const impulse = getDirectionVector(direction, sourceBlock)
  itemEntity.applyImpulse({
    x: impulse.x * 0.3,
    y: 0.2,
    z: impulse.z * 0.3
  })

  return true
}

function getRelativePos(block, direction) {
  const facing = block.permutation.getState("minecraft:cardinal_direction")
  const dirs = {
    "south": { left: { x: 1, y: 0, z: 0 }, right: { x: -1, y: 0, z: 0 }, down: { x: 0, y: -1, z: 0 } },
    "west":  { left: { x: 0, y: 0, z: 1 }, right: { x: 0, y: 0, z: -1 }, down: { x: 0, y: -1, z: 0 } },
    "north": { left: { x: -1, y: 0, z: 0 }, right: { x: 1, y: 0, z: 0 }, down: { x: 0, y: -1, z: 0 } },
    "east":  { left: { x: 0, y: 0, z: -1 }, right: { x: 0, y: 0, z: 1 }, down: { x: 0, y: -1, z: 0 } }
  }
  const offset = dirs[facing]?.[direction] || { x: 0, y: 0, z: 0 }
  return {
    x: block.x + offset.x,
    y: block.y + offset.y,
    z: block.z + offset.z
  }
}


================================================================================
ČÁST 13: CRAFTING RECEIPT
================================================================================

13.1 crafting/filtr.json
------------------------
{
  "format_version": "1.21.0",
  "minecraft:recipe_shaped": {
    "description": {
      "identifier": "filtrovna:filtr"
    },
    "tags": [ "crafting_table" ],
    "pattern": [
      "MCM",
      "SGS",
      "MBM"
    ],
    "key": {
      "M": {
        "item": "minecraft:waxed_copper_block"
      },
      "C": {
        "item": "minecraft:waxed_copper_grate"
      },
      "S": {
        "item": "minecraft:glass"
      },
      "G": {
        "item": "minecraft:copper_golem_spawn_egg"
      },
      "B": {
        "item": "minecraft:waxed_copper_bulb"
      }
    },
    "result": {
      "item": "filtrovna:filtr",
      "count": 1
    }
  }
}

  Poznámka: copper_golem_spawn_egg není vanilla item. Alternativy:
  - "minecraft:pumpkin" (dýně — odkaz na původní golem craft)
  - "minecraft:copper_block" + custom lore
  - Vlastní item "filtrovna:golem_core" získaný jinak


================================================================================
ČÁST 14: TESTOVACÍ SCÉNÁŘE
================================================================================

14.1 ZÁKLADNÍ TESTY
-------------------
  1. Položení bloku — ověřit správnou orientaci, viditelnost golema
  2. Otevření UI — ověřit zobrazení všech sekcí
  3. Vložení předmětu do VSTUPU — ověřit tick reakci, animaci "inspect"
  4. Prázdný filtr — vše jde do MATCH
  5. Nastavení filtru — vložení 1 diamondu do FILTRU, vložení stone + diamond do VSTUPU
  6. Kontrola výstupů — diamond v MATCH, stone v NE
  7. Plný výstup — ověřit zaseknutý stav
  8. Drop mód — zničit cílový kontejner, ověřit vyhození item entity
  9. Řetězec filtrů — 3+ filtry za sebou, ověřit průchodnost
  10. Zničení bloku — ověřit drop itemu, zánik entity, neztrátu dat

14.2 VÝKONNOST
--------------
  - Maximální počet aktivních Filtrů na chunk: 50 (testovat)
  - Tick zátěž: < 1ms na 10 filtrů
  - Memory footprint: < 5MB na 100 filtrů (entity + data)


================================================================================
ČÁST 15: ZNÁMÉ OMEZENÍ A BUDOUCÍ ROZŠÍŘENÍ
================================================================================

15.1 OMEZENÍ
------------
  1. Golem je čistě vizuální — nemá AI, nereaguje na hráče, nelze "osvobodit"
  2. Filtr porovnává pouze typeId — nerozlišuje enchanty, jména, damage
  3. Inventář je vázán na entity — při extrémních okrajových případech
     (force-unload chunku, crash) může dojít k desynchronizaci
  4. Custom UI přes server-ui není tak plynulé jako nativní container UI
  5. iOS má omezení na velikost scriptu — doporučeno minifikovat

15.2 BUDOUCÍ ROZŠÍŘENÍ
-----------------------
  - Podpora NBT filtrů (enchanty, jména, lore)
  - Redstone integrace (comparator output podle zaplnění)
  - Rychlostní upgrade (z 21 ticků na 10)
  - Více golemů v jednom bloku (vizuální variace)
  - Auto-waxing golema (kosmetické)
  - Integrace s hopperům (přímý příjem bez UI)


================================================================================
ČÁST 16: LOKALIZACE
================================================================================

16.1 texts/cs_CZ.lang
---------------------
tile.filtrovna:filtr.name=Filtr
tile.filtrovna:filtr.description=Inteligentní třídící blok s měděným golemem

filtrovna.ui.title=Filtr — Nastavení
filtrovna.ui.section.input=Vstup
filtrovna.ui.section.filter=Filtr
filtrovna.ui.section.match=Vytříděné
filtrovna.ui.section.ne=Odpad
filtrovna.ui.status.idle=Čeká...
filtrovna.ui.status.inspecting=Kontroluje...
filtrovna.ui.status.sorting_match=Třídí — shoda
filtrovna.ui.status.sorting_ne=Třídí — odpad
filtrovna.ui.status.dropping=Vyhazuje...
filtrovna.ui.status.stuck=Zaseknutý!

filtrovna.command.success=Hotovo! Sloty %1–%2 nastaveny na %3.
filtrovna.command.error.no_filter=Zde není Filtr!
filtrovna.command.error.no_container=Chyba: Nelze získat inventář!

16.2 texts/en_US.lang
---------------------
tile.filtrovna:filtr.name=Filter
tile.filtrovna:filtr.description=Intelligent sorting block with copper golem

filtrovna.ui.title=Filter — Settings
filtrovna.ui.section.input=Input
filtrovna.ui.section.filter=Filter
filtrovna.ui.section.match=Sorted
filtrovna.ui.section.ne=Reject
filtrovna.ui.status.idle=Waiting...
filtrovna.ui.status.inspecting=Inspecting...
filtrovna.ui.status.sorting_match=Sorting — match
filtrovna.ui.status.sorting_ne=Sorting — reject
filtrovna.ui.status.dropping=Dropping...
filtrovna.ui.status.stuck=Stuck!

filtrovna.command.success=Done! Slots %1–%2 set to %3.
filtrovna.command.error.no_filter=No Filter here!
filtrovna.command.error.no_container=Error: Cannot access inventory!


================================================================================
                              Kromě filtr bloků tento addon obsahuje také mini copper golemy (malé měděné golemy). Ti jsou stejní jako golemové uvnitř filtr bloků, tedy designově totožní jako klasičtí copper golemové (https://github.com/ZtechNetwork/MCBVanillaResourcePack/tree/b6bdfc80f0b218c0119002967df2479299642be0/textures/entity/copper_golem) (https://github.com/ZtechNetwork/MCBVanillaResourcePack/tree/b6bdfc80f0b218c0119002967df2479299642be0/sounds/mob/copper_golem), ale menší. Od normálních se ovšem liší tak, že věci berou v balíčcích po 10. Za to jsou o něco svyžnější. Věci berou z copper truhel, ale i z ender truhel a jen tak ze země. Sesbírané věci následně vkládají do filtr bloku k třídění. Za jejich majitele je považován ten, kdo je navoskoval, a toho ender truhlu vidí. Na rozdíl od golemů uvnitř filtr stejně jako velcí golemové oxidují.
================================================================================


## 🚀 Vylepšení stávajících funkcí

### 1. **Vylepšený Filtr blok**

- **Prioritní fronta předmětů** – místo FIFO (first-in-first-out) implementuj prioritní systém: vzácné předměty (např. diamanty, netherity) se zpracují před běžnými (kameny, hlína). Lze nastavit přes UI jako "priority mode".
- **Batch processing** – umožni golemovi vložit najednou více předmětů do INPUT slotu (např. celý stack), které Filtr zpracuje jako jednu dávku s jedním animačním cyklem místo 21 ticků na každý předmět zvlášť.[1][2]
- **Filtr s více režimy** – přidej přepínač režimů:
  - **Exact match** – musí přesně odpovídat filtru (aktuální chování)
  - **Tag match** – přijme všechny předměty stejného tagu (např. všechny "logs", všechny "ores")
  - **Mod match** – pokud používáš jiné addony, může filtrovat podle namespace
- **Energetický systém** – Filtr spotřebovává "energii" (např. z redstone, baterií z jiných addonů, nebo vlastní "copper charge"), aby nebyl nekonečný a vyžadoval údržbu.

### 2. **Mini Copper Golem vylepšení**

- **Pathfinding optimalizace** – využívej `minecraft:behavior.move_to_block` s cachingem cest, aby golem nepropočítával cestu při každém běhu. Ulož si poslední úspěšnou cestu do `BlockDynamicPropertiesComponent`.[3]
- **Charging/oxidation mechanika** – golem postupně oxiduje (mění barvu z copper → exposed → weathered → oxidized) a s každou fází se zpomaluje o 10%. Lze "resetovat" pravým klikem s honeycomb (waxing).
- **Teamwork mode** – pokud máš více golemů, mohou si mezi sebou předávat předměty (jeden sbírá, druhý třídí, třetí rozváží).
- **Idle animace** – přidej animace, kdy golem "odpočívá" u zapamatovaného Filtru nebo čistí svůj inventář.

## ✨ Nové funkce a bloky

### 3. **Filtr Master (vylepšený Filtr)**

Nový blok, který funguje jako centrální mozek pro více obyčejných Filtrů:

- **Crafting:** 4× Filtr + 1× comparator + 1× copper_block
- **Funkce:**
  - Propojí až 8 obyčejných Filtrů do jedné sítě
  - Synchronizuje jejich FILTR sloty (nastavíš na Masterovi a všechny se aktualizují)
  - Umožní "global matching" – pokud jeden Filtr nemá místo v MATCH výstupu, automaticky přesměruje na jiný Filtr v síti
  - Zobrazuje statistiky: kolik předmětů celkem vytříděno, úspěšnost, průměrná doba zpracování

### 4. **Conveyor Belt (pásový dopravník)**

- **Crafting:** 2× copper_ingot + 4× iron_ingot + 2× redstone
- **Funkce:**
  - Předměty se pohybují po pásu rychlostí 1 blok/sekundu
  - Lze otáčet o 90° (podobně jako logs)
  - Kompatibilní s Filtrem: předměty z NE výstupu mohou padat přímo na pás
  - Script API: `minecraft:conveyor_movement_component` s custom rychlostí a směrem

### 5. **Smart Hopper (inteligentní trychtýř)**

- **Crafting:** 5× iron_ingot + 1× comparator + 1× copper_nugget
- **Funkce:**
  - Má vlastní filtr (9 slotů) jako vanilla hopper, ale umí:
    - **Prioritizovat** – vytáhne nejdříve předměty, které jsou ve filtru
    - **Zadržet** – pokud je výstupní kontejner plný, podrží předměty až do uvolnění místa
    - **Count mode** – vytáhne přesně N předmětů (nastavitelné v UI)
  - Podpora pro ender truhly a shulker boxy jako cíle

### 6. **Golem Docking Station**

- **Crafting:** 3× copper_block + 2× iron_block + 1× redstone_lamp
- **Funkce:**
  - Golem se "ukotví" u stanice a nabíjí se (obnoví rychlost, resetuje oxidaci)
  - Stanice může sloužit jako "home base" – golem se sem vrací, když nemá úkoly
  - Lze připojit k redstone signálu: když je aktivní, golemové přestanou pracovat a odpočinou si

### 7. **Item Scanner (skener předmětů)**

- **Crafting:** 1× glass + 2× copper_ingot + 1× redstone_torch + 1× comparator
- **Funkce:**
  - Když předmět projde skenerem, vydá redstone signál o síle odpovídající "hodnotě" předmětu (custom mapping)
  - Lze použít k detekci konkrétních předmětů v proudu (např. "pokud projde diamant, aktivuj piston")
  - Script API: `minecraft:scanner_component` s custom blacklist/whitelist

## 🔧 Technická vylepšení pro Script API

### 8. **Persistentní data přes WorldDynamicProperties**

Místo ukládání paměti golemů jen v proměnných (které se ztratí při restartu světa) použij `world.getDynamicProperty()` a `world.setDynamicProperty()`:

```typescript
// Uložení paměti golemu
const golemMemory = {
  filters: [/* pozice Filtrů */],
  storages: [/* pozice skladů */],
  oxidation: 0.3,
  lastActive: Date.now()
};
world.setDynamicProperty(`golem_${golem.id}`, JSON.stringify(golemMemory));
```

Tím zajistíš, že paměť přežije i vypnutí a znovuotevření světa.[3][4]

### 9. **Custom UI pro konfiguraci**

Využij `@minecraft/server-ui.CustomForm` pro pokročilejší nastavení:

- **Filtr konfigurace:**
  - Nastavení priority předmětů (drag & drop v UI)
  - Režim match (exact/tag/mod)
  - Rychlost zpracování (pomaleji = méně "energie")
  
- **Golem konfigurace:**
  - Zobrazení aktuální paměti (seznam Filtrů a skladů)
  - Možnost ručně smazat konkrétní položku z paměti
  - Statistiky: kolik předmětů donesl, kolik vytřídil, průměrná vzdálenost

### 10. **Event-driven architektura**

Místo polling (neustálého kontrolování stavu) používej eventy:

```typescript
world.afterEvents.itemPickup.subscribe((event) => {
  if (event.pickedUpItem.typeId === "filtrovna:mini_copper_golem") {
    // Spusť golemovu AI
  }
});

world.afterEvents.blockPlace.subscribe((event) => {
  if (event.block.typeId === "filtrovna:filtr") {
    // Inicializuj Filtr
  }
});
```

To je výkonnější a méně zatěžuje server než neustálé `setInterval()` nebo `runOnTick`.[5][6]

## 🎨 Vizuální a UX vylepšení

### 11. **Particle effects**

- Když Filtr zpracovává předmět, emituj částice (např. `minecraft:basic_flame_particle` nebo custom copper particles)
- Golem při běhu zanechává stopu (podobně jako fox, ale copper-colored)
- Když se předmět přesune do MATCH/NE slotu, krátký "sparkle" efekt

### 12. **Sound effects**

- Custom zvuky pro:
  - Otevření UI Filtru
  - Úspěšné vytřídění (pleasant "ding")
  - Golem při sběru předmětů (copper "clink")
  - Chyba (když se předmět nevejde do cíle)

### 13. **Tooltip a JEI/REI podpora**

- Přidej custom tooltips, které se zobrazí při podržení předmětu (např. "Mini Copper Golem: pamatuje si 15 Filtrů a 15 skladů")
- Pokud používáš addon pro recepty (např. Just Enough Items pro Bedrock), přidej custom recepty pro všechny nové bloky

## 📊 Statistiky a achievementy

### 14. **Scoreboard integrace**

Vytvoř custom scoreboard, který sleduje:

- Počet vytříděných předmětů
- Počet aktivních golemů
- Celková vzdálenost, kterou golemové proběhli
- Nejvzdálenější doručený předmět

Příkaz: `/filtrovna stats <player>` zobrazí statistiky pro konkrétního hráče.

### 15. **Achievementy**

- **"První třídění"** – vytřiď první předmět
- **"Logistický mistr"** – měj 5 aktivních golemů najednou
- **"Rychlá doprava"** – golem doručí předmět do 10 sekund od vhození
- **"Ender mastery"** – použij ender truhlu jako sklad

## 🔐 Bezpečnostní a multiplayer funkce

### 16. **Owner lock**

- Filtr i golem si pamatují svého majitele (první hráč, který je postaví/spawnuje)
- Jiní hráči nemohou měnit nastavení ani brát předměty z inventáře (lze vypnout v configu)
- Příkaz: `/filtrovna owner <x> <y> <z> <player>` pro změnu majitele

### 17. **Multiplayer queue**

- Pokud více hráčů hodí předměty do stejného Filtru, vytvoří se fronta podle času vhození
- Každý hráč vidí jen své předměty v UI (privacy)

## 🛠️ Debug a vývojářské nástroje

### 18. **Debug mode**

Příkaz: `/filtrovna debug true|false`

- Zobrazí bounding boxy golemů
- Vypíše cestu, kterou golem plánuje
- Ukáže obsah všech slotů Filtru v chatu
- Loguje chyby (např. "golem nemůže najít cestu k Filtru")

### 19. **Performance monitor**

- Příkaz `/filtrovna perf` zobrazí:
  - Průměrný čas zpracování předmětu
  - Počet aktivních golemů
  - FPS dopad (odhad)
  - Paměť použitá na dynamic properties

## 📦 Balení a distribuce

### 20. **Config file**

Vytvoř `config.json` v behavior packu, kde hráči mohou nastavit:

```json
{
  "golem_speed_multiplier": 1.0,
  "filter_processing_time_ticks": 21,
  "enable_oxidation": true,
  "max_golem_memory": 15,
  "enable_ender_chest_support": true,
  "debug_mode": false
}
```

To umožní hráčům přizpůsobit addon bez nutnosti editovat kód.

***

## Prioritní doporučení

Pokud chceš začít s tím nejdůležitějším:

1. **Persistentní data** (č. 8) – aby paměť golemů přežila restart světa
2. **Custom UI** (č. 9) – pro lepší user experience
3. **Event-driven architektura** (č. 10) – pro lepší výkon
4. **Conveyor Belt** (č. 4) – nejužitečnější nový blok pro logistiku
5. **Particle effects** (č. 11) – pro vizuální feedback






Užitečný zdroj: https://github.com/ZtechNetwork/MCBVanillaResourcePack.git
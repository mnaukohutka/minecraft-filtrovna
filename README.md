# Filtrovna — Minecraft Bedrock Addon

Kompletní Behavior + Resource pack pro Minecraft Bedrock Edition 1.21+ obsahující inteligentní třídící systém s měděným golemem, logistickými bloky a perzistentní pamětí.

## Instalace

1. Stáhni `Filtrovna.mcaddon` (nebo `filtrovna_behavior/` + `filtrovna_resource/` složky).
2. Otevři `.mcaddon` soubor — Minecraft jej automaticky importuje.
3. Aktivuj oba packy (Behavior + Resource) ve světě.
4. Povol „Beta API“ v nastavení světa (Experimentální herní prvky).

## Bloky a entity

### 1. Filtr (`filtrovna:filtr`)
Inteligentní třídící blok s vizuálním měděným golemem uvnitř.

- **Crafting:** waxed_copper_block (M), waxed_copper_grate (C), glass (S), pumpkin (G), waxed_copper_bulb (B) ve vzoru `MCM/SGS/MBM`.
- **Inventář:** 37 slotů (VSTUP 0–8, FILTR 9–18, MATCH 19–27, NE 28–36) přes neviditelnou entitu `filtrovna:filtr_entity`.
- **Funkce:** položíš-li předmět do VSTUPU, golem ho zkontroluje, porovná s FILTREM a pošle do MATCH (dolů) nebo NE (vpravo). Pokud nelze přenést do kontejneru, předmět vyhodí jako item entity.
- **Stavový indikátor:** barva žárovky na přední straně (zelená/žlutá/modrá/oranžová/bílá/červená) + částice a zvuky při zpracování.
- **Režimy shody** (přepínač v UI / `/filtrovna mode`):
  - `exact` — přesná shoda (výchozí)
  - `tag` — přijme všechny předměty stejného tagu (logs, ores, ingots, dyes, redstone, ...)
  - `mod` — shoda podle namespace (addonu)
- **Prioritní fronta** — vzácné předměty (diamanty, netherity) se zpracují před běžnými (kámen, hlína). Lze vypnout v UI / `/filtrovna priority`.
- **Batch processing** — zpracuje až N předmětů ve VSTUPU najednou s jedním animačním cyklem místo N×21 ticků.
- **Energetický systém** — Filtr spotřebovává energii na předmět a regeneruje ji v čase. Při 0 energii se zastaví (stav „stuck“). Lze vypnout v configu.
- **UI:** pravý klik otevře `ActionForm` + `CustomForm` (konfigurace módu, priority, rychlosti, správa filtru).

### 2. Mini Copper Golem (`filtrovna:mini_copper_golem`)
Funkční entita: rychlejší než klasický copper golem, s pamětí na 15 Filtrů + 15 skladů, plným sběratelským cyklem a podporou ender truhly.

- **Crafting:** copper_ingot (C) + pumpkin (P) ve vzoru ` C /CPC/ C ` → spawn egg.
- **Vlastnosti:** scale 0.55, rychlost pohybu 0.35, 20 HP, pád bez poškození, persistent.
- **Inventář:** 27 slotů (sbírá item entity pomocí `behavior.pickup_items`).
- **Paměť** (perzistentní přes restart světa přes entity dynamic properties):
  - **Filtr paměť** — kam donést předměty k vytřídění.
  - **Sklad paměť** — kam donést vytříděný MATCH výstup.
- **Učení:**
  - Sneak + pravý klik (s copper_ingot v ruce) na Filtr → golem si ho zapamatuje jako třídící cíl.
  - Sneak + pravý klik (s copper_ingot v ruce) na truhlu (chest, barrel, hopper, shulker, **ender chest**) → jako skladovací cíl.
- **Oxidace / nabíjení:** golem postupně oxiduje (měděný → exposed → weathered → oxidized) a s každou fází se zpomaluje o 10 %. Pravý klik s **honeycomb** (vosk) oxidaci resetuje. Dockovací stanice ho resetuje automaticky.
- **Plný sběratelský cyklus:** sběr → Filtr → třídění → MATCH → sklad. Bez Filtru nese předměty přímo do skladu.
- **Ender truhla:** pokud je golem ochočen, vloží předměty do ender inventáře majitele.
- **Loot:** 2–5 copper_ingot + 25 % šance lightning_rod.

### 3. Filtr Master (`filtrovna:filtr_master`)
Centrální mozek propojující až 8 obyčejných Filtrů.

- **Crafting:** 4× Filtr (F) + comparator (C) + copper_block (B) ve vzoru ` F /FCF/ B `.
- **Funkce:** synchronizuje FILTR sloty ze šablony Mastera do všech propojených Filtrů; „global matching“ přesměruje přebytek z plného MATCH na jiný Filtr v síti; sleduje statistiky (vytříděno, přesměrování, pokusy).
- **UI:** pravý klik → propojení/odpojení nejbližšího Filtru, synchronizace šablony.

### 4. Conveyor Belt (`filtrovna:conveyor`)
Pásový dopravník pohybující item entity po svém směru.

- **Crafting:** 2× copper_ingot (C) + 4× iron_ingot (I) + 2× redstone (R) → 2× pás.
- **Funkce:** předměty se pohybují rychlostí 1 blok/s (konfigurovatelně). Lze otáčet o 90° při pokládce. Kompatibilní s Filtrovou (předměty z NE výstupu mohou padat na pás). Pokud je další blok kontejner, předměty se do něj vloží.

### 5. Smart Hopper (`filtrovna:smart_hopper`)
Inteligentní trychtýř s vlastním filtrem.

- **Crafting:** 5× iron_ingot (I) + comparator (C) + copper_ingot (N) ve vzoru `I I/ICI/ N `.
- **Funkce:** 5 filtr slotů + 27 buffer; prioritizuje vzácné/filtrované předměty; zadrží předměty při plném výstupu; „count mode“. Podpora pro chest/barrel/hopper/shulker/ender chest jako cíl.

### 6. Golem Docking Station (`filtrovna:golem_dock`)
Nabíjecí a domovská stanice pro golemy.

- **Crafting:** 3× copper_block (B) + 2× iron_block (I) + redstone_lamp (L) ve vzoru ` B /IBI/ L `.
- **Funkce:** golem v dosahu ~4 bloků se resetuje (oxidace = 0, obnovená rychlost). Při aktivním redstone signálu golemové odpočívají (přestanou pracovat).

### 7. Item Scanner (`filtrovna:scanner`)
Skener vydávající redstone signál podle hodnoty předmětu.

- **Crafting:** glass (G) + 2× copper_ingot (C) + redstone_torch (R) + comparator (T) ve vzoru ` G / C /RT `.
- **Funkce:** když předmět projde skenerem, emituje signál o síle odpovídající vzácnosti (1–15). Podporuje whitelist/blacklist přes dynamic properties.

## Technické rysy

- **Perzistentní data** — paměť golemů, statistiky, oxidace, konfigurace Filtrů a sítě Mastera jsou uloženy v entity/block/world `DynamicProperties`, takže přežijí restart světa.
- **Event-driven architektura** — pokládka/zničení bloků, spawn golema a interakce reagují na eventy (`playerPlaceBlock`, `playerBreakBlock`, `playerInteractWithBlock`, `playerInteractWithEntity`, `entitySpawn`).
- **Custom UI** — `ActionFormData` + `ModalFormData` pro konfiguraci Filtru (mód, priorita, rychlost) a golema.
- **Statistiky a achievementy** — scoreboard `filtrovna_stats` sleduje počet vytříděných předmětů, aktivní golemy, ujetou vzdálenost; achievementy: První třídění, Logistický mistr, Rychlá doprava, Ender mastery.
- **Owner lock** — Filtr i golem si pamatují majitele (první hráč, který je postaví/učí). Jiní hráči nemohou měnit nastavení ani brát předměty (lze vypnout v configu).
- **Config file** — `filtrovna_behavior/config.json` obsahuje všechny laditelné hodnoty (rychlost golema, doba zpracování, oxidace, energie, ...).

## Příkazy

| Příkaz | Popis |
| --- | --- |
| `/filtrovna filtr <x y z> <slot_start> <slot_end> <item> [amount]` | Nastaví sloty Filtru |
| `/filtrovna fill <x y z> <slot_start> <slot_end> <item> [amount]` | Naplní sloty Filtru |
| `/filtrovna mode <x y z> <exact\|tag\|mod>` | Nastaví režim shody |
| `/filtrovna priority <x y z> <true\|false>` | Přepne prioritní frontu |
| `/filtrovna owner <x y z> [player]` | Zobrazí/nastaví majitele |
| `/filtrovna debug <true\|false>` | Přepne debug mód |
| `/filtrovna perf` | Zobrazí statistiky výkonu |
| `/filtrovna stats [player]` | Zobrazí statistiky |
| `/filtrovna config <set\|get> <path> [value]` | Konfigurace |

## Zvuky a textury

- **Zvuky golema** — převzaty z [MCBVanillaResourcePack](https://github.com/ZtechNetwork/MCBVanillaResourcePack) (step, hurt, look, spin, death, spawn, chest_interaction) ve 4 fázích oxidace (regular, weathered, oxidized).
- **Textury golema** — převzaty z MCBVanillaResourcePack (copper_golem + eyes + exposed/weathered/oxidized varianty).
- **Textury filtru** — vlastní (waxed_copper_grate, copper_bulb, hammered copper + overlay symboly).

## Struktura

```
filtrovna_behavior/     # Behavior Pack
  blocks/                # Definice bloků (filtr, filtr_master, conveyor, ...)
  entities/               # Entity (filtr_entity, mini_copper_golem)
  crafting/               # Crafting recepty
  loot_tables/            # Loot tabulky pro golema
  scripts/                # Script API (main.js + modules/)
  config.json             # Konfigurace
  manifest.json

filtrovna_resource/      # Resource Pack
  models/                 # Geometrie (filtr.geo, mini_copper_golem.geo)
  animations/             # Animace golema (idle, inspect, sort_match, ...)
  animation_controllers/  # Stavový stroj
  render_controllers/    # Render controllery (oxidace fáze)
  entity/                 # Client entity definice
  textures/               # Textury (bloky, entity, items)
  sounds/                 # Zvuky golema + definice
  texts/                  # Lokalizace (cs_CZ, en_US)
  manifest.json
```

## Kompatibilita

- Minecraft Bedrock Edition 1.21+ (iOS, Android, Windows, Xbox, PlayStation, Switch)
- Vyžaduje povolené Beta API (Experimentální herní prvky)
- Script API: `@minecraft/server` 1.14.0, `@minecraft/server-ui` 1.2.0

# Merk AI Your Gym

Besluit Kane (23-10-2026): het logo is het **embleem** (richting 4 uit `richtingen/`):
A, I, Y en G in vier vakken, zoals een stempel. De kleuren zijn **Racegroen**. Premium
en rustig, geen goud of brons; het oude smaragd (#1FA77A) hoort niet meer bij het merk.

De merkgids staat in `merkgids.html` (open in een browser): logo, vrije ruimte,
minimummaat, kleuren met contrast, letters en toon van schrijven.

## Bestanden in deze map

| Bestand | Wat |
| --- | --- |
| `ayg-logo-licht.svg` / `.png` | Liggend logo op licht (racegroen embleem, racegroen woord), PNG 640 px hoog |
| `ayg-logo-donker.svg` / `.png` | Liggend logo op donker (creme embleem, creme woord), PNG 640 px hoog |
| `ayg-logo-licht-40.png`, `-40@2x`, `-40@3x` | Liggend logo voor 40 px hoog (180 x 40), in 1x, 2x en 3x |
| `ayg-logo-donker-40.png`, `-40@2x`, `-40@3x` | Idem op donker |
| `ayg-logo-mail@2x.png` | Voor e-mail: 360 x 80 op wit, tonen als `width="180" height="40"` |
| `ayg-logo-zwart.svg`, `ayg-logo-wit.svg` | Eenkleurig, embleem uitgespaard |
| `ayg-embleem-licht.svg`, `-donker`, `-zwart`, `-wit` | Alleen het embleem |
| `ayg-embleem-klein.svg` | Embleem voor 16 tot 32 px (geen kruis, zwaardere letters) |
| `ayg-embleem-licht-512.png`, `-1024` | Embleem op licht als PNG |
| `ayg-embleem-donker-512.png`, `-1024` | Embleem op donker als PNG |
| `ayg-woordmerk-licht.svg`, `-donker`, `-zwart`, `-wit` | Alleen het woordmerk |
| `ayg-app-icoon.svg`, `ayg-app-icoon-512.png`, `-1024` | App-icoon: creme embleem op racegroen |
| `ayg-deelafbeelding.png` | Voorbeeld van de deelafbeelding (1200 x 630) |

## Kleuren

| Naam | Waarde | Gebruik |
| --- | --- | --- |
| Racegroen | `#10302A` | Hoofdkleur: embleem, vlakken, donkere secties |
| Creme | `#F1ECE1` | Papier en achtergrond, embleem op donker |
| Flessengroen | `#1E4A40` | Tweede groen: lijnen, vlakken op racegroen |
| Salie | `#A7B5A8` | Zacht accent: bijschriften en lijnen op groen |
| Inkt | `#111614` | Tekst |

Contrast (WCAG 2.2): creme op racegroen 12,06:1 · inkt op creme 15,52:1 · flessengroen
op creme 8,45:1 · creme op flessengroen 8,45:1 · salie op racegroen 6,64:1 · inkt op salie
8,55:1 · salie op flessengroen 4,66:1 · salie op creme 1,82:1 (nooit voor tekst) ·
flessengroen op racegroen 1,43:1 (alleen sier, toon op toon).

## In de app

- Component `AygLogo` (`src/components/aiyourgym/merk/AygLogo.tsx`, vormen `logo`,
  `beeldmerk` en `woordmerk`, prop `opDonker` voor een donkere ondergrond) en `AygSymbool`.
- Kleuren van het embleem via `--ayg-logo-plaat` (plaat en Y) en `--ayg-logo-teken`
  (kruis, vak Y, A, I, G). Zonder die variabelen: racegroen met creme bij een licht
  kleurenschema, creme met racegroen bij een donker (`light-dark()`). Het woord volgt `currentColor`.
- Iconen: `icon.svg` en `apple-icon.png` in `src/app/(aiyourgym)/(website)/aiyourgym/` en
  `src/app/(aiyourgym)/(club)/club/`. Deelafbeelding: `opengraph-image.tsx` en
  `twitter-image.tsx` in `src/app/(aiyourgym)/(website)/aiyourgym/(site)/`.
- De reserve-iconen van de ledenapp (`public/club-app/`) zijn bewust neutraal ("Club"):
  een lid ziet daar de sportschool, niet AI Your Gym.

## Scherp op elk scherm

- Gebruik op het scherm altijd de vector (`AygLogo` of een SVG), nooit een PNG.
- Plaat, kruis en vak Y zijn rechte vlakken met `shape-rendering="crispEdges"`: hun randen
  vallen op hele pixels, ook op 1,5x en retina, zonder grijze haarlijnen of naden.
- Het kruis is 3 van de 100. In de kop (21 tot 30 px) is dat minder dan een pixel; daarom ligt
  er een lijn van precies 1 schermpixel op (`vector-effect="non-scaling-stroke"`) als
  ondergrens. Groot valt die lijn binnen het kruis.
- De letters houden gladde randen (anti-aliasing).
- PNG's tekent de generator direct op de doelmaat vanuit de vector (niet groot tekenen en
  verkleinen, dat maakt de randen zacht). Het apple-icon blijft 180 x 180, de maat die iOS vraagt.

## Opnieuw maken

`node docs/aiyourgym/brand/bron/genereer.mjs` (vanuit de hoofdmap van de repo). Het schrijft
`src/components/aiyourgym/merk/merk-paden.ts`, alle bestanden in deze map (behalve de
deelafbeelding) en de iconen, en drukt de contrastwaarden af. Pas maten alleen daar aan.

Letters van het logo: Big Shoulders Bold (`bron/BigShoulders-Bold-merk.ttf`, alleen de letters
van het merk), SIL Open Font License 1.1, zie `bron/OFL-BigShoulders.txt`. Omgezet naar paden.
De Y is een eigen tekening (variant "Strak", besluit Kane 23-10-2026), vastgelegd als `EIGEN_Y`
in `bron/genereer.mjs`: symmetrisch, armen die op halve hoogte in de stam overgaan, zonder inkeping.
Die Y staat in het embleem, in beide Y's van het woordmerk, in de iconen en in de deelafbeelding.

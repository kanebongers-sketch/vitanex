# MentaForce

Projectkennis voor MentaForce, een product van Vitaal. Dit document beschrijft het merk, de doelgroep en de kernfeatures. Onderdelen die nog niet vaststaan zijn expliciet gemarkeerd als `TBD — invullen door team` in plaats van ingevuld met aannames.

## Missie

MentaForce maakt welzijn op het werk bespreekbaar door het rustig, anoniem en geaggregeerd inzichtelijk te maken. We willen teams op tijd het goede gesprek laten voeren — vroeg signaleren in plaats van reactief reageren wanneer het al misgaat.

## Visie

Welzijn is geen eenmalig project maar iets dat je continu, in kleine stappen, volgt en bijstuurt. Door zes vlakken van welzijn samen te brengen in één helder beeld, kunnen teams en organisaties trends herkennen voordat ze problemen worden — zonder dat het ten koste gaat van de privacy van het individu.

## Merkkleuren

Strikt twee kleuren. Wit/inkt geldt als neutraal, niet als "kleur".

- **Deep Navy** — `#0B1B3A` (primaire achtergrond/oppervlak)
- **Electric Cyan** — `#00E5FF` (enige accentkleur)

Aanvullende navy- en neutrale tinten worden afgeleid van deze twee (zie `src/components/marketing/theme.ts`). Het 3D-brein is het enige UI-element dat meerkleurig mag zijn: de zes breindelen hebben elk een eigen kleur, uitsluitend binnen die visualisatie.

## Typografie

- **Space Grotesk** voor de hele landingspagina — zowel koppen als bodytekst.
- Fallback: `system-ui, sans-serif`.

## Tone of voice

Helder, eerlijk, rustig en Nederlands. Concreet en menselijk, zonder jargon of grootspraak.

- Geen genezings- of resultaatbeloftes.
- Geen verzonnen cijfers, percentages of onderzoeksclaims.
- Privacy en respect voor het individu staan voorop; nadruk op "het gesprek mogelijk maken", niet op controle.

## Doelgroep

HR-professionals en teams in Nederland. Organisaties die welzijn serieus nemen en vroeg willen signaleren, met respect voor anonimiteit van medewerkers.

- **Primair:** HR / People-teams die teamwelzijn willen volgen en bespreekbaar maken.
- **Secundair:** teamleiders en medewerkers die zelf inzicht in hun welzijn willen.

## Kernfeatures

- **Zes vlakken van welzijn.** Welzijn wordt gemeten over zes pijlers. De app-volgorde is: **Energie, Slaap, Stress, Stemming, Beweging, Voeding.**
- **Anonieme check-ins.** Medewerkers vullen korte check-ins in; antwoorden worden anoniem verwerkt.
- **Geaggregeerd teaminzicht.** Resultaten zijn alleen op teamniveau zichtbaar, nooit herleidbaar tot een individu.
- **Vroeg signaleren.** Trends en dips worden zichtbaar voordat ze doorwerken, zodat teams op tijd het gesprek kunnen voeren.

### App-modules per vlak

Elke pijler heeft een eigen module. De zes vlakken en hoe de app per vlak ondersteunt:

- **Energie** — dagelijkse check-ins tonen de energietrend; bij structureel lage energie volgen kleine, haalbare hersteltips. Zie [energy.md](./energy.md).
- **Slaap** — slaap en herstel bijhouden, met routines die de nachtrust stap voor stap helpen verbeteren. Zie [sleep.md](./sleep.md).
- **Stress** — spanning zichtbaar maken in trends en adem-/ontspanoefeningen aanreiken wanneer de spanning oploopt. Zie [stress.md](./stress.md).
- **Stemming** — anonieme stemmingsmeting met een teamoverzicht en korte reflecties, zodat praten over hoe het gaat makkelijker wordt.
- **Beweging** — activiteit koppelen en haalbare beweegdoelen zetten die in de werkdag passen.
- **Voeding** — voedings- en hydratatie-check-ins met simpele, volhoudbare gewoontes. Zie [nutrition.md](./nutrition.md).

> Let op: voor Stemming en Beweging bestaat (nog) geen apart kennisbestand. Algemene, correcte welzijnsinfo mag, zonder genezings- of resultaatbeloftes.

## AVG & hosting

- **AVG-conform.** De verwerking is ingericht op privacy: antwoorden worden anoniem en geaggregeerd verwerkt, niet herleidbaar tot een individu.
- **EU-hosting.** Gegevens worden binnen de EU gehost.

> Aanvullende privacy-details (bewaartermijnen, verwerkersovereenkomsten, sub-verwerkers, DPIA-status): `TBD — invullen door team`.

## Roadmap

`TBD — invullen door team`

## Pricing

`TBD — invullen door team`

## Businessmodel

`TBD — invullen door team`

## Concurrentie

`TBD — invullen door team`

## USP's

`TBD — invullen door team`

---

### Technische context (naslag)

- Stack o.a. Next.js (16.x), React 19, Three.js / React Three Fiber (3D-brein), Supabase, Capacitor (mobiele app). Zie `package.json`.
- Design tokens: `src/components/marketing/theme.ts`.
- 3D-brein scrollsectie: `src/components/marketing/landing/BrainScroll.tsx` en `src/components/marketing/BrainCanvas.tsx`.
- Het brein als visuele metafoor voor de zes vlakken: zie [brain.md](./brain.md).

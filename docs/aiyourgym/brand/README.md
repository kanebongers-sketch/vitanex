# Merk AI Your Gym

De merkgids staat in `merkgids.html` (open in een browser): logo, vrije ruimte,
minimummaat, kleuren met contrast, letters en toon van schrijven.

Bestanden in deze map:

- `ayg-logo-licht.svg`, `ayg-logo-donker.svg`, `ayg-logo-zwart.svg`, `ayg-logo-wit.svg`: liggend logo
- `ayg-beeldmerk.svg`, `ayg-beeldmerk-donker.svg`, `ayg-beeldmerk-512.png`: beeldmerk (tegel met figuur)
- `ayg-figuur.svg`: alleen de figuur, als sierelement
- `ayg-woordmerk.svg`: alleen het woordmerk

In de app: component `AygLogo` (`src/components/aiyourgym/merk/AygLogo.tsx`, vormen
`logo`, `beeldmerk` en `woordmerk`).

Alles wordt gemaakt door `node docs/aiyourgym/brand/bron/genereer.mjs` (vanuit de
hoofdmap van de repo). Het woordmerk komt uit `bron/bricolage-merk.ttf`
(Bricolage Grotesque, SIL Open Font License 1.1, zie `bron/OFL-bricolage-grotesque.txt`).

# Logorichtingen AI Your Gym (keuzeblad)

Vier richtingen om uit te kiezen. Gekozen (besluit Kane 23-10-2026): richting 4, het embleem, in de kleuren Racegroen.
De definitieve bestanden staan in `docs/aiyourgym/brand/` en `src/components/aiyourgym/merk/`;
dit keuzeblad (nog in de oude smaragd) blijft als archief.

Open `richtingen.html` in een browser, of bekijk `richtingen.png` (1600 breed).

| Map | Richting | Idee |
| --- | --- | --- |
| `1-monogram/` | De ligatuur | A en Y in een teken: de rechterpoot van de A loopt door als arm en stam van de Y. |
| `2-ritme/` | Het turfje | Vier staven en een stijgende vijfde streep: herhalingen tellen, progressie. |
| `3-woordmerk/` | De schijf | AI YOUR GYM in ruime kapitalen; de O is een halterschijf in smaragd, ook het icoon. |
| `4-embleem/` | Het rooster | Plaat in vier vakken, A I boven Y G, vak Y in smaragd; app-icoon en stempel. Gedurfde variant in clubgroen met mint. |

Per map: `beeldmerk-licht|donker.svg`, `woordmerk-licht|donker.svg`, `lockup-licht|donker.svg`,
`icoon.svg` (app, 512), `favicon.svg`, plus extra's (eenkleurig, smaragd, stempel, clubgroen,
`favicon-16.svg` op het pixelraster voor het embleem).

Opnieuw maken (vanuit de hoofdmap van de repo):

```
python3 docs/aiyourgym/brand/richtingen/bron/subset.py   # alleen als de letters veranderen
node docs/aiyourgym/brand/richtingen/bron/genereer.mjs    # alle SVG's
node docs/aiyourgym/brand/richtingen/bron/blad.mjs        # richtingen.html
node docs/aiyourgym/brand/richtingen/bron/render.mjs docs/aiyourgym/brand/richtingen/richtingen.html docs/aiyourgym/brand/richtingen/richtingen.png 1600
```

Letters (omgezet naar paden, subsets en licenties in `bron/`), alle onder de SIL Open Font
License 1.1, vrij voor logo's en commercieel gebruik: Instrument Sans, Bricolage Grotesque,
Outfit, Big Shoulders. Beeldmerken zijn met de hand geconstrueerd in `bron/genereer.mjs`.

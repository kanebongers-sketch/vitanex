# Fotolijst AI Your Gym (Obsidian Luxury, 28-10-2026)

De website heeft nu geen enkele foto: er zijn geen echte merkfoto's, en stockfoto's of
AI-beelden gebruiken we niet. Elke plek hieronder is zo ontworpen dat hij zonder foto
af is (typografie, het echte product, champagne licht op obsidiaan). Komt er
campagnefotografie, dan kan die op deze plekken in, zonder de compositie om te gooien.

## Algemene regels voor de shoot

- **Echt en eerlijk.** Echte sportscholen, echte trainers en echte leden, met schriftelijke
  toestemming (modelrelease) en, als het pand herkenbaar is, toestemming van de eigenaar.
  Geen merknamen of logo's van andere sportscholen in beeld; Fit Factory wordt op de
  website niet genoemd, dus ook niet herkenbaar in beeld.
- **Licht.** Laag en gericht, als in een hotel-lobby na sluitingstijd: een harde zijlichtbron
  (raam, spot) en diepe schaduwen. Geen vlakke tl-verlichting, geen flits recht van voren.
- **Kleur.** Warme middentonen, zwarten die zwart blijven (niet opgetild), hooglichten richting
  champagne (#D4BF96). Geen verzadigde kleuren in kleding of materiaal; zwart, antraciet,
  ivoor, staal, leer en hout.
- **Mensen.** Geconcentreerd en in actie, niet poserend of lachend in de camera.
- **Techniek.** RAW, minimaal 6000 px aan de lange zijde. Lever per beeld een versie zonder
  tekst en laat ruimte (negatieve ruimte) waar de kop of het product overheen valt.
- **Web.** Uitvoer als AVIF en WebP via `next/image`, met vaste breedte en hoogte (geen
  layoutverschuiving). Het product (HTML-schermen) blijft altijd scherp boven de foto.

## De plekken

| # | Plek op de site | Wat | Compositie | Verhouding | Hoe het nu af is |
|---|---|---|---|---|---|
| 1 | Voorpagina, held (achter het product, `.vp-held-podium`) | Een lege, donkere trainingsvloer vlak voor openingstijd; een rek met halters, een rubberen vloer, een streep raamlicht | Horizon op ongeveer de helft, onderste helft donker zodat het dashboard en de telefoon erover kunnen liggen; geen mensen | 21:9, ook een 4:5 uitsnede voor de telefoon | Champagne lichtval en een champagne horizonlijn achter het product |
| 2 | Voorpagina, wie het bouwt (de boog met KB, `.vp-boog`) | Portret van Kane op de vloer, halflichaam, in eigen kleding, met een tablet of telefoon in de hand | Staand, Kane in het midden van de boog, hoofd in het bovenste derde, achtergrond donker en onscherp | 4:5 | Boog met monogram KB in cursieve serif en een champagne rand |
| 3 | Voorpagina, coaching (naast de telefoon met het schema) | Een trainer die een lid coacht bij een back squat; hand die aanwijst, geen gezicht nodig | Dicht op de handen en de stang, telefoon met het schema mag in beeld | 4:5 | De echte coaching (kernpunten en een veelgemaakte fout) als typografie |
| 4 | Voorpagina, vijf plekken (per rij een klein beeld bij hover, optioneel) | Balie (QR scannen), vloer (lesrooster op tablet), trainer (intake), eigenaar (cijfers op laptop), lid (ledenapp) | Vijf detailbeelden in dezelfde lichtstijl, steeds handen en een scherm | 3:2 | Editoriale index met grote serif-namen |
| 5 | Voorpagina, overstappen | Een eigenaar aan de balie met een laptop en een kop koffie, avond | Persoon links, lege ruimte rechts voor tekst | 16:9 | Tijdlijn in drie stappen met cursieve cijfers |
| 6 | Subpagina's, paginakop (`.ayg-paginakop`) | Per pagina een sfeerbeeld: Functies (balie), Schema's (trainer en lid), Voor wie (verschillende soorten zalen), Ledenapp (lid met telefoon bij de ingang), Prijzen en Overstappen (eigenaar) | Onderwerp rechts, links donker voor de kop | 16:9 en 4:5 | Champagne lichtval van rechtsboven |
| 7 | Deelafbeelding (OG en X, `opengraph-image.tsx`) | Beeld 1 als achtergrond, donker gemaakt | Logo en kop links blijven leesbaar | 1200 x 630 | Embleem toon op toon met champagne licht |

## Nog nodig van Kane

- Een fotograaf en een datum, en welke locatie(s) er gefotografeerd mogen worden.
- Toestemming van de mensen die in beeld komen (formulier modelrelease).
- Een keuze of het portret van Kane (plek 2) er komt; zonder blijft het monogram staan.

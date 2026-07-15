# Toegankelijkheid — MentaForce (WCAG 2.2 AA)

Welzijn voor iederéén in het team — toegankelijkheid is niet optioneel.

## Contrast

- Verifieer alle tekst tegen AA (≥ 4.5:1 normaal, ≥ 3:1 groot/UI).
- **Cyaan op navy is juist veilig — ook als kleine tekst.** Gemeten (WCAG-luminantie, juli 2026): `#00E5FF` op `--bg-card #0E1F3D` = **10.65:1**, op `--bg-app #060E1C` = **12.56:1**, op merk-navy `#0B1B3A` = **11.08:1**. Cyaan is een lichte kleur (luminantie ≈ 0.63); op vrijwel-zwarte navy geeft dat hoog contrast.
  > Een eerdere versie van deze regel claimde ≈ 2.5:1 en verbood cyaan als bodytekst. Dat cijfer geldt voor cyaan op **wit** (1.54:1 — daar faalt het hard), niet op onze donkere surfaces. De regel is gecorrigeerd nadat het is nagerekend; werk niet op het oude cijfer.
- **De echte contrast-dader is de inkt-ladder, niet het accent.** Houd `--text-3`/`--text-4` boven 4.5:1 als ze kleine tekst dragen; `--text-4` stond op `.36` (3.04:1) en zakte. Test elke nieuwe combinatie door 'm écht te berekenen — niet op gevoel.
- Vertrouw niet op kleur alleen om betekenis over te brengen (de 6 pijlers krijgen ook een label/icoon, niet enkel een kleur).

## Toetsenbord & focus

- Alles bedienbaar met toetsenbord; logische tab-volgorde.
- **Zichtbare focus-indicator** altijd (cyan-ring), nooit `outline: none` zonder vervanging.
- Geen toetsenbordvallen in de scrollytelling; scroll-jacking mag de gebruiker niet opsluiten.

## Semantische HTML

- `header`, `main`, `section`, `nav`, `footer` i.p.v. `div` waar een semantisch element past. Eén `h1` per pagina, koppen in hiërarchie.

## Motion

- Respecteer `prefers-reduced-motion: reduce`: zet brein-rotatie/scrollytelling-beweging uit, toon statische eindstaten. Inhoud volledig bruikbaar zonder animatie.

## Het 3D-brein

- Het canvas is decoratief-interactief en niet leesbaar voor screenreaders. Geef een **tekstueel alternatief**: een visueel of `sr-only` blok dat de 6 pijlers (Energie, Slaap, Stress, Stemming, Beweging, Voeding) benoemt en uitlegt. Markeer puur decoratieve canvas-lagen met `aria-hidden`.

## Overig

- `alt`-tekst op betekenisvolle afbeeldingen (`alt=""` op decoratieve).
- `aria-label` op icon-only knoppen (lucide-iconen zonder zichtbare tekst).
- Formulieren: gekoppelde `<label>`, foutmeldingen via `aria-describedby`.

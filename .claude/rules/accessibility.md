# Toegankelijkheid — MentaForce (WCAG 2.2 AA)

Welzijn voor iederéén in het team — toegankelijkheid is niet optioneel.

## Contrast

- Verifieer alle tekst tegen AA (≥ 4.5:1 normaal, ≥ 3:1 groot/UI).
- Let op: **cyan `#00E5FF` op navy `#0B1B3A`** haalt grote tekst/iconen wel, maar als kleine bodytekst NIET (≈ 2.5:1). Gebruik voor lopende tekst de inkt-tokens (`COLORS.ink`), cyan alleen voor accenten/grote elementen. Test elke nieuwe combinatie.
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

# Review-checklist — MentaForce

> **Huisstijl gewijzigd (09-10-2026, besluit Kane):** MentaForce heeft nu de Fit Factory-look —
> grafiet `#101014` / kaarten `#1A1A1F` + amber `#E8A33F`, tekst in Inter, koppen in
> Barlow Condensed (kapitalen). Waar hieronder navy, cyaan of Space Grotesk staat, lees
> grafiet, amber en Inter/Barlow. Contrastcijfers voor cyaan gelden niet meer: amber op
> grafiet ≈ 8.7:1, grafiet-tekst op amber ≈ 8.7:1. Zie `.claude/CLAUDE.md`.


Loop dit na elke noemenswaardige wijziging af. Iets niet afgevinkt → eerst verbeteren,
dan pas door. Bij auth / user data / betalingen: gebruik direct de **security-reviewer**.

## Kwaliteit & kwaliteitslat

- [ ] **Production ready?** Geen TODO's, dode code, `console.log` of debug-statements.
- [ ] **Snel?** Voldoet aan CWV-doelen; brein lazy; `useFrame` zonder setState/allocaties (zie `performance.md`).
- [ ] **Herbruikbaar?** Geen duplicatie; gedeelde logica geëxtraheerd; tokens uit `theme.ts`.
- [ ] **Schaalbaar?** Feature-gerichte mappen, kleine bestanden (≤ ~250 regels component, ≤ 800 bestand), container/presentational gescheiden.
- [ ] **Schone code?** Goed benoemd, < 50 regels/functie, nesting ≤ 4, geen `any`, immutability, semantische HTML.

## Ervaring

- [ ] **Toegankelijk?** WCAG AA contrast (let op cyan/navy), toetsenbord + zichtbare focus, `prefers-reduced-motion`, brein heeft tekstueel alternatief (zie `accessibility.md`).
- [ ] **Responsive?** Werkt op 320 / 375 / 768 / 1024 / 1440 / 1920px. Brein schuift correct naast de info-kaart op desktop, stapelt netjes op mobiel.
- [ ] **Mooi?** Strikt navy + cyan (brein uitgezonderd), hiërarchie via schaal, ontworpen states, rustige animatie. Geen template-look.

## Merk & eerlijkheid

- [ ] **Eerlijk?** Geen verzonnen cijfers, geen nep-testimonials/logo's, geen valse beloftes (zie `branding.md`).
- [ ] **On-brand?** Woordmerk, kleuren, Space Grotesk, NL-toon kloppen.

## Eindvraag

- [ ] **Zou Apple / Stripe / Vercel dit shippen?** Zo niet: verbeteren.

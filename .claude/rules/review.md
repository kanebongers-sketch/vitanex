# Review-checklist — MentaForce

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

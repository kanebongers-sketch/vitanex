# Performance — MentaForce

Landing draagt een zwaar 3D-brein; performance is een feature, niet bijzaak.

## Core Web Vitals (doelen)

| Metric | Doel |
|---|---|
| LCP | < 2.5s |
| INP | < 200ms |
| CLS | < 0.1 |
| FCP | < 1.5s |

## 3D / brein

- Lazy-load met `dynamic(() => import('./BrainCanvas'), { ssr: false })`. Render hem niet boven de fold als LCP-element; toon eerst tekst/poster.
- `useFrame` goedkoop houden: refs lezen/muteren, geen `setState`, geen allocaties per frame (zie `threejs.md`).
- `preserveDrawingBuffer: true` kost extra geheugen — alleen aan als screenshots/export echt nodig zijn.
- Beperk vertex-count, draw-calls en lights. Geen overbodige postprocessing.

## Laadstrategie

- Zwaar dynamisch importeren: `await import('gsap')`, brein-canvas via `dynamic`. Geen render-blocking resources.
- Max 2 font-families (in de praktijk 1: Space Grotesk), `font-display: swap`, subset.
- Splitst per route-group; houd de marketing-bundle licht (richtlijn landing: JS < 150KB, CSS < 30KB gzip).
- Third-party scripts async/defer.

## Afbeeldingen

- Altijd expliciete `width`/`height` (voorkomt CLS). AVIF/WebP met fallback. Nooit groter serveren dan gerenderd.

## Animatie

- Alleen `transform`/`opacity`/`clip-path` (zie `animation.md`). `will-change` spaarzaam en opruimen.

## Checklist

- [ ] Brein lazy + niet als LCP-element
- [ ] `useFrame` zonder setState/allocaties
- [ ] Afbeeldingen met expliciete dimensies
- [ ] Geen layout shift door dynamische content
- [ ] Fonts: swap + subset

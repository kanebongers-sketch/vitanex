# Animatie — MentaForce

Animatie verduidelijkt flow, ze leidt niet af. Rustig en premium, nooit speels of
schreeuwerig. Libraries: framer-motion, gsap, lenis (smooth scroll), R3F `useFrame`.

## Karakter

- **Geen** bounce, shake, spring-overshoot, flash, confetti of "flashy" transitions.
- Bewegingen zijn klein en doelgericht: fade-in + lichte translate (8–16px), of een zachte scale (0.98 → 1).

## Timing

- Duur **150–400ms** voor UI-transities (micro-interactie ~150–200ms, sectie-overgang ~300–400ms).
- Easing: `easeOutCubic` of `cubic-bezier(0.16, 1, 0.3, 1)` — deze laatste staat als `EASE` in `theme.ts`, hergebruik die.

## Wat je animeert

- **Alleen `opacity` en `transform`** (translate/scale/rotate). Nooit `width`/`height`/`margin`/`top`/`left` animeren — die triggeren layout en veroorzaken jank.
- `clip-path` mag voor reveals. `will-change` spaarzaam en weer verwijderen na de animatie.

## Scroll

- lenis voor smooth scroll; scrollytelling (het brein dat per stap inzoomt) drijft op een scroll-progress ref, niet op per-frame React-state.
- Three-camera volgt met frame-rate-onafhankelijke lerp (`1 - exp(-delta*k)`), zie `threejs.md`.

## Reduced motion

- Respecteer **`prefers-reduced-motion: reduce`** overal: zet niet-essentiële animatie en auto-rotatie uit, toon eindstaten / een statisch brein-frame. Inhoud moet zonder beweging volledig bruikbaar zijn.

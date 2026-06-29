# React 19 + TypeScript — MentaForce

React 19, TypeScript strict. Next.js App Router (zie `nextjs.md`).

## Componenten

- Max ~250 regels per component. Groter? Splits in subcomponenten of extraheer logica naar hooks/helpers.
- Eén verantwoordelijkheid per component. Container (data/effects) vs presentational (puur, props in → UI uit) gescheiden.
- Compositie boven prop-drilling: geef children/slots door, gebruik context alleen bij echt gedeelde state (bv. scroll-progress van de 6-vlakken sectie).
- Herbruikbaar en leesbaar: extraheer herhaalde markup (pijler-kaart, sectie-wrapper) één keer.

## Server vs Client components

- **Default = Server Component.** Geen `'use client'` tenzij nodig.
- `'use client'` alleen voor: hooks (`useState`/`useEffect`/`useRef`), event-handlers, browser-API's, framer-motion, lenis, R3F-canvas.
- 3D/canvas nooit op de server: lazy-load met `dynamic(() => import('./BrainCanvas'), { ssr: false })`. `BrainCanvas` zelf staat al op `'use client'`.
- Houd de `'use client'`-grens zo laag mogelijk in de boom: maak een klein client-eiland in plaats van een hele pagina client te maken.

## Typering

- Props altijd met een `interface` (zie `BrainCanvasProps`, `BrainModelProps` in `BrainCanvas.tsx`). Callback-props expliciet typen.
- **Geen `any`.** Gebruik `unknown` + narrowing voor externe input; generics waar het type van de caller afhangt.
- Geen `React.FC`. Schrijf `function Component({ ... }: Props)`.
- Refs typen: `useRef<THREE.Points>(null)`, `MutableRefObject<number>` voor gedeelde scroll-progress.

## Hooks

- Eigen logica → custom hook met `use`-prefix (bv. `useScrollProgress`). Geen duplicatie tussen componenten.
- Volledige dependency-arrays; geen eslint-disable om waarschuwingen te onderdrukken.
- **Geen per-frame `setState`.** In `useFrame` lees en muteer je refs (zoals `camPos.current.lerp(...)`), nooit React-state — dat triggert een re-render per frame en sloopt de FPS.

## Immutability

- Nieuwe objecten/arrays bij updates (spread), nooit in-place mutatie van state of props.
- Uitzondering: three.js-objecten in refs muteer je bewust in `useFrame` (dat is geen React-state).

## Foutafhandeling

- `<Suspense fallback>` rond async/lazy children (GLTF-load, dynamic import).
- Render-fouten in client-eilanden afvangen met een error boundary; toon een rustige NL-fallback, slik niets stil in.

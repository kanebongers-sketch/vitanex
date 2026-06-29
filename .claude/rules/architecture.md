# Architectuur — MentaForce

## Mapindeling

- Feature-/domeingericht, niet per bestandstype. `src/components/[feature]/` met tsx + bijhorende css/helpers bij elkaar (bv. `src/components/marketing/` met `BrainCanvas.tsx`, `theme.ts`).
- App Router structuur via route-groups: `(marketing)`, `(app)`, `(auth)` — zie `nextjs.md`.
- Kleine bestanden: 200–400 regels typisch, 800 max, componenten ~250 max. Splits eerder dan later.

## Tokens & gedeelde stijl

- Design-tokens centraal in `theme.ts` (`COLORS`, `BRAIN_COLORS`, `FONT`, `EASE`, `glassPanel`, `MAXW`, `STEP_REGION`). Eén bron van waarheid; nooit waarden dupliceren of hardcoden.

## Component-split

- Container (data-loading, effects, Supabase-calls) vs presentational (puur, props in → UI uit). Presentational componenten blijven puur en testbaar.
- Compositie boven prop-drilling; context alleen bij echt gedeelde state (scroll-progress, thema).

## State

- Scheid de soorten:
  - **Server-state** (Supabase data): TanStack Query/SWR-stijl, niet dupliceren naar client-state.
  - **Client-state**: lokale `useState`/refs of een lichte store; afgeleide waarden berekenen, niet opslaan.
  - **URL-state**: filters, sortering, actieve tab, paginatie horen in de URL (search params) waar dat deelbaar/zinvol is.
- Geen redundante computed state — leid af uit de bron.

## Grenzen

- Server- vs client-code helder gescheiden (`'use client'` zo laag mogelijk). Secrets alleen server-side; alleen `NEXT_PUBLIC_*` naar de browser.
- Valideer op systeemgrenzen (user input, externe API's, Supabase-responses) en faal snel met duidelijke meldingen.

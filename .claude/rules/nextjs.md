# Next.js App Router — MentaForce (Next 16.2.4)

## LET OP: dit is NIET de Next.js die je kent

Deze versie heeft breaking changes t.o.v. je trainingsdata — API's, conventies en
bestandsstructuur kunnen afwijken. **Lees de relevante guide in
`node_modules/next/dist/docs/` vóór je Next-code schrijft of wijzigt.** Volg
deprecation-notices op. Gok niet op basis van geheugen.

## Routing

- App Router met route-groups: `(marketing)` (landing), `(app)` (ingelogd platform),
  `(auth)` (login/registratie). Groepen bepalen layout, niet de URL.
- `layout.tsx` per groep voor gedeelde shell; `page.tsx` voor de route zelf.
- `loading.tsx` = de Suspense-fallback van die route-segment (rustige skeleton in navy, geen spinner-spektakel).
- `error.tsx` voor route-fouten; vriendelijke NL-melding, geen interne details lekken.
- Metadata per route via de `metadata`-export (of `generateMetadata`). Titel/omschrijving eerlijk en specifiek per pagina.

## Bekende valkuil: scroll-container

- De `<body>` is de scroll-container (`<html>` heeft `overflow: hidden`), o.a. voor lenis-smooth-scroll en de scrollytelling-sectie.
- Gebruik op de scroll-container **`overflow-x: clip`, NIET `overflow-x: hidden`.** `hidden` maakt een nieuwe scroll-context en breekt `position: sticky` (de 6-vlakken sectie blijft dan niet plakken).

## Fonts

- Space Grotesk via `next/font` (var `--font-grotesk`, zie `theme.ts` → `FONT.grotesk`). Niet zelf `<link>`-en. `display: 'swap'`, subset waar mogelijk.

## Afbeeldingen & SVG

- `next/image` voor raster (AVIF/WebP, expliciete `width`/`height`).
- Inline/illustratieve SVG: gebruik een gewoon `<img>` of inline `<svg>`, **niet** `next/image` — tenzij `images.dangerouslyAllowSVG` bewust aanstaat (let dan op de XSS-risico's).
- Het 3D-brein is geen `<img>`: het is een R3F-canvas, lazy via `dynamic(..., { ssr: false })`.

## Client/server

- Server Components zijn default. Markeer alleen interactieve eilanden met `'use client'` (zie `react.md`).
- Geen secrets in client-code; alleen `NEXT_PUBLIC_*` is browser-zichtbaar. Supabase service-keys blijven server-side.

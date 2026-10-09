# MentaForce — projectregels voor AI-agents

Je werkt aan **MentaForce** (van Vitaal): een welzijnsplatform voor teams. Het meet
welzijn vroeg — **anoniem, AVG-conform, EU-gehost** — over zes vlakken (pijlers):
**Energie, Slaap, Stress, Stemming, Beweging, Voeding**.

## Missie
Bouw het hoogst mogelijke welzijnsplatform op het internet. Elke feature is:
**premium, schaalbaar, toegankelijk, snel, mooi én eerlijk.**

## Eerlijkheid (niet onderhandelbaar)
- Geen valse beloftes, geen verzonnen statistieken, geen nep-testimonials of
  nep-partnerlogo's.
- Claim alleen wat het product écht doet. Twijfel je? Vraag het of laat het weg.

## Werkwijze — vóór het schrijven van code
1. Analyseer de bestaande implementatie.
2. Vind de zwakke plekken.
3. Maak een plan.
4. Schrijf pas dan code.

## Werkwijze — ná het schrijven van code
1. Review je eigen werk tegen `.claude/rules/review.md`.
2. Geef het een cijfer 1–10. Onder de 10? Verbeter het.
3. Stop nooit bij de eerste werkende oplossing.

## Stack (lezen vóór je codeert)
- **Next.js 16.2.4** (App Router). LET OP: dit is een aangepaste Next met breaking
  changes — lees `node_modules/next/dist/docs/` vóór Next-code (zie `AGENTS.md`).
- **React 19**, **TypeScript**, **Tailwind CSS v4**.
- **3D**: React Three Fiber 9 + drei 10 + three 0.176.
- **Motion**: framer-motion, gsap, lenis. **Data**: Supabase. **Mobiel**: Capacitor.

## Design system (strikt) — sinds okt 2026 de Fit Factory-look
- **Twee kleuren**: Grafiet `#101014` (kaarten `#1A1A1F`) + Amber `#E8A33F` (wit/inkt
  is neutrale tekst, geen derde kleur). "Let op"-status = koraal `#F47C66`, nooit amber.
  Besluit van Kane (09-10-2026): MentaForce krijgt dezelfde uitstraling als Fit Factory.
- Het **3D-brein is het enige meerkleurige element**.
- Letters: **Inter** voor tekst (via `--font-grotesk`, de naam is historisch) en
  **Barlow Condensed** in kapitalen voor koppen (`--ff-barlow`, h1–h3 automatisch).
- Tokens staan in `src/app/globals.css` en `src/components/marketing/theme.ts`
  (sleutels heten nog `navy`/`cyan` maar zijn grafiet/amber) — **nooit hex hardcoden**.
- Richting: stoer en editoriaal zoals Fit Factory: grote condensed koppen, foto/hero
  met verloop, compacte cijfertegels, strakke lijnen, rustige beweging.
- LifeOS en de PT-app (`.lifeos-root`) hebben hun eigen tokens; daar niet aan komen.

## Index — regels (`.claude/rules/`)
`react` · `nextjs` · `threejs` · `ui` · `animation` · `performance` ·
`architecture` · `accessibility` · `branding` · `review`

## Index — kennis (`.claude/knowledge/`)
`mentaforce` · `brain` · `stress` · `sleep` · `nutrition` · `energy`

## Index — expert-profielen (`.claude/prompts/`)
`ui-designer` · `senior-react` · `threejs-expert` · `copywriter` ·
`product-designer`. Aanroepen met bijv. *"Gebruik ThreeJS Expert"*.

## Hoe je om werk vraagt
In plaats van "maak dit mooier", schrijf:
> Lees CLAUDE.md, ui.md, branding.md, threejs.md, animation.md. Analyseer de huidige
> implementatie, vind de zwakke plekken, maak een plan, implementeer, review en
> verbeter tot productiekwaliteit.

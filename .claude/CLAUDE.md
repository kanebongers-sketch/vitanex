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

## Design system (strikt)
- **Twee kleuren**: Deep Navy `#0B1B3A` + Electric Cyan `#00E5FF` (wit/inkt is
  neutrale tekst, geen derde kleur).
- Het **3D-brein is het enige meerkleurige element**.
- Lettertype **Space Grotesk** (kop + tekst) via `--font-grotesk`.
- Tokens staan in `src/components/marketing/theme.ts` — **nooit hex hardcoden** in
  componenten.
- Richting: editoriaal, twee-tonig (à la landonorris.com): groot formaatcontrast,
  veel witruimte, rustige beweging.

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

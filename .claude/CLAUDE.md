# MentaForce — projectregels voor AI-agents

Je werkt aan **MentaForce** (van Vitaal): een welzijnsplatform voor teams. Het meet
welzijn vroeg — **anoniem, AVG-conform, EU-gehost** — over zes vlakken (pijlers):
**Energie, Slaap, Stress, Stemming, Beweging, Voeding**.

## Status (11-10-2026, besluit Kane)
- MentaForce staat **offline** op alle andere domeinen (`MENTAFORCE_OFFLINE` in `src/lib/site-modus.ts`).
- **Sinds 12-10-2026 (besluit Kane): MentaForce is online onder releasev.nl/mentaforce.** `src/proxy.ts` herschrijft `/mentaforce/…` naar de gewone routes (logica en tests: `src/lib/mentaforce/basis.ts`). De webshop en fitfactorypt.nl mogen hier niet onder lijden of veranderen.
  - Links: `useMfHref()` (`src/lib/mentaforce/useMfBasis.ts`) voor `/`, `/#…`, `/contact`, `/bedankt` en `/api/contact|stripe|checkout|newsletter` (die namen zijn op releasev.nl van de webshop). Andere MentaForce-links zonder basis werken via een 308 naar `/mentaforce/…`.
  - Menu's vergelijken met `useMfPathname()`, niet met `usePathname()` (dat geeft daar `/mentaforce/…`).
  - Links buiten de browser (mails, Stripe, OAuth) via `mentaforceAppUrl()` (`MENTAFORCE_APP_URL`), nooit `NEXT_PUBLIC_APP_URL` aanpassen: LifeOS gebruikt die.
- Live is alleen **Fit Factory PT** op fitfactorypt.nl, plus **LifeOS** op het verborgen adres fitfactorypt.nl/lifeoskane.
- De LifeOS-link/knop is alleen voor Kane (rol beheerder). **Ruben (eigenaar) mag de link nooit te zien krijgen.**
- LifeOS heeft **geen Gmail/mail-functie meer** (geen inbox, mail naar taken, triage of conceptmails). Niet terugbouwen zonder Kane. De mails die LifeOS naar Kane stuurt (dagplanning, weekmail) en de PT-verslagmails blijven.
- LifeOS heeft de Fit Factory PT-stijl (grafiet + amber, Barlow-koppen), net als de PT-app.
- De PT-app gebruikt op de pc de hele schermbreedte (rand `--ff-rand`); alleen formulieren en inloggen blijven smal. De LifeOS-agenda staat over de volle breedte.

## Fit Factory Club (clubsoftware, besluit Kane 14-10-2026)
- All-in clubsoftware die **Virtuagym vervangt** (intakes, schema's, lesroosters, reserveren) plus leden (niet financieel), check-in, CRM/leads, dashboard, cijfers en ledenapp. Zelfde functies als Virtuagym, **andere opbouw en uitstraling**, nooit hun code, teksten of ontwerp overnemen.
- **Sportivity blijft** voor ledenadministratie, incasso en abonnementen; check-in gaat nu met QR en bandje via Sportivity. Kane wil een **koppeling met Sportivity**, maar voorlopig **geen contact met Sportivity of andere bedrijven**.
- **Geheim tot de presentatie:** alleen Kane (beheerder-sessie) op `fitfactorypt.nl/clubkane`; eigenaren, clubmanagers en PT'ers krijgen een 404 en zien nergens een link. Knop "Club" alleen in de PT-balk voor de beheerder.
- Naam: **Fit Factory** (balk: Fit Factory-logo + CLUB). Pilot: **Budel**, later met een echt ledenbestand. Functies per vestiging: **trainer** (doet ook de balie), **groepslesinstructeur** en **clubmanager**; geen aparte baliefunctie. Daarnaast centraal de administratie voor de uren.
- Demodata blijft actueel via `club_demo_verversen()` (pg_cron, elke nacht); raakt alleen rijen met demo = true.
- Club heeft naast het groepslesrooster een **personeelsrooster** (diensten fitnesspersoneel) en **taken en poetslijsten** (dagelijkse taken, afsluitronde, poetsrooster met minimum per week), gebaseerd op de Excel-lijsten van Budel. Het fitnessrooster staat nu in Google Agenda (kleur per medewerker); de administratie controleert daar de uren, daarom krijgt het personeelsrooster een urenadministratie (gepland, gewerkt, goedgekeurd, verwerkt, export).
- Menu van Club: ingedeeld in vijf groepen (Werkvloer, Leden, Planning, Coaching, Beheer) zoals Virtuagym, maar op onze manier: groepen bovenin, onderdelen van de groep eronder, op de telefoon een menupaneel. Geen zijbalk.
- Taken simpel houden: tabbladen **Dag** (standaard) en **Week**, plus Overzicht en Beheer. Beide in de **Excel-weergave** (tabel taken tegen dagen), Dag is dezelfde tabel met een dag.
- Cijfers altijd **per kalendermaand** (van de 1e tot en met de 30e of 31e), niet per week.
- Oefeningbeelden: hoofdbron **RepDB gratis** (vlakke illustraties, bronvermelding "Exercise data by RepDB (repdb.co)"), Everkinetic alleen als reserve. Betaalde ExerciseDB niet (besluit Kane).
- Oefeningbeelden: **geen eigen video's** (kan niet) en **nooit Virtuagym-beeld**. Bron is de open database Everkinetic (CC BY-SA 4.0, begin- en eindhouding als SVG, in onze kleuren als kleine loop), altijd met bronvermelding.
- Trainingsschema's zijn het belangrijkste onderdeel van Club (besluit Kane 17-10-2026). Elke oefening heeft coaching zoals een trainer die geeft: 3 tot 5 genummerde kernpunten ("1. Rug recht", "2. Knieen niet op slot"), opstelling, stappen, veelgemaakte fouten met correctie, ademhaling, tempo. Bron: `src/lib/club/training/coaching/` (op exacte oefeningnaam, getest); nieuwe oefeningen krijgen ook coaching. Beeld: bewegende illustratie met speler (afspelen, begin, eind).
- Het fitness-leadsysteem in Club staat **los van het PT-systeem** (geen koppeling met pt_leads of de PT-app).
- Code: `src/lib/club/**`, `src/app/clubkane/**`, `src/app/api/club/**`, `src/components/club/**`; tabellen `club_*` in de LifeOS-database (migraties 380 en hoger). Bouwbrief: `docs/club/BRIEF.md`. Demodata heeft `demo = true`.

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

## Huisstijl volgens fitfactory.nl (besluit Kane 14-10-2026)
- De hele app (Fit Factory PT, Club, LifeOS) volgt de website fitfactory.nl: bijna zwart `#0A0B09`, kaarten `#141513`, accent **brons `#B58E5C`**, koppen **Oswald** (kapitalen), tekst **Roboto**, pilvormige knoppen, slogan "Meet. Train. Repeat.". Zelf gehost in `src/app/fonts/` (namen `barlow`/`inter` en `--ff-barlow`/`--ff-inter` zijn historisch). Hieronder waar amber, grafiet, Barlow of Inter staat: lees brons, zwart, Oswald en Roboto.
- Feiten van de website staan in Club: adressen, telefoon en e-mail per vestiging, open 06:00 tot 23:00 (Eersel eigen tijden), bemande uren apart, leden van Eersel sporten overal, anderen overal behalve Eersel.

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

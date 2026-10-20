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
- Menu van Club: ingedeeld in vijf groepen (Werkvloer, Leden, Planning, Coaching, Beheer) zoals Virtuagym, maar op onze manier: groepen bovenin, onderdelen van de groep eronder, op de telefoon een menupaneel. Geen zijbalk. In Beheer alleen Cijfers, Rapporten, Instellingen en Hulp. Instel-pagina's staan in `src/lib/club/kern/instel-paginas.ts` (instellingencentrum, kruimelpad `InstelKruimel`, zoekveld Ctrl K); een nieuwe instel-pagina daar toevoegen, niet in het menu (`inMenu: false` in `onderdelen.ts` als hij een eigen rechtensleutel heeft). Structuur: `docs/club/STRUCTUUR.md`.
- Taken simpel houden: tabbladen **Dag** (standaard) en **Week**, plus Overzicht en Beheer. Beide in de **Excel-weergave** (tabel taken tegen dagen), Dag is dezelfde tabel met een dag.
- Cijfers altijd **per kalendermaand** (van de 1e tot en met de 30e of 31e), niet per week.
- Oefeningbeelden: hoofdbron **RepDB gratis** (vlakke illustraties, bronvermelding "Exercise data by RepDB (repdb.co)"), Everkinetic alleen als reserve. Betaalde ExerciseDB niet (besluit Kane).
- Oefeningbeelden: **geen eigen video's** (kan niet) en **nooit Virtuagym-beeld**. Bron is de open database Everkinetic (CC BY-SA 4.0, begin- en eindhouding als SVG, in onze kleuren als kleine loop), altijd met bronvermelding.
- Trainingsschema's zijn het belangrijkste onderdeel van Club (besluit Kane 17-10-2026). Elke oefening heeft coaching zoals een trainer die geeft: 3 tot 5 genummerde kernpunten ("1. Rug recht", "2. Knieen niet op slot"), opstelling, stappen, veelgemaakte fouten met correctie, ademhaling, tempo. Bron: `src/lib/club/training/coaching/` (op exacte oefeningnaam, getest); nieuwe oefeningen krijgen ook coaching. Beeld: bewegende illustratie met speler (afspelen, begin, eind).
- Oefenbibliotheek (18-10-2026, migratie 444): 166 actieve oefeningen, elk met RepDB-beeld en coaching. Een nieuwe standaardoefening komt in `REPDB_ALLE_KOPPELINGEN` (`beelden-repdb.ts`), een migratie en de coaching; de test faalt anders. Kenmerken voor vervangen (bewegingspatroon, spiergroep, primaire spieren, materiaal) leest de code alleen via `kenmerkenVan()` in `src/lib/club/training/oefening-kenmerken.ts`.
- Schema's als coachsysteem (gebouwd 18-10-2026, migratie 443): supersets en circuits via `groep` (blokken.ts), per oefening sets, herhalingen of tijd, kg, RPE of RIR, rust, tempo, notitie; editor met slepen, Alt + pijltjes, ongedaan maken (Ctrl Z), kopie naar ander lid. Basisset startschema's in `src/lib/club/training/sjablonen/basis.ts` (alleen bibliotheekoefeningen met coaching, getest). Leden loggen per set in `club_set_logs`; progressie per oefening is een vaste vakregel (dubbele progressie, `progressie.ts`), nooit "AI" noemen.
- Eigen oefenbeelden (besluit Kane 18-10-2026): de beelden moeten beter, eigen beelden maken mag. Er komt een eigen illustratiesysteem in code (SVG-figuur met skelet, houdingen per oefening, materiaal, animatie tussen begin en eind, accentkleur van de sportschool), eerst als prototype op /clubkane/training/beelden naast RepDB; Kane kiest voordat de bibliotheek wordt omgezet. Geen AI-beelden, geen foto`s. 3D-prototype (20-10-2026) voor zes oefeningen op dezelfde pagina: eigen figuur uit three.js-vormen (mannequin.js niet gebruikt: GPL-3.0), houdingen als data met inverse kinematica in `src/lib/club/training/3d/` (getest), tekenen in `src/components/club/training/drie/`. Besluit Kane (20-10-2026): we gaan voor het eigen 3D-figuur (geen bibliotheek kopen); verbeteren tot Virtuagym-niveau en daarna de hele bibliotheek omzetten. Doel: 200 oefeningen in 3D, elk beeld een 10 (Kane gaf het prototype een 6); per oefening een eigen agent en een eigen bestand. De pagina /clubkane/training/beelden toont alleen nog de 3D-beelden (geen RepDB of SVG-tekeningen meer, besluit Kane 20-10-2026). Nieuwe 3D-oefening: een bestand in `src/lib/club/training/3d/bibliotheek/` op een bouwsteen per bewegingspatroon (`3d/bouw/`: squat, hinge, lunge, heupstrek, machines, armOefening, core), naam exact uit de oefenbibliotheek, opnemen in `bibliotheek/index.ts`; de test controleert naam, coaching, grenzen en lus. Materiaal in `drie/materiaal-vrij|banken|machines.ts`.
- Beelden bij oefeningen: overal dezelfde stijl en topkwaliteit (besluit Kane 17-10-2026). Alleen RepDB-illustraties; oefeningen zonder passend RepDB-beeld gaan op inactief en worden vervangen door de dichtstbijzijnde oefening met RepDB-beeld.
- Multi-club (besluit Kane 17-10-2026): Club wordt software voor meerdere sportscholen, elk met een eigen omgeving en strikt gescheiden data; Fit Factory is de eerste klant. Elke sportschool past in een eigen portaal aan: logo en naam, kleuren, onderdelen aan/uit, eigen oefeningen en coachteksten (zoals Virtuagym, maar onze opbouw). Beheer door eigenaar en clubmanager, niet door trainers. De eigenaar (wie het abonnement afsluit) moet ALLES zelf kunnen instellen, heel uitgebreid (besluit Kane 17-10-2026): een centraal instellingencentrum met huisstijl, domein, vestigingen, medewerkers en rechten per rol, regels en openingstijden, lessen en zalen, oefeningen en coaching, ledenapp en meldingen. Productnaam (besluit Kane 17-10-2026): **AI Your Gym**, domein aiyourgym.com, elke sportschool op een eigen subdomein `naam.aiyourgym.com` (zoals naam.virtuagym.com). Tot dat domein er is heet het in de app neutraal "Club" plus het logo van de sportschool. Domein nog niet gekocht (kosten: eerst overleggen). Er is een demo-sportschool (duidelijk als demo gemarkeerd). Alles blijft tot de presentatie alleen zichtbaar voor Kane.
- Multi-club techniek (gebouwd 17-10-2026): het id van een sportschool (`club_organisaties.id`) IS de `user_id` waarop alle `club_*`-tabellen filteren; Fit Factory heeft het bestaande id (LIFEOS_USER_ID). `ClubToegang` (`src/lib/club/toegang.ts`) kiest de actieve sportschool uit cookie `club-org` (alleen als die bij de beheerder hoort) en geeft `userId`, `organisatie` en `vestigingen`. Elke nieuwe query MOET op `t.userId` filteren. Vestigingen staan per sportschool in `club_vestigingen` (slug, uniek over alle sportscholen), nooit meer een vaste lijst. Huisstijl: `src/lib/club/kern/huisstijl.ts` (CSS-variabelen met automatische contrastcorrectie), portaal `/clubkane/huisstijl`. Onderdelen uit = `eisModule()` geeft 404. Demo-sportschool "Voorbeeld Gym" (id de000000-0000-4000-8000-0000000000c1, migratie 403).
- Eigen login sportscholen (gebouwd 17-10-2026, keuze Kane: link plus pincode zoals de PT-app): tabel `club_beheerders` (rol eigenaar of clubmanager, per `organisatie_id`) en `club_beheerder_sessies` (migratie 410). Link `/clubinloggen/<code>`, pincode van 6 cijfers die Kane goedkeurt in het huisstijl-portaal door de controlecode in te vullen die de beheerder noemt. Zo iemand ziet alleen de eigen sportschool (`t.isKane` false, `t.rol`); wisselen, sportschool aanmaken, subdomein en beheerders beheren zijn alleen voor Kane (`eisKane()`/`vereisKane()`, anders 404). Rollen (besluit Kane): de eigenaar mag alles binnen de eigen sportschool, ook beheerders en het adres (`magBeheerdersBeheren`); de clubmanager ziet alleen de onderdelen die de eigenaar bij de rol Clubmanager aanvinkt (`t.onderdelen`, afgedwongen in het menu, per onderdeel-layout met `eisOnderdeel()` en in `vereisClubToegang` via `magApi`), nooit beheerders, adres of rechten. Een nieuw onderdeel of nieuwe API-map: ook toevoegen aan `src/lib/club/beheerders/rechten.ts`, anders is hij dicht voor een clubmanager. Met subdomeinen aan werkt een inloglink en sessie alleen op het subdomein van de eigen sportschool (cookie host-only, `__Host-`). Fit Factory zelf krijgt nog geen beheerders. Schakelaar `CLUB_EIGEN_LOGIN` in `src/lib/club/beheerders/schakelaar.ts` staat UIT tot de presentatie; uit = inlogpagina en API geven 404 en bestaande sessies tellen niet. Code: `src/lib/club/beheerders/`.
- Verkoopwebsite AI Your Gym (besluit Kane 17-10-2026): high-end site die sportscholen overhaalt (Virtuagym alleen als referentie voor onderwerpen, nooit hun tekst of ontwerp). Na aanmelden en betalen via Stripe (abonnement, eigen Stripe-account voor AI Your Gym, Kane maakt dat zelf aan) komt de eigenaar in het eigen beheerdersportaal. Code: `src/app/aiyourgym/**`, `src/lib/aiyourgym/**`, `src/app/api/aiyourgym/**`; pakketten en prijzen alleen in `src/lib/aiyourgym/pakketten.ts`. Schakelaar `AIYOURGYM_SITE_ACTIEF` staat uit: dan alleen Kane op fitfactorypt.nl/aiyourgym. Er is een testaccount "Test Gym" (slug testgym). Contract (besluit Kane 18-10-2026): jaarcontract met maandelijkse betaling per vestiging, en als actie geen opstartkosten. De website gebruikt de volle breedte. Accentkleur van de website: smaragdgroen #1FA77A (besluit Kane 20-10-2026, vervangt volt/geel), met inkt (#0f1412) als tekst op smaragd; tokens in `src/app/aiyourgym/aiyourgym.css` (licht en donker), bijkleuren salie, groenblauw, zand en mist; contrast bewaakt door `src/components/aiyourgym/contrast.test.ts`. Nog niet vindbaar in zoekmachines (besluit Kane 18-10-2026): noindex tot schakelaar AIYOURGYM_INDEXEREN aan staat, los van AIYOURGYM_SITE_ACTIEF. Kane zijn naam mag op de website (praktijkverhaal), Fit Factory niet noemen. De website is volledig gericht op conversie (besluit Kane 18-10-2026): sterk overtuigend, maar binnen de wet en eerlijk (geen nep-schaarste, nep-aftelklokken, verzonnen reviews of aantallen). Geen prijzen op de website (besluit Kane 17-10-2026); de prijs staat alleen in Stripe. Geen claims als "goedkoopste" of "geavanceerde AI" (niet te onderbouwen), wel eerlijk: scherp geprijsd, elke maand nieuwe functies, gebouwd met AI. Aanmelden (`/aiyourgym/aanmelden`): een pakket is online af te sluiten zodra `AIYOURGYM_STRIPE_PRIJS_<SLEUTEL>` en `AIYOURGYM_STRIPE_SECRET_KEY` gezet zijn, anders wordt het een 'aanvraag' in `ayg_aanmeldingen` (geen mail naar buiten). De webhook richt de sportschool precies een keer in onder Kane; zie `docs/aiyourgym/STRIPE.md` en `TESTACCOUNT.md`.
- Ledenapp voor leden (besluit Kane 17-10-2026): eerst een web-app (PWA) op `/mijn` die leden op hun beginscherm zetten, met eigen inlog per lid (link plus pincode, schakelaar `CLUB_LEDEN_LOGIN` uit tot de presentatie). Later een AI Your Gym-app in de stores (Capacitor), een eigen app per sportschool alleen als betaalde extra.
- Ledenlogin techniek (gebouwd 18-10-2026): tabellen `club_lid_toegang` en `club_lid_sessies` (migratie 424). De sportschool maakt op de ledenkaart een link `/mijn/start/<code>` met QR (7 dagen geldig om de pincode te kiezen; opnieuw maken maakt de oude ongeldig en logt alles uit). Het lid kiest zelf de pincode (zwakke pincodes geweigerd), sessie 90 dagen, na 5 fouten 15 minuten wachten (verdubbelt, na 6 blokkades dicht). `lidToegang()`/`vereisLidToegang()` in `src/lib/club/ledenlogin/toegang.ts`: het lid komt ALTIJD uit de sessie; alleen Kane kijkt mee met `/mijn?lid=<id>` (API: `?voor=`). Leden-API onder `/api/club/lid/**` (niet in `rechten.ts`); de regels van de ledenapp staan op een plek in `src/lib/club/app/acties-*.ts`. Componenten kiezen de API via `LedenApiProvider` (`src/components/club/app/LedenappApi.tsx`).
- Koers (besluit Kane 18-10-2026): het platform AI Your Gym is de kern, Budel is bijzaak en richt zichzelf later in als gewone klant. Het platform moet geschikt zijn voor elk soort sportschool (zelfstandig, boutique, keten). Alles is volledig zelf aan te passen (oefeningen, lessen, teksten), met onze basis als start. Na betalen doorloopt een sportschool een startwizard; persoonlijke hulp bij inrichten zit gratis in de duurdere pakketten. Prijsrichting: service als high-end aanbieders voor ongeveer de helft van hun prijs. Check-in: per sportschool te kiezen, QR met de telefoon is de standaard. De website krijgt een live demo (eigen tijdelijke kopie van Voorbeeld Gym). Club blijft tot de presentatie alleen voor Kane.
- Eenvoud (besluit Kane 18-10-2026): Club is uitgebreid maar zo simpel mogelijk. Niets dubbel in menu, instellingen of ledenapp: elk ding heeft een naam en een plek. Het menu is voor dagelijks werk; alle instel-pagina`s zitten alleen in het instellingencentrum.
- Navigatie (besluit Kane 20-10-2026): Club moet vooral voor de trainer op de vloer heel makkelijk zijn, op telefoon, tablet en pc even goed. Het menu blijft zoals nu (vijf groepen bovenin, zoeken met Ctrl K), maar strakker. Een nieuwe sportschool moet zich heel makkelijk zelf kunnen instellen (startwizard). Website-navbar: licht met smaragd.
- Startwizard (gebouwd 20-10-2026, doel: zonder hulp binnen 15 minuten live): 8 stappen (soort, huisstijl, vestiging, onderdelen, lessen, team, leden, klaar). De soort sportschool (gym, boutique, PT-studio, keten, yoga/pilates, vechtsport, bootcamp) zet standaarden klaar uit `src/lib/club/start/soorten.ts` (onderdelen, lestypen, openingstijden, reserveerregels, rechten per rol); eigen werk wordt nooit overschreven (`toepasPlan`). Elke stap toont "We hebben dit alvast voor je klaargezet" met Klopt of Aanpassen. Kleur uit het logo via canvas (`logo-kleur.ts`), demo-ledenlijst slaat niets op (`demo-leden.ts`). Gekozen soort staat in `instellingen.start.soort`.
- Claude mag voor Club zelf aanvullende migraties (alleen toevoegen, nooit verwijderen) op de LifeOS-database uitvoeren en naar main pushen (besluit Kane 17-10-2026).
- AVG-rechten van een lid (gebouwd 18-10-2026): op de ledenkaart "Gegevens van dit lid downloaden" (JSON plus samenvatting, voor wie Leden mag, gelogd zonder inhoud) en "Lid verwijderen (AVG)": eerst 30 dagen "wordt verwijderd" (status gestopt, terug te draaien), daarna definitief via `club_lid_definitief_verwijderen` (migratie 429, pg_cron elke nacht). Alleen Kane en de eigenaar mogen verwijderen. Bezoeken en lesbezetting blijven anoniem (lid_id null). Een nieuwe tabel met `lid_id` MOET ook in die functie (laatste versie migratie 449), in de export en in `src/lib/club/leden/avg/tabellen.ts` (test `tabellen.test.ts` dwingt dit af).
- AVG (besluit Kane 20-10-2026: "Alles moet AVG en strak zijn"): register en werkafspraken in `docs/club/AVG.md`, verwerkersovereenkomst in `docs/aiyourgym/juridisch/`. Leads en medewerkers hebben ook inzage en wissen (`club_lead_anonimiseren`, `club_medewerker_anonimiseren`). Bewaartermijnen per sportschool in `club_privacy_instellingen` (pagina Privacy en bewaren), uitgevoerd door pg_cron `club_privacy_opruimen` (migratie 449); een nieuwe tabel met persoonsgegevens krijgt daar een termijn. Metingen in een intake alleen met toestemming. IP en e-mail voor remmen alleen via `remSleutel` (HMAC). Geen persoonsgegevens in logs; alleen functionele cookies.
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

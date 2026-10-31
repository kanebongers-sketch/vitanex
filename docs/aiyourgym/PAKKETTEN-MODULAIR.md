# AI Your Gym | basis met add-ons

Besluit Kane (31-10-2026): "Ledenadministratie is eigenlijk de basis. Er moet een basispakket zijn." Dit vervangt het idee dat elk pakket los afgenomen kan worden (besluit 29-10-2026). Het model heet **basis met add-ons**:

- **Basis | Ledenadministratie** (sleutel `administratie`, EN "Core | Membership administration"): altijd afgenomen, niet uit te vinken, niet op te zeggen zolang het abonnement loopt. De kleine kern hieronder hoort bij de basis.
- **Vijf add-ons** bovenop de basis, los te kiezen: `lessen`, `training`, `afspraken`, `team`, `groei`. In teksten heten ze "add-ons" (NL en EN), niet "uitbreidingen".
- Code: `BASIS_PAKKET`, `ADD_ONS`, `isBasis`, `heeftBasis`, `metBasis` in `src/lib/aiyourgym/pakketten.ts`; weergavenaam via `pakketWeergave()`.

## De kern (altijd in de basis)

- Account, inloggen, master account
- Vestigingen, openingstijden, regels en sluitingsdagen
- Team, medewerkers, beheerders en rechten per rol
- Huisstijl, eigen adres (aiyourgym.com/naam), bedrijfsgegevens
- Ledenlijst en ledenkaart met basisgegevens (naam, contact), notities, ledenbestand inlezen, AVG per lid
- De ledenapp (Home en Profiel, inloggen, meldingen), Vandaag, Agenda, Notities, Instellingen, Hulp, Wat is nieuw, Abonnement

## De basis en de vijf add-ons

| Sleutel | Naam | Wat erbij komt |
|---|---|---|
| `administratie` | Basis: Ledenadministratie | Lidmaatschapsvormen (tabblad Lidmaatschap op de ledenkaart, pauze, opzeggen), check-in (balie, kiosk, QR in de app), cijfers, rapporten |
| `lessen` | Groepslessen | Rooster, lestypen, weekrooster, zalen, reserveren en wachtlijst, boekingswidget, tabblad Lessen in de ledenapp |
| `training` | Training en coaching | Intakes en intakevragen, schema's, oefenbibliotheek met 3D, voeding, voortgang, metingen uit apps, tabbladen Schema, Voeding en Voortgang |
| `afspraken` | Afspraken | Afspraaktypen, PT, intakes en metingen boeken, tabblad Afspraken |
| `team` | Team en vloer | Personeelsrooster, uren, taken en poetslijsten |
| `groei` | Groei | Leads, opvolgen (en opvolgregels), challenges, community, berichten aan leden, proefles-aanvragen via de widget |

Welke schermen, API's, tabbladen en wizardstappen bij welk pakket horen staat op een plek: `src/lib/club/kern/pakketten.ts` (`MODULE_PAKKET`, `ONDERDEEL_PAKKET`, `API_PAKKET`, `API_DEEL_PAKKET`, `LID_API_PAKKET`, `LEDENAPP_TAB_PAKKET`, `WIZARD_STAP_PAKKET`).

### Ledenapp en betalen

- **De ledenapp is kern, geen eigen pakket.** Elk pakket heeft een kanaal naar leden nodig: Groepslessen om te boeken, Training voor het schema, Afspraken om een moment te kiezen. De ledenapp zit in de basis. De app toont alleen de tabbladen van wat is afgenomen.
- **Betalen (Financien) is nu geen pakket.** Het zit er nog niet in en staat achter schakelaars; verkopen wat er niet is mag niet. Zodra het af is wordt het een add-on "Betalen": het werkt voor elk pakket (lidgeld, strippenkaarten, PT) en heeft eigen Stripe-kosten en risico voor de sportschool. Tot dan blijft de tekst eerlijk "zit er nog niet in".

## Afgenomen en aan of uit

- **Afgenomen** = licentie via het abonnement: `club_organisaties.pakketten` (migratie 467).
- **Aan of uit** = eigen keuze van de sportschool binnen wat is afgenomen: `club_organisaties.modules` (zoals altijd).
- Zichtbaar = afgenomen EN aan. `organisatieUitRij()` rekent `organisatie.uit` uit als de eigen keuze (`eigenUit`) plus alles van de pakketten die niet zijn afgenomen, met een marker `pakket:<sleutel>` voor onderdelen zonder eigen schakelaar. Daardoor volgen menu, zoekveld, hulpbalk, Vandaag, instellingencentrum, hulpartikelen, ledenkaart, ledenapp en wizard het vanzelf.
- Pagina's: `eisModule()`, `eisOnderdeel()` en `eisPakket()` geven een 404. API: `vereisClubToegang()` en `vereisLidToegang()` controleren `apiAfgenomen()`. Widget: alleen met Groepslessen; proefles-aanvragen (leads) alleen met Groei, anders verwijst de widget naar de ledenapp.
- De schakelaars "Onderdelen aan of uit" tonen alleen afgenomen onderdelen (`ModulesBlok` met `afgenomen`). Opslaan bewaart altijd `eigenUit`, nooit de afgeleide `uit`.
- Fit Factory, de demo, het master account en alle bestaande sportscholen hebben alles (standaard van de kolom). Een lege lijst is alleen de basis: `leesAfgenomen` en `verborgenVoor` voegen `administratie` altijd toe; `leesAfgenomenInvoer` weigert een lijst zonder basis.
- Database: migratie 485 (`485_club_basispakket.sql`, nog door Kane uit te voeren) voegt `administratie` toe waar het ontbreekt (31-10-2026 alleen de testsportschool Stripetest) en zet de check `club_organisaties_basis_check`.

Functies voor andere onderdelen: `heeftPakket`, `onderdeelAfgenomen`, `moduleAfgenomen`, `zichtbaar(uit, { sleutel, module })`, `pakketZichtbaar(uit, pakket)`, labels via `pakketInTaal()` en `pakkettenTekst()` (`src/lib/aiyourgym/taal/woorden/algemeen/pakketten.ts`).

## Aanmelden, Stripe en abonnement

- Aanmelden: de basis staat vast aangevinkt (met slotje en korte uitleg), de add-ons zijn selectievakjes. `?pakketten=lessen,groei` vult de add-ons in; de basis komt er altijd bij. De server (`leesAanmelding`) weigert een keuze zonder basis. `VOORSTEL_PER_SOORT` bevat altijd de basis.
- Stripe Checkout: altijd de basisregel plus een regel per add-on (`stripeRegels` voegt de basis toe). Geen bundel meer (besluit Kane 31-10-2026). Prijs per pakket in `AIYOURGYM_STRIPE_PRIJS_<SLEUTEL>`, een getrapte prijs (volume) met staffels op actieve leden per vestiging. Alleen als elk gekozen pakket een prijs heeft; anders testbetaling, anders een aanvraag.
- Staffels (besluit Kane 31-10-2026): elke vestiging heeft een eigen Stripe-abonnement met dezelfde pakketten; de hoeveelheid van elke regel is het aantal actieve leden van die vestiging (minimaal 1). Grenzen tot 25, 50, 100, 200, 500, 1000, 5000, daarboven prijs op maat (`src/lib/aiyourgym/staffel.ts`). Wat telt als actief lid: `src/lib/club/leden/actief-tellen.ts`. Bij het aanmelden kiest de eigenaar de staffel van de eerste vestiging; daarna houdt de dagelijkse cron `/api/aiyourgym/cron/staffel` het bij (proration none, logboek `ayg_staffel_log`, mail bij een andere staffel). Een nieuwe vestiging in Club krijgt meteen een eigen abonnement. Details en de bedragen: `STRIPE.md`.
- Inrichten zet precies de gekozen pakketten, altijd met de basis. De webhook (`customer.subscription.updated`) en de testbetaling zetten daarna precies de pakketten van de regels van het abonnement, altijd met de basis (`pakkettenVanPrijzen` en `zetPakketten` gebruiken `metBasis`; idempotent; een onbekende prijs verandert niets).
- Club, Abonnement: de basis staat vast bovenaan zonder knop; per add-on erbij nemen of opzeggen. Met Stripe-abonnement en prijs: een regel erbij (Stripe rekent naar rato). Zonder Stripe: testbetaling, er wordt niets afgeschreven. Opzeggen bij een echt contract en alles zonder prijs: een aanvraag in `ayg_pakket_wijzigingen` die Kane verwerkt. Het master account zet add-ons direct. De basis opzeggen weigert de API altijd (`fout: 'basis'`), ook voor het master account; helemaal stoppen is het abonnement opzeggen.
- Website: het verhaal is "een basis met ledenadministratie en ledenapp, plus vijf add-ons". Prijzenpagina met de kern, de basis over de volle breedte en daaronder de vijf add-ons (knop "Basis plus deze add-on"), "Prijs op aanvraag", geen bedragen. Geen "losse pakketten" of "alleen Groepslessen" meer (bewaker `src/components/aiyourgym/pakket-aantal.test.ts`).

## Startwizard

Alleen de stappen van de kern en de afgenomen pakketten: de stap Lessen alleen met Groepslessen (`WIZARD_STAP_PAKKET`). De stap Onderdelen toont alleen afgenomen onderdelen; de basis is niet weg te halen, de schakelaars van onderdelen binnen de basis (check-in, cijfers) blijven zoals ze zijn.

## Bewaking

`src/lib/club/kern/pakketten-routes.test.ts`: elke pagina en API van een pakket geeft een 404 zonder dat pakket; elk pakket met de basis (basis plus een add-on) heeft geen dode links in menu, zoekveld, hulpbalk, Vandaag, instellingen, hulp, ledenkaart en ledenapp; de basis alleen werkt; de basis is altijd afgenomen; elke nieuwe API-map en elk nieuw onderdeel moet een plek krijgen.

## Wat Kane nog doet

1. Migraties 485 en 486 uitvoeren.
2. De prijzen staan vast (staffels, besluit Kane 31-10-2026, tabel in `STRIPE.md`). Zonder prijs voor de basis (`AIYOURGYM_STRIPE_PRIJS_ADMINISTRATIE`) gaat elke aanmelding via de testbetaling.
3. In Stripe per pakket een product met een getrapte prijs (volume) maken zoals in `STRIPE.md` en het prijs-id in Render zetten als `AIYOURGYM_STRIPE_PRIJS_ADMINISTRATIE`, `_LESSEN`, `_TRAINING`, `_AFSPRAKEN`, `_TEAM`, `_GROEI`. De oude `_START`, `_CLUB`, `_KETEN` en `_ALLES` mogen weg. Daarna de cron `/api/aiyourgym/cron/staffel` eens per dag laten draaien (kop `x-cron-secret`).
4. Kiezen of en in welke pakketten persoonlijke hulp bij het inrichten gratis is (de website noemt nu geen pakketten meer).
5. Open aanvragen (pakket erbij of opzeggen) staan in `ayg_pakket_wijzigingen` met status `aanvraag`.

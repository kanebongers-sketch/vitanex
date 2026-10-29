# AI Your Gym | losse pakketten

Besluit Kane (29-10-2026, "enorm belangrijk"): een sportschool kiest alleen wat ze nodig heeft. Elk pakket werkt los van de andere. Een kleine kern zit altijd bij elk pakket.

## De kern (altijd inbegrepen)

- Account, inloggen, master account
- Vestigingen, openingstijden, regels en sluitingsdagen
- Team, medewerkers, beheerders en rechten per rol
- Huisstijl, eigen adres (aiyourgym.com/naam), bedrijfsgegevens
- Ledenlijst en ledenkaart met basisgegevens (naam, contact), notities, ledenbestand inlezen, AVG per lid
- De ledenapp (Home en Profiel, inloggen, meldingen), Vandaag, Agenda, Notities, Instellingen, Hulp, Wat is nieuw, Abonnement

## De zes pakketten

| Sleutel | Naam | Wat erbij komt |
|---|---|---|
| `administratie` | Ledenadministratie | Lidmaatschapsvormen (tabblad Lidmaatschap op de ledenkaart, pauze, opzeggen), check-in (balie, kiosk, QR in de app), cijfers, rapporten |
| `lessen` | Groepslessen | Rooster, lestypen, weekrooster, zalen, reserveren en wachtlijst, boekingswidget, tabblad Lessen in de ledenapp |
| `training` | Training en coaching | Intakes en intakevragen, schema's, oefenbibliotheek met 3D, voeding, voortgang, metingen uit apps, tabbladen Schema, Voeding en Voortgang |
| `afspraken` | Afspraken | Afspraaktypen, PT, intakes en metingen boeken, tabblad Afspraken |
| `team` | Team en vloer | Personeelsrooster, uren, taken en poetslijsten |
| `groei` | Groei | Leads, opvolgen (en opvolgregels), challenges, community, berichten aan leden, proefles-aanvragen via de widget |

Welke schermen, API's, tabbladen en wizardstappen bij welk pakket horen staat op een plek: `src/lib/club/kern/pakketten.ts` (`MODULE_PAKKET`, `ONDERDEEL_PAKKET`, `API_PAKKET`, `API_DEEL_PAKKET`, `LID_API_PAKKET`, `LEDENAPP_TAB_PAKKET`, `WIZARD_STAP_PAKKET`).

### Ledenapp en betalen

- **De ledenapp is kern, geen eigen pakket.** Elk pakket heeft een kanaal naar leden nodig: Groepslessen om te boeken, Training voor het schema, Afspraken om een moment te kiezen. Als los pakket zou een studio met alleen Groepslessen haar leden niet kunnen laten boeken. De app toont alleen de tabbladen van wat is afgenomen.
- **Betalen (Financien) is nu geen pakket.** Het zit er nog niet in en staat achter schakelaars; verkopen wat er niet is mag niet. Zodra het af is wordt het een zevende los pakket "Betalen": het werkt voor elk pakket (lidgeld, strippenkaarten, PT) en heeft eigen Stripe-kosten en risico voor de sportschool. Tot dan blijft de tekst eerlijk "zit er nog niet in".

## Afgenomen en aan of uit

- **Afgenomen** = licentie via het abonnement: `club_organisaties.pakketten` (migratie 467).
- **Aan of uit** = eigen keuze van de sportschool binnen wat is afgenomen: `club_organisaties.modules` (zoals altijd).
- Zichtbaar = afgenomen EN aan. `organisatieUitRij()` rekent `organisatie.uit` uit als de eigen keuze (`eigenUit`) plus alles van de pakketten die niet zijn afgenomen, met een marker `pakket:<sleutel>` voor onderdelen zonder eigen schakelaar. Daardoor volgen menu, zoekveld, hulpbalk, Vandaag, instellingencentrum, hulpartikelen, ledenkaart, ledenapp en wizard het vanzelf.
- Pagina's: `eisModule()`, `eisOnderdeel()` en `eisPakket()` geven een 404. API: `vereisClubToegang()` en `vereisLidToegang()` controleren `apiAfgenomen()`. Widget: alleen met Groepslessen; proefles-aanvragen (leads) alleen met Groei, anders verwijst de widget naar de ledenapp.
- De schakelaars "Onderdelen aan of uit" tonen alleen afgenomen onderdelen (`ModulesBlok` met `afgenomen`). Opslaan bewaart altijd `eigenUit`, nooit de afgeleide `uit`.
- Fit Factory, de demo, het master account en alle bestaande sportscholen hebben alles (standaard van de kolom). Een lege lijst is alleen de kern.

Functies voor andere onderdelen: `heeftPakket`, `onderdeelAfgenomen`, `moduleAfgenomen`, `zichtbaar(uit, { sleutel, module })`, `pakketZichtbaar(uit, pakket)`, labels via `pakketInTaal()` en `pakkettenTekst()` (`src/lib/aiyourgym/taal/woorden/algemeen/pakketten.ts`).

## Aanmelden, Stripe en abonnement

- Aanmelden: een of meer pakketten (selectievakjes) met een voorstel per soort sportschool (`VOORSTEL_PER_SOORT`, bijvoorbeeld yoga: Groepslessen). `?pakketten=lessen,groei` vult de keuze in.
- Stripe Checkout: een regel per pakket, hoeveelheid = aantal vestigingen (jaarcontract, maandelijks per vestiging). Prijs per pakket in `AIYOURGYM_STRIPE_PRIJS_<SLEUTEL>`. Alleen als elk gekozen pakket een prijs heeft; anders testbetaling, anders een aanvraag.
- Inrichten zet precies de gekozen pakketten. De webhook (`customer.subscription.updated`) zet daarna precies de pakketten van de regels van het abonnement (idempotent; een onbekende prijs verandert niets).
- Club, Abonnement: per pakket erbij nemen of opzeggen. Met Stripe-abonnement en prijs: een regel erbij (Stripe rekent naar rato). Zonder Stripe: testbetaling, er wordt niets afgeschreven. Opzeggen bij een echt contract en alles zonder prijs: een aanvraag in `ayg_pakket_wijzigingen` die Kane verwerkt. Het master account zet pakketten direct. Minstens een pakket blijft over.
- Website: prijzenpagina met de zes pakketten en de kern, "Prijs op aanvraag", geen bedragen.

## Startwizard

Alleen de stappen van de kern en de afgenomen pakketten: de stap Lessen alleen met Groepslessen (`WIZARD_STAP_PAKKET`). De stap Onderdelen toont alleen afgenomen onderdelen.

## Bewaking

`src/lib/club/kern/pakketten-routes.test.ts`: elke pagina en API van een pakket geeft een 404 zonder dat pakket; elk pakket alleen (kern plus een) heeft geen dode links in menu, zoekveld, hulpbalk, Vandaag, instellingen, hulp, ledenkaart en ledenapp; de kern alleen werkt; elke nieuwe API-map en elk nieuw onderdeel moet een plek krijgen.

## Wat Kane nog doet

1. Per pakket een prijs kiezen (per vestiging per maand, jaarcontract).
2. In Stripe per pakket een product met een terugkerende prijs maken en het prijs-id in Render zetten als `AIYOURGYM_STRIPE_PRIJS_ADMINISTRATIE`, `_LESSEN`, `_TRAINING`, `_AFSPRAKEN`, `_TEAM`, `_GROEI`. De oude `_START`, `_CLUB`, `_KETEN` mogen weg.
3. Kiezen of en in welke pakketten persoonlijke hulp bij het inrichten gratis is (de website noemt nu geen pakketten meer).
4. Open aanvragen (pakket erbij of opzeggen) staan in `ayg_pakket_wijzigingen` met status `aanvraag`.

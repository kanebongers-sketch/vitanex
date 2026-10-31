# AI Your Gym | ledenbetalingen via Stripe Connect | bouwplan

Status: deels gebouwd, alles achter schakelaars die uit staan (`CLUB_BETALEN_ACTIEF`, `CLUB_LIDGELD_ACTIEF`). Gebouwd en getest in `src/lib/club/betalen/`: geldregels (`geld/`), contractregels (`contract/`), factuurnummers en opbouw (`factuur/`), incassoschema (`incasso/`), inbox en outbox voor Stripe (`inbox/`, `outbox/`), losse verkoop en Connect-onboarding. Nog niet live, nog geen echte betalingen. Ontwerp: 23-10-2026, bijgewerkt 31-10-2026.
Doel (besluit Kane 23-10-2026): sportscholen en studio's draaien hun eigen ledenabonnementen, facturen en incasso's in AI Your Gym. Geld en facturen mogen nooit fout gaan: idempotent, controleerbaar, getest.

Feiten over Stripe en het Nederlandse recht staan in `ONDERZOEK-STRIPE.md`. Waar dit plan een wettelijke of Stripe-waarde nodig heeft staat **[CHECK]**: die waarde komt in een getest regelbestand, niet verspreid door de code.

## 0. Wat er al is (en hergebruikt wordt)

| Onderdeel | Waar | Wat het doet |
|---|---|---|
| Connect-account per sportschool | `club_betalen_accounts` (migratie 439), `src/lib/club/betalen/stripe-api.ts` | Connect-account met Standard-gedrag via controller-instellingen (`fees.payer = account`, `losses.payments = stripe`, `requirement_collection = stripe`, `stripe_dashboard.type = full`), direct charges, kop `Stripe-Account`, onboarding-link, link naar het volledige Stripe-dashboard |
| Webhook Connect | `src/app/(aiyourgym)/api/club-betalen/stripe/route.ts` | Handtekening (`stripe-handtekening.ts`), elk event een keer (`club_betalen_stripe_events`) |
| Losse verkoop | `club_betalen_producten`, `_verkopen`, `_tegoeden`, `_mutaties` | Losse les, strippenkaart, PT-pakket, product; afronden en terugbetalen in databasefuncties |
| Schakelaars | `src/lib/club/betalen/config.ts` | `CLUB_BETALEN_ACTIEF`, `CLUB_STRIPE_SECRET_KEY`, `CLUB_STRIPE_WEBHOOK_SECRET`, `CLUB_LIDGELD_ACTIEF`, `PLATFORM_FEE_CENT = 0` (geen platformdeel) |
| Lidmaatschapsvormen | `club_lidmaatschapsvormen` (417), `src/lib/club/lidmaatschappen/` | Toegangsregels (vestigingen, lessen, daluren), nu zonder geld |
| AVG | `src/lib/club/leden/avg/tabellen.ts`, `club_lid_definitief_verwijderen` (449), `club_privacy_opruimen` | Elke tabel met `lid_id` verplicht geregeld, test dwingt dit af |
| Platformabonnement | `src/lib/aiyourgym/stripe-*.ts`, `docs/aiyourgym/STRIPE.md` | Het abonnement van de sportschool bij AI Your Gym. Blijft volledig los hiervan. |

Regel: het platformabonnement (`AIYOURGYM_STRIPE_*`) en het ledengeld (`CLUB_STRIPE_*`) delen geen sleutels, webhooks of tabellen.

## 1. Architectuur

### 1.1 Bron van waarheid

| Gegeven | Bron | Waarom |
|---|---|---|
| Abonnementsvorm, prijs, contractduur, opzegtermijn, korting | Onze database | Nederlandse regels en keuzes van de sportschool horen bij ons |
| Contract van een lid (begin, eind, verlenging, pauze, opzegging) | Onze database | Wet van Dam-regels zijn pure code en getest |
| Factuur, factuurnummer, btw, regels | Onze database (bevroren na definitief) | Bewaarplicht 7 jaar, doorlopende nummering per sportschool |
| Kasboek | Onze database, alleen toevoegen | Controleerbaar, nooit herschrijven |
| Of geld echt binnen is, teruggeboekt of betwist | Stripe | Alleen Stripe weet dat; wij spiegelen het |
| Betaalmethode, SEPA-machtiging | Stripe (wij bewaren alleen id, type, laatste 4, machtigingskenmerk) | Geen IBAN of kaart bij ons |

**Ontwerpbesluit (ADR-B1): eigen facturatie, Stripe voor het innen.** We maken zelf facturen per periode en innen ze met een PaymentIntent (`sepa_debit`, off_session, met de machtiging) op het account van de sportschool. Voordelen: controle over Nederlandse regels, nummers en bewaren, geen Billing-percentage. Nadeel: herhalingen, herinneringen en pro rata bouwen we zelf. Alternatief Stripe Billing geeft dubbele waarheid en extra kosten.

### 1.2 Inbox: Connect-webhooks

- Een endpoint (`/api/club-betalen/stripe`) krijgt alle events van connected accounts (`event.account`).
- Stap 1: handtekening, grootte begrenzen, rij in `club_betalen_stripe_events` (uniek op `event_id`) met status `ontvangen`, meteen 200.
- Stap 2: een verwerker (direct, plus elke minuut via cron) claimt rijen met `for update skip locked`.
- **Eerst ophalen, dan verwerken.** Het object wordt actueel opgehaald bij Stripe en een toestandsovergang die alleen vooruit kan wordt toegepast (1.5). Volgorde maakt niet uit, opnieuw sturen is onschadelijk.
- Koppeling via `metadata` (`organisatie_id`, `factuur_id`, `betaling_id`) **en** controle op account en bedrag. Klopt iets niet: status `afwijkend`, melding voor Kane, geen boeking.
- Events **[CHECK lijst]**: `payment_intent.processing|succeeded|payment_failed|canceled`, `charge.refunded`, `charge.refund.updated`, `charge.dispute.created|closed|funds_withdrawn|funds_reinstated`, `mandate.updated`, `setup_intent.succeeded|setup_failed`, `checkout.session.completed|async_payment_succeeded|async_payment_failed|expired`, `payment_method.detached`, `account.updated`, `account.application.deauthorized`, `payout.paid|failed`.

### 1.3 Outbox: elke opdracht aan Stripe

- Geld bewegen gaat alleen via `club_betalen_opdrachten`, in dezelfde transactie als de wijziging die hem nodig maakt.
- Vaste idempotentiesleutel `ayg_<soort>_<opdracht_id>`: nooit twee keer afschrijven.
- Werker met `skip locked`, oplopend wachten (1, 5, 30 minuten, 2 uur, 12 uur), na 8 pogingen `vast` met melding. Een time-out is geen mislukking.
- Vlak voor de aanroep wordt de toestand opnieuw gecontroleerd (factuur open, contract niet gepauzeerd, geen andere lopende poging).

### 1.4 Kasboek en controlelog

- `club_betalen_boekingen`: per gebeurtenis met geld een rij (factuur +, betaling -, creditnota -, storno +, terugbetaling +, afboeking -). Saldo is altijd de som. Triggers weigeren `update` en `delete`; correctie is een tegenboeking.
- `club_betalen_audit`: wie, wat, wanneer, rol, oude en nieuwe waarde als ids en bedragen. Hashketen per sportschool (`vorige_hash`, `hash`). Alleen toevoegen.

### 1.5 Toestanden (alleen vooruit)

- Betaling: `klaar` → `aangeboden` → `in_behandeling` → `geslaagd` | `mislukt` | `geannuleerd`; `geslaagd` → `gestorneerd` → `storno_teruggedraaid`. Een oudere toestand wordt genegeerd. Overgangen in `overgangen.ts`, getest.
- Factuur: `concept` → `definitief` → `open` → `betaald` | `deels_betaald` | `oninbaar` | `gecrediteerd`. Na `definitief` veranderen bedragen nooit meer.
- Contract: `concept` → `wacht_op_machtiging` → `proef` → `actief` ⇄ `gepauzeerd`; `actief` → `opgezegd` → `beeindigd`; `actief` → `gestopt_wegens_achterstand` (alleen als de sportschool dat aanzet).

## 2. Datamodel

Migraties vanaf 460, alleen toevoegen. Alle tabellen: `user_id uuid not null`, RLS aan en geforceerd, geen policies, alles ingetrokken voor `anon` en `authenticated`, functies alleen voor `service_role`. Bedragen `integer` in centen met `check`. Kalenderdatums `date` in Nederlandse tijd.

### 2.1 Aanbod
- **club_betalen_plannen**: `vorm_id` (lidmaatschapsvorm), `naam`, `actief`, `interval` (week, vier_weken, maand, kwartaal, jaar), `bedrag_cent` (incl. btw), `btw_procent` **[CHECK]**, `contract_maanden` (null = onbepaald), `opzegtermijn_dagen` (begrensd door wetregel), `verlenging`, `proef_dagen`, `inschrijfkosten_cent`, `vestigingen`, `doelgroep`, `vereist_bewijs`, `factuur_dag`, `pro_rata_eerste`. Uniek `(user_id, vorm_id, lower(naam))`.
- **club_betalen_plan_prijzen**: prijsversies met `geldig_vanaf`; een lopend contract houdt zijn prijs tot een aangekondigde wijziging.
- **club_betalen_kortingen** en **club_betalen_gezinnen** (gezinskorting via `gezin_volgorde_vanaf`).
- Bestaand `club_betalen_producten` krijgt type `dagpas` en `dienst`.

### 2.2 Lid en betalen
- **club_betalen_klanten** (Stripe-klant per lid, `on delete restrict`).
- **club_betalen_mandaten** (`pm_`, `mandate_`, type, laatste4, status, bron); hooguit een actieve standaard per lid.
- **club_betalen_contracten** met bevroren kopie van plan, prijs en korting, status, datums, `voorwaarden_versie`, `akkoord_op`. Uniek: een lopend contract per lid per vorm.
- **club_betalen_contract_wijzigingen** (alleen toevoegen) en **club_betalen_pauzes** (geen overlap via exclude-constraint).

### 2.3 Facturen
- **club_betalen_factuurreeksen**: nummer alleen uit `club_betalen_factuur_definitief()` met rijslot; geen gaten, geen dubbele nummers.
- **club_betalen_facturen**: soort (periode, eerste, handmatig, creditnota), nummer uniek per sportschool, status, datums. Uniek `(user_id, contract_id, periode_van)` voor periodefacturen: **de harde rem tegen een dubbele maandfactuur.** Bevroren klant- en verkopergegevens, btw-uitsplitsing, `pdf_hash`, `bewaren_tot`.
- **club_betalen_factuurregels**: trigger weigert wijzigen na definitief.

### 2.4 Betalingen en herinneringen
- **club_betalen_betalingen**: soort, poging, bedrag, status, `stripe_payment_intent` uniek, foutcode en categorie. Hooguit een lopende poging per factuur.
- **club_betalen_terugbetalingen** (som ≤ betaald, gecontroleerd in een functie), **club_betalen_geschillen**, **club_betalen_herinneringen** (uniek per factuur, stap, kanaal).

### 2.5 Kasboek, audit, inbox, outbox, controle
- **club_betalen_boekingen** (alleen toevoegen; uniek `(user_id, soort, oorzaak)`).
- **club_betalen_audit** (hashketen).
- **club_betalen_stripe_events** uitbreiden met status, pogingen en fout; geen payload met persoonsgegevens; 90 dagen bewaren.
- **club_betalen_opdrachten** (outbox), **club_betalen_afstemming**, **club_betalen_exports**.
- **club_betalen_accounts** erbij: `lidgeld_aan`, `incasso_aan`, `schaduw`, `crediteur_naam`, `voorwaarden_url`, `herinner_schema`, `toegang_bij_achterstand`.

### 2.6 AVG
Elke nieuwe tabel met `lid_id` komt in `LID_TABELLEN`, de export en een nieuwe versie van `club_lid_definitief_verwijderen`.
- Facturen, regels, betalingen, terugbetalingen, geschillen, boekingen, contracten: **bewaard zonder lid** (fiscale bewaarplicht 7 jaar), vrije tekst leeg.
- Mandaten: weg na de SEPA-termijn **[CHECK 13 maanden]** na de laatste incasso. Klanten en herinneringen: weg (plus `klant_verwijderen` bij Stripe). Audit: anoniem.
- Verwijderen kan pas als het geld klopt: geen lopend contract, open factuur, lopende betaling of geschil.
- Na `bewaren_tot`: naam en adres op facturen anoniem, bedragen blijven.
- Geen IBAN, kaartnummer of geboortedatum in onze tabellen.

## 3. Modules en bestanden

### 3.1 `src/lib/club/betalen/`
Puur en volledig getest: `geld/cent.ts`, `geld/btw.ts`, `geld/verdelen.ts`, `contract/regels.ts` (Wet van Dam), `contract/periodes.ts`, `contract/overgangen.ts`, `contract/planwissel.ts`, `factuur/opbouw.ts`, `factuur/nummer.ts`, `incasso/schema.ts`, `stripe/event-lid.ts`, `afstemming/vergelijk.ts`, `rapport/maand.ts`, `rapport/export.ts`, `toegang-financien.ts`.
Server: `factuur/pdf.ts`, `factuur/mail.ts`, `incasso/cyclus.ts`, `stripe/connect.ts`, `inbox/verwerk.ts`, `outbox/werker.ts`, `kasboek/boeken.ts`, `audit/log.ts`, `afstemming/run.ts`.
Databasefuncties (alleen `service_role`): `club_betalen_factuur_definitief`, `club_betalen_betaling_overgang`, `club_betalen_boek`, `club_betalen_audit_schrijf`, `club_betalen_contract_overgang`.

### 3.2 API-routes
- `club/betalen/connect`, `club/betalen/plannen`, `club/betalen/kortingen`.
- `club/financien/contracten` (pauze, opzeggen, wissel, beeindigen), `club/financien/facturen` (pdf, crediteren, afboeken), `club/financien/betalingen` (terugbetalen, opnieuw), `openstaand`, `export`, `afstemming`.
- `club/leden/[id]/betalen`, `club/lid/betalen/*` (ledensessie).
- Crons: `club-incasso`, `club-outbox`, `club-afstemming`.
- Nieuwe rechtensleutel `financien`. Terugbetalen, crediteren en afboeken alleen voor Kane, de eigenaar of wie het extra vinkje "Geld terugboeken" heeft. Elke query filtert op `t.userId`.

### 3.3 UI in Club
- Menu Beheer: **Financien** (Overzicht, Facturen, Incasso's, Contracten, Export). Vraagt een besluit van Kane (zie 8).
- Ledenkaart: blok **Lidmaatschap en betalen**.
- Check-in: nette melding bij achterstand als de sportschool `dicht` kiest. Nooit stil weigeren.

### 3.4 Instellingencentrum
Stripe en betalen, Incasso en herinneringen, Facturen, Kortingen en acties. Prijzen en contracten op de bestaande pagina Lidmaatschappen. Zonder KvK, btw-nummer en adres geen definitieve factuur.

### 3.5 Ledenapp
Lidmaatschap en betalen: contract, volgende incasso, facturen, betaalmethode wijzigen, openstaand betalen met iDEAL, opzeggen met een knop (zo makkelijk als afsluiten **[CHECK]**), later afsluiten in de app.

### 3.6 Startwizard
Stap Betalen (Stripe koppelen) met status van het account; een onboarding die dagen duurt blokkeert de wizard nooit. Voorstel voor plannen per soort, met bedrag leeg: geen verzonnen prijzen.

## 4. Flows met faalwijzen

Elke stap die geld of nummers raakt is een databasefunctie in een transactie, schrijft audit en is veilig om te herhalen.

1. **Connect-onboarding**: account maken (vaste sleutel), link, terug, `account.updated` ophalen. Lidgeld pas aan als charges aan, sepa_debit actief en Bedrijf compleet. Faalwijzen: verlopen link, half af, later geblokkeerd (cyclus pauzeert), koppeling verbroken.
2. **Plan maken**: validatie met wetregel en voorbeeld van eerste incasso. Prijs wijzigen bij lopende contracten via een nieuwe prijsversie.
3. **Plan toewijzen**: contract met bevroren kopie; met machtiging direct actief, anders wachten op machtiging.
4. **Eerste betaling en machtiging**: Checkout met iDEAL en `setup_future_usage` **[CHECK Wero]**, of SEPA-formulier, of SetupIntent bij proef. Afbreken: factuur open, na 7 dagen creditnota. Dubbel klikken: zelfde sleutel.
5. **Maandcyclus**: elk uur per sportschool factuur maken (unieke index), pre-notificatie **[CHECK termijn]**, incasso via de outbox. Schaduwmodus maakt alleen conceptfacturen. Gemiste dagen inhalen tot 35 dagen, zomertijd en korte maanden getest.
6. **Mislukt en opnieuw**: per foutcategorie herhalen of nieuwe methode vragen, herinneringen met iDEAL-link **[CHECK WIK]**, nooit automatisch incassokosten of een incassobureau.
7. **Storno en geschil**: factuur weer open, geen automatisch nieuw incasso.
8. **Terugbetalen**: alleen met recht, bedrag gecontroleerd, altijd met creditnota, vaste sleutel.
9. **Creditnota en handmatige factuur**: definitieve facturen worden nooit gewijzigd; fout gaat via creditnota en nieuwe factuur.
10. **Pauze en bevriezen**: regels van de sportschool, pro rata per dag, creditnota als de factuur al bestond.
11. **Opzeggen**: vroegste einddatum volgens de wet, bevestigingsmail, intrekken tot de einddatum.
12. **Planwissel**: pro rata op de cent (grootste rest), nieuwe looptijd alleen met akkoord van het lid.
13. **Lid vertrekt**: open posten, herinneringen, afboeken alleen met recht.
14. **AVG-verwijdering**: geweigerd bij open posten; daarna fiscale tabellen zonder lid, rest weg.

## 5. Teststrategie

1. **Pure rekenkunde** met 100 procent dekking en eigenschaptests (fast-check): som van delen klopt, btw klopt per tarief, pro rata over 2020 tot 2040, creditnota nooit groter dan gefactureerd, periodes zonder gaten of overlap, opzeggen binnen de wet. Geen decimale getallen voor geld (type `Cent` en een lintregel).
2. **Webhook en outbox**: replay van vaste testmodus-events, dubbel en gelijktijdig, alle volgordes van events, afwijkende events, time-out en herhalen met dezelfde sleutel. SQL-tests voor unieke indexen, alleen-toevoegen-triggers, nummerreeks onder gelijktijdige aanroepen en de AVG-functie.
3. **Testmodus end-to-end** met Test Gym: onboarding, plannen, iDEAL (slagen, mislukken, afbreken), SEPA-testrekeningen, drie gesimuleerde maanden, herhalen, pauze, planwissel, opzeggen, handmatige factuur, creditnota, refund, maandexport, AVG, afstemming, security review.
4. **Dagelijkse afstemming**: Stripe tegen onze rijen (7 dagen, maandag 60), interne controles (boekingen per factuur, nummerreeks, actieve contracten, opdrachten en events die blijven hangen, auditketen). Herstelt nooit zelf bedragen.

## 6. Schakelaars en uitrol

`CLUB_BETALEN_ACTIEF`, `CLUB_LIDGELD_ACTIEF` (uit = 404), `CLUB_LIDGELD_ORGS`, en per sportschool `lidgeld_aan`, `schaduw` (standaard aan) en `incasso_aan`.

1. Test Gym in testmodus, hele checklist.
2. Test Gym live met Kane als enig lid en kleine bedragen.
3. Fit Factory Budel twee of drie maanden in schaduw naast Sportivity (geen contact met Sportivity).
4. Budel live na besluit van Kane; leden machtigen opnieuw via de ledenapp **[CHECK]**.
5. Andere sportscholen, daarna breed.

Terugrollen: `incasso_aan` uit stopt nieuwe incasso's direct; data blijft.

## 7. Bouwvolgorde

| Fase | Inhoud | Inschatting |
|---|---|---|
| 1 | ADR's, schakelaars, `geld/` met eigenschaptests | 1,5 dag |
| 2 | Migratie 460: plannen, prijzen, kortingen, gezinnen, contracten, pauzes, AVG | 2 dagen |
| 3 | Migratie 461: facturen, betalingen, kasboek, audit, outbox, afstemming, SQL-tests | 3 dagen |
| 4 | Inbox en outbox, replay- en volgordetests | 3 dagen |
| 5 | Contractregels en periodes (Wet van Dam) | 2 dagen |
| 6 | Plannen en kortingen op Lidmaatschappen | 2 dagen |
| 7 | Contract toewijzen, ledenkaartblok | 2 dagen |
| 8 | Stripe-klant, eerste betaling, machtiging | 3 dagen |
| 9 | Facturen: nummering, PDF, mail, instellingen | 3 dagen |
| 10 | Maandcyclus, schaduwmodus, pre-notificatie | 3 dagen |
| 11 | Mislukt, herhalen, herinneringen, storno's | 3 dagen |
| 12 | Handmatige factuur, creditnota, refund | 2,5 dagen |
| 13 | Pauze, opzeggen, planwissel | 3 dagen |
| 14 | Ledenapp | 3 dagen |
| 15 | Financien, maandrapport, exports | 3 dagen |
| 16 | Afstemming en auditcontrole | 2 dagen |
| 17 | Wizardstap, hulp, documentatie, security review, E2E | 2,5 dagen |

Totaal ongeveer 47 werkdagen, daarna de schaduwmaanden. Elke fase is een PR met eigen tests; fase 1 tot en met 5 kunnen zonder UI achter de schakelaars.

## 8. Open beslissingen voor Kane

1. **Connect-type**: besloten (Kane 23-10-2026): Standard-gedrag. De sportschool is verkoper, betaalt de Stripe-kosten, draagt het risico en werkt in het volledige Stripe-dashboard. Gebouwd 31-10-2026 met controller-instellingen in `accountFormulier()` (getest).
2. **Jouw deel per betaling**: besloten: geen. Er gaat nooit een `application_fee_amount` mee (test bewaakt dit).
3. **Wie betaalt de Stripe-kosten**: besloten: de sportschool (direct charges, `fees.payer = account`).
4. **Stripe Tax**: advies nee.
5. **Stripe Billing of eigen facturatie**: advies eigen facturatie.
6. **Menu-item Financien** onder Beheer, of tabblad onder Rapporten.
7. **Toegang dicht bij een achterstand** als keuze voor de sportschool.
8. **Machtigingen van Budel**: opnieuw laten machtigen en wanneer.
9. **Btw-tarief** op sportabonnementen en wetswijzigingen.
10. **fast-check** als testpakket (gratis, MIT).

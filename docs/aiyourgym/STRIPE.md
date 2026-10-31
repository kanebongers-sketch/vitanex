# AI Your Gym | betalen met Stripe instellen

Wat Kane zelf moet doen voordat sportscholen online kunnen aanmelden en betalen. Hier staan geen sleutels; die horen alleen in Render.

## Zo werkt het

- Een sportschool meldt zich aan op `/aiyourgym/aanmelden` (straks `aiyourgym.com/aanmelden`).
- Basis met add-ons (besluit Kane 31-10-2026, zie `PAKKETTEN-MODULAIR.md`): de sportschool heeft altijd de basis (Ledenadministratie) en kiest daarbovenop add-ons. Heeft de basis en elke gekozen add-on een Stripe-prijs, dan gaat de klant naar Stripe Checkout: het abonnement van de eerste vestiging, met altijd de basisregel plus een regel per add-on. De hoeveelheid van elke regel is het aantal actieve leden van die vestiging (staffel, zie hieronder). De webhook en de testbetaling zetten altijd de basis op de sportschool; de basis is in Club niet op te zeggen. **Geen proefperiode** (besluit Kane 30-10-2026: "je gebruikt het of je doet het niet"): de eerste maand wordt bij het afsluiten meteen betaald, daarna maandelijks (jaarcontract). De site vraagt geen `trial_period_days` aan. Het bedrag ziet de klant pas bij Stripe; de website toont geen prijzen.
- **Geen bundel meer** (besluit Kane 31-10-2026): `AIYOURGYM_STRIPE_PRIJS_ALLES` wordt nergens meer gebruikt en mag weg uit Render.
- **Staffels per vestiging** (besluit Kane 31-10-2026): de prijs per pakket hangt af van het aantal actieve leden van de vestiging. Zie "Staffels en een abonnement per vestiging" hieronder.
- Na het afronden maakt de webhook precies een keer de sportschool aan: eigen omgeving, adres, eerste vestiging, basisbibliotheek en de eigenaar als beheerder met een persoonlijke inloglink. Je ziet hem meteen in de sportschool-wissel van Club.
- Zolang Stripe niet gekoppeld is, rondt een testbetaling op onze eigen site de aanmelding af (`src/lib/aiyourgym/testbetaling.ts`): er wordt niets afgeschreven en er is ook geen proefperiode; de abonnementspagina toont Actief met "we spreken samen af hoe je betaalt".
- Zonder prijs (of zonder sleutel) en met de testbetaling uit zegt het formulier eerlijk "Aanmelden is nog niet open" en bewaart het de aanmelding als `aanvraag` in de tabel `ayg_aanmeldingen`. Er gaat geen mail naar buiten; jij neemt zelf contact op.

## 1. Stripe-account

Maak een eigen Stripe-account (of een apart account binnen je Stripe-organisatie) voor AI Your Gym, los van MentaForce en RELEASE V. Werk eerst in **testmodus**.

## 2. Producten en prijzen (testmodus)

Maak per pakket een product met een **getrapte** terugkerende prijs per maand (besluit Kane 31-10-2026). Bedragen per maand per vestiging, excl. btw:

| Actieve leden per vestiging | tot 25 | tot 50 | tot 100 | tot 200 | tot 500 | tot 1000 | tot 5000 | daarboven |
|---|---|---|---|---|---|---|---|---|
| Ledenadministratie (basis) | 39 | 40 | 50 | 60 | 75 | 105 | 175 | op maat |
| Groepslessen | 15 | 15 | 20 | 20 | 30 | 40 | 65 | op maat |
| Training en coaching | 15 | 15 | 20 | 20 | 30 | 40 | 65 | op maat |
| Afspraken | 10 | 10 | 10 | 15 | 20 | 25 | 45 | op maat |
| Team en vloer | 10 | 10 | 10 | 15 | 20 | 25 | 45 | op maat |
| Groei | 10 | 10 | 10 | 15 | 20 | 25 | 45 | op maat |

Geen bundelkorting. Deze bedragen staan alleen in Stripe en hier, nooit op de website en nooit in de code (de code kent alleen de grenzen, `src/lib/aiyourgym/staffel.ts`).

Zo stel je elke prijs in (Productcatalogus, product, Prijs toevoegen):

1. **Prijsmodel: Volume** (in de API: `billing_scheme=tiered`, `tiers_mode=volume`). Niet "Gestaffeld" (graduated): bij volume krijgt de hele hoeveelheid de prijs van de staffel waar hij in valt.
2. Terugkerend, **maandelijks**, valuta **EUR**, belasting **exclusief** (`tax_behavior=exclusive`).
3. Zeven staffels plus een laatste. Per staffel een **vast bedrag** (flat fee) en **0 per stuk**:
   - 1 tot 25: vast bedrag uit de tabel, per stuk 0
   - 26 tot 50, 51 tot 100, 101 tot 200, 201 tot 500, 501 tot 1000, 1001 tot 5000: idem
   - 5001 en hoger (Stripe eist een laatste staffel tot oneindig): **hetzelfde vaste bedrag als tot 5000**. Die staffel wordt nooit vanzelf gebruikt: boven 5000 zet de app de hoeveelheid niet en krijg jij een melding om een prijs op maat af te spreken.
4. Geen proefperiode op de prijs of het product.

In de API ziet dat er zo uit (voorbeeld Ledenadministratie, bedragen in centen):

```
POST /v1/prices
product=prod_...
currency=eur
recurring[interval]=month
tax_behavior=exclusive
billing_scheme=tiered
tiers_mode=volume
tiers[0][up_to]=25    tiers[0][flat_amount]=3900   tiers[0][unit_amount]=0
tiers[1][up_to]=50    tiers[1][flat_amount]=4000   tiers[1][unit_amount]=0
tiers[2][up_to]=100   tiers[2][flat_amount]=5000   tiers[2][unit_amount]=0
tiers[3][up_to]=200   tiers[3][flat_amount]=6000   tiers[3][unit_amount]=0
tiers[4][up_to]=500   tiers[4][flat_amount]=7500   tiers[4][unit_amount]=0
tiers[5][up_to]=1000  tiers[5][flat_amount]=10500  tiers[5][unit_amount]=0
tiers[6][up_to]=5000  tiers[6][flat_amount]=17500  tiers[6][unit_amount]=0
tiers[7][up_to]=inf   tiers[7][flat_amount]=17500  tiers[7][unit_amount]=0
```

| Pakket | Render-variabele met het prijs-id |
|---|---|
| Ledenadministratie | `AIYOURGYM_STRIPE_PRIJS_ADMINISTRATIE` |
| Groepslessen | `AIYOURGYM_STRIPE_PRIJS_LESSEN` |
| Training en coaching | `AIYOURGYM_STRIPE_PRIJS_TRAINING` |
| Afspraken | `AIYOURGYM_STRIPE_PRIJS_AFSPRAKEN` |
| Team en vloer | `AIYOURGYM_STRIPE_PRIJS_TEAM` |
| Groei | `AIYOURGYM_STRIPE_PRIJS_GROEI` |

Een bestaande prijs in Stripe kun je niet omzetten naar getrapt: maak een nieuwe prijs en zet het nieuwe `price_...` in Render. Het prijs-id begint met `price_`. Een keuze waarin een pakket zonder variabele zit, gaat via de testbetaling (of wordt een aanvraag als die uit staat). Met dezelfde prijs-id's herkent de webhook welke pakketten een abonnement heeft (`customer.subscription.updated`) en zet die precies op de sportschool.

## Staffels en een abonnement per vestiging

Stripe staat dezelfde prijs niet twee keer in een abonnement toe. Daarom heeft **elke vestiging een eigen abonnement** bij dezelfde Stripe-klant, met dezelfde pakketten (tabel `ayg_vestiging_abonnementen`, migratie 486).

- **Aanmelden**: de eigenaar kiest hoeveel leden de eerste vestiging ongeveer heeft (tot 25 tot en met tot 5000, of meer dan 5000). De checkout is het abonnement van die eerste vestiging; de hoeveelheid van elke regel is de bovengrens van de gekozen staffel (bijvoorbeeld 100). Meer dan 5000 is prijs op maat: altijd een aanvraag voor jou. De website zegt alleen "prijs volgens staffel per vestiging, je ziet het bedrag bij Stripe voordat je betaalt".
- **Na het betalen** koppelt de app het abonnement aan de eerste vestiging (metadata `soort=vestiging`, `organisatie_id`, `vestiging`).
- **Nieuwe vestiging in Club**: met Stripe gekoppeld krijgt hij meteen een eigen abonnement met dezelfde pakketten, de betaalmethode van het eerste abonnement en dezelfde factuurdatum (`billing_cycle_anchor`, naar rato tot die datum). Hoeveelheid: zijn actieve leden, minimaal 1. Nooit dubbel: eerst een rij claimen, dan bij Stripe zoeken op metadata, dan pas maken met een vaste Idempotency-Key.
- **Elke dag** (cron `/api/aiyourgym/cron/staffel`, kop `x-cron-secret`, bijvoorbeeld 03:00 via cron-job.org) telt de app per vestiging de actieve leden (`src/lib/club/leden/actief-tellen.ts`: actief of proef, of opgezegd tot de einddatum; niet gepauzeerd, gestopt, demo of nog niet begonnen) en zet dat aantal als hoeveelheid op elke eigen regel, met `proration_behavior=none`: de nieuwe staffel geldt vanaf de volgende factuur, omhoog en omlaag. Een logregel per abonnement per dag (`ayg_staffel_log`), dus twee keer draaien doet niets extra. Verandert de staffel, dan krijgt de eigenaar een mail (met `AIYOURGYM_RESEND_FROM`) en staat de wijziging in Club bij Abonnement. Boven 5000: niets automatisch, een melding in `club_fouten` voor jou. De cron is ook het vangnet voor koppelen en ontbrekende vestigingen.
- **Pakket erbij in Club**: een regel erbij op het abonnement van elke vestiging, met de hoeveelheid van dat abonnement (naar rato). Opzeggen blijft een aanvraag.
- **Oud abonnement** (van voor 31-10-2026, hoeveelheid = aantal vestigingen, zonder metadata `soort=vestiging`): de app zet het nooit vanzelf om. Zet het met de hand om (per vestiging een abonnement met de nieuwe prijzen) en zet `metadata[soort]=vestiging` op het eerste.
- In Club bij Abonnement ziet de eigenaar per vestiging de actieve leden, de staffel ("Tot 100 leden") en het bedrag zoals Stripe het teruggeeft, plus de afspraak uit de voorwaarden in een regel.
- De afspraak staat in de voorwaarden (artikel "Prijs en staffels", `docs/aiyourgym/juridisch/algemene-voorwaarden.md`).

## 3. Webhook

In Stripe: Ontwikkelaars, Webhooks, eindpunt toevoegen.

- URL zolang de website uit staat: `https://fitfactorypt.nl/api/aiyourgym/stripe/webhook`
- URL als aiyourgym.com live is: `https://aiyourgym.com/api/aiyourgym/stripe/webhook`
- Events:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`

Kopieer daarna het ondertekeningsgeheim (begint met `whsec_`).

## 4. Render (Environment)

| Variabele | Waarde |
|---|---|
| `AIYOURGYM_STRIPE_SECRET_KEY` | geheime sleutel van het AI Your Gym-account (`sk_test_...`, later `sk_live_...`) |
| `AIYOURGYM_STRIPE_WEBHOOK_SECRET` | het `whsec_...` van stap 3 |
| `AIYOURGYM_STRIPE_PRIJS_ADMINISTRATIE`, `_LESSEN`, `_TRAINING`, `_AFSPRAKEN`, `_TEAM`, `_GROEI` | de prijs-id's van stap 2 |
| `AIYOURGYM_RESEND_FROM` (optioneel) | afzender voor de welkomstmail met de inloglink en de mail bij een andere staffel, bijv. `AI Your Gym <welkom@aiyourgym.com>`. Alleen als dat domein in Resend geverifieerd is. Zonder deze variabele wordt er niet gemaild en staat de link alleen op de welkomstpagina. |
| `AIYOURGYM_PROEFMAILS` (optioneel) | `1` = drie startmails met tips op dag 1, 3 en 7 na het aanmelden (cron `/api/aiyourgym/cron/proefmails`, header `x-cron-secret`). De naam is historisch: er is geen proefperiode meer en de mails noemen er ook geen. Standaard uit. |
| `CLUB_CRON_SECRET` (aanbevolen) | eigen geheim voor de crons van AI Your Gym (ook `/api/aiyourgym/cron/proefmails` en `/api/aiyourgym/cron/staffel`), alleen in een kop. Zolang leeg telt `CRON_SECRET`. Stappen in `docs/aiyourgym/CRON-EN-REMMEN.md`. |
| `AIYOURGYM_PORTAAL_URL` (optioneel) | basis voor de inloglink zolang subdomeinen uit staan. Met `AIYOURGYM_SITE_ACTIEF=1` telt hij alleen als hij op aiyourgym.com of een subdomein ervan staat; een ander domein (zoals fitfactorypt.nl) wordt dan genegeerd en de link komt niet in mail of op de welkomstpagina. |

Render deployt na het opslaan vanzelf opnieuw.

## 5. Testen

1. Open `/aiyourgym/aanmelden` als Kane (de website staat nog uit, dus alleen jij ziet hem).
2. Kies een pakket met prijs, vul alles in en betaal met de testkaart van Stripe (4242 4242 4242 4242, een datum in de toekomst, elke CVC).
3. Je komt op `/aiyourgym/welkom` met "Je sportschool staat klaar" en de inloglink.
4. Controleer in Club, Huisstijl, dat de nieuwe sportschool in de wissel staat met de eigenaar bij Beheerders.

## 6. Customer Portal (facturen en betaalgegevens)

De eigenaar van een sportschool opent in Club, Instellingencentrum, **Abonnement en facturen** (`/club/beheer/abonnement`) de knop "Facturen en betaalgegevens". Die opent het Customer Portal van Stripe en komt daarna terug op die pagina. Zet het portaal eerst aan in Stripe, anders geeft de knop een foutmelding.

In Stripe: Instellingen, Billing, **Customer portal** (eerst in testmodus, later ook in livemodus):

1. Sla de instellingen van het portaal minstens een keer op; zonder opgeslagen instellingen maakt Stripe geen portaalsessie.
2. **Facturen**: aan (factuurgeschiedenis tonen, zodat de eigenaar pdf's kan downloaden).
3. **Betaalmethoden**: aan (bijwerken van de betaalmethode).
4. **Klantgegevens**: aan voor factuuradres, e-mail en btw-nummer.
5. **Abonnement opzeggen**: aan, met "Aan het einde van de factuurperiode" (dan toont Club "Opgezegd, loopt nog tot ..."). Een reden vragen mag.
6. **Abonnement wijzigen** (ander pakket of aantal): voorlopig uit. Een pakket erbij nemen gaat in Club, Abonnement (een regel erbij op het abonnement van elke vestiging); opzeggen wordt daar altijd een aanvraag die jij volgens het contract verwerkt. De hoeveelheid (actieve leden) regelt de dagelijkse cron; zet hem niet met de hand.
7. **Bedrijfsgegevens**: naam AI Your Gym, en links naar de algemene voorwaarden en het privacybeleid zodra die er zijn.
8. Standaard terugkeer-url mag leeg blijven: de app geeft bij elke sessie zelf de juiste url mee (alleen eigen domeinen en het subdomein van de sportschool).

Er is geen nieuwe Render-variabele nodig: de knop gebruikt `AIYOURGYM_STRIPE_SECRET_KEY` en de klant uit `ayg_aanmeldingen.stripe_customer_id`. Fit Factory, de demo-sportschool en het testaccount hebben geen klant bij Stripe; daar toont de pagina een uitleg in plaats van de knop.

Status, volgende factuur en bedrag leest de pagina rechtstreeks bij Stripe (`/v1/subscriptions`). Een oud abonnement dat Stripe nog als `trialing` stuurt, toont de pagina als Actief met de datum van de eerste betaling (nooit het woord proef). Is Stripe even onbereikbaar, dan toont hij de status uit `ayg_aanmeldingen` zonder datums.

## Live gaan

Herhaal stap 2 tot en met 4 en stap 6 in de livemodus van Stripe (nieuwe prijs-id's, nieuwe webhook met een eigen `whsec_`, sleutel `sk_live_...`).

## Goed om te weten

- Inloggen voor sportscholen staat uit (`CLUB_EIGEN_LOGIN`). De welkomstpagina zegt dan eerlijk dat inloggen na de lancering opent.
- Een mislukte betaling of opzegging zet alleen de status in `ayg_aanmeldingen` (`betaling_mislukt`, `gepauzeerd`, `opgezegd`); de sportschool zelf wordt niet automatisch dichtgezet. Dat beslis je zelf.
- De code praat rechtstreeks met de Stripe-API (`src/lib/aiyourgym/stripe-api.ts`) en controleert de handtekening van de webhook zelf (`stripe-handtekening.ts`, getest).

# AI Your Gym | betalen met Stripe instellen

Wat Kane zelf moet doen voordat sportscholen online kunnen aanmelden en betalen. Hier staan geen sleutels; die horen alleen in Render.

## Zo werkt het

- Een sportschool meldt zich aan op `/aiyourgym/aanmelden` (straks `aiyourgym.com/aanmelden`).
- De sportschool kiest een of meer losse pakketten (besluit Kane 29-10-2026, zie `PAKKETTEN-MODULAIR.md`). Heeft elk gekozen pakket een Stripe-prijs, dan gaat de klant naar Stripe Checkout: een abonnement met een regel per pakket, per vestiging, met **14 dagen gratis** (`PROEFDAGEN` in `src/lib/aiyourgym/pakketten.ts`). Het bedrag ziet de klant pas bij Stripe; de website toont geen prijzen.
- Kiest de sportschool alle zes pakketten en staat er een bundelprijs (`AIYOURGYM_STRIPE_PRIJS_ALLES`), dan krijgt het abonnement een regel met de bundel in plaats van zes losse regels (besluit Kane 30-10-2026). Zonder bundelprijs blijven het zes losse regels.
- Na het afronden maakt de webhook precies een keer de sportschool aan: eigen omgeving, adres, eerste vestiging, basisbibliotheek en de eigenaar als beheerder met een persoonlijke inloglink. Je ziet hem meteen in de sportschool-wissel van Club.
- Zonder prijs (of zonder sleutel) zegt het formulier eerlijk "Aanmelden is nog niet open" en bewaart het de aanmelding als `aanvraag` in de tabel `ayg_aanmeldingen`. Er gaat geen mail naar buiten; jij neemt zelf contact op.

## 1. Stripe-account

Maak een eigen Stripe-account (of een apart account binnen je Stripe-organisatie) voor AI Your Gym, los van MentaForce en RELEASE V. Werk eerst in **testmodus**.

## 2. Producten en prijzen (testmodus)

Maak per los pakket een product met een terugkerende prijs per maand, **per vestiging** (de hoeveelheid is het aantal vestigingen):

| Pakket | Render-variabele met het prijs-id |
|---|---|
| Ledenadministratie | `AIYOURGYM_STRIPE_PRIJS_ADMINISTRATIE` |
| Groepslessen | `AIYOURGYM_STRIPE_PRIJS_LESSEN` |
| Training en coaching | `AIYOURGYM_STRIPE_PRIJS_TRAINING` |
| Afspraken | `AIYOURGYM_STRIPE_PRIJS_AFSPRAKEN` |
| Team en vloer | `AIYOURGYM_STRIPE_PRIJS_TEAM` |
| Groei | `AIYOURGYM_STRIPE_PRIJS_GROEI` |
| Alle zes samen (bundel) | `AIYOURGYM_STRIPE_PRIJS_ALLES` |

De bundel is een eigen product met een eigen terugkerende prijs per maand, per vestiging (besluit Kane 30-10-2026: alle zes samen 119 euro in plaats van 123 euro los). Zo werkt hij:

- **Aanmelden** met alle zes: een regel met de bundelprijs, hoeveelheid het aantal vestigingen. Minder dan zes: een regel per pakket.
- **Webhook**: een abonnement met de bundelprijs betekent alle zes pakketten. Dat zet `customer.subscription.updated` vast op de sportschool, ook als hetzelfde event twee keer komt.
- **Club, Abonnement, erbij nemen**: heeft de sportschool daarna alle zes, dan worden de losse regels in een verzoek vervangen door de bundelregel (Stripe rekent naar rato).
- **Club, Abonnement, opzeggen**: altijd een aanvraag die jij volgens het jaarcontract verwerkt, ook vanuit de bundel. Verwerk je hem, zet dan in Stripe de bundelregel om naar de losse regels die overblijven; de webhook zet daarna precies die pakketten op de sportschool.
- Elke wijziging gaat met een Idempotency-Key die hoort bij de regels van dat moment: twee keer klikken geeft een wijziging. Staat het abonnement al zoals het moet, dan gaat er niets naar Stripe.
- De eigenaar ziet in Club bij Abonnement het bedrag per maand zoals het in Stripe staat (prijs per stuk maal aantal, alleen bij maandprijzen in euro). De website toont nooit bedragen; bij het aanmelden staat alleen dat alle zes samen een bundelprijs hebben.

Het prijs-id begint met `price_`. Een keuze waarin een pakket zonder variabele zit, gaat via de testbetaling (of wordt een aanvraag als die uit staat). De oude variabelen `_START`, `_CLUB` en `_KETEN` worden niet meer gebruikt. Met dezelfde prijs-id's herkent de webhook welke pakketten een abonnement heeft (`customer.subscription.updated`) en zet die precies op de sportschool. Stel in Stripe bij Belastingen de btw in als je die wilt laten berekenen. Zet de proefperiode niet ook nog in Stripe zelf: de site vraagt hem al aan.

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
| `AIYOURGYM_STRIPE_PRIJS_ALLES` | het prijs-id van de bundel (alle zes samen) van stap 2 |
| `AIYOURGYM_RESEND_FROM` (optioneel) | afzender voor de welkomstmail met de inloglink, bijv. `AI Your Gym <welkom@aiyourgym.com>`. Alleen als dat domein in Resend geverifieerd is. Zonder deze variabele wordt er niet gemaild en staat de link alleen op de welkomstpagina. |
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
6. **Abonnement wijzigen** (ander pakket of aantal): voorlopig uit. Een pakket erbij nemen gaat in Club, Abonnement (een regel erbij op het abonnement, of de bundelregel bij alle zes); opzeggen wordt daar altijd een aanvraag die jij volgens het contract verwerkt, ook vanuit de bundel. Het aantal vestigingen hoort bij wat in Club staat; dat regel je zelf.
7. **Bedrijfsgegevens**: naam AI Your Gym, en links naar de algemene voorwaarden en het privacybeleid zodra die er zijn.
8. Standaard terugkeer-url mag leeg blijven: de app geeft bij elke sessie zelf de juiste url mee (alleen eigen domeinen en het subdomein van de sportschool).

Er is geen nieuwe Render-variabele nodig: de knop gebruikt `AIYOURGYM_STRIPE_SECRET_KEY` en de klant uit `ayg_aanmeldingen.stripe_customer_id`. Fit Factory, de demo-sportschool en het testaccount hebben geen klant bij Stripe; daar toont de pagina een uitleg in plaats van de knop.

Status en einddatum van de proefperiode leest de pagina rechtstreeks bij Stripe (`/v1/subscriptions`). Is Stripe even onbereikbaar, dan toont hij de status uit `ayg_aanmeldingen` zonder datums.

## Live gaan

Herhaal stap 2 tot en met 4 en stap 6 in de livemodus van Stripe (nieuwe prijs-id's, nieuwe webhook met een eigen `whsec_`, sleutel `sk_live_...`).

## Goed om te weten

- Inloggen voor sportscholen staat uit (`CLUB_EIGEN_LOGIN`). De welkomstpagina zegt dan eerlijk dat inloggen na de lancering opent.
- Een mislukte betaling of opzegging zet alleen de status in `ayg_aanmeldingen` (`betaling_mislukt`, `gepauzeerd`, `opgezegd`); de sportschool zelf wordt niet automatisch dichtgezet. Dat beslis je zelf.
- De code praat rechtstreeks met de Stripe-API (`src/lib/aiyourgym/stripe-api.ts`) en controleert de handtekening van de webhook zelf (`stripe-handtekening.ts`, getest).

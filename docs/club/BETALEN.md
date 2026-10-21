# Betalen in de ledenapp (Club)

Leden kopen in de ledenapp losse producten van hun sportschool: een losse les of drop-in, een strippenkaart, een PT-pakket of een los product (bijvoorbeeld een shake, op te halen bij de balie). Het lidmaatschap zelf hoort hier niet bij: dat blijft bij Sportivity of het eigen systeem van de sportschool, net als incasso.

Het geld gaat naar de sportschool zelf, niet naar AI Your Gym. Daarvoor gebruiken we **Stripe Connect** met **Express-accounts** en **direct charges**.

## Waarom direct charges

- De betaling staat op het Stripe-account van de sportschool. De sportschool is de verkoper: haar naam staat op het afschrift van het lid, zij betaalt de Stripe-kosten, en terugbetalingen en geschillen zijn van haar.
- AI Your Gym kan later een deel inhouden (application fee). Dat percentage staat nu op 0 (zie open beslissingen).
- Bij destination charges zou AI Your Gym de verkoper zijn en de btw over lessen van een ander moeten afdragen. Dat past niet bij verkoop namens de sportschool.
- Let op: bij Express-accounts blijft het platform (AI Your Gym) volgens Stripe aansprakelijk als een sportschool een negatief saldo heeft (bijvoorbeeld na een geschil zonder saldo). Klein risico, wel goed om te weten.

## Hoe het werkt

1. De eigenaar (of Kane) opent Club, Instellingencentrum, **Betalen in de ledenapp** (`/club/beheer/betalen`), klikt **Stripe koppelen** en vult bij Stripe de bedrijfsgegevens, KvK, rekeningnummer en identiteit in.
2. Zodra Stripe betalingen open zet, zet de eigenaar **Kopen in de app** aan en voegt producten toe (prijs in euro incl. btw, btw 9 of 21 procent, aantal lessen of sessies, geldigheid in dagen, vestigingen, te koop ja of nee).
3. Het lid ziet op Home het blok **Kopen** (`/mijn?tab=kopen`), kiest een product en betaalt op de pagina van Stripe met iDEAL of kaart. Wij zien geen bank- of kaartgegevens.
4. Stripe meldt de betaling via de webhook. Pas dan zet Club het tegoed op het lid. Het bedrag komt altijd uit onze eigen verkoopregel; klopt het bedrag of account van Stripe niet, dan gebeurt er niets en komt er een melding in Systeem.
5. **Strippenkaart:** heeft het lidmaatschap van een lid geen groepslessen, dan weigert de app de boeking zoals altijd. Heeft het lid strippen, dan verschijnt meteen de knop **Boek met strippenkaart**. De les wordt geboekt (alle gewone regels gelden: vol, boekvenster, no-shows) en er gaat een strip af. Alleen voor een vrije plek, niet voor de wachtlijst. Op tijd afgemeld: strip terug. Te laat afgemeld: geen strip terug.
6. **PT-pakket:** bij een afspraak van een type met "personal training" of "PT" in de naam ziet de trainer **Sessie afboeken** (een keer per afspraak, met **Terugzetten** voor een vergissing).
7. **Terugbetalen:** in het overzicht van verkopen, altijd het hele bedrag. Stripe verwerkt het, daarna vervalt wat er nog op het tegoed stond.

## Wat Kane moet doen

1. **Stripe Connect aanzetten** op het Stripe-account van AI Your Gym (Dashboard, Connect, aan de slag). Kies Express, land Nederland, en zet iDEAL en kaart aan als betaalmethoden voor connected accounts. Vul het platformprofiel in (wat AI Your Gym doet, dat sportscholen via ons verkopen).
2. **Webhook voor Connect** maken (Dashboard, Developers, Webhooks, "Events on Connected accounts"):
   - URL: `https://fitfactorypt.nl/api/club-betalen/stripe`
   - Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`, `account.updated`
3. **Env in Render** zetten:
   - `CLUB_STRIPE_SECRET_KEY`: de geheime sleutel van het AI Your Gym-platformaccount (eerst `sk_test_...`, later `sk_live_...`). Mag dezelfde zijn als `AIYOURGYM_STRIPE_SECRET_KEY` als dat hetzelfde account is.
   - `CLUB_STRIPE_WEBHOOK_SECRET`: de `whsec_...` van de webhook hierboven.
   - `CLUB_BETALEN_ACTIEF=1`: pas als alles getest is. Zonder deze schakelaar bestaat betalen niet (404) en gaat er niets kapot.
4. **Testen in testmodus:** koppel de demo-sportschool of Fit Factory met test-onboarding, maak een product, koop het als testlid met een testkaart of test-iDEAL, controleer het tegoed en een terugbetaling.
5. **Migratie 439** staat al in de database (tabellen en functies voor producten, verkopen, tegoeden, mutaties, Connect-accounts en idempotentie).

## Juridisch en btw (laten checken)

- **Algemene voorwaarden voor verkoop namens de sportschool:** de sportschool is de verkoper. AI Your Gym levert alleen de software. Zet dat in de voorwaarden van AI Your Gym voor sportscholen, en laat de sportschool eigen verkoopvoorwaarden voor leden hebben (herroepingsrecht bij diensten die op een datum geleverd worden, geldigheid van strippenkaarten, wat er gebeurt bij sluiting).
- **Stripe Connect-overeenkomst:** de sportschool accepteert tijdens de onboarding de Stripe Connected Account Agreement.
- **Btw:** de sportschool draagt de btw af over wat zij verkoopt. Het tarief (9 of 21 procent) kiest de sportschool met haar boekhouder; Club rekent het btw-deel alleen uit voor het overzicht. Een eventuele platformfee is een dienst van AI Your Gym aan de sportschool en valt onder de btw van AI Your Gym.
- **Facturen:** Stripe stuurt het lid een betaalbewijs. Een echte factuur (als een lid erom vraagt) maakt de sportschool nu zelf.
- **Privacy:** wij bewaren geen kaart- of bankgegevens, alleen wat er gekocht is, het bedrag en de Stripe-id's. Zet Stripe als verwerker in de privacyverklaring van de sportschool.

## Open beslissingen (Kane)

- **Platformfee:** `PLATFORM_FEE_PROCENT` in `src/lib/club/betalen/config.ts` staat op 0. Kiest Kane een percentage, dan houdt Stripe dat automatisch in per betaling. Niet zelf invullen.
- **Wachtlijst met strippenkaart:** nu boek je met een strip alleen een vrije plek. Wachtlijst met strip kan later (strip vasthouden en teruggeven als je er niet in komt).
- **Strip terug als de sportschool een les annuleert** of de balie het lid afmeldt: nu alleen automatisch als het lid zelf op tijd afmeldt in de app. De rest kan later, of via een terugbetaling.
- **Drop-in voor de fitness** (zonder groepsles) aan de balie afboeken bij check-in: nu niet; een losse les geldt voor een groepsles.

## Code

- Logica: `src/lib/club/betalen/**` (config, model, regels, invoer, Stripe-API, events, webhookverwerking, opslag, acties).
- Webhook: `src/app/(aiyourgym)/api/club-betalen/stripe/route.ts`.
- Beheer-API: `src/app/(aiyourgym)/api/club/betalen/**`; ledenapp-API: `src/app/(aiyourgym)/api/club/lid/betalen/**`; PT afboeken: `src/app/(aiyourgym)/api/club/afspraken/[id]/tegoed`.
- Pagina: `src/app/(aiyourgym)/(club)/club/beheer/betalen`; componenten: `src/components/club/betalen/**`.
- Database: `supabase/lifeos-migrations/439_club_betalen.sql`.

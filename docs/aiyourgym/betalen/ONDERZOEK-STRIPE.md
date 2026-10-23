# Onderzoek | Ledenbetalingen per sportschool via Stripe

Stand: 23-10-2026. Bronnen: officiele Stripe-documentatie en -prijspagina's, Belastingdienst, ACM, KvK en vakbronnen (zie onderaan). Alles wat ik niet zelf op een primaire bron heb kunnen controleren staat gemarkeerd als **[niet geverifieerd]**. Dit is geen juridisch of fiscaal advies; laat de contract- en btw-keuzes toetsen door een adviseur voordat het live gaat.

Doel: elke sportschool (tenant in AI Your Gym) int zelf de betalingen van haar leden in ons product, via Stripe. De sportschool is de verkoper (merchant of record), wij houden nooit geld vast.

---

## 1. Stripe Connect: welk soort account

### Wat er nu is
* Stripe noemt de oude soorten **Standard, Express en Custom** inmiddels "legacy". Voor nieuwe platforms raadt Stripe de **Accounts v2 API** aan, met per account een "configuratie" (merchant, customer, recipient). Wie op Accounts v1 blijft, gebruikt **controller properties** in plaats van een soort.
* De controller properties (v1) zijn vier losse knoppen:
  * `controller.fees.payer`: `account` (de sportschool betaalt de Stripe-kosten zelf) of `application` (wij betalen ze).
  * `controller.losses.payments`: `stripe` (Stripe draagt het risico als een sportschool een negatief saldo niet terugbetaalt) of `application` (wij dragen dat).
  * `controller.requirement_collection`: `stripe` (Stripe verzamelt KYC-gegevens) of `application` (wij).
  * `controller.stripe_dashboard.type`: `full`, `express` of `none`.
* Standard is precies: fees `account`, losses `stripe`, requirements `stripe`, dashboard `full`. Express en Custom zetten verliezen en kosten bij het platform.
* In Accounts v2 heten de knoppen anders (onder andere `defaults.responsibilities.fees_collector` en een losses-tegenhanger). De precieze v2-namen voor verliezen en dashboard **[niet geverifieerd]**, die controleren bij de bouw.

### Wie draagt wat
* **Direct charges** (betaling direct op het account van de sportschool): de sportschool is merchant of record, ziet haar eigen naam op het bankafschrift, en terugboekingen en geschillen gaan van haar saldo af. Stripe zegt letterlijk dat refunds en chargebacks "debit the connected account's balance".
* Geschilkosten: bij fees-payer `account` betaalt de sportschool ze, bij `application` het platform.
* Kan de sportschool een negatief saldo niet aanvullen, dan beslist `losses.payments` wie opdraait. Met `stripe` is dat Stripe; ons eigen platformsaldo blijft wel onze verantwoordelijkheid.
* Bij destination charges (betaling op ons platformaccount) betaalt het platform altijd kosten, refunds en geschillen. Dat past niet bij "wij houden nooit geld vast".

### Onboarding
* Stripe-hosted onboarding via een **Account Link** (`type=account_onboarding`, met `refresh_url` en `return_url`). Stripe toont zelf het juiste formulier per land en bedrijfsvorm en doet de KYC (identiteit, UBO, bankrekening).
* Keuze tussen alles vooraf (`collection_options.fields=eventually_due`) of stapsgewijs (`currently_due`). Advies: vooraf, dan geen verrassingen met geblokkeerde uitbetalingen.
* Een Account Link is eenmalig, verloopt na een paar minuten en mag nooit gemaild worden; alleen tonen aan een ingelogde eigenaar.
* Status volgen met het event `account.updated` (velden `requirements.currently_due` en `past_due`).
* Het dashboardtype is **niet te wijzigen** na aanmaken. Een verkeerde keuze betekent een nieuw account per sportschool.
* SEPA-incasso vereist extra verificatie en de capability `sepa_debit_payments` per account.

### Conclusie Connect-type
Beste match: **Standard-gedrag** (via Accounts v2 met merchant-configuratie, of v1 met controller properties): kosten bij de sportschool, verliezen bij Stripe, KYC door Stripe, **direct charges**. Wij zijn dan niet aansprakelijk voor negatieve saldi en betalen geen Connect-kosten.

Twee smaken:
* **A. Volledig Stripe-dashboard** (`full`): snelst te bouwen, sportschool ziet alles ook in Stripe. Nadeel: de sportschool kan in Stripe zelf abonnementen wijzigen buiten ons om, dus wij moeten alles via webhooks terug synchroniseren.
* **B. Geen Stripe-dashboard** (`none`) met verliezen bij Stripe en KYC door Stripe: volledig in onze huisstijl. Stripe verplicht dan **embedded components** voor accountbeheer. Alleen wij beheren de abonnementen (Stripe: alleen accounts met het volledige dashboard kunnen zelf abonnementen beheren). Meer bouwwerk. De combinatie `none` plus `stripe`-KYC plus `application`-verliezen is niet toegestaan; `none` met `stripe`-verliezen wel volgens de tabel van Stripe, maar test dit vooraf in een sandbox **[niet geverifieerd in de praktijk]**.

---

## 2. Kosten (EUR, Stripe-prijspagina Nederland, 23-10-2026)

| Onderdeel | Tarief |
| --- | --- |
| SEPA-incasso, geslaagd | **0,35 euro** per betaling |
| SEPA-incasso, mislukt | **3,50 euro** per mislukte incasso |
| SEPA-geschil (stornering) | **15 euro** |
| iDEAL / iDEAL \| Wero | **0,29 euro** per betaling |
| Bancontact | 0,35 euro |
| Kaart EER standaard | 1,5% + 0,25 euro |
| Kaart EER premium | 2,8% + 0,25 euro |
| Kaart VK | 2,5% + 0,25 euro |
| Kaart internationaal | 3,15% + 0,25 euro (+2% bij valutawissel) |
| Kaartgeschil | 20 euro (plus 20 euro bij aanvechten, terug bij winst) |
| Stripe Billing (abonnementen) | **0,7%** van het Billing-volume (pay-as-you-go); vast contract vanaf 500 euro per maand |
| Stripe Invoicing (losse facturen) | Starter **0,4%** per betaalde factuur |
| Stripe Tax Basic | 0,5% per transactie (no-code) of 0,45 euro per transactie via API; Tax Complete vanaf 80 euro per maand |
| Handmatige btw-tarieven (Tax Rates) | geen extra kosten |
| Uitbetaling (standaardschema) | gratis |
| Directe uitbetaling (Instant) | 1%, minimaal 0,50 euro |
| Refund | geen kosten, maar de oorspronkelijke transactiekosten krijg je niet terug |

### Connect
* **"Stripe regelt de prijzen"** (sportschool betaalt Stripe zelf, Standard-gedrag): **geen** platformkosten, geen kosten per actief account, geen uitbetalingskosten. Stripe: "We don't charge any Connect fees to it or to your platform."
* **"Jij regelt de prijzen"** (wij betalen Stripe, `fees.payer=application`): 2 euro per actief account per maand, 0,25% + 0,10 euro per uitbetaling, en alle verwerkingskosten, geschilkosten, Billing en Tax komen bij ons. Op de algemene prijspagina staat ook 0,25% "startkosten" voor dit model.

### Ons eigen deel (application fee)
* Abonnementen: `application_fee_percent` (0 tot 100, twee decimalen) op de subscription; Stripe neemt dit per factuurperiode van het eindbedrag. Een vast bedrag per abonnementsperiode kan **niet** als percentage-instelling; dan per factuur `application_fee_amount` zetten (via het event `invoice.created`).
* `application_fee_percent` geldt niet voor prorata-facturen die direct worden gefactureerd; daar zelf een bedrag zetten.
* Let op: blijft een sportschool na ontkoppeling doorlopen met direct charges, dan blijft de fee doorlopen tot de sportschool hem weghaalt. Bij opzeggen van AI Your Gym moeten wij de fee eerst verwijderen.
* Wettelijk/contractueel moet de sportschool weten dat wij een fee nemen (voorwaarden AI Your Gym).

### Rekenvoorbeeld lid van 40 euro per maand (indicatie)
* SEPA: 0,35 + 0,7% Billing (0,28) = **0,63 euro** per maand voor de sportschool.
* Eerste betaling met iDEAL: 0,29 + 0,28 = 0,57 euro.
* Met kaart (EER standaard): 0,60 + 0,25 + 0,28 = 1,13 euro.
* Mislukte incasso: 3,50 euro extra; automatische herpogingen door Stripe kosten geen failure fee.

---

## 3. Stripe Billing op het account van de sportschool

* **Prijzen en abonnementen** staan op het account van de sportschool en worden aangemaakt met de header `Stripe-Account`. Kortingen via coupons en promotiecodes.
* **Proefperiode**: `trial_period_days` of `trial_end`; zonder betaalmethode mogelijk. Event `customer.subscription.trial_will_end` komt 3 dagen voor het einde.
* **Inschrijfgeld**: als eenmalige regel op de eerste factuur (add_invoice_items) **[niet geverifieerd: exacte parameter controleren bij bouw]**.
* **Contractduur en opzegtermijn**: Stripe kent geen harde "minimale looptijd". Oplossing: een **subscription schedule** met fases (bijv. 12 maanden vaste prijs, daarna doorlopend per maand) en de opzeglogica (opzegtermijn, einddatum) in onze eigen software, met `cancel_at` op de juiste datum.
* **Prorata**: standaard bij wijzigen van abonnement; instelbaar per wijziging (`proration_behavior`).
* **Pauzeren / bevriezen**:
  * `pause_collection` houdt het abonnement actief maar int niet. Keuze per pauze: facturen als concept bewaren (`keep_as_draft`), oninbaar markeren (`mark_uncollectible`) of laten vervallen (`void`). Optioneel `resumes_at`.
  * Een echt gepauzeerd abonnement (status `paused`) maakt geen facturen meer tot hervatten. Voor "bevriezen" (blessure, zwangerschap) is `void` of de echte pauze het netst; de contracteinddatum moet dan in onze software opschuiven.
* **Mislukte betalingen**: Smart Retries (aanbevolen standaard: 8 pogingen in 2 weken) voor kaarten. Voor **SEPA**: maximaal **2** automatische herpogingen binnen 30 dagen, alleen bij onvoldoende saldo, en alleen als je dit aanzet. Na de laatste poging: annuleren, `unpaid`, `past_due` laten of pauzeren.
* **Aanmaningen**: Stripe kan e-mails sturen bij mislukte betalingen; inhoud en toon (Nederlands) controleren. Eigen herinneringen via ons product kan ook op basis van `invoice.payment_failed`.
* **Klantportaal**: plan wisselen, opzeggen (standaard aan het einde van de periode), betaalmethode wijzigen, factuurhistorie. Branding per sportschool via direct charges. Voor contracten met opzegtermijn liever **ons eigen opzegscherm** (wettelijke regels, zie 6), het Stripe-portaal kent die regels niet.
* **Factuurnummers**: elk merchant of record heeft een **eigen nummerreeks die bij 0001 begint**. In de EU is nummering over het hele account (account-level) de standaard. Prefix instelbaar (1 tot 12 hoofdletters/cijfers), startnummer instelbaar (handig bij overstap uit Sportivity of Virtuagym). Concepten krijgen pas een nummer bij finaliseren **[niet geverifieerd]**.
* **Handmatige facturen** (PT-sessie, product, dagpas): als losse factuur (Invoicing, 0,4%) of als factuurregel die meeloopt op de volgende abonnementsfactuur (alleen Billing 0,7%). Contant aan de balie: factuur als betaald buiten Stripe markeren, zodat de nummerreeks compleet blijft.
* **Creditnota's**: alleen op gefinaliseerde facturen (open of betaald). Bij betaald: terugstorten, tegoed op klantsaldo of "buiten Stripe terugbetaald". Som van creditnota's mag de factuur niet overschrijden. Krijgt een PDF in de taal van de klant.
* **Btw**:
  * **Handmatige Tax Rates** (gratis): per tarief een object (bijv. "Btw 9%" en "Btw 21%", inclusief). Percentage is na aanmaken niet te wijzigen; bij een tariefwijziging nieuw tarief maken en het oude archiveren. Per factuurregel een tarief mogelijk. Export per tarief voor de btw-aangifte.
  * **Stripe Tax** (0,5% of 0,45 euro per transactie) bepaalt tarieven automatisch, maar kent de Nederlandse sportregel (9% alleen bij ter beschikking stellen van een sportaccommodatie) niet beter dan wij. Voor sportscholen die alleen in Nederland verkopen voegt het weinig toe.
  * Stripe zegt zelf: "You're responsible for verifying that the invoices you issue meet local tax requirements."
* **Uitbetalingen**: automatisch naar de bank van de sportschool, standaard gratis. SEPA-geld is pas na **T+6 werkdagen** beschikbaar.
* **Maandrapportage**: per kalendermaand uit Stripe halen (facturen, betalingen, refunds, kosten, uitbetalingen) via de API per account of de rapportages van Stripe, en in Club tonen per kalendermaand (sluit aan op de regel "cijfers altijd per kalendermaand").

---

## 4. SEPA-incasso: regels

* Stripe ondersteunt alleen het **SEPA Core**-schema (consumenten en bedrijven), niet B2B.
* Lid geeft naam, IBAN en accepteert een **machtiging (mandaat)**; Stripe kan de mandaattekst genereren. Bij direct charges geldt het **incassant-ID** (Creditor ID) van het account van de sportschool; zonder eigen Creditor ID gebruikt Stripe het Stripe-ID met de naam van de sportschool.
* **Vooraankondiging (pre-notificatie)**: verplicht bij elke afschrijving. Gebruikelijk is 14 dagen vooraf, maar het Stripe-mandaat noemt **tot 2 kalenderdagen** vooraf, zodat de melding bij aanmaken van de betaling mag. Bij gelijke maandbedragen mag een aankondiging meerdere data noemen. Bij het Stripe Creditor ID stuurt Stripe deze e-mails altijd zelf. Eigen e-mails moeten bevatten: laatste 4 cijfers IBAN, mandaatreferentie, bedrag, Creditor ID en contactgegevens.
* **Terugboekrecht**: tot **8 weken** na afschrijving zonder opgaaf van reden, altijd gehonoreerd. Daarna tot **13 maanden** alleen bij een niet-geautoriseerde afschrijving (dan levert Stripe het mandaat aan de bank, maar de bank beslist). SEPA-geschillen zijn **definitief, geen beroep**. Kosten 15 euro.
* **Dubbele terugbetaling**: een eigen refund voorkomt geen storno door de bank. Advies van Stripe: pas terugbetalen na volledige afwikkeling en het lid laten weten dat je terugbetaalt. Refunds kunnen tot 180 dagen na betaling.
* **Timing**: indienen voor 10:30 CET is dezelfde dag; weigerperiode 5 werkdagen; als geslaagd beschouwen na **6 werkdagen**. Limiet 10.000 euro per transactie; nieuwe accounts ook 10.000 euro per week (groeit mee).
* **Faalcodes** (op de Charge, `failure_code`): `insufficient_funds`, `account_closed`, `authorization_revoked`, `debit_not_authorized`, `debit_disputed`, `bank_account_restricted`, `debit_authorization_not_match`, `incorrect_account_holder_name`, `invalid_account_number`, `branch_does_not_exist`, `recipient_deceased`, `refer_to_customer`, `generic_could_not_process`. Bij ingetrokken of ongeldige machtiging is een **nieuw mandaat** nodig; Stripe merkt een ingetrokken mandaat pas bij een mislukte poging (`mandate.updated`).
* **Eerste betaling met iDEAL**: Stripe kan na een iDEAL-betaling automatisch een SEPA-mandaat aanmaken en volgende termijnen per incasso innen. iDEAL wordt in 2026 en 2027 stapsgewijs **Wero** (co-branding "iDEAL | Wero" vanaf 2026, volledig Wero en abonnementen in Wero vanaf 2027 volgens vakbronnen) **[datums niet geverifieerd bij iDEAL zelf]**. Testen of de iDEAL naar SEPA-route onder Wero blijft werken.

---

## 5. Webhooks bij Connect

* Twee soorten endpoints: **"Your account"** (platformzaken, bijv. de AI Your Gym-abonnementen van sportscholen zelf) en **"Connected accounts"** (alles van de sportscholen bij direct charges: klanten, facturen, betalingen, uitbetalingen). Via API: `connect=true`, of bij event destinations `events_from=["@accounts"]`. Er zijn maximaal 16 event destinations.
* Elk event van een sportschool heeft een veld **`account`** met het account-ID. Daarmee kiezen we de tenant; vervolgaanroepen met `Stripe-Account`.
* **Handtekening**: header `Stripe-Signature`, HMAC-SHA256 met het `whsec_`-geheim van dat endpoint (apart geheim per endpoint en per test/live). Ruwe body gebruiken. Standaard tolerantie 5 minuten (nooit 0). Geheimen periodiek roteren (oude kan nog 24 uur mee).
* **Herhalingen**: live tot **3 dagen** met oplopende pauzes; sandbox 3 keer in een paar uur. Handmatig opnieuw sturen: 15 dagen (dashboard) of 30 dagen (CLI).
* **Volgorde niet gegarandeerd**, en **dubbele levering** komt voor. Dus: verwerkte event-ID's opslaan, idempotent verwerken, bij twijfel het object opnieuw ophalen. Snel 2xx teruggeven en daarna asynchroon verwerken (piek op de 1e van de maand).
* Een productie-endpoint voor Connect ontvangt live en test-events; altijd `livemode` controleren.
* **Idempotency keys**: bij elke schrijfactie naar Stripe (abonnement, factuur, refund) een eigen sleutel meesturen, zodat een herhaalde aanroep niet dubbel boekt **[standaard Stripe-functie; niet opnieuw nagelezen in deze ronde]**.
* Belangrijkste events: `account.updated`, `account.application.deauthorized`, `customer.subscription.created/updated/deleted/paused/resumed/trial_will_end`, `invoice.created` (reageert dit niet, dan wordt finaliseren tot 72 uur uitgesteld), `invoice.finalized`, `invoice.paid`, `invoice.payment_failed`, `invoice.payment_action_required`, `payment_intent.processing/succeeded/payment_failed`, `charge.failed`, `charge.dispute.created`, `charge.refunded`, `mandate.updated`, `payout.paid/failed`, `subscription_schedule.*`.
* **Testen**: sandbox, `stripe listen --forward-connect-to localhost:PORT/pad` en `stripe trigger --stripe-account acct_... event`. Testgegevens voor KYC en SEPA-faalgevallen bestaan in testmodus.

---

## 6. Nederlandse en Europese regels

### Factuureisen (Belastingdienst)
Op elke factuur: volledige naam en adres van sportschool en lid (geen postbus), btw-nummer van de sportschool, KvK-nummer, factuurdatum, **uniek opeenvolgend factuurnummer** (een of meer reeksen, elk nummer een keer), omschrijving en omvang van de dienst, leverdatum of datum vooruitbetaling, bedrag exclusief btw per tarief, btw-tarief en btw-bedrag. Facturen tot 100 euro inclusief btw mogen minder gegevens bevatten. Facturen aan consumenten zijn in Nederland niet altijd verplicht, maar als je ze maakt, moeten ze kloppen **[uitzondering voor particulieren niet geverifieerd op de Belastingdienst-pagina]**.

Gevolg voor ons: per sportschool een reeks (Stripe doet dit per account), nooit eigen facturen naast Stripe in een andere reeks zonder duidelijke tweede reeks, en naam, adres, btw- en KvK-nummer van de sportschool in de factuurinstellingen.

### Btw voor sport
* **9%** voor het gelegenheid geven tot sportbeoefening, als een sportaccommodatie ter beschikking wordt gesteld (fitness, groepslessen in de zaal). De geplande verhoging naar 21% per 1-1-2026 is **definitief niet doorgegaan** (SRA, juni 2025; Miljoenennota 2026). **[Stand 2026 niet op belastingdienst.nl zelf gecontroleerd; de officiele pagina gaf een 404]**.
* **Losse lessen of begeleiding zonder accommodatie** krijgen geen 9% (Europese rechtspraak); personal training kan dus 21% zijn, afhankelijk van de opzet **[laten toetsen]**.
* Producten (supplementen, kleding) meestal 21%, voedingsmiddelen en dranken zonder alcohol vaak 9% **[per product laten toetsen]**.
* Sportverenigingen zonder winstoogmerk zijn vaak **vrijgesteld**; dan geen btw op de factuur.
* Gevolg: btw-tarief per product of prijs instelbaar maken, met 9% als voorstel voor lidmaatschap en 21% als voorstel voor PT en producten, en de keuze altijd bij de sportschool.

### Abonnementen (Wet van Dam en BW)
* Na de eerste contractperiode mag een sportabonnement alleen stilzwijgend verlengd worden naar **onbepaalde tijd**, met een opzegtermijn van **maximaal een maand**, op elk moment opzegbaar (ACM).
* **Online afgesloten = online opzeggen**, makkelijk vindbaar, zonder extra drempels (ACM, gebaseerd op art. 6:236 sub o BW).
* Alle vaste kosten (inschrijfgeld, toeslag maandbetaling) moeten in de getoonde prijs zitten of duidelijk vermeld staan.
* Eerste looptijd langer dan een jaar is bij consumentencontracten in beginsel onredelijk (grijze lijst BW) **[artikelnummer en precieze regel niet geverifieerd]**. Advies: maximaal 12 maanden als eerste periode.
* Prijsverhoging tijdens de looptijd: alleen als dat in de voorwaarden staat, en het lid moet dan vaak kunnen opzeggen **[niet geverifieerd]**.

### Herroepingsrecht
* Online inschrijving: **14 dagen bedenktijd**. Wil het lid direct sporten, dan moet dat uitdrukkelijk gevraagd worden en mag de sportschool alleen naar rato rekenen als dat vooraf is gemeld (ACM).
* Sinds **19 juni 2026** is een **herroepingsfunctie** ("herroepingsknop") verplicht voor online overeenkomsten (Richtlijn (EU) 2023/2673, ACM en KvK): goed zichtbaar, volledig digitaal, bevestiging per e-mail, zonder eerst te hoeven inloggen. Dit geldt ook voor online aanmelden bij een sportschool via ons product.

### PSD2 en SCA
* Een SEPA-incasso zelf valt **niet** onder sterke klantauthenticatie (door de begunstigde geinitieerd, EBA). Het afgeven van het mandaat online valt er alleen onder als de bank van het lid erbij betrokken is (zoals bij de iDEAL-route).
* Kaarten: eerste betaling met 3D Secure; volgende termijnen als merchant-initiated (off-session). Banken kunnen alsnog authenticatie vragen; dan `invoice.payment_action_required` afhandelen en het lid een link sturen.

### AVG
* De sportschool is verwerkingsverantwoordelijke voor ledengegevens; wij zijn verwerker (verwerkersovereenkomst in `docs/aiyourgym/juridisch/`). Stripe treedt voor betaalgegevens deels op als eigen verantwoordelijke **[rol per gegevenssoort niet geverifieerd]**; dit opnemen in het verwerkingsregister (`docs/club/AVG.md`).
* IBAN en kaartgegevens niet zelf opslaan: alleen Stripe-ID's en de laatste 4 cijfers. Geen betaalgegevens in logs.
* Bewaartermijn betaalgegevens: de **fiscale bewaarplicht gaat voor** op de AVG-wisregels. Bij "lid verwijderen (AVG)" de factuur- en betaalgegevens dus niet wissen maar afschermen tot de termijn voorbij is.

### Bewaarplicht
* **7 jaar** voor de administratie (facturen, betalingen), **10 jaar** voor gegevens over onroerende zaken. De termijn begint pas als een gegeven niet meer actueel is (bij een lopend contract dus pas na afloop). Facturen in Stripe blijven bewaard zolang het account bestaat **[niet geverifieerd hoe lang na sluiten account]**: daarom eigen maandexport van factuur-PDF's per sportschool.

---

## 7. Advies

1. **Connect**: Accounts v2 met merchant-configuratie (of v1 met controller properties), **Standard-gedrag**: Stripe-kosten bij de sportschool, verliezen bij Stripe, KYC door Stripe via hosted onboarding, **direct charges**. Start met **dashboard `full`** (smaak A); smaak B (eigen huisstijl, embedded components) pas als de basis werkt, want het dashboardtype is niet te wijzigen. Eerst in een sandbox testen welke combinatie werkt.
2. **Betaalmethoden**: eerste betaling met iDEAL (maakt SEPA-mandaat), daarna maandelijks SEPA-incasso; kaart als optie per sportschool.
3. **Facturen**: alles als Stripe-factuur op het account van de sportschool, zodat er een sluitende nummerreeks is; contant aan de balie als "betaald buiten Stripe".
4. **Btw**: handmatige Tax Rates (gratis), tarief per prijs, voorstel 9% / 21% met uitleg, keuze bij de sportschool.
5. **Contractlogica in ons product**, niet in Stripe: looptijd, opzegtermijn (max 1 maand na eerste periode), online opzeggen, herroepingsknop, bevriezen. Stripe voert uit via schedules, `cancel_at` en `pause_collection`.
6. **SEPA-herpogingen aan** (2 keer, gratis) en eigen herinneringen in Nederlands; toegang pas definitief na `invoice.paid` plus de 6 werkdagen van SEPA, met een duidelijke regel voor de tussentijd.
7. **Webhooks**: een Connect-endpoint en een platform-endpoint, handtekening controleren, event-ID's opslaan, asynchroon verwerken, idempotency keys op alle schrijfacties.
8. **Ons verdienmodel**: eerst **geen** transactie-fee (alleen het AI Your Gym-abonnement); later eventueel een kleine `application_fee_percent`.

---

## 8. Open beslissingen voor Kane (met kosten per optie)

| # | Beslissing | Opties en kosten |
| --- | --- | --- |
| 1 | Connect-smaak | **A. Volledig Stripe-dashboard**: 0 euro Connect-kosten, minste bouwwerk. **B. Eigen huisstijl zonder Stripe-dashboard**: 0 euro Connect-kosten, meer bouwwerk (embedded components). **C. Wij betalen Stripe (`fees.payer=application`)**: 2 euro per actief account per maand + 0,25% + 0,10 euro per uitbetaling + alle verwerkings-, geschil-, Billing- en Tax-kosten voor ons, en meestal ook het verliesrisico. Advies A. |
| 2 | Ons deel per transactie | **Geen** (0 euro, simpelst, eerlijk verhaal) of **percentage** via `application_fee_percent` (bijv. 0,5%: bij 40 euro is dat 0,20 euro per lid per maand voor ons) of **vast bedrag per factuur** via `application_fee_amount` (extra bouwwerk). Advies: eerst geen. |
| 3 | Btw-berekening | **Handmatige Tax Rates**: gratis. **Stripe Tax Basic**: 0,5% of 0,45 euro per transactie (bij 40 euro dus 0,20 tot 0,45 euro per lid per maand). Advies handmatig. |
| 4 | Losse verkopen (PT, producten, dagpas) | **Losse factuur** (Invoicing 0,4%) of **meelopen op de abonnementsfactuur** (alleen Billing 0,7%, geen extra kosten) of **los betaalverzoek zonder factuur** (alleen betaalkosten, maar dan geen Stripe-factuurnummer). Advies: losse factuur bij directe betaling, anders meelopen. |
| 5 | Kaartbetalingen toestaan | Ja: 1,5% + 0,25 euro (EER standaard), duurder dan SEPA. Nee: alleen iDEAL en SEPA. Advies: aan te zetten per sportschool, standaard uit. |
| 6 | Incassant-ID | **Stripe Creditor ID**: 0 euro, Stripe stuurt de vooraankondigingen. **Eigen Creditor ID van de sportschool**: minder storno's volgens Stripe, maar de sportschool moet dat bij de bank regelen (kosten bank **[niet geverifieerd]**) en wij moeten zelf vooraankondigingen sturen. Advies: start met Stripe Creditor ID. |
| 7 | Stripe Billing-contract | **Pay-as-you-go 0,7%** (betaalt de sportschool) of **vast vanaf 500 euro per maand** (alleen bij heel groot volume). Advies 0,7%. |
| 8 | Wat bij mislukte incasso | Na 2 herpogingen: abonnement **pauzeren**, **past_due laten** of **opzeggen**. Kosten: 3,50 euro per mislukte incasso voor de sportschool, herpogingen door Stripe gratis. Advies: past_due en toegang blokkeren na een in te stellen termijn. |
| 9 | Fit Factory / Budel | Sportivity blijft voor incasso (eerder besluit). Overstap naar dit systeem betekent bestaande machtigingen overzetten: of en hoe Stripe bestaande SEPA-mandaten kan overnemen is **[niet geverifieerd]**; anders moeten leden opnieuw machtigen. Geen actie nodig tot Kane kiest. |
| 10 | Juridische toets | Algemene voorwaarden voor sportscholen (modeltekst lidmaatschap, opzeggen, bevriezen, prijsverhoging, herroeping) en btw-advies laten toetsen door een jurist of fiscalist. Kosten afhankelijk van adviseur **[niet bekend]**. |

---

## 9. Top 5 risico's

1. **SEPA-storno's**: 8 weken zonder reden, tot 13 maanden bij niet-geautoriseerd, geen beroep, 15 euro per stuk, en kans op dubbele terugbetaling. Toegang en refunds moeten daar rekening mee houden.
2. **Abonnementsrecht verkeerd ingesteld**: als ons product standaard een te lange looptijd, opzegtermijn of geen online opzegging en herroepingsknop aanbiedt, handelen de sportscholen in strijd met de wet en komen de klachten bij ons.
3. **Btw en factuurnummers**: 9% versus 21% verkeerd toepassen (vooral PT en producten), of gaten en dubbele reeksen door facturen buiten Stripe. Stripe legt de verantwoordelijkheid expliciet bij de verkoper.
4. **Webhooks**: volgorde niet gegarandeerd, dubbele events, 3 dagen herhaling. Fout verwerken geeft dubbele toegang, gemiste mislukte betalingen of verkeerde maandcijfers per sportschool.
5. **Vastzitten aan een keuze**: dashboardtype en fee-payer zijn niet te wijzigen na aanmaken, en iDEAL gaat over naar Wero. Een verkeerde start betekent alle sportscholen opnieuw laten onboarden.

---

## Bronnen

Stripe
* Prijzen Nederland: https://stripe.com/nl/pricing
* Lokale betaalmethoden (SEPA, iDEAL): https://stripe.com/nl/pricing/local-payment-methods
* Connect-prijzen: https://stripe.com/nl/connect/pricing
* Accounttypen (legacy): https://docs.stripe.com/connect/accounts
* Controller properties: https://docs.stripe.com/connect/migrate-to-controller-properties
* Accounts v2 voor SaaS: https://docs.stripe.com/connect/accounts-v2/saas-platform-payments-billing
* Kostenverdeling direct charges: https://docs.stripe.com/connect/direct-charges-fee-payer-behavior
* Hosted onboarding: https://docs.stripe.com/connect/hosted-onboarding
* Abonnementen met Connect: https://docs.stripe.com/connect/subscriptions
* Connect-webhooks: https://docs.stripe.com/connect/webhooks
* Webhooks algemeen: https://docs.stripe.com/webhooks
* SEPA-incasso: https://docs.stripe.com/payments/sepa-debit
* iDEAL naar SEPA: https://docs.stripe.com/payments/ideal/set-up-payment en https://stripe.com/nl/resources/more/direct-debit-initiated-via-ideal
* Herpogingen: https://docs.stripe.com/billing/revenue-recovery/smart-retries
* Betalingen pauzeren: https://docs.stripe.com/billing/subscriptions/pause-payment
* Klantportaal: https://docs.stripe.com/customer-management/configure-portal
* Facturen en nummering: https://docs.stripe.com/invoicing/customize
* Creditnota's: https://docs.stripe.com/invoicing/dashboard/credit-notes
* Btw-tarieven: https://docs.stripe.com/billing/taxes/tax-rates
* SCA en off-session: https://support.stripe.com/questions/what-is-the-difference-between-on-session-and-off-session-and-why-is-it-important

Overheid en toezicht
* Factuureisen: https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/administratie_bijhouden/facturen_maken/factuureisen/factuureisen
* Bewaarplicht: https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/administratie_bijhouden/administratie_bewaren
* ACM sportscholen: https://www.acm.nl/nl/publicaties/publicatie/14258/Twaalf-sportschoolketens-passen-voorwaarden-en-website-aan
* ACM online opzeggen: https://www.acm.nl/nl/publicaties/acm-online-afgesloten-abonnement-moet-je-online-kunnen-opzeggen
* ACM herroepingsknop: https://www.acm.nl/nl/publicaties/acm-roept-online-retailers-op-zich-voor-te-bereiden-op-herroepingsknop
* KvK herroepingsknop: https://www.kvk.nl/wetten-en-regels/herroepingsknop-verplicht-voor-webshops/
* EBA over SCA bij incasso: https://www.eba.europa.eu/single-rule-book-qa/-/qna/view/publicId/2018_4131

Vakbronnen
* Btw sport blijft 9%: https://www.sra.nl/nieuws/004501/2025/06/definitief-geen-verhoging-btw-op-sport-media-en-cultuur
* 9% en sportaccommodatie: https://www.sra.nl/nieuws/004501/2025/02/ook-bij-outdoor-9-btw-mogelijk
* iDEAL naar Wero: https://ideal.nl/en/ideal-vanaf-2026-stapsgewijs-over-naar-wero en https://www.cm.com/nl-nl/blog/ideal-naar-wero-wat-merchants-moeten-weten-over-de-transitie/

# Nieuw lid van A tot Z (30-10-2026)

Besluit Kane: leden melden zich nooit aan via een openbare pagina. Er zijn twee wegen, en daarna doet het lid zelf een korte intake. De statische walkthrough met nagebouwde schermen staat in `docs/club/lid-a-tot-z.html` (openen in de browser, geen inlog nodig).

## Kort

| Weg | Medewerker | Lid | Uitkomst |
|---|---|---|---|
| A. Sportschool voegt toe | 2 klikken (Lid toevoegen, Toevoegen) plus naam en e-mail | mail openen of QR scannen, wachtwoord kiezen | lid status actief, ingelogd in de app |
| B. Aanmeldlink of QR | 2 klikken voor een link (Aanmeldlink, Maak link en QR); een balie-QR gaat maanden mee | 3 schermen: gegevens, lidmaatschap, code plus wachtwoord | proeflid, ingelogd in de app |
| Intake | niets | hoogstens 4 korte schermen | intake op de ledenkaart, melding op Vandaag |

Doel: een lid is binnen 3 minuten van de link in de app (stap 1 ongeveer 40 seconden, lidmaatschap 10 seconden, code uit de mail plus wachtwoord ongeveer 60 seconden).

## Waarom een proeflid en geen aanvraag

Een aanmelding via een link wordt meteen een lid met status **proef**. Dat is het eenvoudigst: het lid zit direct in de app, kan de intake doen en lessen boeken. Het is ook eerlijk: het lid ziet "Je start als proeflid. De sportschool zet je lidmaatschap daarna definitief" en "Online betalen zit er nog niet in". Een aanvraag die eerst bevestigd moet worden, zou het lid buiten de app houden tot iemand van het team tijd heeft. Het team ziet de melding "Nieuwe aanmelding via link" en zet het lidmaatschap op de ledenkaart op actief (bestaande knoppen bij Lidmaatschap).

## Weg A: de sportschool voegt een lid toe

1. **Ledenlijst** (`/club/leden?v=<vestiging>`) of **Vandaag** (`/club`, sectie Nieuwe leden): knop **Lid toevoegen**. Klik 1.
2. Venster: voornaam, achternaam, e-mail. Telefoon en lidmaatschap zijn optioneel. Het vinkje "Stuur meteen een uitnodiging voor de app" staat aan. **Toevoegen**. Klik 2.
   - Bestaat het e-mailadres al bij een lid van deze sportschool, dan zegt Club dat en linkt naar dat lid (geen dubbele kaart).
3. Klaar-scherm: "Noor is toegevoegd". De uitnodiging gaat per mail met de volgende ronde van de meldingen (binnen een paar minuten), en de QR staat er meteen om aan de balie te scannen. Knoppen **Nog een lid** en **Open de ledenkaart**.
   - Staan de mails uit, dan zegt het scherm: laat het lid deze QR scannen.
4. Het lid opent de link (`aiyourgym.com/<slug>/mijn/start/<code>`), bevestigt het e-mailadres, kiest een wachtwoord en is ingelogd. Daarna verschijnt op Home de kaart "Vertel ons over je doel" voor de intake.

Techniek: `POST /api/club/leden` (onderdeel Leden, bewerken), regels in `src/lib/club/nieuwe-leden/regels.ts` (`leesSnelToevoegen`), opslag in `toevoegen-opslag.ts` (lid plus uitnodiging via de bestaande ledenlogin en de wachtrij van de meldingen).

## Weg B: aanmelden via een link of QR van de sportschool

### De sportschool maakt een link

1. **Ledenlijst** of **Vandaag**: knop **Aanmeldlink**. Klik 1.
2. Kies voor wie: **Iedereen met de link** (balie, flyer, website; standaard 90 dagen) of **Een persoon** (werkt een keer; standaard 7 dagen). Geldig 7, 30 of 90 dagen of tot je hem intrekt (alleen herbruikbaar). Lidmaatschap: het lid kiest zelf, of vast. Optioneel een naam (Balie, Flyer januari). **Maak link en QR**. Klik 2.
3. De QR staat er groot en scherp: tik erop voor volledig scherm (om aan de balie te scannen). **Kopieer link**, **Delen** (deelknop van de telefoon), **Download PNG** (1600 px) en **Print A4** (poster met logo, naam en accentkleur van de sportschool, "Scan en meld je aan", drie stappen).
4. Alle links per vestiging: `/club/leden/aanmeldlinks?v=<vestiging>` (stand, hoe vaak gebruikt, tot wanneer, QR tonen, **Intrekken** met bevestiging). Een ingetrokken, verlopen of volle link geeft een 404 en de QR werkt niet meer.

### Het lid meldt zich aan

Adres: `aiyourgym.com/<slug>/mijn/aanmelden/<code>` (de code is geheim, 24 tekens). Zonder geldige code een 404 zonder iets van de sportschool.

1. **Over jou** (stap 1 van 3): voornaam, achternaam, e-mail, telefoon en geboortedatum (beide optioneel), vinkje "Kernhal mag mijn gegevens gebruiken voor mijn lidmaatschap en de ledenapp". **Verder**. Er gaat meteen een mail met een code van 6 cijfers.
2. **Kies je lidmaatschap** (stap 2 van 3, alleen als de link geen vaste vorm heeft en de vestiging vormen heeft): de vormen van de sportschool plus "Weet ik nog niet". **Verder**.
3. **Bijna klaar** (stap 3 van 3): de code uit de mail en een wachtwoord (twee keer). **Klaar, open de app**. Het lid is ingelogd en de intake opent.

Geen verraad: of het e-mailadres al bij een lid hoort, ziet niemand op het scherm. Een bekend adres krijgt een mail "Je bent al lid" met de links om in te loggen of een link aan te vragen, en geen code; elke code is dan fout.

Techniek: `POST /api/club/lid/aanmelden` (start, en `opnieuw` voor een nieuwe code), `POST /api/club/lid/aanmelden/afronden`. Opslag in `src/lib/club/nieuwe-leden/aanmelden-opslag.ts`, links in `links-opslag.ts`, mails in `mail.ts`.

## De intake van het lid (beide wegen)

Adres: `/mijn/intake` (meteen na aanmelden, en via de kaart op Home zolang er geen intake is). Hoort bij het pakket Training en coaching.

1. **Wat wil je bereiken?** Grote tegels, een of meer doelen. **Verder**.
2. **Gewicht en lengte**: eerst het vinkje toestemming ("Mijn trainer mag mijn gewicht, lengte en antwoorden over mijn gezondheid bewaren"), dan grote cijfervelden. **Sla over** mag.
3. **Je gezondheid**: de bestaande gezondheidsvragen als Ja of Nee, met **Overal nee** in een tik; bij Ja een tekstveld (bij gewrichten ook waar). Zonder toestemming geen vragen, wel **Sla over**.
4. **Ervaring en tijd**: niveau, dagen per week (standaard 3), minuten (standaard 60), waar je traint (standaard club). **Klaar**.
5. Klaar-scherm: **Maak mijn startschema** opent het tabblad Schema met de snelle start al ingevuld (doel, dagen, niveau, thuis of club) en alleen Blender-oefeningen met coaching.

Resultaat: een gewone rij in `club_intakes` met `bron = 'lid'`, toestemming met tijd en tekstversie. Gewicht en lengte staan in de intake en tellen mee in de voortgang. Zonder toestemming bewaren we geen gewicht, lengte of gezondheid (ook niet als de browser ze stuurt). Overgeslagen gezondheid blijft leeg, nooit "overal nee".

Techniek: `POST /api/club/lid/intake` (lid uit de sessie), `src/lib/club/nieuwe-leden/intake.ts`, `intake-keuze.ts`, `intake-opslag.ts`.

## Wat het team ziet

- **Vandaag**, sectie **Nieuwe leden**: de knoppen Lid toevoegen, Aanmeldlink en Aanmeldlinks, en de meldingen **Nieuwe aanmelding via link** (proeflid, vorm, tijd) en **Intake ingevuld**. Een klik op de naam opent de ledenkaart (bij een intake het tabblad Training); **Gezien** haalt de melding weg voor het hele team.
- **Ledenkaart**: chip "Aangemeld via link op ...", status Proeflid; op het tabblad Training de intake met chip **Ingevuld door lid** en de knop voor het schemavoorstel.

## AVG en beveiliging

- Toestemming bij aanmelden vastgelegd met tijd en tekstversie (`club_aanmeldingen.toestemming_op`, `club_leden.aanmelding_toestemming_versie`).
- Toestemming voor gezondheid in de intake met tijd en tekstversie (`club_intakes.toestemming_op`, `toestemming_versie`).
- Een lopende aanmelding (`club_aanmeldingen`) bewaart gegevens hoogstens een dag; daarna wist de app de rij.
- Rem: per IP 10 per kwartier in het geheugen en 10 per uur in de database (429), per adres 3 per uur (stil geen mail), per link 60 per uur; honingpot; alleen van onze eigen pagina; de mail gaat pas na het antwoord. Een code is 30 minuten geldig, hoogstens 5 pogingen, hoogstens 3 keer opnieuw sturen. IP en adres alleen als HMAC (`remSleutel`).
- Tenant-filter: de link en de aanmelding worden op hun geheime code of tokenhash gezocht (uitzondering met reden in `tenant-filter-uitzonderingen.ts`); al het andere filtert op de sportschool.

## Database

Migratie 480 (uitgevoerd op bbklogjersviaoocgrve): `club_aanmeldlinks`, `club_aanmeldingen`, kolommen `aangemeld_via`, `aanmelding_op`, `aanmelding_toestemming_versie`, `aanmelding_gezien_op` op `club_leden`, en `bron`, `toestemming_op`, `toestemming_versie`, `gezien_op` op `club_intakes`.

## Tests

- `src/lib/club/nieuwe-leden/keten.test.ts`: de hele keten met een database in het geheugen (link maken, aanmelden, code, wachtwoord, ingelogd via de sessie, intake, meldingen op Vandaag, intake op de ledenkaart, Gezien), plus snel toevoegen met uitnodiging, eenmalige en ingetrokken links, de rem, en geen verraad van een bekend adres.
- `src/lib/club/nieuwe-leden/routes.test.ts`: de openbare routes (zelfde antwoord, mail na het antwoord, 404, CSRF, honingpot, sessiecookie bij afronden).
- `src/lib/club/nieuwe-leden/regels.test.ts`: alle regels zonder database.

## Wat Kane zelf moet aanzetten of testen

- **Mail voor de aanmeldcode**: `AIYOURGYM_RESEND_FROM` en `RESEND_API_KEY` in Render (dezelfde als de uitnodiging van medewerkers). Zonder die mail werkt aanmelden via een link niet; de pagina en het venster zeggen dat eerlijk.
- **Mail voor de uitnodiging bij Lid toevoegen**: `CLUB_MAILS_ACTIEF=1` met `CLUB_RESEND_API_KEY` en `CLUB_RESEND_FROM`. Zonder: Club toont de QR om aan de balie te scannen.
- Testen op Test Gym: Leden, Aanmeldlink, QR scannen met je telefoon, aanmelden met een tweede eigen e-mailadres, intake invullen, daarna Vandaag en de ledenkaart bekijken.

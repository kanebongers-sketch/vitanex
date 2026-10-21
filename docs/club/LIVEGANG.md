# Club en AI Your Gym | betrouwbaarheid voor de livegang

Stand 17-10-2026. Alles hieronder werkt zonder nieuwe betaalde diensten.

## 1. Foutregistratie

**Wat er gebeurt**
- Elke serverfout die Next zelf opvangt op een pagina, API-route of server action van Club (`/club`, `/clubinloggen`, `/api/club`), de ledenapp (`/mijn`, `/api/club/lid`) of AI Your Gym (`/aiyourgym`, `/api/aiyourgym`) komt in de tabel `club_fouten`. Dat loopt via `src/instrumentation.ts` (de Next-hook `onRequestError`).
- Fouten die een route zelf afvangt en netjes beantwoordt, ziet Next niet. Die leg je vast met `meldFout()` uit `src/lib/club/betrouwbaarheid/melden.ts`. Dat gebeurt nu al in de aanmelding (`/api/aiyourgym/checkout`) en de Stripe-webhook van AI Your Gym.
- Per dag een rij per soort fout (fingerprint). Herhalingen tellen op in "aantal". Na 90 dagen ruimt pg_cron (`club_fouten_opruimen`, elke nacht) ze op.
- Er gaat **geen** persoonsgegeven mee: geen headers, body, cookies, tokens of ip-adressen. De melding wordt geschoond (e-mail, id's, codes, cijfers en tekst tussen aanhalingstekens eruit) en is hooguit 200 tekens. De route is het patroon (`/club/leden/[id]`). Als sportschool staat alleen de slug van het subdomein of het id uit de cookie `club-org`.
- De rest van de app (PT-app, LifeOS, webshop, MentaForce) wordt bewust overgeslagen.

**Bekijken**: `aiyourgym.com/club/systeem` (alleen Kane, anderen een 404). Daar staan de stand van de database (bereikbaar, reactietijd, opslag van de 500 MB in het gratis plan), de fouten per dag (14 dagen, per onderdeel) en de laatste 30 fouten. Er staat nog geen knop in het menu: typ het adres of zet het in je bladwijzers.

**Wat het niet is**: geen meldingen per mail of telefoon en geen fouten uit de browser. Kijk dus zelf af en toe op de pagina, bijvoorbeeld na elke update.

## 2. Gezondheidscontrole (uptime)

`GET https://fitfactorypt.nl/api/status` geeft:
- `200` en `{ "ok": true, "db": "ok" }` als de app draait en de database binnen 3 seconden antwoordt;
- `503` en `{ "ok": false, "db": "fout" }` of `"traag"` als de database niet (op tijd) antwoordt.

Geen gegevens, geen cache. (`/api/gezondheid` bestond al voor MentaForce, daarom heet deze `/api/status`.)

**Instellen in cron-job.org (gratis, account heb je al)**
1. Log in op cron-job.org en kies **Create cronjob**.
2. Titel: `Fit Factory status`. URL: `https://fitfactorypt.nl/api/status`.
3. Schema: elke 5 minuten (vaker is niet nodig).
4. Bij **Notifications**: zet "Notify me when execution fails" aan, en "when it succeeds again". Een 503 telt als mislukt, dus je krijgt een mail als de database weg is of de app niet draait.
5. Opslaan en een keer **Test run** doen: je moet `200` en `{"ok":true,"db":"ok"}` zien.

Extra voordeel: het gratis Supabase-project wordt gepauzeerd na een week met te weinig activiteit. Elke 5 minuten een proefvraag houdt het project wakker.

## 3. Back-ups: wat er is en wat niet

Nagekeken via Supabase op 17-10-2026:
- Project `bbklogjersviaoocgrve` (naam `lifeos`) draait in **eu-central-1 (Frankfurt)**, Postgres 17.
- De organisatie (Ergonoma) staat op het **gratis plan** (Free).
- Volgens de Supabase-documentatie maakt Supabase **alleen voor Pro, Team en Enterprise** automatisch dagelijkse back-ups (Pro: 7 dagen terug). **Op het gratis plan is er dus geen automatische back-up waarop je kunt terugzetten.** Supabase raadt gratis projecten aan om zelf regelmatig een export te maken met `supabase db dump`.
- **Point in time recovery** (terugzetten tot op de minuut) is een betaalde uitbreiding op Pro (vanaf ongeveer 100 dollar per maand voor 7 dagen, plus minimaal een Small compute). Niet aanwezig.
- Back-ups van de database bevatten **geen bestanden uit Storage** (zoals de logo's van sportscholen), alleen de verwijzingen.
- Een gratis project dat lang stil ligt wordt gepauzeerd; herstellen kan tot 90 dagen daarna.

Ik heb niets aan het plan veranderd en geen kosten gemaakt. Overweeg voor de livegang met echte leden het Pro-plan (25 dollar per maand, dan dagelijkse back-ups van 7 dagen). Dat is een kostenbeslissing voor jou.

**Zelf een back-up maken (gratis, tot je Pro hebt)**
1. Installeer eenmalig de Supabase CLI. Let op: `supabase db dump` gebruikt Docker Desktop. Wil je geen Docker, installeer dan de PostgreSQL 17-clienttools (`pg_dump` en `psql`) en gebruik de tweede variant hieronder.
2. Pak in het Supabase-dashboard bij Connect de connection string (Session pooler) met je databasewachtwoord.
3. Draai in een map buiten de repo:
   ```
   supabase db dump --db-url "<connection string>" -f lifeos-schema.sql
   supabase db dump --db-url "<connection string>" -f lifeos-data.sql --data-only
   ```
   of zonder Docker:
   ```
   pg_dump "<connection string>" --schema=public --no-owner --no-privileges -f lifeos-public.sql
   ```
4. Bewaar de bestanden versleuteld op een plek buiten je pc (bijvoorbeeld een versleutelde map in Google Drive). Ze bevatten persoonsgegevens van leden: nooit in git, nooit onversleuteld delen.
5. Doe dit minstens wekelijks, en altijd voor een grote migratie.

**Terugzet-test (een keer per kwartaal, en voor de livegang)**
1. Maak een tweede, leeg gratis Supabase-project aan (bijvoorbeeld `lifeos-hersteltest`). Kost niets zolang je binnen het gratis aantal projecten blijft; anders eerst overleggen.
2. Zet de back-up terug in dat testproject met `psql` (connection string van het testproject):
   ```
   psql "<connection string testproject>" -f lifeos-schema.sql
   psql "<connection string testproject>" -f lifeos-data.sql
   ```
   (of `psql "<connection string testproject>" -f lifeos-public.sql` bij de variant zonder Docker)
3. Controleer in het testproject met de SQL-editor: `select count(*) from club_leden;`, `select count(*) from club_organisaties;` en `select max(aangemaakt_op) from club_logboek;`. De aantallen moeten kloppen met het echte project.
4. Noteer datum, duur en uitkomst. Verwijder daarna het testproject (er staan echte persoonsgegevens in).

Met Pro gaat terugzetten via Database > Backups in het dashboard. Let op: dan ligt het project tijdens het terugzetten stil en verlies je alles na het moment van de back-up.

## 4. Na het uitrollen even nalopen
- [ ] Migratie 428 staat op de database (is uitgevoerd op 17-10-2026).
- [ ] `fitfactorypt.nl/api/status` geeft `200`.
- [ ] Cron-job.org-taak staat aan met mail bij mislukken.
- [ ] `aiyourgym.com/club/systeem` opent en toont de database als bereikbaar.
- [ ] Eerste eigen back-up gemaakt en een keer teruggezet in een testproject.

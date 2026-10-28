# QA security en autorisatie AI Your Gym (28-10-2026)

Statussen: code beoordeeld / tsc / vitest / live (curl op aiyourgym.com, zonder sessie, niet-destructief).

## 1. Inventaris toegang per route (213 route.ts in club, aiyourgym, widget, mijn)

| Toegang | Aantal | Hoe afgedwongen |
|---|---|---|
| Club-sessie (platform, eigenaar, clubmanager, medewerker) | 119 direct + ongeveer 40 via wrappers (vereisBetalenBeheer, vereisLidgeldBeheer, vereisCommunityBeheer, vereisHulpToegang, vereisBeheerdersBeheer) | `vereisClubToegang`: 404 zonder sessie, `magApi` per rol, CSRF (`isZelfdeOorsprong`) op alles behalve GET/HEAD |
| Lid-sessie | 20 + community/health (`vereisLidToegang`, `vereisCommunityLid`, `vereisLidHealth`) | lid komt altijd uit de sessie; eigendom gecontroleerd (bijv. `annuleerLesVoorLid`: `res.lidId !== lid.id` = 404) |
| Cron | 5 aiyourgym + 1 PT | `x-cron-secret`, constant-time (`geheimGelijk`), fail-closed |
| Webhook | Stripe (aiyourgym), Stripe Connect (club-betalen), health per bron | HMAC over ruwe body met tolerantie 300 s, timingSafeEqual, eventclaim voor idempotentie, body-limiet |
| Openbaar met rem | beschikbaar, status, aanvragen, activeren, lid/inloggen, inloggen*, widget aanvraag, testbetaling, checkout, demo-aanvraag, club-afmelden | rate limit per IP en per e-mail (HMAC), DB-blokkade bij inlogpogingen, same-origin op POST |
| Platform-eigenaar | beheerders, organisatie nieuw/wissel, platform | `vereisPlatformEigenaar` / startlink met IP-rem |

Geen route gevonden zonder controle. Mass assignment: lid-PATCH gebruikt een vaste whitelist (`leesLidWijziging`). SSRF: push-endpoints alleen via allowlist (`isToegestaneDienst`), health-fetch met `redirect: 'error'`. Open redirects: geen redirect naar waarden uit het verzoek; Stripe-terug-url alleen eigen hosts (`portaalTerugUrl`). Foutdetails: geen `error.message` in antwoorden gevonden. Cookies: httpOnly, secure in productie, sameSite lax, `__Host-` waar bedoeld. Tenant-isolatie: `tenant-filter.test.ts` plus uitzonderingenlijst met reden per regel (nagelopen, geen verdachte regel).

## 2. Live testmatrix (zonder sessie)

| Onderdeel | Scenario | Verwacht | Werkelijk | Status |
|---|---|---|---|---|
| Alle 206 API-paden, GET | zonder sessie | 401/403/404, geen data | 210 keer 404, 5 keer 401 (cron), 3 keer 200 (beschikbaar, status, manifest: bewust openbaar, geen persoonsdata) | geslaagd |
| 120+ POST/PATCH/DELETE met `{}` zonder Origin | zonder sessie | 403/404/405 | 23 keer 403 (lid-routes, CSRF-poort), rest 404/405 | geslaagd |
| 20 lid-mutaties mét eigen Origin, zonder sessie | sessiepoort | 404/401 | 20 keer 404 | geslaagd |
| Club-mutaties met eigen Origin zonder sessie | leden, instellingen, vestigingen, beheerders, betalen | 404 | 404 (privacy/start/adres: 405 op POST, juiste methode is PATCH, niet geprobeerd) | geslaagd |
| CORS | OPTIONS met vreemde Origin | geen ACAO | geen Access-Control-* | geslaagd |
| CSRF | POST lid/inloggen met Origin evil.example | 403 | 403 | geslaagd |
| Pagina's | /club, /clubkane, /club/leden, /testgym/club op aiyourgym.com | 404 | 404; /mijn leidt naar /mijn/inloggen | geslaagd |
| fitfactorypt.nl/clubkane | zonder sessie | alleen inlogpagina | 200 inlogpagina; /clubkane/leden 404 | geslaagd |
| Headers | HSTS, X-Frame-Options DENY, Referrer-Policy, nosniff, noindex, no-store | aanwezig | allemaal aanwezig | geslaagd |
| CSP | geen unsafe-inline voor scripts | `script-src 'self' 'unsafe-inline'` | P2, zie open punten | mislukt (bekend) |
| Rate limit beschikbaar | 45 verzoeken, daarna 429 | 429 vanaf 41 | 429 vanaf 41 | geslaagd |
| Rate limit omzeilen | zelfde, elk met eigen `X-Forwarded-For` | 429 blijven | 200 (omzeild) | mislukt, P1, opgelost in code |
| Subdomein foo.aiyourgym.com | niet geconfigureerd | geen antwoord | verbinding mislukt (geen DNS) | geslaagd |

Overgeslagen (blokkade, bewust niet live): POST op checkout, demo-aanvraag, testbetaling, widget-aanvraag, lid/aanvragen, lid/activeren, inloggen*, stripe-webhooks, cron-POST, organisatie/nieuw: 22 combinaties. Reden: kunnen data of mails aanmaken. Alleen code beoordeeld.

## 3. Database (alleen lezen)

Supabase-advisors en een anon-key-test: geblokkeerd. Geen Supabase-MCP in deze sessie en de anon key van het LifeOS-project (bbklogjersviaoocgrve) staat niet in `.env.local` (die heeft alleen het MentaForce-project). Alternatief, statische controle van `supabase/lifeos-migrations` (131 bestanden):
- RLS wordt voor de club_*-tabellen aan gezet via een lus in `380_club_basis.sql` (regel 297) en per tabel elders; geen tabel zonder RLS gevonden die niet door die lus gedekt is (code beoordeeld, niet tegen de live database bevestigd).
- Van 50 functies hebben 48 een `revoke execute`; de twee overige zijn triggerfuncties (`pt_dossier_volgt_klant`, `pt_dossier_rij_van_klant`, niet via RPC aan te roepen). Alle `security definer` functies hebben `set search_path`.
- Bucket `club-logo` is privaat gezet (migratie 401). `355_pt_bibliotheek` en `363` niet nader bekeken (PT, buiten gebied).
Open: Kane of de hoofdsessie draait `get_advisors` (security) en test met de anon key.

## 4. Bevindingen en fixes

| Prio | Probleem | Oplossing | Test |
|---|---|---|---|
| P1 | `ipVan()` nam het eerste adres uit `X-Forwarded-For`, dat een bezoeker zelf kiest. Alle IP-remmen (login, aanmelden, widget, beschikbaar, activeren, lid-aanvragen, platformrem) waren te omzeilen met een nieuwe kop per verzoek; live bevestigd (45 verzoeken 429, met nep-kop weer 200). | `src/lib/club/kern/verzoek.ts`: eerst `CF-Connecting-IP` (door de randdienst gezet en overschreven), dan `True-Client-IP`, pas dan X-Forwarded-For. | `src/lib/club/kern/verzoek.test.ts` (5 tests, ook `isZelfdeOorsprong`) |
| P2 | Rate limit zit in geheugen per instance (`isRateLimited`), reset bij elke deploy. Inloggen is wel ook in de database geblokkeerd; overige remmen niet. | Niet gewijzigd (architectuur). | |
| P2 | CSP heeft `script-src 'unsafe-inline'`. | Niet gewijzigd: nonce-CSP raakt de hele site, eigen ronde. | |
| P2 | PT-crons (`dagplanning-mail`, `lifeos-weekmail`, `lifeos-agenda-sync`, `pt-clubmail`, `push`, `stuur-weekplanning-telegram`) accepteren `?secret=` in de URL (lekt in logs). AI Your Gym-crons zijn goed (alleen header). | Niet gewijzigd: buiten gebied en cron-job.org gebruikt mogelijk de URL-vorm; eerst omzetten bij Kane. | |
| P3 | `x-powered-by: Next.js` en `x-middleware-rewrite` in antwoorden. Health-webhook leest de body voor de lengtecontrole (limiet 64 kB wel gecontroleerd). Andere IP-functies buiten dit gebied (`lifeos/leads/toegang.ts`, `releasev/lib/rate-limit.ts`, `api/contact`) nemen ook het eerste XFF-adres. | Niet gewijzigd. | |

Aanname bij P1: Render zit achter Cloudflare (live: `Server: cloudflare`, `cf-ray`). Hertest na deploy: 45 verzoeken op `/api/aiyourgym/beschikbaar?slug=qa-sec-test` met wisselende `X-Forwarded-For` moet 429 geven vanaf het 41e. Zet de kop `CF-Connecting-IP` niet in het verzoek (Cloudflare overschrijft hem). Als Render hem niet doorgeeft valt `ipVan` terug op oud gedrag en is er niets verslechterd.

## 5. Checks

- `npx vitest run src/lib/club src/lib/aiyourgym src/components/club`: 272 bestanden, 5171 tests geslaagd.
- Incrementele tsc: 1 fout, niet van mij: `src/components/aiyourgym/site/AygNav.tsx(40,28)` `houdFocusInPaneel` niet gevonden (werk van een ander gebied).

## Gewijzigde bestanden

- `src/lib/club/kern/verzoek.ts`
- `src/lib/club/kern/verzoek.test.ts` (nieuw)
- `docs/qa/security-aiyourgym.md` (nieuw)

## Supabase-advisors (hoofdsessie, 28-10-2026 17:10, live database)
- rls_enabled_no_policy (INFO, 141 tabellen, alle club_* en ayg_*): RLS aan zonder policies = anon en authenticated kunnen niets lezen of schrijven; de app werkt alleen met de service role op de server. Dit is de bedoelde dichte stand. Geslaagd.
- anon/authenticated kunnen SECURITY DEFINER-functies pt_dossier_rij_van_klant en pt_dossier_volgt_klant uitvoeren (WARN): triggerfuncties van de PT-app, buiten de scope van AI Your Gym. Genoteerd, niet aangepast.
- Leaked password protection uit (WARN): gaat over Supabase Auth; AI Your Gym gebruikt eigen wachtwoorden (scrypt), niet Supabase Auth. Geen actie.
- Geen club_*- of ayg_*-functie in de WARN-lijst.

# MentaForce

Burn-out preventie voor Nederlandse teams. Medewerkers doen wekelijkse check-ins,
koppelen hun wearable (stappen, slaap, hartslag) en krijgen AI-coaching;
HR ziet anonieme trends en signalen op bedrijfsniveau.

**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · Tailwind 4 · Supabase
(auth, database, storage, edge functions) · Anthropic Claude (AI-coach) ·
Capacitor (Android/iOS) · Recharts

## Snel starten

```bash
npm install
cp .env.example .env.local   # vul de waarden in — zie tabel hieronder
npm run dev                  # → http://localhost:3000
```

Productie-build checken: `npm run build` · Lint: `npm run lint`

## Projectstructuur

```
├── src/
│   ├── app/                  # Alle pagina's en API-routes (Next.js App Router)
│   │   ├── (pagina's)        #   Medewerker: home, checkin, gezondheid, coach,
│   │   │                     #   voeding, sport, doelen, journal, roosters, verlof …
│   │   ├── hr/               #   HR-portaal: dashboard, gesprekken, roosters, protocollen
│   │   ├── agent/            #   Outreach-agent dashboard (alleen eigenaar)
│   │   ├── admin/            #   Admin-pagina
│   │   └── api/              #   Server-routes: AI-coach, OAuth-callbacks, documenten,
│   │                         #   health-insights, voeding, sport, telegram-bot …
│   ├── components/           # Feature-mappen: ui (primitives), layout, auth, checkin,
│   │                         #   coach, gezondheid, hr, marketing, rooster, team, three, vita
│   ├── lib/                  # Gedeelde logica, per domein gegroepeerd in submappen:
│   │   │                     #   supabase/ · auth/ (api-auth, auth-fetch, oauth-state)
│   │   │                     #   health/ (metrics, wearables) · xp/ · doelen/ · plan/
│   │   │                     #   pdf/ · integraties/ (stripe, telegram) · analytics/
│   │   │                     #   navigatie/ (categorie-nav, tiles) · utils/ · coach/ · vita/
│   │   └── types.ts          # Gedeelde types (in lib-root)
│   └── hooks/                # React hooks
├── supabase/                 # Database-migraties + edge functions → zie supabase/README.md
├── scripts/                  # Hulpscripts (o.a. seed-testuser.mjs voor lokale tests)
├── android/ + ios/           # Capacitor native shells (npm run cap:sync na webwijzigingen)
├── public/                   # Statische bestanden (logo)
└── PATCHNOTES.md             # Wat er per release is veranderd, in gewone taal
```

**Vuistregels:**

- Nieuwe pagina → map in `src/app/`, route = mapnaam (Nederlandse URL's).
- Nieuw component → in de feature-map waar het bij hoort; gedeelde primitives in
  `components/ui/`.
- Databasewijziging → genummerde migratie in `supabase/migrations/`.
- Elke API-route die persoonlijke data raakt verifieert de gebruiker via
  `getAuthenticatedUser()` (zie `src/lib/api-auth.ts`); client-side calls gaan
  via `authFetch()` zodat het Bearer-token meegaat.

## Environment-variabelen (.env.local)

| Variabele | Waarvoor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project-URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publieke Supabase-key (RLS beschermt de data) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side admin-key — **nooit** naar de client |
| `NEXT_PUBLIC_APP_URL` | Basis-URL van de app (bijv. `https://mentaforce.nl`) |
| `ANTHROPIC_API_KEY` | Claude — AI-coach, analyses, agent |
| `RESEND_API_KEY` | E-mails (welkom, herinneringen, rapporten) |
| `OAUTH_STATE_SECRET` | HMAC-secret voor OAuth-koppelingen (aanrader; valt terug op service role key) |
| `GOOGLE_FIT_CLIENT_ID` / `GOOGLE_FIT_CLIENT_SECRET` | Google Fit koppeling |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Agenda koppeling |
| `FITBIT_CLIENT_ID` / `FITBIT_CLIENT_SECRET` | Fitbit koppeling |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` / `TELEGRAM_WEBHOOK_SECRET` | Persoonlijke Telegram-assistent |
| `GITHUB_TOKEN` | Outreach-agent (GitHub Actions triggeren) |
| `USDA_API_KEY` | Voedingsdatabase-zoekfunctie |
| `INTERNAL_API_KEY` | Interne beheer-endpoints |

## Gezondheidsdata (wearables)

Eén pijplijn voor alle bronnen, opgeslagen in `health_native_logs` (één rij
per gebruiker per dag, bronnen overschrijven elkaars velden niet):

| Platform | Bron | Route |
|---|---|---|
| iOS-app | Apple Health / Apple Watch (`capacitor-health`) | client leest 14 dagen → `POST /api/health/sync` |
| Android-app | Health Connect (`@devmaxime/capacitor-health-connect`) | client leest 14 dagen → `POST /api/health/sync` |
| Web | Google Fit REST API | server haalt zelf op via `POST /api/google-fit/sync` |

De Gezondheid-pagina synct automatisch bij openen (max. elke 30 min) en heeft
een "Sync nu"-knop. Parsers en merge-logica staan in `src/lib/google-fit-parser.ts`
en `src/lib/health-data.ts` (volledig unit-getest).

**iOS eenmalig instellen (Xcode, vereist macOS):** open `npm run cap:ios`,
voeg onder *Signing & Capabilities* de **HealthKit**-capability toe.
De `NSHealthShareUsageDescription` staat al in `Info.plist`.

## Mobiel (Capacitor)

```bash
npm run cap:sync           # webcode → native projecten
npm run cap:android        # opent Android Studio
npm run cap:ios            # opent Xcode
```

Health Connect (stappen/slaap/hartslag op Android) werkt alleen in de native app.

## Lokaal testen met data

```bash
node scripts/seed-testuser.mjs            # maakt testgebruiker + 14 dagen gezondheidsdata
node scripts/seed-testuser.mjs --cleanup  # ruimt alles weer op
```

> Lokale dev op Windows met TLS-interceptie (antivirus): start met
> `NODE_OPTIONS=--use-system-ca`, anders falen server-side Supabase-calls.

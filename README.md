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
│   ├── components/
│   │   ├── layout/           # Navbar, HrShell, Logo, AndroidBackHandler
│   │   ├── hr/               # HR-tabs, gesprekskaarten/-modals, KPI-cards, HR-code modal
│   │   ├── gezondheid/       # Metriek-tegels, sparklines, detail-sheet, AI-coach card
│   │   ├── rooster/          # Dienstkaart, weekrooster
│   │   └── (root)            # Gedeeld: Avatar, CrisisButton, MoodPulse, DocumentenSectie
│   ├── lib/                  # Gedeelde logica:
│   │   │                     #   supabase.ts (client) · supabase-admin.ts (service role)
│   │   │                     #   api-auth.ts + auth-fetch.ts (Bearer-auth voor API-routes)
│   │   │                     #   oauth-state.ts (CSRF-veilige OAuth-koppelingen)
│   │   │                     #   gezondheid-metrics.ts · health-connect.ts (wearables)
│   │   │                     #   xp.ts · tiles.ts · doelen-config.tsx (gamificatie)
│   │   └── types.ts          # Gedeelde types
│   └── hooks/                # React hooks
├── supabase/                 # Database-migraties + edge functions → zie supabase/README.md
├── scripts/                  # Hulpscripts (o.a. seed-testuser.mjs voor lokale tests)
├── android/ + ios/           # Capacitor native shells (npm run cap:sync na webwijzigingen)
├── public/                   # Statische bestanden (logo)
└── PATCHNOTES.md             # Wat er per release is veranderd, in gewone taal
```

**Vuistregels:**

- Nieuwe pagina → map in `src/app/`, route = mapnaam (Nederlandse URL's).
- Nieuw component → in de feature-map waar het bij hoort; alleen écht gedeelde
  componenten in de root van `components/`.
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

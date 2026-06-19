# Changelog

## [Unreleased] — 2026-06-19

### Bevindingen: 8-agent volledige audit (Product, UX, Growth, VC, Architect, QA, Market, Innovation)

---

### Opgelost (deze sessie)

#### Kritiek — Security & Data-integriteit

- **supabase.ts**: Stille fallback naar `placeholder.supabase.co` verwijderd. Gooit nu een duidelijke fout bij ontbrekende env vars.
- **supabase-admin.ts**: Non-null assertions (`!`) vervangen door expliciete runtime-checks.
- **voeding/route.ts**: Inconsistente zelfgeschreven auth (`getAuth()`) gemigreerd naar gedeeld `getAuthenticatedUser()` + `createAdminClient()` pattern. Module-level service role key exposure opgelost.
- **burnout-predictor/route.ts**: `null` waarden in `waarde_schaal` veroorzaakten `NaN` risico-scores die stil werden opgeslagen. Gefilterd met `if (a.waarde_schaal !== null)`.
- **dashboard/page.tsx**: `fetch('/api/herinnering')` zonder auth header → vervangen door `authFetch()`.

#### Hoog — Bug-fixes

- **date-nl.ts** (nieuw): Centrale timezone-bibliotheek voor `Europe/Amsterdam`. Voorkomt UTC vs. NL-tijdzone bugs bij server-side datumberekeningen.
- **vandaag/route.ts**: UTC-bugs in `vandaag`, `gisteren`, `dagstartUtc`, `uur` berekeningen opgelost via `date-nl.ts`.
- **streak/route.ts**: UTC-bugs in streakberekening en kalender opgelost. Maandpercentage berekening gebruikt nu NL-datum.
- **water/route.ts**: UTC-bug opgelost. Try/catch toegevoegd aan GET, POST, DELETE. Errors lekken niet naar client.
- **slaap/route.ts**: Try/catch toegevoegd aan GET en POST. `await req.json()` nu beveiligd. Errors lekken niet naar client. Input validatie verbeterd (datum format check).
- **burnout-predictor/route.ts**: Upsert-resultaat nu gecheckt; silent 200 OK bij DB-fout was een bug.
- **dashboard/page.tsx**: Drie lege `catch {}` blokken vervangen door `console.error()` met context.

#### Medium — Kwaliteitsverbeteringen

- **mood/route.ts**: Interne `error.message` en `String(err)` lekten in HTTP responses. Generieke berichten voor client, gedetailleerd in server logs.
- **voeding/route.ts**: `body.calorieen || null` → `body.calorieen ?? null` (voorkomt dat 0 naar null wordt omgezet voor voedingswaarden). `parseInt(dagen)` zonder validatie → gevalideerd op bereik 1-365.
- **globals.css**: Dubbele `.mf-card` definitie opgelost (eerste verwijderd, tweede is canonical met padding). Dubbele `.mf-btn-primary` definitie opgelost.
- **globals.css**: Micro-learning componenten gebruikten `--mentaforce-primary` met indigo fallback `#6366f1` → vervangen door `--mf-green` met correcte fallback `#1D9E75`.
- **dashboard/page.tsx**: `AIInsightCard` hardcoded dark colors (`#1a1a2e`, `#2d2d4e`) → CSS tokens (`mf-card`, `var(--mf-green)`).

---

### Openstaand (volgende prioriteit)

Zie [ROADMAP.md](./ROADMAP.md) voor de volledige geprioriteerde lijst.

**Direct kritiek (nog niet geïmplementeerd):**
- `submit-checkin/route.ts` L62-76: Niet-atomische delete+insert zonder transactie → data loss risico bij concurrent submits (QA CRIT-01)
- `achievements/check/route.ts`: Geen `onConflict` op insert → dubbele achievement toekenning mogelijk (QA CRIT-02)
- `submit-checkin/route.ts` L74: `bedrijf_id` niet gevalideerd als eigendom van de user → IDOR-risico (QA HIGH-05)

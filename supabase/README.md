# Supabase — database & edge functions

Alles wat op de Supabase-kant van MentaForce leeft.

## Mappen

| Map | Wat |
|---|---|
| `migrations/` | Alle databasewijzigingen, genummerd in volgorde van toepassen |
| `functions/` | Edge functions (Deno) — draaien op Supabase, niet op de Next.js-server |

## Migraties

De nummers geven de volgorde aan waarin de migraties zijn toegepast.
Ze zijn **handmatig** toegepast (via de SQL Editor of het Supabase MCP) —
we gebruiken niet de Supabase CLI-migratietabel.

| Bestand | Wat het doet |
|---|---|
| `001_checkin_uitgebreid.sql` | Uitgebreide wekelijkse check-in (scores per categorie) |
| `002_checkin_analyses.sql` | AI-analyses van check-ins |
| `002_ontbrekende_tabellen.sql` | Aanvulling van eerder ontbrekende tabellen |
| `003_wearable_tokens.sql` | OAuth-tokens voor Fitbit / Google (server-side opgeslagen) |
| `004_hr_code.sql` | HR-koppelcodes waarmee medewerkers bij een bedrijf horen |
| `004_hr_gesprekken.sql` | HR-gesprekken (plannen, verslagen) |
| `004_roosters.sql` | Werkroosters en diensten |
| `005_hr_uitbreiding.sql` | Extra HR-velden en -rechten |
| `006_documenten.sql` | Documenten/dossier-systeem incl. RLS-policies (AVG) |
| `007_workday.sql` | Workday-features: verlof, uren, declaraties, loonstroken |
| `009_mood_logs.sql` | Dagelijkse stemming-logs |
| `010_sport_fitness.sql` | Sport: oefeningen, schema's, voortgang |
| `011_fitness_company_nullable.sql` | Fix: sport ook zonder bedrijf |
| `012_handle_new_user_rol.sql` | Rol-afhandeling bij registratie |
| `013_agent_rls_hardening.sql` | RLS-aanscherping agent-tabellen (toegepast; outreach-script gebruikt nu de service role key) |
| `014_wearable_tokens_google_fit.sql` | Google Fit toegevoegd aan provider-constraint (toegepast) |
| `015_security_advisories.sql` | Security advisories: checkin_status filtert nu zelf op eigen bedrijf (HR/admin), fitness_voortgang respecteert RLS, hr_code_logs alleen service role, search_path vastgezet, trigger-functies niet via RPC aanroepbaar, avatars-listing dicht (toegepast en geverifieerd) |

**Bewust geaccepteerde advisor-meldingen:**
- `checkin_status` is nog steeds SECURITY DEFINER — dat is nodig om als HR
  check-ins van medewerkers te kunnen lezen. De view filtert sindsdien zélf
  op `auth.uid()` (alleen HR/admin, alleen eigen bedrijf), dus de melding is
  een vals alarm.
- `hr_code_logs` heeft RLS aan zonder policies — bewust: alleen de service
  role (API-routes) mag erbij.
- "Leaked password protection disabled" — aanzetten kan alleen via het
  dashboard: Authentication → Providers → Email → "Prevent use of leaked
  passwords".

**Nieuwe migratie toevoegen:** maak `0XX_korte_naam.sql` met het eerstvolgende
nummer, pas hem toe in Supabase, en zet er bovenin een comment bij wat hij doet.

## Edge functions

| Function | Wat |
|---|---|
| `checkin-reminder` | Stuurt check-in-herinneringen per e-mail (Resend); zie de eigen README |

Deploy via het Supabase dashboard of `supabase functions deploy <naam>`.
Let op: deze code draait in **Deno** — imports wijken af van de Next.js-app
(daarom is deze map uitgesloten van de Next.js TypeScript-check).

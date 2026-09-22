-- ─── LifeOS — RLS aanzetten op agenda_categorie_regels ──────────────────────
-- Beveiligingsfix (Supabase-advisor: "RLS Disabled in Public", ERROR). De tabel
-- `agenda_categorie_regels` (migratie 240) stond in het public-schema en was dus
-- via PostgREST bereikbaar met de anon-key, terwijl RLS er niet op stond.
--
-- LifeOS is single-tenant en wordt UITSLUITEND server-side benaderd via de
-- service-role (createLifeosAdminClient) — die omzeilt RLS. Elke andere lifeos-
-- tabel staat daarom op "RLS aan, geen policy" (deny-all voor anon/authenticated,
-- service-role werkt door). Deze tabel miste dat; hiermee volgt 'ie hetzelfde
-- patroon. Geen policy nodig: er is geen client-side toegang tot dit project.
--
-- Toegepast op het lifeos-project (bbklogjersviaoocgrve); dit bestand is het
-- bijbehorende record in de repo.

alter table public.agenda_categorie_regels enable row level security;

-- ─── LifeOS — PT-dashboard: weekcheck-in vóór het coachgesprek ─────────────
-- Elke PT'er bereidt het wekelijkse coachgesprek met Kane voor op zijn eigen
-- dashboard (mentaforce.nl/<naam>/coach): energie (1–5), wat ging goed, waar liep
-- je tegenaan, wat wil je bespreken en je focus voor volgende week. Kane ziet het
-- in het gesprek en het komt in het pdf-verslag.
--
-- Eén rij per PT'er per week. `week` is de maandag van die week in Nederlandse
-- tijd (YYYY-MM-DD); de server rekent 'm uit (src/lib/lifeos/pt-dashboard/checkin.ts),
-- de PT'er kiest 'm niet. Opnieuw opslaan in dezelfde week = bijwerken (upsert).
-- Elk veld mag leeg; de app vraagt minstens één ingevuld veld.

create table if not exists public.pt_weekcheckins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  persoon_id uuid not null references public.crm_personen (id) on delete cascade,
  week date not null check (extract(isodow from week) = 1),
  energie smallint check (energie is null or energie between 1 and 5),
  gewonnen text check (gewonnen is null or char_length(gewonnen) <= 600),
  lastig text check (lastig is null or char_length(lastig) <= 600),
  bespreken text check (bespreken is null or char_length(bespreken) <= 600),
  focus text check (focus is null or char_length(focus) <= 300),
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now(),
  constraint pt_weekcheckins_persoon_week unique (persoon_id, week)
);
create index if not exists pt_weekcheckins_user_week on public.pt_weekcheckins (user_id, week desc);

-- Alleen de service-role (server) leest en schrijft; geen policy = geen toegang via anon/auth.
alter table public.pt_weekcheckins enable row level security;

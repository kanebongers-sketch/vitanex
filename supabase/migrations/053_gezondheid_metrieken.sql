-- 053 — Gezondheid op Apple Health / Health Connect-niveau.
-- Eén dagrij per gebruiker per bron (bestaat al: unique user_id, datum, bron).
-- Hier komen de metrieken bij die Apple Health en Health Connect standaard
-- leveren. Alles nullable: een bron die iets niet meet, laat het leeg.
-- Plus: losse trainingen (workouts) en een sync-status per bron.

alter table public.health_native_logs
  add column if not exists rusthartslag numeric(5,1) check (rusthartslag is null or rusthartslag between 25 and 220),
  add column if not exists hrv_ms numeric(6,1) check (hrv_ms is null or hrv_ms between 1 and 500),
  add column if not exists vo2max numeric(4,1) check (vo2max is null or vo2max between 10 and 100),
  add column if not exists gewicht_kg numeric(5,2) check (gewicht_kg is null or gewicht_kg between 20 and 400),
  add column if not exists actieve_kcal integer check (actieve_kcal is null or actieve_kcal between 0 and 20000),
  add column if not exists beweegminuten integer check (beweegminuten is null or beweegminuten between 0 and 1440),
  add column if not exists afstand_m integer check (afstand_m is null or afstand_m between 0 and 500000),
  add column if not exists verdiepingen integer check (verdiepingen is null or verdiepingen between 0 and 1000),
  add column if not exists slaap_diep_min integer check (slaap_diep_min is null or slaap_diep_min between 0 and 1440),
  add column if not exists slaap_licht_min integer check (slaap_licht_min is null or slaap_licht_min between 0 and 1440),
  add column if not exists slaap_rem_min integer check (slaap_rem_min is null or slaap_rem_min between 0 and 1440),
  add column if not exists slaap_wakker_min integer check (slaap_wakker_min is null or slaap_wakker_min between 0 and 1440),
  add column if not exists bedtijd timestamptz,
  add column if not exists wektijd timestamptz,
  add column if not exists ademhaling_pm numeric(4,1) check (ademhaling_pm is null or ademhaling_pm between 3 and 60),
  add column if not exists zuurstof_pct numeric(4,1) check (zuurstof_pct is null or zuurstof_pct between 50 and 100),
  add column if not exists bijgewerkt_op timestamptz not null default now();

create table if not exists public.health_workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bron text not null check (bron in ('health_connect', 'healthkit', 'google_health')),
  extern_id text not null,
  soort text not null check (char_length(soort) between 1 and 60),
  start timestamptz not null,
  eind timestamptz not null check (eind > start),
  kcal integer check (kcal is null or kcal between 0 and 20000),
  afstand_m integer check (afstand_m is null or afstand_m between 0 and 500000),
  gem_hartslag numeric(5,1) check (gem_hartslag is null or gem_hartslag between 25 and 250),
  aangemaakt_op timestamptz not null default now(),
  unique (user_id, bron, extern_id)
);
create index if not exists health_workouts_user_start_idx on public.health_workouts (user_id, start desc);
alter table public.health_workouts enable row level security;
drop policy if exists "health_workouts: eigen" on public.health_workouts;
create policy "health_workouts: eigen" on public.health_workouts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.health_sync_status (
  user_id uuid not null references auth.users(id) on delete cascade,
  bron text not null check (bron in ('health_connect', 'healthkit', 'google_health')),
  rechten text[] not null default '{}',
  laatste_sync timestamptz,
  laatste_fout text check (laatste_fout is null or char_length(laatste_fout) <= 500),
  bijgewerkt_op timestamptz not null default now(),
  primary key (user_id, bron)
);
alter table public.health_sync_status enable row level security;
drop policy if exists "health_sync_status: eigen" on public.health_sync_status;
create policy "health_sync_status: eigen" on public.health_sync_status
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

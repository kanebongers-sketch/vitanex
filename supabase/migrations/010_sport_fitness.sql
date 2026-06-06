-- ============================================================
-- Migration 010: Sport & Fitness Feature
-- Tabellen: fitness_schemas, fitness_oefeningen, training_logs,
--           oefening_logs, en view fitness_voortgang
-- ============================================================

-- ============================================================
-- 1. fitness_schemas — AI-gegenereerde trainingsschema's
-- ============================================================
create table if not exists fitness_schemas (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id) on delete cascade,
  company_id       uuid not null,
  naam             text not null,
  doel             text,                          -- 'spiermassa', 'afvallen', 'conditie', ...
  niveau           text check (niveau in ('beginner', 'gemiddeld', 'gevorderd')),
  sessies_per_week int  check (sessies_per_week between 1 and 7),
  schema_json      jsonb,                         -- array van trainingen met oefeningen
  ai_gegenereerd   boolean not null default true,
  aangemaakt_op    timestamptz not null default now(),
  actief           boolean not null default true
);

-- ============================================================
-- 2. fitness_oefeningen — Gedeelde oefeningen bibliotheek
-- ============================================================
create table if not exists fitness_oefeningen (
  id                 uuid primary key default gen_random_uuid(),
  naam               text not null,
  spiergroep         text check (spiergroep in (
                       'borst', 'rug', 'schouders', 'armen',
                       'benen', 'core', 'cardio'
                     )),
  beschrijving       text,
  uitvoering_stappen text[],
  image_url          text,
  moeilijkheid       text check (moeilijkheid in ('beginner', 'gemiddeld', 'gevorderd')),
  benodigdheden      text[],
  aangemaakt_op      timestamptz not null default now()
);

-- ============================================================
-- 3. training_logs — Uitgevoerde trainingen
-- ============================================================
create table if not exists training_logs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  schema_id      uuid references fitness_schemas(id) on delete set null,
  datum          date not null default current_date,
  naam           text,
  duur_minuten   int,
  notities       text,
  aangemaakt_op  timestamptz not null default now()
);

-- ============================================================
-- 4. oefening_logs — Sets/reps/gewicht per oefening per training
-- ============================================================
create table if not exists oefening_logs (
  id               uuid primary key default gen_random_uuid(),
  training_log_id  uuid not null references training_logs(id) on delete cascade,
  user_id          uuid not null references profiles(id) on delete cascade,
  oefening_id      uuid references fitness_oefeningen(id) on delete set null,
  oefening_naam    text not null,               -- altijd invullen als fallback
  set_nummer       int,
  herhalingen      int,
  gewicht_kg       numeric(6,2),               -- null voor bodyweight oefeningen
  notitie          text,
  aangemaakt_op    timestamptz not null default now()
);

-- ============================================================
-- 5. fitness_voortgang — VIEW voor progressie-charts
--    Max gewicht + totaal volume per user, oefening en week
-- ============================================================
create or replace view fitness_voortgang as
select
  ol.user_id,
  ol.oefening_naam,
  date_trunc('week', tl.datum::timestamptz)::date as week_start,
  max(ol.gewicht_kg)                              as max_gewicht,
  sum(ol.herhalingen * coalesce(ol.gewicht_kg, 0))
    * count(distinct ol.set_nummer)               as totaal_volume,
  count(distinct tl.id)                           as aantal_sessies
from oefening_logs ol
join training_logs tl on tl.id = ol.training_log_id
where ol.gewicht_kg is not null
  or ol.herhalingen is not null
group by
  ol.user_id,
  ol.oefening_naam,
  date_trunc('week', tl.datum::timestamptz)::date;

-- ============================================================
-- Indexes
-- ============================================================
create index if not exists idx_training_logs_user_datum
  on training_logs (user_id, datum);

create index if not exists idx_oefening_logs_training_log
  on oefening_logs (training_log_id);

create index if not exists idx_oefening_logs_user_naam
  on oefening_logs (user_id, oefening_naam);

create index if not exists idx_fitness_schemas_user_actief
  on fitness_schemas (user_id, actief);

-- ============================================================
-- Row Level Security
-- ============================================================

-- fitness_schemas
alter table fitness_schemas enable row level security;

create policy "fitness_schemas: eigen rijen lezen"
  on fitness_schemas for select
  using (auth.uid() = user_id);

create policy "fitness_schemas: eigen rijen aanmaken"
  on fitness_schemas for insert
  with check (auth.uid() = user_id);

create policy "fitness_schemas: eigen rijen bijwerken"
  on fitness_schemas for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "fitness_schemas: eigen rijen verwijderen"
  on fitness_schemas for delete
  using (auth.uid() = user_id);

-- fitness_oefeningen — public read, geen client writes
alter table fitness_oefeningen enable row level security;

create policy "fitness_oefeningen: iedereen mag lezen"
  on fitness_oefeningen for select
  using (true);

-- training_logs
alter table training_logs enable row level security;

create policy "training_logs: eigen rijen lezen"
  on training_logs for select
  using (auth.uid() = user_id);

create policy "training_logs: eigen rijen aanmaken"
  on training_logs for insert
  with check (auth.uid() = user_id);

create policy "training_logs: eigen rijen bijwerken"
  on training_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "training_logs: eigen rijen verwijderen"
  on training_logs for delete
  using (auth.uid() = user_id);

-- oefening_logs
alter table oefening_logs enable row level security;

create policy "oefening_logs: eigen rijen lezen"
  on oefening_logs for select
  using (auth.uid() = user_id);

create policy "oefening_logs: eigen rijen aanmaken"
  on oefening_logs for insert
  with check (auth.uid() = user_id);

create policy "oefening_logs: eigen rijen bijwerken"
  on oefening_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "oefening_logs: eigen rijen verwijderen"
  on oefening_logs for delete
  using (auth.uid() = user_id);

-- ============================================================
-- Tabel-overzicht
-- ============================================================
-- fitness_schemas     : AI-gegenereerde trainingsschema's per user
-- fitness_oefeningen  : Gedeelde bibliotheek van oefeningen (public read)
-- training_logs       : Logboek van uitgevoerde trainingen per user
-- oefening_logs       : Sets, reps en gewichten per oefening per training
-- fitness_voortgang   : VIEW — max gewicht + volume per user/oefening/week
-- ============================================================

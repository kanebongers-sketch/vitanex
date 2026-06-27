-- ============================================================
-- Migration 026: Intake-enquête, doelen & lichaamsmetingen
--
-- 1. profiles: nieuwe intake-/doelvelden (activiteitsniveau, fitness_doel,
--    streefgewicht, vetpercentage, water-/stappen-/calorie-doel, dieet,
--    allergieën, intake_voltooid).
-- 2. lichaamsmetingen: tijdreeks van gewicht/vetpercentage voor de
--    prestaties-grafieken in het profiel.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS + CREATE TABLE IF NOT EXISTS.
-- Bestaande kolommen (gewicht_kg, lengte_cm, geboortedatum, geslacht)
-- blijven ongemoeid.
-- ============================================================

-- ─── 1. profiles uitbreiden ─────────────────────────────────
alter table profiles add column if not exists activiteitsniveau text
  check (activiteitsniveau in ('sedentair','licht','gemiddeld','actief','zeer_actief'));

alter table profiles add column if not exists fitness_doel text
  check (fitness_doel in ('afvallen','onderhouden','aankomen','fitter'));

alter table profiles add column if not exists streefgewicht_kg numeric(5,2);

-- Zelf ingevoerd vetpercentage (0–70%).
alter table profiles add column if not exists vetpercentage numeric(4,1)
  check (vetpercentage is null or (vetpercentage >= 0 and vetpercentage <= 70));

-- Doelen: null = automatisch berekend uit het profiel; een waarde = handmatig
-- overschreven via Instellingen.
alter table profiles add column if not exists water_doel_ml int
  check (water_doel_ml is null or (water_doel_ml between 500 and 6000));

alter table profiles add column if not exists stappen_doel int
  check (stappen_doel is null or (stappen_doel between 1000 and 50000));

alter table profiles add column if not exists calorie_doel int
  check (calorie_doel is null or (calorie_doel between 800 and 8000));

alter table profiles add column if not exists dieetvoorkeur text
  check (dieetvoorkeur in ('geen','vegetarisch','veganistisch','pescotarisch','keto','mediterraan','glutenvrij','lactosevrij'));

alter table profiles add column if not exists allergieen text[];

alter table profiles add column if not exists intake_voltooid boolean not null default false;

-- ─── 2. lichaamsmetingen — gewicht/vetpercentage tijdreeks ──
create table if not exists lichaamsmetingen (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  datum          date not null default current_date,
  gewicht_kg     numeric(5,2),
  vetpercentage  numeric(4,1) check (vetpercentage is null or (vetpercentage >= 0 and vetpercentage <= 70)),
  notitie        text,
  aangemaakt_op  timestamptz not null default now(),
  unique (user_id, datum)
);

create index if not exists idx_lichaamsmetingen_user_datum
  on lichaamsmetingen (user_id, datum desc);

alter table lichaamsmetingen enable row level security;

drop policy if exists "lichaamsmetingen: eigen rijen lezen" on lichaamsmetingen;
create policy "lichaamsmetingen: eigen rijen lezen"
  on lichaamsmetingen for select using (auth.uid() = user_id);

drop policy if exists "lichaamsmetingen: eigen rijen aanmaken" on lichaamsmetingen;
create policy "lichaamsmetingen: eigen rijen aanmaken"
  on lichaamsmetingen for insert with check (auth.uid() = user_id);

drop policy if exists "lichaamsmetingen: eigen rijen bijwerken" on lichaamsmetingen;
create policy "lichaamsmetingen: eigen rijen bijwerken"
  on lichaamsmetingen for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "lichaamsmetingen: eigen rijen verwijderen" on lichaamsmetingen;
create policy "lichaamsmetingen: eigen rijen verwijderen"
  on lichaamsmetingen for delete using (auth.uid() = user_id);

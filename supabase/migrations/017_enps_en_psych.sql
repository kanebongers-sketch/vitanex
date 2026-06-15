-- ================================================================
-- MentaForce – Migratie 017: eNPS tabel + HR analytics
-- ================================================================

-- ── 1. eNPS antwoorden (maandelijks per medewerker) ─────────────
create table if not exists enps_antwoorden (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  bedrijf_id    uuid not null references bedrijven(id) on delete cascade,
  score         int  not null check (score between 0 and 10),
  toelichting   text,
  categorie     text not null check (categorie in ('promoter','passive','detractor')),
  aangemaakt_op timestamptz not null default now()
);

alter table enps_antwoorden enable row level security;

-- Medewerkers mogen alleen eigen records zien, HR mag bedrijf lezen
create policy "enps_antwoorden: eigen schrijven"
  on enps_antwoorden for insert with check (auth.uid() = user_id);

create policy "enps_antwoorden: eigen lezen"
  on enps_antwoorden for select using (auth.uid() = user_id);

create policy "enps_antwoorden: hr leest bedrijf"
  on enps_antwoorden for select using (
    exists (
      select 1 from profiles
      where id = auth.uid()
        and rol in ('hr','admin')
        and bedrijf_id = enps_antwoorden.bedrijf_id
    )
  );

create index if not exists idx_enps_antwoorden_bedrijf
  on enps_antwoorden(bedrijf_id, aangemaakt_op desc);

-- ── 2. Maak enps_metingen tabel backwards-compatible ────────────
-- De bestaande /api/enps route gebruikt enps_metingen
-- Hier voegen we bedrijf_id toe als die nog niet bestaat
alter table if exists enps_metingen
  add column if not exists bedrijf_id uuid references bedrijven(id);

-- ── 3. Team uitdaging logs index (voor snellere queries) ─────────
create index if not exists idx_uitdaging_logs_uitdaging
  on uitdaging_logs(uitdaging_id, aangemaakt_op desc);

-- ── 4. Focus sessies: dag-niveau aggregaat view ──────────────────
create or replace view focus_dag_totalen as
select
  user_id,
  aangemaakt_op::date as datum,
  sum(duur_minuten)   as totaal_minuten,
  count(*)            as aantal_sessies
from focus_sessies
group by user_id, aangemaakt_op::date;

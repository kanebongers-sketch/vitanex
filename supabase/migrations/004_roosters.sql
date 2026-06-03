-- ============================================================
-- MentaForce: Rooster systeem
-- ============================================================

-- Roosters: een rooster is een named planningsperiode (bijv. "Week 23 - Team A")
create table if not exists roosters (
  id            uuid primary key default gen_random_uuid(),
  bedrijf_id    uuid not null references bedrijven(id) on delete cascade,
  naam          text not null,
  week_start    date not null,       -- altijd maandag van de week
  aangemaakt_door uuid references profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

-- Diensten: één dienst per medewerker per dag binnen een rooster
create table if not exists rooster_diensten (
  id            uuid primary key default gen_random_uuid(),
  rooster_id    uuid not null references roosters(id) on delete cascade,
  user_id       uuid not null references profiles(id) on delete cascade,
  datum         date not null,
  start_tijd    time not null,       -- bijv. 09:00
  eind_tijd     time not null,       -- bijv. 17:00
  rol_label     text,                -- optioneel: "Kassa", "Magazijn", etc.
  notitie       text,
  created_at    timestamptz not null default now()
);

-- Indexes voor snelle lookups
create index if not exists roosters_bedrijf_idx       on roosters(bedrijf_id);
create index if not exists roosters_week_start_idx    on roosters(week_start);
create index if not exists diensten_rooster_idx       on rooster_diensten(rooster_id);
create index if not exists diensten_user_idx          on rooster_diensten(user_id);
create index if not exists diensten_datum_idx         on rooster_diensten(datum);

-- RLS
alter table roosters          enable row level security;
alter table rooster_diensten  enable row level security;

-- HR/admin: volledige toegang tot roosters van eigen bedrijf
create policy "hr_roosters_select" on roosters for select
  using (
    bedrijf_id in (
      select bedrijf_id from profiles where id = auth.uid() and rol in ('hr','admin')
    )
  );

create policy "hr_roosters_insert" on roosters for insert
  with check (
    bedrijf_id in (
      select bedrijf_id from profiles where id = auth.uid() and rol in ('hr','admin')
    )
  );

create policy "hr_roosters_update" on roosters for update
  using (
    bedrijf_id in (
      select bedrijf_id from profiles where id = auth.uid() and rol in ('hr','admin')
    )
  );

create policy "hr_roosters_delete" on roosters for delete
  using (
    bedrijf_id in (
      select bedrijf_id from profiles where id = auth.uid() and rol in ('hr','admin')
    )
  );

-- Medewerker: kan roosters van eigen bedrijf lezen (om diensten te tonen)
create policy "medewerker_roosters_select" on roosters for select
  using (
    bedrijf_id in (
      select bedrijf_id from profiles where id = auth.uid()
    )
  );

-- HR/admin: volledige toegang tot diensten van eigen bedrijf
create policy "hr_diensten_select" on rooster_diensten for select
  using (
    rooster_id in (
      select r.id from roosters r
      join profiles p on p.bedrijf_id = r.bedrijf_id
      where p.id = auth.uid() and p.rol in ('hr','admin')
    )
  );

create policy "hr_diensten_insert" on rooster_diensten for insert
  with check (
    rooster_id in (
      select r.id from roosters r
      join profiles p on p.bedrijf_id = r.bedrijf_id
      where p.id = auth.uid() and p.rol in ('hr','admin')
    )
  );

create policy "hr_diensten_update" on rooster_diensten for update
  using (
    rooster_id in (
      select r.id from roosters r
      join profiles p on p.bedrijf_id = r.bedrijf_id
      where p.id = auth.uid() and p.rol in ('hr','admin')
    )
  );

create policy "hr_diensten_delete" on rooster_diensten for delete
  using (
    rooster_id in (
      select r.id from roosters r
      join profiles p on p.bedrijf_id = r.bedrijf_id
      where p.id = auth.uid() and p.rol in ('hr','admin')
    )
  );

-- Medewerker: ziet alleen eigen diensten
create policy "medewerker_diensten_select" on rooster_diensten for select
  using (user_id = auth.uid());

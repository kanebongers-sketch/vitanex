-- HR Gesprekken tabel
create table if not exists hr_gesprekken (
  id uuid primary key default gen_random_uuid(),
  bedrijf_id text not null,
  hr_user_id uuid not null references profiles(id) on delete cascade,
  medewerker_id uuid not null references profiles(id) on delete cascade,
  datum date not null,
  type text not null check (type in ('functionering', 'beoordeling', 'welzijn', 'overig')),
  onderwerp text not null,
  notities_intern text,
  samenvatting_medewerker text,
  actiepunten jsonb not null default '[]'::jsonb,
  status text not null default 'gepland' check (status in ('gepland', 'afgerond', 'geannuleerd')),
  followup_datum date,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now()
);

-- Indexes voor performance
create index if not exists hr_gesprekken_bedrijf_id_idx on hr_gesprekken(bedrijf_id);
create index if not exists hr_gesprekken_medewerker_id_idx on hr_gesprekken(medewerker_id);
create index if not exists hr_gesprekken_datum_idx on hr_gesprekken(datum);

-- RLS
alter table hr_gesprekken enable row level security;

-- HR/admin mag alles zien binnen hun bedrijf
create policy "hr_gesprekken_hr_select" on hr_gesprekken
  for select using (
    bedrijf_id in (
      select bedrijf_id from profiles where id = auth.uid() and rol in ('hr', 'admin')
    )
  );

create policy "hr_gesprekken_hr_insert" on hr_gesprekken
  for insert with check (
    bedrijf_id in (
      select bedrijf_id from profiles where id = auth.uid() and rol in ('hr', 'admin')
    )
  );

create policy "hr_gesprekken_hr_update" on hr_gesprekken
  for update using (
    bedrijf_id in (
      select bedrijf_id from profiles where id = auth.uid() and rol in ('hr', 'admin')
    )
  );

create policy "hr_gesprekken_hr_delete" on hr_gesprekken
  for delete using (
    bedrijf_id in (
      select bedrijf_id from profiles where id = auth.uid() and rol in ('hr', 'admin')
    )
  );

-- Medewerker mag alleen hun eigen gesprekken zien (beperkte velden via view)
create policy "hr_gesprekken_medewerker_select" on hr_gesprekken
  for select using (medewerker_id = auth.uid());

-- View voor medewerkers (verbergt interne notities)
create or replace view mijn_gesprekken as
  select
    id,
    datum,
    type,
    onderwerp,
    samenvatting_medewerker,
    actiepunten,
    status,
    followup_datum,
    aangemaakt_op
  from hr_gesprekken
  where medewerker_id = auth.uid();

-- Trigger voor bijgewerkt_op
create or replace function update_bijgewerkt_op()
returns trigger language plpgsql as $$
begin
  new.bijgewerkt_op = now();
  return new;
end;
$$;

create trigger hr_gesprekken_bijgewerkt_op
  before update on hr_gesprekken
  for each row execute function update_bijgewerkt_op();

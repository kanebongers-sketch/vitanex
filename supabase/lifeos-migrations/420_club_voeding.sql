-- ─── Club: voeding voor de coaching ─────────────────────────────────────────
-- Per sportschool (user_id) een voedingsplan per lid, door de trainer:
-- dagdoelen (kcal, eiwit, koolhydraten en vet in gram), vrije adviezen en een
-- eenvoudige dagindeling (maaltijden met voorbeeldproducten als vrije tekst,
-- geen productdatabase). berekening bewaart de invoer van de rekenhulp
-- (Mifflin-St Jeor, src/lib/club/voeding/rekenhulp.ts). notitie is intern en
-- gaat nooit naar de ledenapp. Een plan is een richtlijn, geen medisch advies.
-- Sjablonen per sportschool vullen een plan snel in; dagdoelen mogen daar leeg.
-- Idempotent; voegt alleen toe. Alleen de server schrijft (RLS aan, geen policies).

create table if not exists public.club_voedingssjablonen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  naam text not null check (char_length(naam) between 1 and 60),
  omschrijving text check (char_length(omschrijving) <= 300),
  doel text check (doel in ('afvallen', 'onderhoud', 'aankomen')),
  eiwit_per_kg numeric(3,1) check (eiwit_per_kg between 0.8 and 2.5),
  kcal int check (kcal between 800 and 6000),
  eiwit_g int check (eiwit_g between 0 and 500),
  koolhydraten_g int check (koolhydraten_g between 0 and 1000),
  vet_g int check (vet_g between 0 and 400),
  adviezen text[] not null default '{}',
  maaltijden jsonb not null default '[]'::jsonb check (jsonb_typeof(maaltijden) = 'array'),
  demo boolean not null default false,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now()
);
create index if not exists club_voedingssjablonen_naam_idx on public.club_voedingssjablonen (user_id, naam);

create table if not exists public.club_voedingsplannen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  lid_id uuid not null references public.club_leden(id) on delete cascade,
  doel text check (doel in ('afvallen', 'onderhoud', 'aankomen')),
  kcal int not null check (kcal between 800 and 6000),
  eiwit_g int not null check (eiwit_g between 0 and 500),
  koolhydraten_g int not null check (koolhydraten_g between 0 and 1000),
  vet_g int not null check (vet_g between 0 and 400),
  adviezen text[] not null default '{}',
  maaltijden jsonb not null default '[]'::jsonb check (jsonb_typeof(maaltijden) = 'array'),
  notitie text check (char_length(notitie) <= 1000),
  berekening jsonb,
  sjabloon_id uuid references public.club_voedingssjablonen(id) on delete set null,
  bijgewerkt_door text,
  demo boolean not null default false,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now()
);
-- Een lid heeft een huidig plan.
create unique index if not exists club_voedingsplannen_lid_uniek on public.club_voedingsplannen (user_id, lid_id);
create index if not exists club_voedingsplannen_bijgewerkt_idx on public.club_voedingsplannen (user_id, bijgewerkt_op desc);
create index if not exists club_voedingsplannen_sjabloon_idx on public.club_voedingsplannen (sjabloon_id) where sjabloon_id is not null;

alter table public.club_voedingssjablonen enable row level security;
alter table public.club_voedingsplannen enable row level security;
revoke all on public.club_voedingssjablonen from anon, authenticated;
revoke all on public.club_voedingsplannen from anon, authenticated;

-- ── Demodata ────────────────────────────────────────────────────────────────
-- Per sportschool drie sjablonen; voor een paar demo-leden een plan.
insert into public.club_voedingssjablonen (id, user_id, naam, omschrijving, doel, eiwit_per_kg, kcal, eiwit_g, koolhydraten_g, vet_g, adviezen, maaltijden, demo)
select s.id::uuid, o.user_id::uuid, s.naam, s.omschrijving, s.doel, s.eiwit_per_kg, s.kcal, s.eiwit_g, s.kh, s.vet, s.adviezen, s.maaltijden::jsonb, true
from (values ('67b0a700-3f1d-425e-9646-98c237e34fd7', '0'), ('de000000-0000-4000-8000-0000000000c1', '1')) as o(user_id, nr)
cross join lateral (values
  ('f00d0000-0000-4000-8000-00000000' || o.nr || '001', 'Rustig afvallen', 'Een kleine min op het verbruik, met veel eiwit en groente om verzadigd te blijven.', 'afvallen', 1.8::numeric, null::int, null::int, null::int, null::int,
   array['Elke maaltijd een eiwitbron', 'De helft van je bord groente', 'Drink water bij elke maaltijd', 'Plan een tussendoortje in plaats van te snaaien'],
   '[{"naam":"Ontbijt","tijd":"07:30","voorbeelden":"Magere kwark met havermout en blauwe bessen"},{"naam":"Lunch","tijd":"12:30","voorbeelden":"Twee volkoren boterhammen met kipfilet, tomaat en komkommer"},{"naam":"Tussendoor","tijd":"15:30","voorbeelden":"Appel en een handje ongezouten noten"},{"naam":"Avondeten","tijd":"18:30","voorbeelden":"Zalm, zilvervliesrijst en broccoli"}]'),
  ('f00d0000-0000-4000-8000-00000000' || o.nr || '002', 'Fit blijven', 'Gelijk aan het verbruik, voor leden die vooral sterker en fitter willen worden.', 'onderhoud', 1.6::numeric, null::int, null::int, null::int, null::int,
   array['Elke maaltijd een eiwitbron', 'Kies vaker volkoren', 'Eet twee stuks fruit per dag'],
   '[{"naam":"Ontbijt","tijd":"08:00","voorbeelden":"Volkoren yoghurt met muesli en banaan"},{"naam":"Lunch","tijd":"12:30","voorbeelden":"Salade met ei, kikkererwten en volkorenbrood"},{"naam":"Avondeten","tijd":"18:30","voorbeelden":"Kipfilet, aardappelen en sperziebonen"}]'),
  ('f00d0000-0000-4000-8000-00000000' || o.nr || '003', 'Spieropbouw', 'Iets boven het verbruik met ruim eiwit, verdeeld over vier momenten.', 'aankomen', 2.0::numeric, null::int, null::int, null::int, null::int,
   array['Verdeel je eiwit over vier momenten', 'Eet binnen twee uur na het trainen een maaltijd', 'Neem koolhydraten rond je training'],
   '[{"naam":"Ontbijt","tijd":"07:30","voorbeelden":"Drie eieren, volkorenbrood en avocado"},{"naam":"Lunch","tijd":"12:30","voorbeelden":"Wraps met rundergehakt, bonen en paprika"},{"naam":"Na de training","tijd":"17:00","voorbeelden":"Kwark met banaan en havermout"},{"naam":"Avondeten","tijd":"19:00","voorbeelden":"Volkorenpasta met kip en groente"}]')
) as s(id, naam, omschrijving, doel, eiwit_per_kg, kcal, eiwit_g, kh, vet, adviezen, maaltijden)
on conflict (id) do nothing;

-- Plannen voor de eerste vier actieve demo-leden van elke sportschool (Fit Factory: Budel).
insert into public.club_voedingsplannen (user_id, lid_id, doel, kcal, eiwit_g, koolhydraten_g, vet_g, adviezen, maaltijden, notitie, sjabloon_id, bijgewerkt_door, demo)
select l.user_id, l.id, p.doel, p.kcal, p.eiwit, p.kh, p.vet, s.adviezen, s.maaltijden, 'Demo: eerste versie na de intake.', s.id, 'Demo', true
from (
  select id, user_id, row_number() over (partition by user_id order by id) as nr
  from public.club_leden
  where demo = true and status = 'actief'
    and ((user_id = '67b0a700-3f1d-425e-9646-98c237e34fd7' and vestiging = 'budel') or user_id = 'de000000-0000-4000-8000-0000000000c1')
) l
join (values
  (1, 'afvallen', 2050, 150, 205, 57, '001'),
  (2, 'onderhoud', 2600, 125, 320, 72, '002'),
  (3, 'aankomen', 3100, 165, 390, 86, '003'),
  (4, 'afvallen', 1800, 125, 180, 50, '001')
) as p(nr, doel, kcal, eiwit, kh, vet, sjabloon) on p.nr = l.nr
join public.club_voedingssjablonen s
  on s.user_id = l.user_id and s.demo = true
  and s.id = ('f00d0000-0000-4000-8000-00000000' || case when l.user_id = '67b0a700-3f1d-425e-9646-98c237e34fd7' then '0' else '1' end || p.sjabloon)::uuid
on conflict (user_id, lid_id) do nothing;

-- ─── Club: afspraken met trainers (intakes, personal training, metingen) ────
-- Aanvulling, idempotent; veilig om opnieuw te draaien. Alleen toevoegen.
--
-- 1. club_afspraak_typen: soorten afspraken per sportschool (naam, duur,
--    buffer na afloop, kleur, wie ze mag geven, boekregels voor de app).
-- 2. club_afspraken: een afspraak van een lid (verplicht, eventueel gekoppeld
--    aan een lead) met een medewerker in een vestiging.
--    Dubbel boeken is in de database zelf onmogelijk (race-veilig): een
--    medewerker kan geen twee afspraken hebben die elkaar (met buffer)
--    overlappen, en een lid ook niet. Geannuleerde afspraken tellen niet mee.
-- 3. Demodata (demo = true) voor Fit Factory (Budel) en Voorbeeld Gym, en een
--    functie die de demo-afspraken elke nacht aanvult (pg_cron, 03:40).
--
-- Weghalen van de demodata:
--   delete from club_afspraken where demo; delete from club_afspraak_typen where demo;
--   select cron.unschedule('club-afspraken-demo');

create extension if not exists btree_gist with schema extensions;

-- ── 1. Afspraaktypen ────────────────────────────────────────────────────────
create table if not exists public.club_afspraak_typen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  naam text not null check (char_length(naam) between 1 and 80),
  duur_min int not null check (duur_min between 5 and 480),
  buffer_min int not null default 0 check (buffer_min between 0 and 120),
  kleur text not null default 'amber' check (kleur in ('amber','blauw','groen','roze','turkoois','geel','lila','zand')),
  -- Leeg = elke trainer van de vestiging mag dit type geven.
  medewerker_ids uuid[] not null default '{}',
  app_boekbaar boolean not null default true,
  boeken_uren_vooraf int not null default 12 check (boeken_uren_vooraf between 0 and 336),
  annuleren_uren_vooraf int not null default 24 check (annuleren_uren_vooraf between 0 and 336),
  actief boolean not null default true,
  volgorde int not null default 0,
  demo boolean not null default false,
  aangemaakt_op timestamptz not null default now()
);
create index if not exists club_afspraak_typen_user on public.club_afspraak_typen (user_id, volgorde);

-- ── 2. Afspraken ────────────────────────────────────────────────────────────
create table if not exists public.club_afspraken (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  vestiging text not null references public.club_vestigingen(vestiging),
  type_id uuid not null references public.club_afspraak_typen(id) on delete restrict,
  medewerker_id uuid not null references public.club_medewerkers(id) on delete cascade,
  lid_id uuid not null references public.club_leden(id) on delete cascade,
  lead_id uuid references public.club_leads(id) on delete set null,
  start_op timestamptz not null,
  eind_op timestamptz not null,
  -- Eind plus de buffer van het type: tot dan is de medewerker bezet.
  bezet_tot timestamptz not null,
  status text not null default 'gepland' check (status in ('gepland','geweest','niet_gekomen','geannuleerd')),
  notitie text check (char_length(notitie) <= 1000),
  geboekt_door text not null default 'balie' check (geboekt_door in ('balie','trainer','app')),
  geannuleerd_op timestamptz,
  demo boolean not null default false,
  aangemaakt_op timestamptz not null default now(),
  gewijzigd_op timestamptz not null default now(),
  check (eind_op > start_op),
  check (bezet_tot >= eind_op)
);
create index if not exists club_afspraken_vestiging_start on public.club_afspraken (user_id, vestiging, start_op);
create index if not exists club_afspraken_lid on public.club_afspraken (user_id, lid_id, start_op);
create index if not exists club_afspraken_medewerker on public.club_afspraken (user_id, medewerker_id, start_op);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'club_afspraken_medewerker_vrij') then
    alter table public.club_afspraken add constraint club_afspraken_medewerker_vrij
      exclude using gist (medewerker_id with =, tstzrange(start_op, bezet_tot, '[)') with &&)
      where (status <> 'geannuleerd');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'club_afspraken_lid_vrij') then
    alter table public.club_afspraken add constraint club_afspraken_lid_vrij
      exclude using gist (lid_id with =, tstzrange(start_op, eind_op, '[)') with &&)
      where (status <> 'geannuleerd');
  end if;
end $$;

alter table public.club_afspraak_typen enable row level security;
alter table public.club_afspraken enable row level security;

-- ── 3. Demodata ─────────────────────────────────────────────────────────────
-- Typen: alleen als de sportschool nog geen demo-typen heeft.
do $$
declare
  org uuid;
begin
  foreach org in array array['67b0a700-3f1d-425e-9646-98c237e34fd7', 'de000000-0000-4000-8000-0000000000c1']::uuid[]
  loop
    if exists (select 1 from public.club_vestigingen where user_id = org)
       and not exists (select 1 from public.club_afspraak_typen where user_id = org and demo) then
      insert into public.club_afspraak_typen (user_id, naam, duur_min, buffer_min, kleur, app_boekbaar, boeken_uren_vooraf, annuleren_uren_vooraf, volgorde, demo) values
        (org, 'Intake', 45, 15, 'amber', true, 24, 24, 1, true),
        (org, 'Personal training 30 min', 30, 5, 'blauw', true, 12, 24, 2, true),
        (org, 'Personal training 60 min', 60, 10, 'turkoois', true, 12, 24, 3, true),
        (org, 'Voortgangsmeting', 30, 0, 'groen', true, 24, 12, 4, true),
        (org, 'Leefstijlgesprek', 45, 0, 'lila', false, 48, 48, 5, true);
    end if;
  end loop;
end $$;

-- Afspraken: per dag en per demo-vestiging, alleen als die dag nog leeg is.
-- Deterministisch (hash van medewerker, dag en uur), binnen de openingstijden
-- en de vaste beschikbaarheid. Overlap slaat de database zelf over.
create or replace function public.club_afspraken_demo_verversen() returns void
language plpgsql
set search_path = public, extensions
as $$
declare
  vandaag date := (now() at time zone 'Europe/Amsterdam')::date;
begin
  insert into public.club_afspraken (user_id, vestiging, type_id, medewerker_id, lid_id, start_op, eind_op, bezet_tot, status, geboekt_door, notitie, demo)
  select k.user_id, k.vestiging, k.type_id, k.medewerker_id, k.lid_id,
    k.start_op, k.start_op + k.duur_min * interval '1 minute', k.start_op + (k.duur_min + k.buffer_min) * interval '1 minute',
    case
      when k.dag >= vandaag then (case when k.h % 17 = 0 then 'geannuleerd' else 'gepland' end)
      when k.h % 11 = 0 then 'niet_gekomen'
      when k.h % 17 = 0 then 'geannuleerd'
      else 'geweest'
    end,
    (array['balie','trainer','app','app'])[1 + k.h % 4],
    case when k.h % 9 = 0 then 'Demo: wil vooral aan conditie werken' end,
    true
  from (
    select v.user_id, v.vestiging, m.id as medewerker_id, d::date as dag, u.uur,
      abs(hashtext(m.id::text || d::date::text || u.uur::text)) as h,
      ((d::date + make_time(u.uur, 0, 0)) at time zone 'Europe/Amsterdam') as start_op,
      ty.id as type_id, ty.duur_min, ty.buffer_min,
      (select l.id from public.club_leden l
        where l.user_id = v.user_id and l.vestiging = v.vestiging and l.demo and l.status in ('actief','proef')
        order by l.id
        offset (abs(hashtext(m.id::text || d::date::text || u.uur::text || 'lid')) % greatest(1, (
          select count(*) from public.club_leden l2 where l2.user_id = v.user_id and l2.vestiging = v.vestiging and l2.demo and l2.status in ('actief','proef'))))
        limit 1) as lid_id,
      v.openingstijden -> extract(isodow from d)::text as open_dag
    from public.club_vestigingen v
    cross join generate_series(vandaag - 7, vandaag + 14, interval '1 day') d
    join public.club_medewerkers m on m.user_id = v.user_id and m.demo and m.actief and 'trainer' = any(m.rollen) and v.vestiging = any(m.vestigingen)
    cross join (values (7), (9), (10), (12), (16), (17), (18), (19), (20)) u(uur)
    cross join lateral (
      select t.id, t.duur_min, t.buffer_min from public.club_afspraak_typen t
      where t.user_id = v.user_id and t.demo and t.actief
      order by t.volgorde
      offset (abs(hashtext(m.id::text || d::date::text || u.uur::text || 'type')) % 5) limit 1
    ) ty
    where v.vestiging in ('budel', 'voorbeeld-centrum', 'voorbeeld-noord')
      and extract(isodow from d) <> 7
      and not exists (select 1 from public.club_afspraken a where a.demo and a.vestiging = v.vestiging and (a.start_op at time zone 'Europe/Amsterdam')::date = d::date)
      and abs(hashtext(m.id::text || d::date::text || u.uur::text)) % 100 < 26
      -- Niet op een dag dat de medewerker niet kan (losse datum, anders vaste weekdag).
      and not exists (
        select 1 from public.club_beschikbaarheid b
        where b.medewerker_id = m.id and b.beschikbaar = false
          and ((b.datum is not null and d::date between b.datum and coalesce(b.datum_tot, b.datum))
            or (b.weekdag = extract(isodow from d) and not exists (
              select 1 from public.club_beschikbaarheid b2 where b2.medewerker_id = m.id and b2.datum is not null and d::date between b2.datum and coalesce(b2.datum_tot, b2.datum)))))
      -- Vaste tijden (bijv. alleen 's avonds): dan moet het uur erbinnen vallen.
      and (
        not exists (select 1 from public.club_beschikbaarheid b where b.medewerker_id = m.id and b.beschikbaar and b.weekdag = extract(isodow from d))
        or exists (select 1 from public.club_beschikbaarheid b where b.medewerker_id = m.id and b.beschikbaar and b.weekdag = extract(isodow from d)
          and (b.van is null or make_time(u.uur, 0, 0) >= b.van) and (b.tot is null or make_time(u.uur, 0, 0) + interval '1 hour' <= b.tot))
      )
  ) k
  where k.lid_id is not null
    and k.open_dag is not null
    and make_time(k.uur, 0, 0) >= (k.open_dag ->> 0)::time
    and make_time(k.uur, 0, 0) + k.duur_min * interval '1 minute' <= (k.open_dag ->> 1)::time
  on conflict do nothing;

  -- Voorbije demo-afspraken die nog op gepland staan, afronden.
  update public.club_afspraken
  set status = case when abs(hashtext(id::text)) % 10 = 0 then 'niet_gekomen' else 'geweest' end, gewijzigd_op = now()
  where demo and status = 'gepland' and eind_op < now();
end $$;

select public.club_afspraken_demo_verversen();

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron')
     and not exists (select 1 from cron.job where jobname = 'club-afspraken-demo') then
    perform cron.schedule('club-afspraken-demo', '40 3 * * *', 'select public.club_afspraken_demo_verversen()');
  end if;
end $$;

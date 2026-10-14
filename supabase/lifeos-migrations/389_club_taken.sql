-- ─── Fit Factory clubsoftware: taken en poetslijsten ────────────────────────
-- Vervangt de twee Excel-bestanden met een tabblad per week ("Dagelijkse taken
-- afsluitronde Budel" en "Poetsrooster"). Per vestiging een paar lijsten met
-- taken; het personeel vinkt per dag af (wie en hoe laat). Weektaken hebben een
-- minimum aantal keer per week. Onder "Iets anders gedaan?" staat per dag een
-- vrije notitie, en de afsluitronde wordt aan het eind van de dag afgemeld.
--
-- Zelfde opzet als 380: single-tenant (user_id = LIFEOS_USER_ID), RLS aan zonder
-- policies, alleen de service-role (server) leest en schrijft.
-- Idempotent: opnieuw draaien is veilig. De taken voor Budel worden alleen
-- aangemaakt als Budel nog geen takenlijsten heeft; de demo-afvinkingen alleen
-- als er nog geen demo-afvinkingen zijn. Demo weghalen:
--   delete from club_taak_afvinken where demo; delete from club_taak_notities where demo;
--   delete from club_taak_afsluitrondes where demo;

create table if not exists public.club_takenlijsten (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  vestiging text not null references public.club_vestigingen(vestiging),
  naam text not null check (char_length(naam) between 1 and 60),
  volgorde int not null default 0,
  actief boolean not null default true,
  aangemaakt_op timestamptz not null default now()
);
create unique index if not exists club_takenlijsten_naam on public.club_takenlijsten (user_id, vestiging, lower(naam));

create table if not exists public.club_taken (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  lijst_id uuid not null references public.club_takenlijsten(id) on delete cascade,
  naam text not null check (char_length(naam) between 1 and 120),
  -- Kopje binnen de lijst, zoals in de Excel ("Minimaal 3x per week").
  groep text check (char_length(groep) <= 60),
  -- dagelijks | per_week (met per_week_min) | indien_nodig | extra
  frequentie text not null default 'dagelijks' check (frequentie in ('dagelijks','per_week','indien_nodig','extra')),
  per_week_min int check (per_week_min between 1 and 7),
  moment text not null default 'vrij' check (moment in ('ochtend','middag','afsluiten','vrij')),
  volgorde int not null default 0,
  actief boolean not null default true,
  aangemaakt_op timestamptz not null default now(),
  check (frequentie <> 'per_week' or per_week_min is not null)
);
create index if not exists club_taken_lijst on public.club_taken (lijst_id, volgorde);

-- Een vinkje: taak X is op datum Y gedaan door Z. Een vakje per taak per dag.
create table if not exists public.club_taak_afvinken (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  vestiging text not null references public.club_vestigingen(vestiging),
  taak_id uuid not null references public.club_taken(id) on delete cascade,
  datum date not null,
  afgevinkt_op timestamptz not null default now(),
  medewerker_id uuid references public.club_medewerkers(id) on delete set null,
  -- Naam of initialen zoals op het papier ("LM"), ook als er geen medewerker is gekozen.
  wie text not null check (char_length(wie) between 1 and 80),
  notitie text check (char_length(notitie) <= 300),
  demo boolean not null default false
);
create unique index if not exists club_taak_afvinken_uniek on public.club_taak_afvinken (taak_id, datum);
create index if not exists club_taak_afvinken_week on public.club_taak_afvinken (user_id, vestiging, datum);

-- "Noteer hier als je iets anders hebt gedaan!"
create table if not exists public.club_taak_notities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  vestiging text not null references public.club_vestigingen(vestiging),
  datum date not null,
  tekst text not null check (char_length(tekst) between 1 and 1000),
  wie text check (char_length(wie) <= 80),
  medewerker_id uuid references public.club_medewerkers(id) on delete set null,
  demo boolean not null default false,
  aangemaakt_op timestamptz not null default now()
);
create index if not exists club_taak_notities_dag on public.club_taak_notities (user_id, vestiging, datum);

-- Afsluitronde klaar: wie sloot af, hoe laat, en hoeveel afsluittaken nog open stonden.
create table if not exists public.club_taak_afsluitrondes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  vestiging text not null references public.club_vestigingen(vestiging),
  datum date not null,
  wie text not null check (char_length(wie) between 1 and 80),
  medewerker_id uuid references public.club_medewerkers(id) on delete set null,
  open_taken int not null default 0 check (open_taken >= 0),
  op timestamptz not null default now(),
  demo boolean not null default false
);
create unique index if not exists club_taak_afsluitrondes_dag on public.club_taak_afsluitrondes (user_id, vestiging, datum);

-- Alles alleen via de server.
do $$
declare t text;
begin
  foreach t in array array['club_takenlijsten','club_taken','club_taak_afvinken','club_taak_notities','club_taak_afsluitrondes']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;

-- ─── De lijsten van Budel, precies zoals in de Excel ───────────────────────
do $$
declare
  uid uuid;
  l_dag uuid;
  l_afsluit uuid;
  l_poets uuid;
begin
  select user_id into uid from public.pt_lead_links limit 1;
  if uid is null then raise exception 'Geen LifeOS-gebruiker gevonden (pt_lead_links leeg).'; end if;
  if not exists (select 1 from public.club_vestigingen where vestiging = 'budel') then
    raise notice 'Vestiging Budel bestaat nog niet (draai eerst 381), taken overgeslagen.';
    return;
  end if;
  if exists (select 1 from public.club_takenlijsten where user_id = uid and vestiging = 'budel') then
    raise notice 'Budel heeft al takenlijsten, overgeslagen.';
    return;
  end if;

  insert into public.club_takenlijsten (user_id, vestiging, naam, volgorde) values (uid, 'budel', 'Dagelijks', 10) returning id into l_dag;
  insert into public.club_takenlijsten (user_id, vestiging, naam, volgorde) values (uid, 'budel', 'Afsluitronde', 20) returning id into l_afsluit;
  insert into public.club_takenlijsten (user_id, vestiging, naam, volgorde) values (uid, 'budel', 'Poetsrooster', 30) returning id into l_poets;

  insert into public.club_taken (user_id, lijst_id, naam, groep, frequentie, per_week_min, moment, volgorde)
  select uid, l_dag, x.naam, 'Dagelijkse taken', 'dagelijks', null, x.moment, x.nr * 10
  from (values
    (1, 'Kleedkamers check ochtend', 'ochtend'),
    (2, 'Toiletten schoonmaken ochtend', 'ochtend'),
    (3, 'Mail/leads checken', 'vrij'),
    (4, 'Gewichten opruimen', 'vrij'),
    (5, 'Toiletten schoonmaken middag', 'middag'),
    (6, 'Instagram story', 'vrij')
  ) as x(nr, naam, moment);

  insert into public.club_taken (user_id, lijst_id, naam, groep, frequentie, per_week_min, moment, volgorde)
  select uid, l_afsluit, x.naam, 'Afsluit taken', 'dagelijks', null, 'afsluiten', x.nr * 10
  from (values
    (1, 'Groepsleszaal dweilen'),
    (2, 'Cardio schoonmaken'),
    (3, 'Kleedkamers check avond'),
    (4, 'Toiletten schoonmaken'),
    (5, 'Spuitjes vullen'),
    (6, 'Rollen aanvullen (ook toiletten)'),
    (7, 'Vuilniszakken + emmer toiletten'),
    (8, 'Zithoek stoffen'),
    (9, 'Afwas keuken'),
    (10, 'Koffiezetapparaat reinigen'),
    (11, 'Kassa telling'),
    (12, 'Voorraad checken')
  ) as x(nr, naam);

  insert into public.club_taken (user_id, lijst_id, naam, groep, frequentie, per_week_min, moment, volgorde)
  select uid, l_poets, x.naam, x.groep, x.frequentie, x.minimum, 'vrij', x.nr * 10
  from (values
    (1, 'Stofzuigen kracht', 'Minimaal 3x per week', 'per_week', 3),
    (2, 'Stofzuigen functional', 'Minimaal 3x per week', 'per_week', 3),
    (3, 'Dweilen laminaat vloer', 'Minimaal 2x per week', 'per_week', 2),
    (4, 'Stofzuigen laminaat vloer', 'Minimaal 2x per week', 'per_week', 2),
    (5, 'Stofzuigen houten plateau', 'Minimaal 2x per week', 'per_week', 2),
    (6, 'eGym toestellen', 'Minimaal 2x per week', 'per_week', 2),
    (7, 'Steekgewichten', 'Minimaal 2x per week', 'per_week', 2),
    (8, 'Plate loaded toestellen', 'Minimaal 2x per week', 'per_week', 2),
    (9, 'Groepsleszaal stofzuigen', 'Minimaal 2x per week', 'per_week', 2),
    (10, 'Kracht grondig opruimen/schoonmaken', 'Minimaal 1x per week', 'per_week', 1),
    (11, 'Functional grondig opruimen/schoonmaken', 'Minimaal 1x per week', 'per_week', 1),
    (12, 'Kasten afstoffen', 'Minimaal 1x per week', 'per_week', 1),
    (13, 'Balie grondig schoonmaken', 'Minimaal 1x per week', 'per_week', 1),
    (14, 'Schoonmaken ingang (binnen/buiten)', 'Minimaal 1x per week', 'per_week', 1),
    (15, 'Kozijnen groepsleszaal afdoen (binnenzijde)', 'Minimaal 1x per week', 'per_week', 1),
    (16, 'Dumbbell/halter racks grondig', 'Elke week (indien nodig)', 'indien_nodig', null),
    (17, 'Squat racks grondig', 'Elke week (indien nodig)', 'indien_nodig', null),
    (18, 'Cable racks grondig', 'Elke week (indien nodig)', 'indien_nodig', null),
    (19, 'Koffiezetapparaat bijvullen', 'Elke week (indien nodig)', 'indien_nodig', null),
    (20, 'Koffiezetapparaat grondig schoonmaken', 'Elke week (indien nodig)', 'indien_nodig', null),
    (21, 'Spinningbikes grondig', 'Extra', 'extra', null),
    (22, 'Spiegels schoonmaken', 'Extra', 'extra', null),
    (23, 'Spinnenwebben weghalen', 'Extra', 'extra', null),
    (24, 'Trap afdoen', 'Extra', 'extra', null)
  ) as x(nr, naam, groep, frequentie, minimum);
end $$;

-- ─── Demo: afvinkingen van de afgelopen 3 weken in Budel ───────────────────
-- Verzonnen, door de demo-medewerkers van Budel (381). Niet alles is gedaan,
-- zodat de voortgang en de achterstand iets laten zien.
do $$
declare
  uid uuid;
  mw record;
  mw_ids uuid[];
  mw_namen text[];
  n int;
  dag date;
  tk record;
  kans float;
  uur int;
  k int;
begin
  select user_id into uid from public.pt_lead_links limit 1;
  if uid is null then return; end if;
  if exists (select 1 from public.club_taak_afvinken where demo) then
    raise notice 'Demo-afvinkingen staan er al, overgeslagen.';
    return;
  end if;
  select array_agg(id order by naam), array_agg(naam order by naam) into mw_ids, mw_namen
    from public.club_medewerkers where user_id = uid and demo and actief and 'budel' = any(vestigingen);
  n := coalesce(array_length(mw_ids, 1), 0);
  if n = 0 then
    raise notice 'Geen demo-medewerkers in Budel, demo-afvinkingen overgeslagen.';
    return;
  end if;
  perform setseed(0.389);

  for dag in select generate_series(current_date - 21, current_date - 1, interval '1 day')::date loop
    for tk in
      select t.id, t.frequentie, t.per_week_min, t.moment
      from public.club_taken t join public.club_takenlijsten l on l.id = t.lijst_id
      where t.user_id = uid and l.vestiging = 'budel' and t.actief
    loop
      kans := case tk.frequentie
        when 'dagelijks' then case when tk.moment = 'afsluiten' then 0.9 else 0.86 end
        when 'per_week' then least(0.9, tk.per_week_min / 7.0 + 0.06)
        when 'indien_nodig' then 0.12
        else 0.06 end;
      continue when random() >= kans;
      k := 1 + floor(random() * n)::int;
      uur := case tk.moment when 'ochtend' then 8 + floor(random() * 2)::int
        when 'middag' then 13 + floor(random() * 3)::int
        when 'afsluiten' then 21 + floor(random() * 2)::int
        else 10 + floor(random() * 9)::int end;
      insert into public.club_taak_afvinken (user_id, vestiging, taak_id, datum, afgevinkt_op, medewerker_id, wie, demo)
      values (uid, 'budel', tk.id, dag,
        ((dag + make_time(uur, floor(random() * 60)::int, 0)) at time zone 'Europe/Amsterdam'),
        mw_ids[k], mw_namen[k], true)
      on conflict (taak_id, datum) do nothing;
    end loop;

    -- De afsluitronde is (bijna) elke avond afgemeld.
    if random() < 0.85 then
      k := 1 + floor(random() * n)::int;
      insert into public.club_taak_afsluitrondes (user_id, vestiging, datum, wie, medewerker_id, open_taken, op, demo)
      values (uid, 'budel', dag, mw_namen[k], mw_ids[k], floor(random() * 2)::int,
        ((dag + make_time(22, 40 + floor(random() * 19)::int, 0)) at time zone 'Europe/Amsterdam'), true)
      on conflict (user_id, vestiging, datum) do nothing;
    end if;
  end loop;

  insert into public.club_taak_notities (user_id, vestiging, datum, tekst, wie, medewerker_id, demo)
  values
    (uid, 'budel', current_date - 9, 'Lekkage bij de douche in de herenkleedkamer gemeld en emmer neergezet.', mw_namen[1], mw_ids[1], true),
    (uid, 'budel', current_date - 5, 'Ramen bij de ingang aan de buitenkant gelapt.', mw_namen[least(2, n)], mw_ids[least(2, n)], true),
    (uid, 'budel', current_date - 2, 'Foam rollers en matten in de functional area gereinigd.', mw_namen[n], mw_ids[n], true);
end $$;

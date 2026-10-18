-- 440: Community in de ledenapp: groepen, tijdlijn, reacties, meldingen en
-- de keuze om op ranglijsten te staan.
--
-- * club_community_groepen: per sportschool (user_id), aangemaakt door de
--   sportschool. 'open' = leden worden zelf lid, 'besloten' = alleen de
--   sportschool voegt leden toe. Optioneel gekoppeld aan een challenge (de
--   ranglijst volgt dan de challenge) of een lestype. Archiveren in plaats van
--   verwijderen.
-- * club_community_groepsleden: wie in een groep zit. 'verwijderd' = door de
--   sportschool uit de groep gehaald; zo iemand kan niet zelf terug.
-- * club_community_berichten: korte berichten (1 tot 500 tekens, geen
--   afbeeldingen). 'vastgehouden' = de filter of de rem hield het bericht
--   tegen, de sportschool beoordeelt het. 'verborgen' = door de sportschool.
-- * club_community_reacties: een duim of een high five, een per soort per lid.
-- * club_community_meldingen: een lid meldt een bericht; de sportschool
--   handelt het af in Club.
-- * club_community_voorkeuren: op ranglijsten (standaard UIT, privacy by
--   default, art. 25 AVG) en tot wanneer het lid de activiteit zag.
--
-- Alle lid_id's verwijzen met on delete cascade naar club_leden: ook als een
-- latere versie van club_lid_definitief_verwijderen deze tabellen vergeet,
-- verdwijnt alles van het lid met het lid. Migratie 441 zet ze daarnaast
-- expliciet in die functie.
--
-- Geen policies: alleen de server (service role) leest en schrijft; anon en
-- authenticated hebben geen enkel recht. Idempotent; voegt alleen toe.

create table if not exists public.club_community_groepen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  naam text not null check (char_length(trim(naam)) between 2 and 60),
  uitleg text check (uitleg is null or char_length(uitleg) <= 300),
  toegang text not null default 'open' check (toegang in ('open', 'besloten')),
  -- Leeg = alle vestigingen; anders alleen leden van deze vestiging zien de groep.
  vestiging text check (vestiging is null or char_length(vestiging) between 1 and 60),
  challenge_id uuid references public.club_challenges (id) on delete set null,
  lestype_id uuid references public.club_lestypen (id) on delete set null,
  ranglijst boolean not null default true,
  gearchiveerd_op timestamptz,
  aangemaakt_door text not null default 'Club' check (char_length(aangemaakt_door) between 1 and 80),
  demo boolean not null default false,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now()
);

create index if not exists club_community_groepen_user on public.club_community_groepen (user_id, gearchiveerd_op);

create table if not exists public.club_community_groepsleden (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  groep_id uuid not null references public.club_community_groepen (id) on delete cascade,
  lid_id uuid not null references public.club_leden (id) on delete cascade,
  status text not null default 'lid' check (status in ('lid', 'verwijderd')),
  toegevoegd_door text not null default 'Zelf' check (char_length(toegevoegd_door) between 1 and 80),
  demo boolean not null default false,
  aangemaakt_op timestamptz not null default now(),
  gewijzigd_op timestamptz not null default now(),
  unique (groep_id, lid_id)
);

create index if not exists club_community_groepsleden_lid on public.club_community_groepsleden (user_id, lid_id);
create index if not exists club_community_groepsleden_groep on public.club_community_groepsleden (groep_id, status);

create table if not exists public.club_community_berichten (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  groep_id uuid not null references public.club_community_groepen (id) on delete cascade,
  lid_id uuid not null references public.club_leden (id) on delete cascade,
  tekst text not null check (char_length(trim(tekst)) between 1 and 500),
  status text not null default 'zichtbaar' check (status in ('zichtbaar', 'vastgehouden', 'verborgen')),
  -- Waarom vastgehouden of verborgen (kort, zonder de tekst zelf).
  reden text check (reden is null or char_length(reden) <= 200),
  beoordeeld_door text check (beoordeeld_door is null or char_length(beoordeeld_door) <= 80),
  beoordeeld_op timestamptz,
  demo boolean not null default false,
  aangemaakt_op timestamptz not null default now()
);

create index if not exists club_community_berichten_groep on public.club_community_berichten (groep_id, aangemaakt_op desc);
create index if not exists club_community_berichten_lid on public.club_community_berichten (user_id, lid_id, aangemaakt_op desc);
create index if not exists club_community_berichten_status on public.club_community_berichten (user_id, status) where status <> 'zichtbaar';

create table if not exists public.club_community_reacties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  bericht_id uuid not null references public.club_community_berichten (id) on delete cascade,
  lid_id uuid not null references public.club_leden (id) on delete cascade,
  soort text not null check (soort in ('duim', 'highfive')),
  demo boolean not null default false,
  aangemaakt_op timestamptz not null default now(),
  unique (bericht_id, lid_id, soort)
);

create index if not exists club_community_reacties_bericht on public.club_community_reacties (bericht_id);
create index if not exists club_community_reacties_lid on public.club_community_reacties (user_id, lid_id);

create table if not exists public.club_community_meldingen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  bericht_id uuid not null references public.club_community_berichten (id) on delete cascade,
  lid_id uuid not null references public.club_leden (id) on delete cascade,
  reden text not null check (reden in ('ongepast', 'pesten', 'spam', 'anders')),
  toelichting text check (toelichting is null or char_length(toelichting) <= 300),
  status text not null default 'open' check (status in ('open', 'afgehandeld')),
  uitkomst text check (uitkomst is null or uitkomst in ('verborgen', 'toegestaan')),
  afgehandeld_door text check (afgehandeld_door is null or char_length(afgehandeld_door) <= 80),
  afgehandeld_op timestamptz,
  demo boolean not null default false,
  aangemaakt_op timestamptz not null default now(),
  unique (bericht_id, lid_id)
);

create index if not exists club_community_meldingen_open on public.club_community_meldingen (user_id, status, aangemaakt_op);
create index if not exists club_community_meldingen_lid on public.club_community_meldingen (user_id, lid_id);

create table if not exists public.club_community_voorkeuren (
  lid_id uuid primary key references public.club_leden (id) on delete cascade,
  user_id uuid not null,
  op_ranglijst boolean not null default false,
  activiteit_gezien_op timestamptz,
  demo boolean not null default false,
  gewijzigd_op timestamptz not null default now()
);

create index if not exists club_community_voorkeuren_user on public.club_community_voorkeuren (user_id);

-- ── Alleen de server ──────────────────────────────────────────────────────────
do $$
declare
  t text;
begin
  foreach t in array array['club_community_groepen', 'club_community_groepsleden', 'club_community_berichten', 'club_community_reacties', 'club_community_meldingen', 'club_community_voorkeuren']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated', t);
  end loop;
end
$$;

-- ── Demodata voor de Voorbeeld Gym (demo = true) ──────────────────────────────
-- Leden worden op het moment van uitvoeren gekozen (eerste actieve leden van
-- Centrum), zodat er geen vaste lid-id's in staan.
do $$
declare
  v_org constant uuid := 'de000000-0000-4000-8000-0000000000c1';
  g_ochtend constant uuid := 'c0aa0000-0000-4000-8000-000000000001';
  g_hyrox constant uuid := 'c0aa0000-0000-4000-8000-000000000002';
  g_okt constant uuid := 'c0aa0000-0000-4000-8000-000000000003';
  v_leden uuid[];
  v_challenge uuid;
  b1 uuid := 'c0ab0000-0000-4000-8000-000000000001';
  b2 uuid := 'c0ab0000-0000-4000-8000-000000000002';
  b3 uuid := 'c0ab0000-0000-4000-8000-000000000003';
  b4 uuid := 'c0ab0000-0000-4000-8000-000000000004';
  b5 uuid := 'c0ab0000-0000-4000-8000-000000000005';
  b6 uuid := 'c0ab0000-0000-4000-8000-000000000006';
begin
  if not exists (select 1 from public.club_organisaties where id = v_org) then
    return;
  end if;
  select array_agg(id order by aangemaakt_op, id) into v_leden from (
    select id, aangemaakt_op from public.club_leden
    where user_id = v_org and demo = true and status = 'actief' and vestiging = 'voorbeeld-centrum'
    order by aangemaakt_op, id limit 10
  ) x;
  if v_leden is null or array_length(v_leden, 1) < 8 then
    return;
  end if;
  select id into v_challenge from public.club_challenges where user_id = v_org and id = 'c4a11e00-0000-4000-8000-000000000011';

  insert into public.club_community_groepen (id, user_id, naam, uitleg, toegang, vestiging, challenge_id, ranglijst, aangemaakt_door, demo)
  values
    (g_ochtend, v_org, 'Ochtendploeg', 'Voor iedereen die voor achten traint. Deel je ochtendroutine en spreek af wie morgen komt.', 'open', null, null, true, 'Voorbeeld Gym', true),
    (g_hyrox, v_org, 'Hyrox-team', 'Samen trainen voor de Hyrox. Alleen voor leden die de trainer heeft toegevoegd.', 'besloten', 'voorbeeld-centrum', null, true, 'Voorbeeld Gym', true),
    (g_okt, v_org, '12 keer in oktober', 'De groep bij de challenge van deze maand. Moedig elkaar aan.', 'open', null, v_challenge, true, 'Voorbeeld Gym', true)
  on conflict (id) do nothing;

  insert into public.club_community_groepsleden (user_id, groep_id, lid_id, toegevoegd_door, demo)
  select v_org, g, l, case when g = g_hyrox then 'Voorbeeld Gym' else 'Zelf' end, true
  from (values (g_ochtend, 1), (g_ochtend, 2), (g_ochtend, 3), (g_ochtend, 4), (g_ochtend, 5), (g_ochtend, 6),
               (g_hyrox, 2), (g_hyrox, 5), (g_hyrox, 7), (g_hyrox, 8),
               (g_okt, 1), (g_okt, 3), (g_okt, 4), (g_okt, 6), (g_okt, 7), (g_okt, 8)) as v(g, i)
  cross join lateral (select v_leden[v.i] as l) x
  on conflict (groep_id, lid_id) do nothing;

  insert into public.club_community_berichten (id, user_id, groep_id, lid_id, tekst, status, reden, aangemaakt_op, demo)
  values
    (b1, v_org, g_ochtend, v_leden[1], 'Morgen om 06:30 weer van de partij. Wie doet er mee met de roeiintervallen?', 'zichtbaar', null, now() - interval '20 hours', true),
    (b2, v_org, g_ochtend, v_leden[3], 'Ben erbij! Eerst koffie, dan roeien.', 'zichtbaar', null, now() - interval '19 hours', true),
    (b3, v_org, g_ochtend, v_leden[5], 'Vandaag mijn eerste keer om zes uur gelukt. Zwaar, maar de rest van de dag voelde top.', 'zichtbaar', null, now() - interval '3 hours', true),
    (b4, v_org, g_hyrox, v_leden[2], 'Sled push ging vandaag een stuk beter dan vorige week. Nog zes weken!', 'zichtbaar', null, now() - interval '1 day', true),
    (b5, v_org, g_okt, v_leden[4], 'Teller staat op 9. Nog drie keer en de badge is binnen.', 'zichtbaar', null, now() - interval '5 hours', true),
    (b6, v_org, g_okt, v_leden[6], 'Wat een gedoe met die parkeerplaats, echt kut vandaag.', 'vastgehouden', 'Bevat een woord uit de woordfilter', now() - interval '2 hours', true)
  on conflict (id) do nothing;

  insert into public.club_community_reacties (user_id, bericht_id, lid_id, soort, demo)
  values
    (v_org, b1, v_leden[2], 'duim', true),
    (v_org, b1, v_leden[3], 'highfive', true),
    (v_org, b3, v_leden[1], 'highfive', true),
    (v_org, b3, v_leden[4], 'highfive', true),
    (v_org, b3, v_leden[6], 'duim', true),
    (v_org, b4, v_leden[5], 'duim', true),
    (v_org, b5, v_leden[3], 'highfive', true)
  on conflict (bericht_id, lid_id, soort) do nothing;

  insert into public.club_community_meldingen (user_id, bericht_id, lid_id, reden, toelichting, demo)
  values (v_org, b2, v_leden[6], 'spam', 'Voorbeeld van een melding in de demo.', true)
  on conflict (bericht_id, lid_id) do nothing;

  -- Een paar demoleden staan op de ranglijst; de rest heeft niets gekozen (standaard uit).
  insert into public.club_community_voorkeuren (lid_id, user_id, op_ranglijst, demo)
  select v_leden[i], v_org, true, true from generate_series(1, 6) as i
  on conflict (lid_id) do nothing;
end
$$;

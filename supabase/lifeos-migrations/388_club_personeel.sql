-- ─── Fit Factory clubsoftware: personeelsrooster en urenregistratie ─────────
-- Aanvulling op 380_club_basis.sql. Idempotent; veilig om opnieuw te draaien.
--
-- 1. club_medewerkers: contracturen per week, een vaste roosterkleur en de rol
--    'administratie' (voor wie de uren controleert en verwerkt).
-- 2. (Bemande uren staan in club_vestigingen.bemand, migratie 390; de code
--    valt terug op de openingstijden als die kolom leeg of afwezig is.)
-- 3. club_dienst_soorten: vaste diensten per vestiging (Ochtend, Avond, ...).
-- 4. club_diensten: een dienst op een datum, met de urenregistratie erbij
--    (gewerkte tijd, pauze, uursoort werk/ziek/verlof en de status
--    gepland > gewerkt > goedgekeurd > verwerkt).
-- 5. club_beschikbaarheid: vaste beschikbaarheid per weekdag en losse datums.
-- 6. club_dienst_sjablonen: een week als vast patroon.
-- 7. club_rooster_notities: mededelingen in het rooster en blokken
--    "geen afspraken" (iemand is er wel, maar plant dan niets in).
-- 8. Demodata voor Budel (demo = true), alleen als die er nog niet is.
--
-- Weghalen van de demodata:
--   delete from club_diensten where demo; delete from club_rooster_notities where demo;
--   delete from club_beschikbaarheid where demo; delete from club_dienst_soorten where demo;

-- ── 1. Medewerkers ──────────────────────────────────────────────────────────
alter table public.club_medewerkers add column if not exists contracturen_per_week numeric(4,1)
  check (contracturen_per_week is null or (contracturen_per_week >= 0 and contracturen_per_week <= 60));
alter table public.club_medewerkers add column if not exists kleur text
  check (kleur is null or kleur in ('amber','blauw','groen','roze','turkoois','geel','lila','zand'));

alter table public.club_medewerkers drop constraint if exists club_medewerkers_rollen_check;
alter table public.club_medewerkers add constraint club_medewerkers_rollen_check
  check (rollen <@ array['balie','trainer','instructeur','manager','administratie']::text[]);

-- ── 3. Dienstsoorten ────────────────────────────────────────────────────────
create table if not exists public.club_dienst_soorten (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  vestiging text not null references public.club_vestigingen(vestiging),
  naam text not null check (char_length(naam) between 1 and 40),
  categorie text not null default 'overig' check (categorie in ('opening','dag','avond','afsluiten','weekend','overig')),
  begin time not null,
  eind time not null,
  rol text check (rol is null or rol in ('balie','trainer','instructeur','manager','administratie')),
  volgorde int not null default 0,
  actief boolean not null default true,
  demo boolean not null default false,
  check (eind > begin)
);
create index if not exists club_dienst_soorten_vestiging on public.club_dienst_soorten (user_id, vestiging, volgorde);

-- ── 4. Diensten en uren ─────────────────────────────────────────────────────
create table if not exists public.club_diensten (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  vestiging text not null references public.club_vestigingen(vestiging),
  datum date not null,
  begin time not null,
  eind time not null,
  -- null = open dienst (nog niemand ingepland).
  medewerker_id uuid references public.club_medewerkers(id) on delete set null,
  soort_id uuid references public.club_dienst_soorten(id) on delete set null,
  notitie text check (char_length(notitie) <= 300),
  status text not null default 'gepland' check (status in ('gepland','geruild','ziek')),
  -- Een vervangende (open) dienst wijst naar de dienst van wie zich ziek meldde.
  vervangt_id uuid references public.club_diensten(id) on delete set null,
  -- Urenregistratie.
  uursoort text not null default 'werk' check (uursoort in ('werk','ziek','verlof')),
  uur_status text not null default 'gepland' check (uur_status in ('gepland','gewerkt','goedgekeurd','verwerkt')),
  gewerkt_begin time,
  gewerkt_eind time,
  pauze_min int not null default 0 check (pauze_min between 0 and 240),
  uren_opmerking text check (char_length(uren_opmerking) <= 300),
  bevestigd_door text check (char_length(bevestigd_door) <= 80),
  bevestigd_op timestamptz,
  goedgekeurd_door text check (char_length(goedgekeurd_door) <= 80),
  goedgekeurd_op timestamptz,
  verwerkt_op timestamptz,
  demo boolean not null default false,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now(),
  check (eind > begin),
  check (gewerkt_begin is null or gewerkt_eind is null or gewerkt_eind > gewerkt_begin)
);
create index if not exists club_diensten_vestiging_datum on public.club_diensten (user_id, vestiging, datum);
create index if not exists club_diensten_medewerker_datum on public.club_diensten (medewerker_id, datum);

-- ── 5. Beschikbaarheid ──────────────────────────────────────────────────────
create table if not exists public.club_beschikbaarheid (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  medewerker_id uuid not null references public.club_medewerkers(id) on delete cascade,
  -- Of een vaste weekdag (1 = maandag), of een datum (tot en met datum_tot).
  weekdag int check (weekdag between 1 and 7),
  datum date,
  datum_tot date,
  beschikbaar boolean not null default true,
  van time,
  tot time,
  reden text check (reden is null or reden in ('verlof','vrij','ziek')),
  notitie text check (char_length(notitie) <= 200),
  demo boolean not null default false,
  aangemaakt_op timestamptz not null default now(),
  check ((weekdag is null) <> (datum is null)),
  check (datum_tot is null or (datum is not null and datum_tot >= datum)),
  check (van is null or tot is null or tot > van)
);
create index if not exists club_beschikbaarheid_medewerker on public.club_beschikbaarheid (user_id, medewerker_id);

-- ── 6. Vaste patronen ───────────────────────────────────────────────────────
create table if not exists public.club_dienst_sjablonen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  vestiging text not null references public.club_vestigingen(vestiging),
  naam text not null check (char_length(naam) between 1 and 60),
  -- [{ weekdag, begin, eind, medewerker_id, soort_id, notitie }]
  diensten jsonb not null default '[]'::jsonb,
  aangemaakt_op timestamptz not null default now()
);
create index if not exists club_dienst_sjablonen_vestiging on public.club_dienst_sjablonen (user_id, vestiging);

-- ── 7. Mededelingen en "geen afspraken" ─────────────────────────────────────
create table if not exists public.club_rooster_notities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  vestiging text not null references public.club_vestigingen(vestiging),
  datum date not null,
  van time,
  tot time,
  soort text not null default 'mededeling' check (soort in ('mededeling','geen_afspraken')),
  medewerker_id uuid references public.club_medewerkers(id) on delete cascade,
  tekst text not null check (char_length(tekst) between 1 and 200),
  demo boolean not null default false,
  aangemaakt_op timestamptz not null default now(),
  check (van is null or tot is null or tot > van)
);
create index if not exists club_rooster_notities_datum on public.club_rooster_notities (user_id, vestiging, datum);

-- Alles alleen via de server.
do $$
declare t text;
begin
  foreach t in array array['club_dienst_soorten','club_diensten','club_beschikbaarheid','club_dienst_sjablonen','club_rooster_notities']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;

-- ── 8. Demodata Budel ───────────────────────────────────────────────────────
-- Ritme zoals de echte Google Agenda van Budel: ochtend 08:00 tot 14:00, avond
-- 14:00 tot 21:30, een extra avond 17:00 tot 21:30 en het weekend 08:00 tot 13:00.
-- Vier weken terug en vier weken vooruit. Bewust: een gat deze woensdag (13:30
-- tot 14:00), een open dienst volgende week donderdag, een lege zaterdag over
-- twee weken, een ziekmelding, verlof, afwijkende uren en onbevestigde diensten.
do $$
declare
  uid uuid;
  maandag0 date := date_trunc('week', current_date)::date;
  mw record;
  m_marloes uuid; m_dennis uuid; m_lynn uuid; m_jeroen uuid; m_yara uuid;
  s_ochtend uuid; s_kort uuid; s_avond uuid; s_laat uuid; s_weekend uuid;
  wk int;
  p record;
  d date;
  ziek_id uuid;
begin
  select user_id into uid from public.pt_lead_links limit 1;
  if uid is null then raise exception 'Geen LifeOS-gebruiker gevonden (pt_lead_links leeg).'; end if;
  if not exists (select 1 from public.club_vestigingen where vestiging = 'budel') then
    raise notice 'Vestiging Budel ontbreekt, demodata overgeslagen.';
    return;
  end if;
  if exists (select 1 from public.club_dienst_soorten where demo and vestiging = 'budel') then
    raise notice 'Demodata personeel staat er al, overgeslagen.';
    return;
  end if;

  select id into m_marloes from public.club_medewerkers where demo and naam = 'Marloes Coolen' limit 1;
  select id into m_dennis from public.club_medewerkers where demo and naam = 'Dennis Hermans' limit 1;
  select id into m_lynn from public.club_medewerkers where demo and naam = 'Lynn Maas' limit 1;
  select id into m_jeroen from public.club_medewerkers where demo and naam = 'Jeroen Swinkels' limit 1;
  select id into m_yara from public.club_medewerkers where demo and naam = 'Yara Verbeek' limit 1;
  if m_marloes is null or m_dennis is null or m_lynn is null or m_jeroen is null or m_yara is null then
    raise notice 'Demo-medewerkers van Budel ontbreken (draai eerst 381), overgeslagen.';
    return;
  end if;

  -- Contracturen en kleuren.
  update public.club_medewerkers set contracturen_per_week = 28, kleur = 'roze' where id = m_marloes;
  update public.club_medewerkers set contracturen_per_week = 24, kleur = 'blauw' where id = m_dennis;
  update public.club_medewerkers set contracturen_per_week = 24, kleur = 'groen' where id = m_lynn;
  update public.club_medewerkers set contracturen_per_week = 16, kleur = 'geel' where id = m_jeroen;
  update public.club_medewerkers set contracturen_per_week = 8, kleur = 'turkoois' where id = m_yara;
  update public.club_medewerkers set kleur = 'lila' where demo and naam = 'Kim van Gestel';
  update public.club_medewerkers set kleur = 'zand' where demo and naam = 'Mike van Hout';

  insert into public.club_dienst_soorten (user_id, vestiging, naam, categorie, begin, eind, rol, volgorde, demo) values
    (uid,'budel','Ochtend','opening','08:00','14:00','balie',1,true) returning id into s_ochtend;
  insert into public.club_dienst_soorten (user_id, vestiging, naam, categorie, begin, eind, rol, volgorde, demo) values
    (uid,'budel','Ochtend kort','opening','08:00','13:30','balie',2,true) returning id into s_kort;
  insert into public.club_dienst_soorten (user_id, vestiging, naam, categorie, begin, eind, rol, volgorde, demo) values
    (uid,'budel','Avond','afsluiten','14:00','21:30','balie',3,true) returning id into s_avond;
  insert into public.club_dienst_soorten (user_id, vestiging, naam, categorie, begin, eind, rol, volgorde, demo) values
    (uid,'budel','Avond vloer','avond','17:00','21:30','trainer',4,true) returning id into s_laat;
  insert into public.club_dienst_soorten (user_id, vestiging, naam, categorie, begin, eind, rol, volgorde, demo) values
    (uid,'budel','Weekend','weekend','08:00','13:00','balie',5,true) returning id into s_weekend;

  -- Het weekpatroon, acht weken (wk -4 tot en met 3).
  for wk in -4..3 loop
    for p in
      select * from (values
        (1, s_ochtend, m_marloes), (1, s_avond, m_dennis), (1, s_laat, m_jeroen),
        (2, s_ochtend, m_marloes), (2, s_avond, m_lynn), (2, s_laat, m_yara),
        (3, s_ochtend, m_dennis), (3, s_avond, m_lynn), (3, s_laat, m_jeroen),
        (4, s_ochtend, m_marloes), (4, s_avond, m_dennis), (4, s_laat, m_yara),
        (5, s_ochtend, m_lynn), (5, s_avond, m_marloes),
        (6, s_weekend, m_dennis), (7, s_weekend, m_jeroen)
      ) as x(dag, soort, wie)
    loop
      d := maandag0 + wk * 7 + p.dag - 1;
      insert into public.club_diensten (user_id, vestiging, datum, begin, eind, medewerker_id, soort_id, demo,
        uur_status, pauze_min, bevestigd_door, bevestigd_op, goedgekeurd_door, goedgekeurd_op, verwerkt_op)
      select uid, 'budel', d, s.begin, s.eind, p.wie, s.id, true,
        case when wk = -4 then 'verwerkt' when wk = -3 then 'goedgekeurd' when d < current_date then 'gewerkt' else 'gepland' end,
        case when d < current_date and s.eind - s.begin >= interval '7 hours' then 30 else 0 end,
        case when d < current_date then 'Demo' end,
        case when d < current_date then d + s.eind end,
        case when wk <= -3 then 'Demo' end,
        case when wk <= -3 then d + time '23:00' end,
        case when wk = -4 then d + interval '10 days' end
      from public.club_dienst_soorten s where s.id = p.soort;
    end loop;
  end loop;

  -- Bewust gat: deze woensdag ochtend kort (13:30), dus 13:30 tot 14:00 staat niemand.
  update public.club_diensten set eind = '13:30', soort_id = s_kort
  where demo and vestiging = 'budel' and datum = maandag0 + 2 and soort_id = s_ochtend;
  -- Open dienst: volgende week donderdag avond.
  update public.club_diensten set medewerker_id = null
  where demo and vestiging = 'budel' and datum = maandag0 + 7 + 3 and soort_id = s_avond;
  -- Lege zaterdag over twee weken.
  delete from public.club_diensten where demo and vestiging = 'budel' and datum = maandag0 + 14 + 5;

  -- Afwijkende uren (gewerkt anders dan gepland).
  update public.club_diensten set gewerkt_begin = begin, gewerkt_eind = '22:15', uren_opmerking = 'Afgesloten na storing toegangspoortje'
  where demo and vestiging = 'budel' and datum = maandag0 - 7 + 1 and soort_id = s_avond;
  update public.club_diensten set gewerkt_begin = '14:30', gewerkt_eind = eind, uren_opmerking = 'Later begonnen, afgesproken met Marloes'
  where demo and vestiging = 'budel' and datum = maandag0 - 14 + 4 and soort_id = s_avond;
  -- Onbevestigd: vorige week donderdag en zondag.
  update public.club_diensten set uur_status = 'gepland', bevestigd_door = null, bevestigd_op = null
  where demo and vestiging = 'budel' and soort_id in (s_laat, s_weekend) and datum in (maandag0 - 7 + 3, maandag0 - 7 + 6);
  -- En deze week maandag de avond vloer (nog niet bevestigd).
  update public.club_diensten set uur_status = 'gepland', bevestigd_door = null, bevestigd_op = null
  where demo and vestiging = 'budel' and datum = maandag0 and soort_id = s_laat and maandag0 < current_date;

  -- Ziek: twee weken terug woensdag meldde Jeroen zich ziek, Yara nam het over.
  update public.club_diensten set status = 'ziek', uursoort = 'ziek', uur_status = 'goedgekeurd', pauze_min = 0
  where demo and vestiging = 'budel' and datum = maandag0 - 14 + 2 and soort_id = s_laat
  returning id into ziek_id;
  if ziek_id is not null then
    insert into public.club_diensten (user_id, vestiging, datum, begin, eind, medewerker_id, soort_id, vervangt_id, uur_status, bevestigd_door, bevestigd_op, demo)
    values (uid, 'budel', maandag0 - 14 + 2, '17:00', '21:30', m_yara, s_laat, ziek_id, 'gewerkt', 'Demo', now(), true);
  end if;
  -- Verlof: vorige week maandag had Marloes verlof, Lynn deed de ochtend.
  update public.club_diensten set uursoort = 'verlof', status = 'geruild', pauze_min = 0
  where demo and vestiging = 'budel' and datum = maandag0 - 7 and soort_id = s_ochtend
  returning id into ziek_id;
  if ziek_id is not null then
    insert into public.club_diensten (user_id, vestiging, datum, begin, eind, medewerker_id, soort_id, vervangt_id, uur_status, bevestigd_door, bevestigd_op, demo)
    values (uid, 'budel', maandag0 - 7, '08:00', '14:00', m_lynn, s_ochtend, ziek_id, 'gewerkt', 'Demo', now(), true);
  end if;

  -- Beschikbaarheid: Jeroen werkt op maandag en dinsdag overdag in Bergeijk, Yara
  -- kan niet op vrijdag, Dennis heeft verlof over twee weken (dinsdag tot en met
  -- donderdag; hij staat woensdag en donderdag nog ingepland, dat geeft waarschuwingen).
  insert into public.club_beschikbaarheid (user_id, medewerker_id, weekdag, beschikbaar, van, tot, notitie, demo) values
    (uid, m_jeroen, 1, true, '16:00', '22:00', 'Overdag in Bergeijk', true),
    (uid, m_jeroen, 2, true, '16:00', '22:00', 'Overdag in Bergeijk', true),
    (uid, m_yara, 5, false, null, null, 'Studie', true);
  insert into public.club_beschikbaarheid (user_id, medewerker_id, datum, datum_tot, beschikbaar, reden, notitie, demo) values
    (uid, m_dennis, maandag0 + 14 + 1, maandag0 + 14 + 3, false, 'verlof', 'Vakantie', true);

  -- Mededelingen en "geen afspraken", zoals in de Google Agenda.
  insert into public.club_rooster_notities (user_id, vestiging, datum, van, tot, soort, medewerker_id, tekst, demo) values
    (uid, 'budel', maandag0 + 1, '18:45', null, 'mededeling', null, 'Muziek zachter voor Body balance', true),
    (uid, 'budel', maandag0 + 3, '19:00', '20:00', 'geen_afspraken', m_yara, 'Geen afspraken HIIT', true),
    (uid, 'budel', maandag0 + 7 + 1, '19:00', '20:00', 'geen_afspraken', m_yara, 'Geen afspraken HIIT', true),
    (uid, 'budel', maandag0 + 4, null, null, 'mededeling', null, 'Schoonmaakbedrijf komt om 06:00, deur open laten', true);
end $$;

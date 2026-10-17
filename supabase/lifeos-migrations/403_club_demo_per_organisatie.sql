-- ─── Club: demo per sportschool ─────────────────────────────────────────────
-- 1. De nachtelijke demo-verversing (393) schreef reserveringen en taken met het
--    vaste id van Fit Factory. Met meerdere sportscholen moet elke rij de user_id
--    van haar eigen sportschool houden: nu overal de user_id van de les, lijst of
--    medewerker zelf, en koppelingen alleen binnen dezelfde sportschool.
-- 2. De demo-sportschool "Voorbeeld Gym" (verzonnen, demo = true overal).

create or replace function public.club_demo_verversen() returns void
language plpgsql
set search_path = public
as $$
declare
  gisteren date := (now() at time zone 'Europe/Amsterdam')::date - 1;
  vanaf date;
begin
  -- 1. Bezoeken: vanaf de dag na de laatste demo-check-in (hooguit 14 dagen terug) t/m gisteren.
  select greatest(coalesce(max((op at time zone 'Europe/Amsterdam')::date) + 1, gisteren - 14), gisteren - 14)
    into vanaf from public.club_checkins where demo and (op at time zone 'Europe/Amsterdam')::date < gisteren + 1
      and bron <> 'les';
  insert into public.club_checkins (user_id, lid_id, vestiging, op, bron, demo)
  select f.user_id, f.id, f.vestiging,
    (d::date + time '06:30' + (abs(hashtext(f.id::text || d::text || 'm')) % 900) * interval '1 minute') at time zone 'Europe/Amsterdam',
    (array['bandje','bandje','bandje','qr','balie'])[1 + abs(hashtext(f.id::text || d::text || 'b')) % 5], true
  from (
    select l.id, l.user_id, l.vestiging, l.lid_sinds,
      case when l.status = 'proef' then 2.0
           -- 8 procent komt nooit, 12 procent is afgehaakt: geen nieuwe bezoeken.
           when abs(hashtext(l.id::text || 'freq')) % 100 < 20 then 0
           when abs(hashtext(l.id::text || 'freq')) % 100 < 46 then 1.0
           when abs(hashtext(l.id::text || 'freq')) % 100 < 76 then 2.0
           when abs(hashtext(l.id::text || 'freq')) % 100 < 93 then 3.0
           else 4.5 end as per_week
    from public.club_leden l where l.demo and l.status in ('actief','opgezegd','proef')
  ) f
  cross join generate_series(vanaf, gisteren, interval '1 day') d
  where f.per_week > 0 and d::date >= coalesce(f.lid_sinds, d::date)
    and (abs(hashtext(f.id::text || d::text)) % 1000) < (f.per_week / 7.0 * 1000);

  -- 2. Lessen uit de demo-weekroosters tot 14 dagen vooruit.
  insert into public.club_lessen (user_id, vestiging, serie_id, lestype_id, zaal_id, instructeur_id, start_op, eind_op, capaciteit, demo)
  select s.user_id, s.vestiging, s.id, s.lestype_id, s.zaal_id, s.instructeur_id,
    (d::date + s.starttijd) at time zone 'Europe/Amsterdam',
    (d::date + s.starttijd + s.duur_min * interval '1 minute') at time zone 'Europe/Amsterdam',
    s.capaciteit, true
  from public.club_lesseries s
  cross join generate_series(gisteren + 1, gisteren + 15, interval '1 day') d
  where s.demo and s.actief and extract(isodow from d) = s.weekdag
    and d::date >= s.vanaf and (s.tot is null or d::date <= s.tot)
  on conflict (serie_id, start_op) where serie_id is not null do nothing;

  -- 3a. Reserveringen voor toekomstige demo-lessen die er nog geen hebben (30 tot 95 procent vol).
  insert into public.club_reserveringen (user_id, les_id, lid_id, status, geboekt_op, bron, demo)
  select x.eigenaar, x.les_id, x.lid_id, 'geboekt', x.start_op - interval '2 days', 'app', true
  from (
    select les.user_id as eigenaar, les.id as les_id, les.start_op, l.id as lid_id,
      row_number() over (partition by les.id order by md5(les.id::text || l.id::text)) as nr,
      greatest(2, floor(les.capaciteit * (0.3 + (abs(hashtext(les.id::text)) % 65) / 100.0)))::int as doel
    from public.club_lessen les
    join public.club_leden l on l.demo and l.user_id = les.user_id and l.vestiging = les.vestiging and l.status in ('actief','proef','opgezegd')
    where les.demo and les.start_op > now() and les.status = 'gepland'
      and not exists (select 1 from public.club_reserveringen r where r.les_id = les.id)
  ) x
  where x.nr <= x.doel
  on conflict (les_id, lid_id) do nothing;

  -- 3b. Voorbije demo-lessen afronden: geboekt wordt aanwezig (93 procent) of niet gekomen.
  update public.club_reserveringen r
  set status = case when abs(hashtext(r.id::text || 'ns')) % 100 < 7 then 'no_show' else 'aanwezig' end,
      gewijzigd_op = now()
  from public.club_lessen les
  where r.les_id = les.id and r.demo and r.status = 'geboekt' and les.eind_op < now();

  -- 3c. Wie aanwezig was bij een les, heeft die dag ook ingecheckt (10 minuten voor de les).
  insert into public.club_checkins (user_id, lid_id, vestiging, op, bron, demo)
  select r.user_id, r.lid_id, les.vestiging, les.start_op - interval '10 minutes', 'bandje', true
  from public.club_reserveringen r
  join public.club_lessen les on les.id = r.les_id
  where r.demo and r.status = 'aanwezig' and les.start_op < now()
    and not exists (
      select 1 from public.club_checkins c
      where c.lid_id = r.lid_id
        and (c.op at time zone 'Europe/Amsterdam')::date = (les.start_op at time zone 'Europe/Amsterdam')::date
    );

  -- 4a. Diensten tot 4 weken vooruit: kopie van het patroon van een week eerder,
  --     alleen voor dagen waarop nog geen enkele demo-dienst staat.
  insert into public.club_diensten (user_id, vestiging, datum, begin, eind, medewerker_id, soort_id, demo)
  select d.user_id, d.vestiging, d.datum + 7, d.begin, d.eind, d.medewerker_id, d.soort_id, true
  from public.club_diensten d
  where d.demo and d.vervangt_id is null and d.status = 'gepland' and d.uursoort = 'werk'
    and d.datum + 7 between gisteren + 1 and gisteren + 29
    and not exists (
      select 1 from public.club_diensten n
      -- Alleen helemaal lege dagen aanvullen: een dag met aangepaste diensten blijft zoals hij is.
      where n.demo and n.vestiging = d.vestiging and n.datum = d.datum + 7
    );

  -- 4b. Demo-diensten van meer dan een week geleden zijn gewerkt en bevestigd
  -- (de laatste week blijft deels onbevestigd, zodat het urenoverzicht iets toont).
  update public.club_diensten
  set uur_status = 'gewerkt', bevestigd_door = 'Demo', bevestigd_op = now(),
      pauze_min = case when eind - begin >= interval '7 hours' then 30 else pauze_min end
  where demo and uur_status = 'gepland' and datum <= gisteren and medewerker_id is not null and uursoort = 'werk'
    and datum < gisteren - 6;

  -- 5. Taken en afsluitronde voor gisteren (alleen vestigingen met demo-medewerkers).
  insert into public.club_taak_afvinken (user_id, vestiging, taak_id, datum, afgevinkt_op, medewerker_id, wie, demo)
  select lst.user_id, lst.vestiging, t.id, gisteren,
    (gisteren + make_time(case t.moment when 'ochtend' then 9 when 'middag' then 14 when 'afsluiten' then 21 else 12 end,
       abs(hashtext(t.id::text || gisteren::text)) % 60, 0)) at time zone 'Europe/Amsterdam',
    m.id, m.naam, true
  from public.club_taken t
  join public.club_takenlijsten lst on lst.id = t.lijst_id
  cross join lateral (
    select id, naam from public.club_medewerkers mw
    where mw.demo and mw.actief and mw.user_id = lst.user_id and lst.vestiging = any(mw.vestigingen)
    order by md5(mw.id::text || t.id::text || gisteren::text) limit 1
  ) m
  where t.actief
    and (abs(hashtext(t.id::text || gisteren::text)) % 100) < case t.frequentie
      when 'dagelijks' then 88 when 'per_week' then least(90, t.per_week_min * 100 / 7 + 6)
      when 'indien_nodig' then 12 else 6 end
  on conflict (taak_id, datum) do nothing;

  insert into public.club_taak_afsluitrondes (user_id, vestiging, datum, wie, medewerker_id, open_taken, op, demo)
  select v.user_id, v.vestiging, gisteren, m.naam, m.id, 0, (gisteren + time '22:45') at time zone 'Europe/Amsterdam', true
  from (select distinct lst.user_id, lst.vestiging from public.club_takenlijsten lst) v
  cross join lateral (
    select id, naam from public.club_medewerkers mw
    where mw.demo and mw.actief and mw.user_id = v.user_id and v.vestiging = any(mw.vestigingen)
    order by md5(mw.id::text || gisteren::text) limit 1
  ) m
  on conflict (user_id, vestiging, datum) do nothing;
end $$;


revoke all on function public.club_demo_verversen() from public, anon, authenticated;

-- ── Demo-sportschool "Voorbeeld Gym" ──
-- Een verzonnen sportschool (demo = true overal) om multi-club te laten zien:
-- eigen look (blauw, licht thema), twee vestigingen, leden, bezoek, lessen,
-- personeel, taken en de oefenbibliotheek. Strikt gescheiden van Fit Factory:
-- alle rijen hebben user_id = het id van de demo-sportschool.
-- Idempotent: slaat over als de demo-sportschool al leden heeft.

create or replace function public.club_demo_organisatie_maken(p_beheerder uuid) returns uuid
language plpgsql
set search_path = public
as $$
declare
  org uuid := 'de000000-0000-4000-8000-0000000000c1';
  voornamen text[] := array['Sanne','Lars','Emma','Daan','Lotte','Bram','Fleur','Thijs','Noor','Iris','Milan','Julia','Sem','Eva','Luuk','Lisa','Jesse','Anouk','Tim','Sophie','Niels','Maud','Koen','Femke','Stijn','Roos','Joris','Esmee','Bas','Lieke'];
  achternamen text[] := array['de Vries','Jansen','van den Berg','Bakker','Visser','Smit','Meijer','de Boer','Mulder','de Groot','Bos','Vos','Peters','Hendriks','van Leeuwen','Dekker','Brouwer','de Wit','Dijkstra','Smits','de Graaf','van der Meer','Kuipers','Verhoeven','van Dijk'];
  abonnementen text[] := array['Onbeperkt 12 maanden','Onbeperkt maand','Fitness flex','Groepslessen','Student','Dal-uren'];
  v text;
  i int;
  st text;
  r float;
  mw_ids uuid[];
  oud_lijst record;
  nieuw_lijst uuid;
begin
  if p_beheerder is null then raise exception 'Geen beheerder opgegeven.'; end if;

  insert into public.club_organisaties (id, beheerder_id, naam, slogan, logo, kleur_accent, thema, demo)
  values (org, p_beheerder, 'Voorbeeld Gym', 'Sterker, elke week', null, '#3E63DD', 'licht', true)
  on conflict (id) do nothing;

  if exists (select 1 from public.club_leden where user_id = org) then return org; end if;
  perform setseed(0.17);

  insert into public.club_vestigingen (vestiging, user_id, naam, adres, regels, openingstijden, volgorde, standaard)
  values
    ('voorbeeld-centrum', org, 'Centrum', 'Voorbeeldstraat 1, 1234 AB Voorbeeld',
     '{"annuleer_uren":2,"no_show_drempel":3,"no_show_blokkade_dagen":7,"reserveer_dagen_vooruit":7,"max_open_reserveringen":5,"checkin_venster_min":15}'::jsonb,
     '{"1":["07:00","22:00"],"2":["07:00","22:00"],"3":["07:00","22:00"],"4":["07:00","22:00"],"5":["07:00","21:00"],"6":["09:00","16:00"],"7":["09:00","14:00"]}'::jsonb, 1, true),
    ('voorbeeld-noord', org, 'Noord', 'Voorbeeldlaan 20, 1234 CD Voorbeeld',
     '{"annuleer_uren":2,"no_show_drempel":3,"no_show_blokkade_dagen":7,"reserveer_dagen_vooruit":7,"max_open_reserveringen":5,"checkin_venster_min":15}'::jsonb,
     '{"1":["07:00","22:00"],"2":["07:00","22:00"],"3":["07:00","22:00"],"4":["07:00","22:00"],"5":["07:00","21:00"],"6":["09:00","16:00"],"7":["09:00","14:00"]}'::jsonb, 2, false)
  on conflict (vestiging) do nothing;

  insert into public.club_medewerkers (user_id, naam, email, rollen, vestigingen, demo, kleur) values
    (org, 'Anouk Peters', 'anouk@voorbeeld.nl', array['manager','trainer'], array['voorbeeld-centrum','voorbeeld-noord'], true, 'blauw'),
    (org, 'Sem de Graaf', 'sem@voorbeeld.nl', array['trainer','instructeur'], array['voorbeeld-centrum'], true, 'groen'),
    (org, 'Maud Kuipers', 'maud@voorbeeld.nl', array['instructeur'], array['voorbeeld-centrum'], true, 'lila'),
    (org, 'Joris Brouwer', 'joris@voorbeeld.nl', array['trainer'], array['voorbeeld-centrum','voorbeeld-noord'], true, 'roze'),
    (org, 'Lieke Dekker', 'lieke@voorbeeld.nl', array['trainer','instructeur'], array['voorbeeld-noord'], true, 'turkoois');
  select array_agg(id order by naam) into mw_ids from public.club_medewerkers where user_id = org and 'trainer' = any(rollen);

  -- Leden
  foreach v in array array['voorbeeld-centrum','voorbeeld-noord'] loop
    for i in 1..(case when v = 'voorbeeld-centrum' then 140 else 60 end) loop
      r := random();
      st := case when r < 0.82 then 'actief' when r < 0.88 then 'gepauzeerd' when r < 0.93 then 'opgezegd' when r < 0.97 then 'proef' else 'gestopt' end;
      insert into public.club_leden (user_id, vestiging, lidnummer, voornaam, achternaam, email, telefoon, geboortedatum, geslacht, abonnement, status, lid_sinds, einddatum, tags, coach_id, demo)
      values (org, v, 'VG' || lpad((2000 + i + case when v = 'voorbeeld-noord' then 500 else 0 end)::text, 5, '0'),
        voornamen[1 + floor(random() * array_length(voornamen, 1))::int],
        achternamen[1 + floor(random() * array_length(achternamen, 1))::int],
        'lid' || i || '.' || substr(md5(v || i::text), 1, 5) || '@voorbeeld.nl',
        '06' || lpad(floor(random() * 99999999)::text, 8, '0'),
        (current_date - ((18 + floor(random() * 50))::int * 365 + floor(random() * 365)::int)),
        case when random() < 0.5 then 'vrouw' else 'man' end,
        abonnementen[1 + floor(random() * array_length(abonnementen, 1))::int],
        st, current_date - floor(random() * 1100)::int,
        case when st = 'opgezegd' then current_date + floor(random() * 60)::int when st = 'gestopt' then current_date - floor(random() * 90)::int else null end,
        case when random() < 0.12 then array['pt-interesse'] else '{}'::text[] end,
        case when random() < 0.3 then mw_ids[1 + floor(random() * array_length(mw_ids, 1))::int] else null end,
        true);
    end loop;
  end loop;
  update public.club_leden set lid_sinds = current_date - floor(random() * 14)::int where user_id = org and status = 'proef';

  -- Bezoek van de afgelopen 12 weken
  insert into public.club_checkins (user_id, lid_id, vestiging, op, bron, demo)
  select f.user_id, f.id, f.vestiging,
    (d::date + time '07:00' + (abs(hashtext(f.id::text || d::text || 'm')) % 840) * interval '1 minute') at time zone 'Europe/Amsterdam',
    (array['bandje','qr','qr','balie'])[1 + abs(hashtext(f.id::text || d::text || 'b')) % 4], true
  from (
    select l.id, l.user_id, l.vestiging, l.lid_sinds,
      case when l.status = 'proef' then 2.0
           when abs(hashtext(l.id::text || 'freq')) % 100 < 10 then 0
           when abs(hashtext(l.id::text || 'freq')) % 100 < 40 then 1.0
           when abs(hashtext(l.id::text || 'freq')) % 100 < 75 then 2.0
           when abs(hashtext(l.id::text || 'freq')) % 100 < 93 then 3.0
           else 4.5 end as per_week
    from public.club_leden l where l.user_id = org and l.status in ('actief','opgezegd','proef')
  ) f
  cross join generate_series(current_date - 84, current_date - 1, interval '1 day') d
  where f.per_week > 0 and d::date >= coalesce(f.lid_sinds, current_date - 400)
    and (abs(hashtext(f.id::text || d::text)) % 1000) < (f.per_week / 7.0 * 1000);

  -- Zalen, lestypen, weekrooster (Centrum) en lessen
  insert into public.club_zalen (user_id, vestiging, naam, capaciteit) values
    (org, 'voorbeeld-centrum', 'Studio', 20), (org, 'voorbeeld-centrum', 'Cycle', 16), (org, 'voorbeeld-noord', 'Studio', 16);
  insert into public.club_lestypen (user_id, naam, omschrijving, soort, duur_min, intensiteit) values
    (org, 'Cycle', 'Fietsen op muziek met intervallen.', 'spinning', 45, 3),
    (org, 'Kracht', 'Krachttraining met halters voor het hele lichaam.', 'kracht', 50, 2),
    (org, 'HIIT', 'Korte, intensieve blokken met korte rust.', 'functioneel', 30, 3),
    (org, 'Yoga', 'Rustige flow met aandacht voor ademhaling en mobiliteit.', 'mind_body', 60, 1),
    (org, 'Mobiliteit', 'Soepel bewegen en een sterke romp.', 'mind_body', 30, 1);
  insert into public.club_lesseries (user_id, vestiging, lestype_id, zaal_id, instructeur_id, weekdag, starttijd, duur_min, capaciteit, vanaf, demo)
  select org, x.vestiging, t.id,
    (select z.id from public.club_zalen z where z.user_id = org and z.vestiging = x.vestiging and z.naam = x.zaal),
    (select m.id from public.club_medewerkers m where m.user_id = org and 'instructeur' = any(m.rollen) and x.vestiging = any(m.vestigingen) order by md5(x.naam || x.dag::text || m.id::text) limit 1),
    x.dag, x.tijd::time, t.duur_min, x.cap, current_date - 35, true
  from (values
    ('voorbeeld-centrum','Cycle',1,'07:00','Cycle',16), ('voorbeeld-centrum','Kracht',1,'19:00','Studio',20),
    ('voorbeeld-centrum','Yoga',2,'09:30','Studio',20), ('voorbeeld-centrum','HIIT',2,'18:30','Studio',20),
    ('voorbeeld-centrum','Cycle',3,'19:30','Cycle',16), ('voorbeeld-centrum','Mobiliteit',3,'20:15','Studio',20),
    ('voorbeeld-centrum','Kracht',4,'18:30','Studio',20), ('voorbeeld-centrum','Cycle',5,'07:00','Cycle',16),
    ('voorbeeld-centrum','HIIT',6,'10:00','Studio',20), ('voorbeeld-centrum','Yoga',7,'10:00','Studio',20),
    ('voorbeeld-noord','Kracht',2,'19:00','Studio',16), ('voorbeeld-noord','Yoga',4,'09:30','Studio',16),
    ('voorbeeld-noord','HIIT',6,'09:30','Studio',16)
  ) as x(vestiging, naam, dag, tijd, zaal, cap)
  join public.club_lestypen t on t.user_id = org and t.naam = x.naam;

  insert into public.club_lessen (user_id, vestiging, serie_id, lestype_id, zaal_id, instructeur_id, start_op, eind_op, capaciteit, demo)
  select s.user_id, s.vestiging, s.id, s.lestype_id, s.zaal_id, s.instructeur_id,
    (d::date + s.starttijd) at time zone 'Europe/Amsterdam',
    (d::date + s.starttijd + s.duur_min * interval '1 minute') at time zone 'Europe/Amsterdam',
    s.capaciteit, true
  from public.club_lesseries s
  cross join generate_series(current_date - 28, current_date + 14, interval '1 day') d
  where s.user_id = org and extract(isodow from d) = s.weekdag;

  insert into public.club_reserveringen (user_id, les_id, lid_id, status, geboekt_op, bron, demo)
  select org, x.les_id, x.lid_id,
    case when x.start_op > now() then 'geboekt' when abs(hashtext(x.les_id::text || x.lid_id::text)) % 100 < 7 then 'no_show' else 'aanwezig' end,
    x.start_op - interval '2 days', 'app', true
  from (
    select les.id as les_id, les.start_op, l.id as lid_id,
      row_number() over (partition by les.id order by md5(les.id::text || l.id::text)) as nr,
      greatest(3, floor(les.capaciteit * (0.4 + (abs(hashtext(les.id::text)) % 55) / 100.0)))::int as doel
    from public.club_lessen les
    join public.club_leden l on l.user_id = org and l.vestiging = les.vestiging and l.status in ('actief','proef','opgezegd')
    where les.user_id = org
  ) x
  where x.nr <= x.doel
  on conflict (les_id, lid_id) do nothing;

  -- Leads
  insert into public.club_leads (user_id, vestiging, naam, email, telefoon, bron, interesse, status, opvolgen_op, medewerker_id, toestemming_contact, demo, aangemaakt_op)
  select org, case when g % 3 = 0 then 'voorbeeld-noord' else 'voorbeeld-centrum' end,
    voornamen[1 + floor(random() * array_length(voornamen, 1))::int] || ' ' || achternamen[1 + floor(random() * array_length(achternamen, 1))::int],
    'lead' || g || '@voorbeeld.nl', '06' || lpad(floor(random() * 99999999)::text, 8, '0'),
    (array['website','balie','social','verwijzing'])[1 + floor(random() * 4)::int],
    (array['Afvallen','Sterker worden','Groepslessen','Conditie'])[1 + floor(random() * 4)::int],
    (array['nieuw','contact','proefles','lid','verloren'])[1 + floor(random() * 5)::int],
    current_date + (floor(random() * 10) - 3)::int, mw_ids[1 + floor(random() * array_length(mw_ids, 1))::int],
    true, true, now() - floor(random() * 30) * interval '1 day'
  from generate_series(1, 18) g;

  -- Taken: dezelfde opzet als de lijsten van Fit Factory Budel, als startpunt.
  for oud_lijst in select l.id, l.naam, l.volgorde from public.club_takenlijsten l where l.user_id = p_beheerder and l.vestiging = 'budel' and l.actief loop
    insert into public.club_takenlijsten (user_id, vestiging, naam, volgorde) values (org, 'voorbeeld-centrum', oud_lijst.naam, oud_lijst.volgorde) returning id into nieuw_lijst;
    insert into public.club_taken (user_id, lijst_id, naam, groep, frequentie, per_week_min, moment, volgorde, actief)
    select org, nieuw_lijst, t.naam, t.groep, t.frequentie, t.per_week_min, t.moment, t.volgorde, t.actief
    from public.club_taken t where t.lijst_id = oud_lijst.id;
  end loop;

  -- Personeel: diensten van deze en volgende week voor Centrum (de nachtelijke verversing vult daarna aan).
  insert into public.club_dienst_soorten (user_id, vestiging, naam, categorie, begin, eind, rol, volgorde, actief, demo)
  select org, 'voorbeeld-centrum', s.naam, s.categorie, s.begin, s.eind, s.rol, s.volgorde, s.actief, true
  from public.club_dienst_soorten s where s.user_id = p_beheerder and s.vestiging = 'budel';
  insert into public.club_diensten (user_id, vestiging, datum, begin, eind, medewerker_id, soort_id, demo)
  select org, 'voorbeeld-centrum', d::date, s.begin, s.eind,
    (select m.id from public.club_medewerkers m where m.user_id = org and 'voorbeeld-centrum' = any(m.vestigingen) order by md5(s.id::text || d::text || m.id::text) limit 1),
    s.id, true
  from public.club_dienst_soorten s
  cross join generate_series(current_date - 13, current_date + 13, interval '1 day') d
  where s.user_id = org and s.actief
    and case s.categorie
      when 'weekend' then extract(isodow from d) >= 6
      when 'avond' then extract(isodow from d) <= 4
      else extract(isodow from d) <= 5 and s.naam not ilike '%kort%'
    end;

  -- Oefenbibliotheek: dezelfde actieve oefeningen (met beeld en spieren) als startpunt.
  insert into public.club_oefeningen (user_id, naam, spiergroep, materiaal, niveau, uitleg, aandachtspunten, actief, patroon, belast, beeld_start, beeld_eind, beeld_bron, beeld_licentie, spieren_primair, spieren_secundair)
  select org, o.naam, o.spiergroep, o.materiaal, o.niveau, o.uitleg, o.aandachtspunten, true, o.patroon, o.belast, o.beeld_start, o.beeld_eind, o.beeld_bron, o.beeld_licentie, o.spieren_primair, o.spieren_secundair
  from public.club_oefeningen o where o.user_id = p_beheerder and o.actief
  on conflict do nothing;

  return org;
end $$;

revoke all on function public.club_demo_organisatie_maken(uuid) from public, anon, authenticated;

select public.club_demo_organisatie_maken((select user_id from public.pt_lead_links where rol = 'beheerder' limit 1));

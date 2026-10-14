-- ─── Fit Factory clubsoftware: fictieve demodata ────────────────────────────
-- Verzonnen leden, medewerkers, zalen, lessen, reserveringen, bezoeken en leads
-- om de clubsoftware te testen en te presenteren. Geen echte personen: namen
-- zijn willekeurig gecombineerd, e-mailadressen eindigen op @voorbeeld.nl.
-- Alles heeft demo = true. Weghalen voor de pilot:
--   delete from club_leads where demo; delete from club_lessen where demo;
--   delete from club_lesseries where demo; delete from club_leden where demo;
--   delete from club_medewerkers where demo;
-- (reserveringen, check-ins, intakes en schema's van demoleden gaan mee via cascade.)
-- Opnieuw draaien is veilig: het slaat zich over als er al demoleden zijn.

do $$
declare
  uid uuid;
  voornamen text[] := array['Sanne','Lars','Emma','Daan','Lotte','Bram','Fleur','Thijs','Noor','Ruben','Iris','Milan','Julia','Sem','Eva','Luuk','Lisa','Jesse','Anouk','Tim','Sophie','Niels','Maud','Koen','Femke','Stijn','Roos','Joris','Esmee','Bas','Lieke','Wouter','Demi','Rik','Nina','Gijs','Floor','Tom','Merel','Jens'];
  achternamen text[] := array['de Vries','Jansen','van den Berg','Bakker','Visser','Smit','Meijer','de Boer','Mulder','de Groot','Bos','Vos','Peters','Hendriks','van Leeuwen','Dekker','Brouwer','de Wit','Dijkstra','Smits','de Graaf','van der Meer','Kuipers','Verhoeven','van Dijk','Willems','Kok','Jacobs','Schouten','Maas','Verbeek','van Gestel','Hermans','Coolen','Swinkels','van Hout'];
  abonnementen text[] := array['All-in 12 maanden','All-in maand','Fitness 12 maanden','Fitness flex','Groepslessen 12 maanden','Student','Dal-uren','Senior 65+'];
  v text;
  aantal int;
  i int;
  lid uuid;
  st text;
  r float;
  mw_ids uuid[];
  zaal1 uuid; zaal2 uuid; zaal3 uuid;
  lt record;
  serie uuid;
  dag date;
  les record;
begin
  select user_id into uid from public.pt_lead_links limit 1;
  if uid is null then raise exception 'Geen LifeOS-gebruiker gevonden (pt_lead_links leeg).'; end if;
  if exists (select 1 from public.club_leden where demo) then
    raise notice 'Demodata staat er al, overgeslagen.';
    return;
  end if;
  perform setseed(0.42);

  -- Vestigingen met standaardregels.
  insert into public.club_vestigingen (vestiging, user_id, naam, adres, regels, openingstijden)
  select v.sleutel, uid, v.naam, null,
    '{"annuleer_uren":2,"no_show_drempel":3,"no_show_blokkade_dagen":7,"reserveer_dagen_vooruit":7,"max_open_reserveringen":5,"checkin_venster_min":15}'::jsonb,
    '{"1":["06:00","23:00"],"2":["06:00","23:00"],"3":["06:00","23:00"],"4":["06:00","23:00"],"5":["06:00","22:00"],"6":["08:00","17:00"],"7":["08:00","16:00"]}'::jsonb
  from (values ('budel','Budel'),('bergeijk','Bergeijk'),('someren','Someren'),('eindhoven_boschdijk','Eindhoven Boschdijk'),('eindhoven_tongelre','Eindhoven Tongelre'),('eersel','Eersel'),('oisterwijk','Oisterwijk'),('bladel','Bladel')) as v(sleutel, naam)
  on conflict (vestiging) do nothing;

  -- Medewerkers (verzonnen).
  insert into public.club_medewerkers (user_id, naam, email, rollen, vestigingen, demo) values
    (uid,'Marloes Coolen','marloes@voorbeeld.nl',array['manager','balie'],array['budel'],true),
    (uid,'Jeroen Swinkels','jeroen@voorbeeld.nl',array['trainer','instructeur'],array['budel','bergeijk'],true),
    (uid,'Kim van Gestel','kim@voorbeeld.nl',array['instructeur'],array['budel'],true),
    (uid,'Dennis Hermans','dennis@voorbeeld.nl',array['trainer'],array['budel'],true),
    (uid,'Lynn Maas','lynn@voorbeeld.nl',array['balie'],array['budel'],true),
    (uid,'Yara Verbeek','yara@voorbeeld.nl',array['instructeur','trainer'],array['budel','someren'],true),
    (uid,'Mike van Hout','mike@voorbeeld.nl',array['instructeur'],array['budel','eersel'],true),
    (uid,'Petra Kuipers','petra@voorbeeld.nl',array['manager'],array['bergeijk','bladel'],true),
    (uid,'Rick Schouten','rick@voorbeeld.nl',array['trainer','balie'],array['someren'],true),
    (uid,'Sabine Willems','sabine@voorbeeld.nl',array['manager','trainer'],array['eersel'],true);
  select array_agg(id order by naam) into mw_ids from public.club_medewerkers where demo and 'budel' = any(vestigingen);

  -- Leden: Budel ruim gevuld (pilot), de andere vestigingen een kleinere set.
  foreach v in array array['budel','bergeijk','someren','eindhoven_boschdijk','eindhoven_tongelre','eersel','oisterwijk','bladel'] loop
    aantal := case when v = 'budel' then 240 else 40 end;
    for i in 1..aantal loop
      r := random();
      st := case when r < 0.80 then 'actief' when r < 0.87 then 'gepauzeerd' when r < 0.93 then 'opgezegd' when r < 0.97 then 'proef' else 'gestopt' end;
      insert into public.club_leden (user_id, vestiging, lidnummer, voornaam, achternaam, email, telefoon, geboortedatum, geslacht, abonnement, status, lid_sinds, einddatum, tags, coach_id, demo)
      values (
        uid, v,
        upper(left(v, 2)) || lpad((1000 + i)::text, 5, '0'),
        voornamen[1 + floor(random() * array_length(voornamen, 1))::int],
        achternamen[1 + floor(random() * array_length(achternamen, 1))::int],
        null, null,
        (current_date - ((18 + floor(random() * 50))::int * 365 + floor(random() * 365)::int)),
        case when random() < 0.52 then 'vrouw' else 'man' end,
        abonnementen[1 + floor(random() * array_length(abonnementen, 1))::int],
        st,
        current_date - floor(random() * 1400)::int,
        case when st in ('opgezegd') then current_date + floor(random() * 60)::int when st = 'gestopt' then current_date - floor(random() * 90)::int else null end,
        case when random() < 0.15 then array['pt-interesse'] when random() < 0.1 then array['nieuw'] else '{}'::text[] end,
        case when v = 'budel' and random() < 0.35 then mw_ids[1 + floor(random() * array_length(mw_ids, 1))::int] else null end,
        true
      ) returning id into lid;
      update public.club_leden set email = lower(replace(voornaam, ' ', '')) || '.' || substr(md5(lid::text), 1, 5) || '@voorbeeld.nl',
        telefoon = '06' || lpad(floor(random() * 99999999)::text, 8, '0') where id = lid;
    end loop;
  end loop;
  -- Proefleden zijn nieuw.
  update public.club_leden set lid_sinds = current_date - floor(random() * 14)::int where demo and status = 'proef';

  -- Bezoeken: de laatste 60 dagen, actieve leden komen 0 tot 4 keer per week.
  insert into public.club_checkins (user_id, lid_id, vestiging, op, bron, demo)
  select uid, l.id, l.vestiging,
    (d::date + time '06:30' + floor(random() * 15 * 60) * interval '1 minute') at time zone 'Europe/Amsterdam',
    (array['bandje','qr','bandje','balie'])[1 + floor(random() * 4)::int], true
  from public.club_leden l
  cross join generate_series(current_date - 60, current_date - 1, interval '1 day') d
  where l.demo and l.status in ('actief','opgezegd','proef')
    and d::date >= l.lid_sinds
    and random() < (case when l.tags @> array['nieuw'] then 0.12 else 0.06 + (abs(hashtext(l.id::text)) % 50) / 100.0 end);
  -- Vandaag: wat bezoek tot nu toe.
  insert into public.club_checkins (user_id, lid_id, vestiging, op, bron, demo)
  select uid, l.id, l.vestiging, now() - (floor(random() * 300) * interval '1 minute'), 'bandje', true
  from public.club_leden l where l.demo and l.vestiging = 'budel' and l.status = 'actief' and random() < 0.12;

  -- Zalen en lestypen.
  insert into public.club_zalen (user_id, vestiging, naam, capaciteit) values (uid,'budel','Groepsleszaal',24) returning id into zaal1;
  insert into public.club_zalen (user_id, vestiging, naam, capaciteit) values (uid,'budel','Spinningzaal',18) returning id into zaal2;
  insert into public.club_zalen (user_id, vestiging, naam, capaciteit) values (uid,'budel','Functional area',12) returning id into zaal3;
  insert into public.club_zalen (user_id, vestiging, naam, capaciteit)
  select uid, v, 'Groepsleszaal', 22 from unnest(array['bergeijk','someren','eindhoven_boschdijk','eindhoven_tongelre','eersel','oisterwijk','bladel']) v;

  if not exists (select 1 from public.club_lestypen where user_id = uid) then
    insert into public.club_lestypen (user_id, naam, omschrijving, soort, duur_min, intensiteit) values
      (uid,'Spinning','Fietsen op muziek met intervallen. Je bepaalt zelf de weerstand.','spinning',45,3),
      (uid,'BodyPump','Krachttraining met halters op muziek voor het hele lichaam.','kracht',55,2),
      (uid,'HIIT','Korte, intensieve blokken met korte rust. Veel energie in weinig tijd.','functioneel',30,3),
      (uid,'Yoga','Rustige flow met aandacht voor ademhaling, balans en mobiliteit.','mind_body',60,1),
      (uid,'Pilates','Sterke core en houding met gecontroleerde oefeningen.','mind_body',50,1),
      (uid,'Bootcamp','Kracht en conditie in kleine groepen, binnen of buiten.','functioneel',45,3),
      (uid,'Zumba','Dansen op Latin en pop met eenvoudige passen.','dans',50,2),
      (uid,'Core & Stretch','Buikspieren, rug en een rustige afsluiting.','mind_body',30,1),
      (uid,'Circuit','Wisselende stations met kracht en cardio.','functioneel',45,2),
      (uid,'Senior Fit','Bewegen voor 65+: balans, kracht en plezier.','overig',45,1);
  end if;

  -- Weekrooster Budel: (lestype, weekdag, tijd, zaal).
  for lt in
    select t.naam, x.dag, x.tijd::time as tijd, x.zaal
    from (values
      ('Spinning',1,'07:00',2),('BodyPump',1,'09:30',1),('HIIT',1,'18:30',3),('Spinning',1,'19:30',2),('Yoga',1,'20:00',1),
      ('Pilates',2,'09:00',1),('Senior Fit',2,'10:30',1),('Circuit',2,'18:00',3),('Zumba',2,'19:00',1),('Spinning',2,'20:00',2),
      ('Spinning',3,'07:00',2),('BodyPump',3,'18:30',1),('HIIT',3,'19:30',3),('Core & Stretch',3,'20:30',1),
      ('Yoga',4,'09:00',1),('Senior Fit',4,'10:30',1),('Bootcamp',4,'18:30',3),('Spinning',4,'19:30',2),('BodyPump',4,'20:00',1),
      ('HIIT',5,'07:00',3),('Pilates',5,'09:30',1),('Spinning',5,'18:00',2),
      ('Spinning',6,'09:00',2),('BodyPump',6,'10:00',1),('Bootcamp',6,'10:30',3),
      ('Yoga',7,'09:30',1),('Spinning',7,'10:00',2)
    ) as x(naam, dag, tijd, zaal)
    join public.club_lestypen t on t.naam = x.naam and t.user_id = uid
  loop
    insert into public.club_lesseries (user_id, vestiging, lestype_id, zaal_id, instructeur_id, weekdag, starttijd, duur_min, capaciteit, vanaf, demo)
    select uid, 'budel', t.id,
      case lt.zaal when 1 then zaal1 when 2 then zaal2 else zaal3 end,
      (select id from public.club_medewerkers m where m.demo and 'instructeur' = any(m.rollen) and 'budel' = any(m.vestigingen) order by md5(lt.naam || lt.dag::text || m.id::text) limit 1),
      lt.dag, lt.tijd, t.duur_min,
      case lt.zaal when 1 then 24 when 2 then 18 else 12 end,
      current_date - 35, true
    from public.club_lestypen t where t.naam = lt.naam and t.user_id = uid
    returning id into serie;
  end loop;

  -- Lessen: 4 weken terug en 2 weken vooruit.
  insert into public.club_lessen (user_id, vestiging, serie_id, lestype_id, zaal_id, instructeur_id, start_op, eind_op, capaciteit, demo)
  select s.user_id, s.vestiging, s.id, s.lestype_id, s.zaal_id, s.instructeur_id,
    (d::date + s.starttijd) at time zone 'Europe/Amsterdam',
    (d::date + s.starttijd + s.duur_min * interval '1 minute') at time zone 'Europe/Amsterdam',
    s.capaciteit, true
  from public.club_lesseries s
  cross join generate_series(current_date - 28, current_date + 14, interval '1 day') d
  where s.demo and extract(isodow from d) = s.weekdag;

  -- Reserveringen: bezetting 40 tot 100 procent, populaire lessen vol met wachtlijst.
  for les in select id, capaciteit, start_op, vestiging from public.club_lessen where demo loop
    insert into public.club_reserveringen (user_id, les_id, lid_id, status, geboekt_op, bron, demo)
    select uid, les.id, l.id,
      case
        when les.start_op > now() then 'geboekt'
        when random() < 0.08 then 'no_show'
        when random() < 0.06 then 'geannuleerd'
        else 'aanwezig'
      end,
      les.start_op - (1 + floor(random() * 5)) * interval '1 day', 'app', true
    from public.club_leden l
    where l.demo and l.vestiging = les.vestiging and l.status in ('actief','proef','opgezegd')
    order by random()
    limit greatest(3, floor(les.capaciteit * (0.4 + random() * 0.65))::int);
  end loop;
  -- Te veel geboekt in de toekomst: de rest naar de wachtlijst.
  with geteld as (
    select r.id, r.les_id, row_number() over (partition by r.les_id order by r.geboekt_op, r.id) as nr, l.capaciteit
    from public.club_reserveringen r join public.club_lessen l on l.id = r.les_id
    where r.demo and r.status = 'geboekt'
  )
  update public.club_reserveringen r set status = 'wachtlijst', wachtpositie = g.nr - g.capaciteit
  from geteld g where g.id = r.id and g.nr > g.capaciteit;

  -- Leads.
  insert into public.club_leads (user_id, vestiging, naam, email, telefoon, bron, interesse, status, proefles_op, opvolgen_op, medewerker_id, toestemming_contact, demo, aangemaakt_op)
  select uid, 'budel',
    voornamen[1 + floor(random() * array_length(voornamen, 1))::int] || ' ' || achternamen[1 + floor(random() * array_length(achternamen, 1))::int],
    'lead' || g || '@voorbeeld.nl',
    '06' || lpad(floor(random() * 99999999)::text, 8, '0'),
    (array['website','balie','social','verwijzing','actie','telefoon'])[1 + floor(random() * 6)::int],
    (array['Afvallen','Sterker worden','Groepslessen','Conditie','Personal training','Na blessure weer sporten'])[1 + floor(random() * 6)::int],
    (array['nieuw','nieuw','contact','proefles','proefles_geweest','lid','verloren'])[1 + floor(random() * 7)::int],
    null,
    current_date + (floor(random() * 10) - 3)::int,
    mw_ids[1 + floor(random() * array_length(mw_ids, 1))::int],
    true, true,
    now() - floor(random() * 30) * interval '1 day'
  from generate_series(1, 28) g;
  update public.club_leads set proefles_op = date_trunc('hour', now()) + (floor(random() * 8) - 2) * interval '1 day' + interval '18 hours'
  where demo and status in ('proefles','proefles_geweest');
end $$;

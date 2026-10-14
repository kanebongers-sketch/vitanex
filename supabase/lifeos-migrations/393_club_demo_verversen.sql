-- ─── Fit Factory clubsoftware: demodata elke nacht actueel ──────────────────
-- De demo moet er bij een presentatie net zo levend uitzien als vandaag. Deze
-- functie vult alleen DEMO-rijen aan (demo = true) en raakt echte data nooit:
--  1. bezoeken t/m gisteren (zelfde verdeling als 381: deterministisch per lid
--     en dag),
--  2. lessen uit de demo-weekroosters tot 14 dagen vooruit,
--  3. reserveringen voor nieuwe lessen, en voorbije lessen afronden (aanwezig of
--     niet gekomen; aanwezig geeft ook een check-in op die dag),
--  4. diensten tot 4 weken vooruit (patroon van een week eerder), voorbije
--     diensten op "gewerkt",
--  5. afgevinkte taken en de afsluitronde voor gisteren.
-- Draait elke nacht om 03:30 via pg_cron. Weghalen: select cron.unschedule('club-demo-verversen');

create or replace function public.club_demo_verversen() returns void
language plpgsql
set search_path = public
as $$
declare
  uid uuid;
  gisteren date := (now() at time zone 'Europe/Amsterdam')::date - 1;
  vanaf date;
begin
  select user_id into uid from public.pt_lead_links limit 1;
  if uid is null then return; end if;

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
  select uid, x.les_id, x.lid_id, 'geboekt', x.start_op - interval '2 days', 'app', true
  from (
    select les.id as les_id, les.start_op, l.id as lid_id,
      row_number() over (partition by les.id order by md5(les.id::text || l.id::text)) as nr,
      greatest(2, floor(les.capaciteit * (0.3 + (abs(hashtext(les.id::text)) % 65) / 100.0)))::int as doel
    from public.club_lessen les
    join public.club_leden l on l.demo and l.vestiging = les.vestiging and l.status in ('actief','proef','opgezegd')
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
  select uid, lst.vestiging, t.id, gisteren,
    (gisteren + make_time(case t.moment when 'ochtend' then 9 when 'middag' then 14 when 'afsluiten' then 21 else 12 end,
       abs(hashtext(t.id::text || gisteren::text)) % 60, 0)) at time zone 'Europe/Amsterdam',
    m.id, m.naam, true
  from public.club_taken t
  join public.club_takenlijsten lst on lst.id = t.lijst_id
  cross join lateral (
    select id, naam from public.club_medewerkers mw
    where mw.demo and mw.actief and lst.vestiging = any(mw.vestigingen)
    order by md5(mw.id::text || t.id::text || gisteren::text) limit 1
  ) m
  where t.actief
    and (abs(hashtext(t.id::text || gisteren::text)) % 100) < case t.frequentie
      when 'dagelijks' then 88 when 'per_week' then least(90, t.per_week_min * 100 / 7 + 6)
      when 'indien_nodig' then 12 else 6 end
  on conflict (taak_id, datum) do nothing;

  insert into public.club_taak_afsluitrondes (user_id, vestiging, datum, wie, medewerker_id, open_taken, op, demo)
  select uid, v.vestiging, gisteren, m.naam, m.id, 0, (gisteren + time '22:45') at time zone 'Europe/Amsterdam', true
  from (select distinct lst.vestiging from public.club_takenlijsten lst) v
  cross join lateral (
    select id, naam from public.club_medewerkers mw
    where mw.demo and mw.actief and v.vestiging = any(mw.vestigingen)
    order by md5(mw.id::text || gisteren::text) limit 1
  ) m
  on conflict (user_id, vestiging, datum) do nothing;
end $$;

revoke all on function public.club_demo_verversen() from public, anon, authenticated;

-- Elke nacht om 03:30 (UTC; in Nederland 04:30 of 05:30).
select cron.schedule('club-demo-verversen', '30 3 * * *', 'select public.club_demo_verversen()');

-- ─── Club: trainingsschema's voor de demo-sportschool ───────────────────────
-- Voorbeeld Gym krijgt 40 leden met een actief schema, gemaakt van dezelfde
-- sjablonen als de demo-schema's van Fit Factory. De oefeningen worden op naam
-- gekoppeld aan de eigen bibliotheek van Voorbeeld Gym (nooit aan die van
-- Fit Factory). Alles demo = true. Idempotent: slaat over als er al schema's zijn.

do $$
declare
  org uuid := 'de000000-0000-4000-8000-0000000000c1';
  ff uuid;
  sjablonen uuid[];
  lid record;
  bron record;
  nieuw uuid;
  n int := 0;
begin
  if not exists (select 1 from public.club_organisaties where id = org) then return; end if;
  if exists (select 1 from public.club_schemas where user_id = org) then return; end if;
  select beheerder_id into ff from public.club_organisaties where id = org;

  -- Per schemanaam een sjabloon.
  select array_agg(id order by naam) into sjablonen
  from (select distinct on (naam) id, naam from public.club_schemas where user_id = ff and demo order by naam, id) s;
  if sjablonen is null then return; end if;

  for lid in
    select l.id from public.club_leden l
    where l.user_id = org and l.status in ('actief', 'proef')
    order by md5(l.id::text) limit 40
  loop
    select * into bron from public.club_schemas where id = sjablonen[1 + (n % array_length(sjablonen, 1))];
    insert into public.club_schemas (user_id, lid_id, naam, doel, niveau, weken, medewerker_id, status, notitie, demo, dag_titels)
    values (org, lid.id, bron.naam, bron.doel, bron.niveau, bron.weken,
      (select m.id from public.club_medewerkers m where m.user_id = org and 'trainer' = any(m.rollen) order by md5(lid.id::text || m.id::text) limit 1),
      'actief', bron.notitie, true, bron.dag_titels)
    returning id into nieuw;
    insert into public.club_schema_oefeningen (user_id, schema_id, dag, volgorde, oefening_id, sets, herhalingen, gewicht_kg, rust_sec, notitie)
    select org, nieuw, r.dag, r.volgorde, eigen.id, r.sets, r.herhalingen, r.gewicht_kg, r.rust_sec, r.notitie
    from public.club_schema_oefeningen r
    join public.club_oefeningen o on o.id = r.oefening_id
    join public.club_oefeningen eigen on eigen.user_id = org and lower(eigen.naam) = lower(o.naam) and eigen.actief
    where r.schema_id = bron.id;
    n := n + 1;
  end loop;
end $$;

-- 443: schema's als topsysteem voor coaches. Alleen toevoegen, niets weg.
--
-- 1. Per oefening in een schema: superset of circuit (groep), tijd per set,
--    RPE of RIR en tempo.
-- 2. Sjablonen blijven schema's zonder lid (lid_id null, migratie 380). Een
--    sjabloon uit de basisset onthoudt welke (basis_sleutel).
-- 3. club_set_logs: per set wat een lid in de ledenapp deed (gewicht en
--    herhalingen of tijd). Daarmee ziet de trainer het verloop per oefening.
--    De training zelf blijft een regel in club_trainingslog (met de duur).
-- 4. club_lid_definitief_verwijderen neemt de set-logs mee (nieuwe versie van
--    441, alle bestaande regels overgenomen).
-- 5. Demodata: zes weken set-logs voor de leden van Voorbeeld Gym (demo = true).

-- 1. Schema-regels
alter table public.club_schema_oefeningen
  add column if not exists groep smallint check (groep between 1 and 60),
  add column if not exists tijd_sec int check (tijd_sec between 5 and 3600),
  add column if not exists rpe numeric(3,1) check (rpe between 1 and 10),
  add column if not exists rir smallint check (rir between 0 and 10),
  add column if not exists tempo text check (tempo ~ '^[0-9X]{4}$');

-- 2. Sjablonen uit de basisset
alter table public.club_schemas
  add column if not exists basis_sleutel text check (char_length(basis_sleutel) <= 40);

-- Duur van een gelogde training (van "start" tot "training klaar").
alter table public.club_trainingslog
  add column if not exists duur_sec int check (duur_sec between 0 and 21600);

-- 3. Set-logs
create table if not exists public.club_set_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  lid_id uuid not null references public.club_leden(id) on delete cascade,
  trainingslog_id uuid not null references public.club_trainingslog(id) on delete cascade,
  schema_id uuid references public.club_schemas(id) on delete set null,
  oefening_id uuid not null references public.club_oefeningen(id) on delete cascade,
  set_nr smallint not null check (set_nr between 1 and 20),
  herhalingen smallint check (herhalingen between 0 and 300),
  gewicht_kg numeric(6,2) check (gewicht_kg between 0 and 1000),
  tijd_sec int check (tijd_sec between 0 and 3600),
  op timestamptz not null default now(),
  demo boolean not null default false
);
create index if not exists club_set_logs_lid_oefening on public.club_set_logs (lid_id, oefening_id, op desc);
create index if not exists club_set_logs_training on public.club_set_logs (trainingslog_id);
create index if not exists club_set_logs_user on public.club_set_logs (user_id, op desc);

alter table public.club_set_logs enable row level security;
revoke all on public.club_set_logs from anon, authenticated;

-- 4. Definitief verwijderen, nu met de set-logs.
create or replace function public.club_lid_definitief_verwijderen(p_user uuid, p_lid uuid, p_wie text default 'Systeem')
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_lid public.club_leden%rowtype;
  v_namen text[];
  v_leads uuid[];
  n_checkins integer;
  n_reserveringen_anoniem integer;
  n_reserveringen_weg integer;
  n_leads integer;
  n_logboek integer;
begin
  select * into v_lid from public.club_leden l where l.id = p_lid and l.user_id = p_user for update;
  if not found then
    return jsonb_build_object('verwijderd', false);
  end if;

  select coalesce(array_agg(ld.id), '{}') into v_leads
  from public.club_leads ld where ld.lid_id = p_lid and ld.user_id = p_user;

  select array_agg(distinct lower(trim(n))) into v_namen
  from unnest(array[v_lid.voornaam || ' ' || v_lid.achternaam]
    || coalesce((select array_agg(ld.naam) from public.club_leads ld where ld.id = any (v_leads)), '{}')) as n
  where char_length(trim(n)) >= 3;

  -- 1. Anonieme tellingen: bezoeken en de bezetting van gegeven lessen.
  update public.club_checkins set lid_id = null where lid_id = p_lid and user_id = p_user;
  get diagnostics n_checkins = row_count;

  update public.club_reserveringen r set lid_id = null
  from public.club_lessen les
  where r.les_id = les.id and r.lid_id = p_lid and r.user_id = p_user and les.start_op <= now();
  get diagnostics n_reserveringen_anoniem = row_count;

  delete from public.club_reserveringen where lid_id = p_lid and user_id = p_user;
  get diagnostics n_reserveringen_weg = row_count;

  -- 2. Leads die dit lid werden: persoonsgegevens weg, status en bron blijven.
  delete from public.club_lead_historie where lead_id = any (v_leads);
  update public.club_afspraken set notitie = null where lead_id = any (v_leads) and lid_id is distinct from p_lid;
  update public.club_leads
  set naam = 'Verwijderd lid', email = null, telefoon = null, interesse = null, verloren_reden = null,
      lid_id = null, toestemming_contact = false, bijgewerkt_op = now()
  where id = any (v_leads);
  get diagnostics n_leads = row_count;

  -- 3. Alles van het lid zelf.
  delete from public.club_lid_sessies where lid_id = p_lid;
  delete from public.club_lid_toegang where lid_id = p_lid;
  delete from public.club_meldingen where lid_id = p_lid;
  delete from public.club_meldingen_voorkeuren where lid_id = p_lid;
  delete from public.club_notities where lid_id = p_lid;
  delete from public.club_intakes where lid_id = p_lid;
  delete from public.club_metingen where lid_id = p_lid;
  delete from public.club_voedingsplannen where lid_id = p_lid;
  -- Set-logs (migratie 443) voor de trainingen waar ze bij horen.
  delete from public.club_set_logs where lid_id = p_lid;
  delete from public.club_trainingslog where lid_id = p_lid;
  delete from public.club_schemas where lid_id = p_lid;
  delete from public.club_afspraken where lid_id = p_lid;
  delete from public.club_challenge_deelnemers where lid_id = p_lid;
  delete from public.club_opvolgtaken where lid_id = p_lid;
  -- Community (migratie 440).
  delete from public.club_community_meldingen where lid_id = p_lid;
  delete from public.club_community_reacties where lid_id = p_lid;
  delete from public.club_community_berichten where lid_id = p_lid;
  delete from public.club_community_groepsleden where lid_id = p_lid;
  delete from public.club_community_voorkeuren where lid_id = p_lid;
  delete from public.club_leden where id = p_lid and user_id = p_user;

  -- 4. Logboek: de naam eruit, en een regel zonder naam erbij.
  update public.club_logboek lb set onderwerp = 'Verwijderd lid'
  where lb.user_id = p_user and lb.onderwerp is not null
    and exists (select 1 from unnest(coalesce(v_namen, '{}')) n where position(n in lower(lb.onderwerp)) > 0);
  get diagnostics n_logboek = row_count;

  insert into public.club_logboek (user_id, vestiging, wie, actie, onderwerp)
  values (p_user, v_lid.vestiging, left(coalesce(nullif(trim(p_wie), ''), 'Systeem'), 80), 'Lid verwijderd', null);

  return jsonb_build_object(
    'verwijderd', true,
    'bezoeken_anoniem', n_checkins,
    'boekingen_anoniem', n_reserveringen_anoniem,
    'boekingen_weg', n_reserveringen_weg,
    'leads_anoniem', n_leads,
    'logboek_geschoond', n_logboek
  );
end
$$;

revoke all on function public.club_lid_definitief_verwijderen(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.club_lid_definitief_verwijderen(uuid, uuid, text) to service_role;

-- 5. Demodata Voorbeeld Gym: zes weken trainen volgens dubbele progressie.
-- Per lid met een actief demoschema: elke week elke dag een training, de
-- herhalingen lopen op binnen het bereik en daarna gaat het gewicht een stap
-- omhoog. Idempotent: slaat over als er al set-logs voor Voorbeeld Gym zijn.
do $$
declare
  org uuid := 'de000000-0000-4000-8000-0000000000c1';
  sch record;
  dag_nr int;
  wk int;
  log_id uuid;
  moment timestamptz;
begin
  if not exists (select 1 from public.club_organisaties where id = org) then return; end if;
  if exists (select 1 from public.club_set_logs where user_id = org) then return; end if;

  for sch in
    select s.id, s.lid_id from public.club_schemas s
    join public.club_leden l on l.id = s.lid_id and l.demo
    where s.user_id = org and s.status = 'actief' and s.demo
    order by md5(s.id::text) limit 24
  loop
    for wk in 1..6 loop
      for dag_nr in select distinct r.dag from public.club_schema_oefeningen r where r.schema_id = sch.id order by 1 loop
        moment := date_trunc('day', now()) - ((6 - wk) * 7 + (3 - least(dag_nr, 3)) * 2 + 1) * interval '1 day'
          + (17 + abs(hashtext(sch.id::text || wk::text)) % 4) * interval '1 hour';
        insert into public.club_trainingslog (user_id, lid_id, schema_id, dag, op, uitgevoerd, duur_sec, demo)
        values (org, sch.lid_id, sch.id, dag_nr, moment, '[]'::jsonb, 2700 + abs(hashtext(sch.id::text || wk::text || dag_nr::text)) % 1500, true)
        returning id into log_id;

        insert into public.club_set_logs (user_id, lid_id, trainingslog_id, schema_id, oefening_id, set_nr, herhalingen, gewicht_kg, tijd_sec, op, demo)
        select org, sch.lid_id, log_id, sch.id, r.oefening_id, sn,
          case when r.herhalingen ~ '^\d+(-\d+)?$' then
            greatest(1, b.laag + ((wk - 1) % greatest(1, b.hoog - b.laag + 1)) - case when sn = coalesce(r.sets, 3) and wk % 2 = 0 then 1 else 0 end)
          end,
          case when b.basis is null or not (r.herhalingen ~ '^\d+(-\d+)?$') then null
            else b.basis + b.stap * ((wk - 1) / greatest(1, b.hoog - b.laag + 1)) end,
          case when r.herhalingen ~ 'sec' then (regexp_match(r.herhalingen, '(\d+)'))[1]::int + 5 * ((wk - 1) / 2) end,
          moment + sn * interval '2 minutes', true
        from public.club_schema_oefeningen r
        join public.club_oefeningen o on o.id = r.oefening_id
        cross join lateral (
          select
            coalesce((regexp_match(r.herhalingen, '^(\d+)'))[1]::int, 10) as laag,
            coalesce((regexp_match(r.herhalingen, '^\d+-(\d+)$'))[1]::int, coalesce((regexp_match(r.herhalingen, '^(\d+)'))[1]::int, 10)) as hoog,
            case o.materiaal when 'barbell' then 2.5 when 'dumbbell' then 2 when 'kettlebell' then 4 when 'machine' then 5 when 'kabel' then 2.5 else 0 end as stap,
            case o.materiaal
              when 'barbell' then 30 + (abs(hashtext(sch.lid_id::text || o.id::text)) % 5) * 5
              when 'dumbbell' then 8 + (abs(hashtext(sch.lid_id::text || o.id::text)) % 4) * 2
              when 'kettlebell' then 12 + (abs(hashtext(sch.lid_id::text || o.id::text)) % 2) * 4
              when 'machine' then 30 + (abs(hashtext(sch.lid_id::text || o.id::text)) % 6) * 5
              when 'kabel' then 15 + (abs(hashtext(sch.lid_id::text || o.id::text)) % 5) * 2.5
            end as basis
        ) b
        cross join generate_series(1, coalesce(r.sets, 3)) sn
        where r.schema_id = sch.id and r.dag = dag_nr and o.materiaal <> 'cardio_apparaat';
      end loop;
    end loop;
  end loop;
end $$;

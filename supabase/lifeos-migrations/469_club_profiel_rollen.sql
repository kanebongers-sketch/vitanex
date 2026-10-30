-- 469: Club, rollenmodel v2: rollen per profiel. Alleen toevoegen, idempotent.
-- Uitgevoerd door Claude op 29-10-2026 (toestemming Kane: aanvullende migraties voor Club).
--
-- Besluit Kane (29-10-2026): een profiel per persoon per sportschool (de rij in
-- club_medewerkers) met een of meer rollen: eigenaar, manager (clubmanager),
-- trainer, instructeur (groepslesinstructeur), roosteraar en administratie.
-- Bouwplan: docs/club/ROLLEN-PLAN.md. Terugdraaien: docs/club/rollen/terugdraaien-469.sql.
--
-- Wat er gebeurt:
--   1. Kolom club_medewerkers.alle_vestigingen en club_beheerders.profiel_id.
--   2. Tabel club_profiel_rollen (RLS aan, geen toegang voor anon of authenticated).
--   3. Twee synchronisaties met club_medewerkers.rollen (de vier oude rollen),
--      zodat de oude code en de schakelaar CLUB_ROLLEN_V2 uit precies blijven werken.
--   4. Een nieuwe beheerder krijgt meteen een profiel met zijn rol.
--   5. Overzetten: rollen[] naar club_profiel_rollen, elke beheerder een
--      profiel, rechten v1 naar v2 (instellingen.rolrechten). Niets verwijderd.
--   6. club_medewerker_anonimiseren en club_demo_verversen bijgewerkt.

-- ── 1. Kolommen ─────────────────────────────────────────────────────────────

alter table public.club_medewerkers
  add column if not exists alle_vestigingen boolean not null default false;

alter table public.club_beheerders
  add column if not exists profiel_id uuid references public.club_medewerkers(id) on delete set null;

create index if not exists club_beheerders_profiel on public.club_beheerders (profiel_id);

-- ── 2. Tabel ────────────────────────────────────────────────────────────────

create table if not exists public.club_profiel_rollen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  medewerker_id uuid not null,
  rol text not null check (rol in ('eigenaar', 'manager', 'trainer', 'instructeur', 'roosteraar', 'administratie')),
  toegekend_door text check (toegekend_door is null or char_length(toegekend_door) <= 80),
  toegekend_op timestamptz not null default now(),
  demo boolean not null default false,
  unique (medewerker_id, rol),
  foreign key (medewerker_id, user_id) references public.club_medewerkers(id, user_id) on delete cascade
);

create index if not exists club_profiel_rollen_user on public.club_profiel_rollen (user_id, rol);

alter table public.club_profiel_rollen enable row level security;
revoke all on public.club_profiel_rollen from anon, authenticated, public;

-- ── 3. Synchronisatie met club_medewerkers.rollen ───────────────────────────
-- Heen: club_profiel_rollen bepaalt de vier oude rollen in club_medewerkers.rollen.
-- Terug: schrijft de oude code club_medewerkers.rollen, dan volgen de profielrollen
-- (alleen de vier oude; eigenaar en roosteraar blijven staan).
-- Beide schrijven alleen bij een verschil, dus ze stoppen vanzelf.

create or replace function public.club_profiel_rollen_naar_oud()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_mw uuid := coalesce(new.medewerker_id, old.medewerker_id);
  v_user uuid := coalesce(new.user_id, old.user_id);
  v_rollen text[];
begin
  select coalesce(array_agg(r.rol order by array_position(array['trainer','instructeur','manager','administratie'], r.rol)), '{}')
    into v_rollen
  from public.club_profiel_rollen r
  where r.medewerker_id = v_mw and r.user_id = v_user and r.rol in ('trainer', 'instructeur', 'manager', 'administratie');

  update public.club_medewerkers m
  set rollen = v_rollen
  where m.id = v_mw and m.user_id = v_user
    and not (m.rollen @> v_rollen and m.rollen <@ v_rollen);
  return null;
end
$$;

drop trigger if exists club_profiel_rollen_sync on public.club_profiel_rollen;
create trigger club_profiel_rollen_sync
  after insert or update or delete on public.club_profiel_rollen
  for each row execute function public.club_profiel_rollen_naar_oud();

create or replace function public.club_medewerker_rollen_naar_profiel()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.club_profiel_rollen (user_id, medewerker_id, rol, toegekend_door, demo)
  select new.user_id, new.id, r, 'Club', new.demo
  from unnest(coalesce(new.rollen, '{}')) as r
  where r in ('trainer', 'instructeur', 'manager', 'administratie')
  on conflict (medewerker_id, rol) do nothing;

  delete from public.club_profiel_rollen p
  where p.medewerker_id = new.id and p.user_id = new.user_id
    and p.rol in ('trainer', 'instructeur', 'manager', 'administratie')
    and not (p.rol = any(coalesce(new.rollen, '{}')));
  return null;
end
$$;

drop trigger if exists club_medewerker_rollen_sync on public.club_medewerkers;
create trigger club_medewerker_rollen_sync
  after insert or update of rollen on public.club_medewerkers
  for each row execute function public.club_medewerker_rollen_naar_profiel();

-- ── 4. Een profiel voor elke beheerder ──────────────────────────────────────

create or replace function public.club_profiel_voor_beheerder(p_org uuid, p_naam text, p_email text, p_rol text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_rol text := case when p_rol = 'clubmanager' then 'manager' else 'eigenaar' end;
begin
  -- Geen demo (ook niet bij een demo-sportschool): een echte login hoort niet bij de demodata.
  insert into public.club_medewerkers (user_id, naam, email, rollen, vestigingen, alle_vestigingen, actief, demo)
  values (p_org, left(coalesce(nullif(trim(p_naam), ''), 'Beheerder'), 80), case when p_email is null then null else left(lower(trim(p_email)), 160) end,
          '{}', '{}', true, true, false)
  returning id into v_id;
  insert into public.club_profiel_rollen (user_id, medewerker_id, rol, toegekend_door, demo)
  values (p_org, v_id, v_rol, 'Aanmelding', false)
  on conflict (medewerker_id, rol) do nothing;
  return v_id;
end
$$;

revoke all on function public.club_profiel_voor_beheerder(uuid, text, text, text) from public, anon, authenticated;

create or replace function public.club_beheerder_profiel()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.profiel_id is null then
    new.profiel_id := public.club_profiel_voor_beheerder(new.organisatie_id, new.naam, new.email, new.rol);
  end if;
  return new;
end
$$;

drop trigger if exists club_beheerder_profiel on public.club_beheerders;
create trigger club_beheerder_profiel
  before insert on public.club_beheerders
  for each row execute function public.club_beheerder_profiel();

-- ── 5. Overzetten ───────────────────────────────────────────────────────────

-- 5a. De oude rollen naar de profielen.
insert into public.club_profiel_rollen (user_id, medewerker_id, rol, toegekend_door, demo)
select m.user_id, m.id, r, 'Migratie 469', m.demo
from public.club_medewerkers m, unnest(m.rollen) as r
on conflict (medewerker_id, rol) do nothing;

-- 5b. Elke beheerder een profiel met de rol eigenaar of manager.
do $$
declare
  b record;
begin
  for b in select id, organisatie_id, naam, email, rol from public.club_beheerders where profiel_id is null loop
    update public.club_beheerders
    set profiel_id = public.club_profiel_voor_beheerder(b.organisatie_id, b.naam, b.email, b.rol)
    where id = b.id;
  end loop;
end
$$;

-- 5c. Rechten v1 naar v2: elke oude sleutel wordt bewerken; de nieuwe sleutels
-- krijgen de standaard (manager: team en uren beheren, administratie: uren
-- beheren). Eigenaar, roosteraar en de startpagina's: de standaard uit de code
-- (src/lib/club/rollen/standaard.ts). Bestaat rolrechten al, dan niets.
update public.club_organisaties o
set instellingen = o.instellingen || jsonb_build_object('rolrechten', jsonb_build_object(
  'versie', 2,
  'bron', 'v1',
  'rollen', (
    select coalesce(jsonb_object_agg(rol, kaart), '{}'::jsonb)
    from (
      select rol,
        coalesce((
          select jsonb_object_agg(s, 'bewerken')
          from jsonb_array_elements_text(case when jsonb_typeof(o.instellingen -> 'rechten' -> rol) = 'array' then o.instellingen -> 'rechten' -> rol else '[]'::jsonb end) s
          where s not in ('abonnement', 'rollen', 'huisstijl', 'bedrijf', 'lidmaatschappen', 'sluiting', 'financien', 'privacy', 'widget', 'start')
        ), '{}'::jsonb)
        || case rol when 'manager' then '{"team":"beheren","uren":"beheren"}'::jsonb
                    when 'administratie' then '{"uren":"beheren"}'::jsonb
                    else '{}'::jsonb end as kaart
      from unnest(array['trainer', 'instructeur', 'manager', 'administratie']) as rol
      where o.instellingen -> 'rechten' ? rol
    ) x
  )
))
where o.instellingen ? 'rechten'
  and jsonb_typeof(o.instellingen -> 'rechten') = 'object'
  and not (o.instellingen ? 'rolrechten');

-- ── 6. AVG en demo ──────────────────────────────────────────────────────────

-- Een medewerker wissen neemt ook de rollen mee. Een profiel dat nog aan een
-- actieve beheerderslogin hangt, wordt niet gewist (eerst die login intrekken):
-- zo verdwijnt nooit stilletjes de laatste eigenaar.
create or replace function public.club_medewerker_anonimiseren(p_user uuid, p_mw uuid, p_wie text default 'Systeem'::text)
returns boolean
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_mw public.club_medewerkers%rowtype;
  v_nieuw text;
begin
  select * into v_mw from public.club_medewerkers m where m.id = p_mw and m.user_id = p_user for update;
  if not found or v_mw.geanonimiseerd_op is not null then
    return false;
  end if;
  if exists (select 1 from public.club_beheerders b where b.profiel_id = p_mw and b.organisatie_id = p_user and b.actief) then
    return false;
  end if;
  v_nieuw := 'Oud-medewerker ' || upper(left(replace(p_mw::text, '-', ''), 4));

  delete from public.club_medewerker_toegang where medewerker_id = p_mw and user_id = p_user;
  delete from public.club_beschikbaarheid where medewerker_id = p_mw and user_id = p_user;
  delete from public.club_rooster_notities where medewerker_id = p_mw and user_id = p_user;
  delete from public.club_profiel_rollen where medewerker_id = p_mw and user_id = p_user;
  update public.club_beheerders set profiel_id = null where profiel_id = p_mw and organisatie_id = p_user;
  update public.club_diensten set uren_opmerking = null, notitie = null where medewerker_id = p_mw and user_id = p_user;
  update public.club_taak_afvinken set notitie = null where medewerker_id = p_mw and user_id = p_user;
  delete from public.club_taak_notities where medewerker_id = p_mw and user_id = p_user;
  update public.club_leden set coach_id = null where coach_id = p_mw and user_id = p_user;
  update public.club_leads set medewerker_id = null where medewerker_id = p_mw and user_id = p_user;
  update public.club_opvolgtaken set medewerker_id = null where medewerker_id = p_mw and user_id = p_user and status <> 'afgehandeld';
  update public.club_automatiseringen set medewerker_id = null where medewerker_id = p_mw and user_id = p_user;
  update public.club_agenda set medewerker_id = null where medewerker_id = p_mw and user_id = p_user;
  update public.club_support set melder_naam = v_nieuw where melder_id = p_mw and user_id = p_user;

  perform public.club_avg_naam_vervangen(p_user, v_mw.naam, v_nieuw);
  if char_length(trim(v_mw.naam)) >= 3 then
    update public.club_logboek lb set onderwerp = v_nieuw
    where lb.user_id = p_user and lb.onderwerp is not null and position(lower(trim(v_mw.naam)) in lower(lb.onderwerp)) > 0;
  end if;

  update public.club_medewerkers
  set naam = v_nieuw, email = null, actief = false, geanonimiseerd_op = now()
  where id = p_mw and user_id = p_user;

  insert into public.club_logboek (user_id, vestiging, wie, actie, onderwerp)
  values (p_user, null, left(coalesce(nullif(trim(p_wie), ''), 'Systeem'), 80), 'Medewerker gewist (AVG)', v_nieuw);
  return true;
end
$function$;

revoke all on function public.club_medewerker_anonimiseren(uuid, uuid, text) from public, anon, authenticated;

-- club_demo_verversen: aan het eind de rollen van demo-medewerkers aanvullen
-- (de synchronisatie doet dit al; dit is het vangnet voor oude demodata).
do $$
declare
  v_def text;
begin
  v_def := pg_get_functiondef('public.club_demo_verversen()'::regprocedure);
  if position('club_profiel_rollen' in v_def) = 0 then
    v_def := regexp_replace(v_def, 'end\s*\$function\$\s*$',
      E'  insert into public.club_profiel_rollen (user_id, medewerker_id, rol, toegekend_door, demo)\n'
      || E'  select m.user_id, m.id, r, ''Demo'', true\n'
      || E'  from public.club_medewerkers m, unnest(m.rollen) as r\n'
      || E'  where m.demo\n'
      || E'  on conflict (medewerker_id, rol) do nothing;\n'
      || E'end $function$\n');
    execute v_def;
  end if;
end
$$;

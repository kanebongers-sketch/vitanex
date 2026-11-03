-- 489: Club, het Prikbord: mededelingen, werkwijzen en updates voor het team.
--
-- Opdracht Kane (03-11-2026): communicatie van eigenaren naar het team,
-- werkprocessen en updates in AI Your Gym. Ontwerp: docs/club/EENVOUD-10-MINUTEN.md
-- (hoofdstuk 2.5 en hoofdstuk 8, deel 5). Alleen toevoegen; idempotent.
--
-- 1. club_mededelingen: een bericht aan het team, per vestiging en rol, met
--    de optie "moet gelezen en bevestigd worden". Een belangrijke wijziging van
--    een werkwijze is ook een mededeling (soort 'wijziging', met de versie).
-- 2. club_mededeling_gelezen: per persoon (profiel) gelezen en bevestigd.
-- 3. club_werkwijzen: vaste instructies stap voor stap (openen, sluiten,
--    ongeval en EHBO, nieuw lid, klacht of eigen), met een versie.
-- 4. club_werkwijze_versies: elke versie blijft, zodat je ziet wat iemand bevestigde.
-- 5. club_werkwijze_uitvoeringen: wie voerde de werkwijze uit, waar, wanneer,
--    welke stappen en een notitie (zonder medische details).
--
-- AVG (src/lib/club/leden/avg/tabellen.ts, docs/club/AVG.md):
--  - club_werkwijze_uitvoeringen.lid_id is optioneel en gaat los van het lid
--    zodra het lid definitief wordt verwijderd (on delete set null; de functie
--    club_lid_definitief_verwijderen verwijdert club_leden zelf). De koppeling
--    staat in de inzage (export) van het lid.
--  - Een medewerker wissen (club_medewerker_anonimiseren, hieronder opnieuw,
--    gelijk aan de live versie plus de werkwijzen): de notities van zijn
--    uitvoeringen gaan leeg. profiel_id en door_profiel wijzen daarna naar het
--    geanonimiseerde profiel ("Oud-medewerker ...") en zeggen niets meer.
--  - Bewaartermijn: uitvoeringen en mededelingen (met hun gelezen-regels) gaan
--    na 24 maanden weg (club_prikbord_opruimen, elke nacht). Zichtbaar bij
--    Privacy en bewaren als vaste termijn.
--
-- Alle tabellen: RLS aan en geforceerd, geen policies; alleen de server.

-- ── 1. Werkwijzen (eerst: mededelingen verwijzen ernaar) ──────────────────────
create table if not exists public.club_werkwijzen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  titel text not null check (char_length(titel) between 1 and 120),
  soort text not null default 'eigen' check (soort in ('openen', 'sluiten', 'veiligheid', 'nieuw_lid', 'klacht', 'eigen')),
  vestigingen text[] not null default '{}',
  rollen text[] not null default '{}' check (rollen <@ array['eigenaar', 'manager', 'trainer', 'instructeur', 'roosteraar', 'administratie']::text[]),
  versie integer not null default 1 check (versie between 1 and 10000),
  takenlijst_id uuid references public.club_takenlijsten(id) on delete set null,
  bron_notitie_id uuid references public.club_kladblok(id) on delete set null,
  gearchiveerd boolean not null default false,
  demo boolean not null default false,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now(),
  unique (id, user_id)
);
create index if not exists club_werkwijzen_sportschool on public.club_werkwijzen (user_id, gearchiveerd, titel);
create index if not exists club_werkwijzen_takenlijst on public.club_werkwijzen (user_id, takenlijst_id) where takenlijst_id is not null;

create table if not exists public.club_werkwijze_versies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  werkwijze_id uuid not null,
  versie integer not null check (versie between 1 and 10000),
  stappen jsonb not null check (jsonb_typeof(stappen) = 'array' and jsonb_array_length(stappen) between 1 and 40),
  wat_anders text check (wat_anders is null or char_length(wat_anders) between 1 and 600),
  door_profiel uuid references public.club_medewerkers(id) on delete set null,
  gemaakt_op timestamptz not null default now(),
  unique (werkwijze_id, versie),
  foreign key (werkwijze_id, user_id) references public.club_werkwijzen(id, user_id) on delete cascade
);
create index if not exists club_werkwijze_versies_werkwijze on public.club_werkwijze_versies (user_id, werkwijze_id, versie desc);
create index if not exists club_werkwijze_versies_door on public.club_werkwijze_versies (door_profiel) where door_profiel is not null;

-- ── 2. Mededelingen ───────────────────────────────────────────────────────────
create table if not exists public.club_mededelingen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  titel text not null check (char_length(titel) between 1 and 120),
  inhoud text not null default '' check (char_length(inhoud) <= 4000),
  vestigingen text[] not null default '{}',
  rollen text[] not null default '{}' check (rollen <@ array['eigenaar', 'manager', 'trainer', 'instructeur', 'roosteraar', 'administratie']::text[]),
  verplicht boolean not null default false,
  soort text not null default 'mededeling' check (soort in ('mededeling', 'wijziging')),
  werkwijze_id uuid references public.club_werkwijzen(id) on delete cascade,
  werkwijze_versie integer check (werkwijze_versie is null or werkwijze_versie between 1 and 10000),
  door_profiel uuid references public.club_medewerkers(id) on delete set null,
  geplaatst_op timestamptz not null default now(),
  verloopt_op timestamptz,
  gearchiveerd boolean not null default false,
  demo boolean not null default false,
  -- Een wijziging hoort altijd bij een werkwijze en een versie, en is altijd verplicht.
  constraint club_mededelingen_wijziging check (
    (soort = 'mededeling' and werkwijze_id is null and werkwijze_versie is null)
    or (soort = 'wijziging' and werkwijze_id is not null and werkwijze_versie is not null and verplicht)
  ),
  constraint club_mededelingen_verloopt check (verloopt_op is null or verloopt_op > geplaatst_op),
  unique (id, user_id)
);
create index if not exists club_mededelingen_sportschool on public.club_mededelingen (user_id, gearchiveerd, geplaatst_op desc);
create index if not exists club_mededelingen_werkwijze on public.club_mededelingen (werkwijze_id) where werkwijze_id is not null;
create index if not exists club_mededelingen_door on public.club_mededelingen (door_profiel) where door_profiel is not null;

create table if not exists public.club_mededeling_gelezen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  mededeling_id uuid not null,
  profiel_id uuid not null,
  gelezen_op timestamptz not null default now(),
  bevestigd_op timestamptz,
  unique (mededeling_id, profiel_id),
  foreign key (mededeling_id, user_id) references public.club_mededelingen(id, user_id) on delete cascade,
  foreign key (profiel_id, user_id) references public.club_medewerkers(id, user_id) on delete cascade
);
create index if not exists club_mededeling_gelezen_profiel on public.club_mededeling_gelezen (user_id, profiel_id);

-- ── 3. Uitvoeringen van een werkwijze ─────────────────────────────────────────
create table if not exists public.club_werkwijze_uitvoeringen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  werkwijze_id uuid not null,
  versie integer not null check (versie between 1 and 10000),
  vestiging text not null check (char_length(vestiging) between 1 and 60),
  profiel_id uuid references public.club_medewerkers(id) on delete set null,
  gestart_op timestamptz not null default now(),
  afgerond_op timestamptz,
  afgevinkt jsonb not null default '[]'::jsonb check (jsonb_typeof(afgevinkt) = 'array'),
  -- Geen medische details (vaste waarschuwing in de app).
  notitie text check (notitie is null or char_length(notitie) <= 1000),
  lid_id uuid references public.club_leden(id) on delete set null,
  demo boolean not null default false,
  constraint club_werkwijze_uitvoeringen_volgorde check (afgerond_op is null or afgerond_op >= gestart_op),
  foreign key (werkwijze_id, user_id) references public.club_werkwijzen(id, user_id) on delete cascade
);
create index if not exists club_werkwijze_uitvoeringen_vestiging on public.club_werkwijze_uitvoeringen (user_id, vestiging, gestart_op desc);
create index if not exists club_werkwijze_uitvoeringen_werkwijze on public.club_werkwijze_uitvoeringen (user_id, werkwijze_id, gestart_op desc);
create index if not exists club_werkwijze_uitvoeringen_profiel on public.club_werkwijze_uitvoeringen (profiel_id) where profiel_id is not null;
create index if not exists club_werkwijze_uitvoeringen_lid on public.club_werkwijze_uitvoeringen (lid_id) where lid_id is not null;

-- ── 4. Alleen via de server ───────────────────────────────────────────────────
alter table public.club_werkwijzen enable row level security;
alter table public.club_werkwijzen force row level security;
revoke all on public.club_werkwijzen from anon, authenticated, public;
alter table public.club_werkwijze_versies enable row level security;
alter table public.club_werkwijze_versies force row level security;
revoke all on public.club_werkwijze_versies from anon, authenticated, public;
alter table public.club_mededelingen enable row level security;
alter table public.club_mededelingen force row level security;
revoke all on public.club_mededelingen from anon, authenticated, public;
alter table public.club_mededeling_gelezen enable row level security;
alter table public.club_mededeling_gelezen force row level security;
revoke all on public.club_mededeling_gelezen from anon, authenticated, public;
alter table public.club_werkwijze_uitvoeringen enable row level security;
alter table public.club_werkwijze_uitvoeringen force row level security;
revoke all on public.club_werkwijze_uitvoeringen from anon, authenticated, public;

-- ── 5. Medewerker wissen (AVG): de live versie plus de werkwijzen ─────────────
-- Gelijk aan de live definitie (gelezen op 03-11-2026), met een regel erbij:
-- de notities van zijn uitvoeringen gaan leeg.
create or replace function public.club_medewerker_anonimiseren(p_user uuid, p_mw uuid, p_wie text default 'Systeem')
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
  -- 489: het Prikbord. Notities van zijn uitvoeringen leeg; de verwijzingen
  -- (profiel_id, door_profiel) wijzen naar het geanonimiseerde profiel.
  update public.club_werkwijze_uitvoeringen set notitie = null where profiel_id = p_mw and user_id = p_user;

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
grant execute on function public.club_medewerker_anonimiseren(uuid, uuid, text) to service_role;

-- ── 6. Bewaartermijn: 24 maanden ──────────────────────────────────────────────
-- Uitvoeringen: 24 maanden na de start. Mededelingen: 24 maanden na plaatsen,
-- met hun gelezen-regels (cascade). Werkwijzen en hun versies blijven zolang
-- de sportschool ze heeft (instructies, geen gegevens over personen).
create or replace function public.club_prikbord_opruimen()
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_uitvoeringen integer;
  v_mededelingen integer;
begin
  delete from public.club_werkwijze_uitvoeringen where gestart_op < now() - interval '24 months';
  get diagnostics v_uitvoeringen = row_count;
  delete from public.club_mededelingen where geplaatst_op < now() - interval '24 months';
  get diagnostics v_mededelingen = row_count;
  return jsonb_build_object('uitvoeringen', v_uitvoeringen, 'mededelingen', v_mededelingen);
end
$function$;

revoke all on function public.club_prikbord_opruimen() from public, anon, authenticated;
grant execute on function public.club_prikbord_opruimen() to service_role;

-- Elke nacht om 04:20 UTC, na club_privacy_opruimen (04:05).
do $$
begin
  if exists (select 1 from cron.job where jobname = 'club_prikbord_opruimen') then
    perform cron.unschedule('club_prikbord_opruimen');
  end if;
  perform cron.schedule('club_prikbord_opruimen', '20 4 * * *', $job$select public.club_prikbord_opruimen()$job$);
end
$$;

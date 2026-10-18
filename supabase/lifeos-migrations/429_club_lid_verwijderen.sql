-- 429: AVG-rechten van een lid: verwijderen in twee stappen.
--
-- Stap 1 (aanvragen): het lid "wordt verwijderd". Het lid kan niet meer
-- inloggen, inchecken of boeken (status gestopt; de vorige status wordt
-- bewaard), alle sessies van de ledenapp vervallen, toekomstige boekingen,
-- afspraken en geplande meldingen worden geannuleerd. De sportschool kan dit
-- 30 dagen terugdraaien.
-- Stap 2 (definitief, na 30 dagen via pg_cron): alle persoonsgegevens van het
-- lid weg uit alle club_*-tabellen, in een transactie. Wat anoniem mag blijven
-- voor de maandcijfers wordt losgekoppeld (lid_id null):
--   * club_checkins: bezoeken per dag en per uur blijven kloppen;
--   * club_reserveringen van lessen die al begonnen zijn: bezetting, aanwezig
--     en no-show van die lessen blijven kloppen;
--   * club_leads die naar dit lid zijn omgezet: naam, contact en vrije tekst
--     weg, status en bron blijven (conversiecijfers).
-- Regels in het logboek die de naam noemen worden "Verwijderd lid"; daarna komt
-- er een regel "Lid verwijderd" zonder naam bij.
--
-- Alle functies zijn security definer, alleen voor service_role (de server), met
-- een vaste search_path. De server controleert vooraf wie het mag (Kane en de
-- eigenaar van de sportschool).

-- ── Losgekoppelde tellingen mogen zonder lid bestaan ──────────────────────────
alter table public.club_checkins alter column lid_id drop not null;
alter table public.club_reserveringen alter column lid_id drop not null;

-- ── Aanvragen die nog lopen ───────────────────────────────────────────────────
create table if not exists public.club_lid_verwijderingen (
  lid_id uuid primary key references public.club_leden(id) on delete cascade,
  user_id uuid not null,
  aangevraagd_op timestamptz not null default now(),
  definitief_op timestamptz not null,
  aangevraagd_door text not null check (char_length(aangevraagd_door) between 1 and 80),
  vorige_status text not null check (vorige_status in ('actief', 'gepauzeerd', 'opgezegd', 'gestopt', 'proef')),
  check (definitief_op > aangevraagd_op)
);

create index if not exists club_lid_verwijderingen_user on public.club_lid_verwijderingen (user_id);
create index if not exists club_lid_verwijderingen_definitief on public.club_lid_verwijderingen (definitief_op);

alter table public.club_lid_verwijderingen enable row level security;
alter table public.club_lid_verwijderingen force row level security;
revoke all on public.club_lid_verwijderingen from public, anon, authenticated;

-- ── Zolang de aanvraag loopt blijft het lid gestopt (ook bij een import) ──────
create or replace function public.club_lid_verwijderen_bewaken()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status is distinct from 'gestopt'
     and exists (select 1 from public.club_lid_verwijderingen v where v.lid_id = new.id) then
    new.status := 'gestopt';
  end if;
  return new;
end
$$;

revoke all on function public.club_lid_verwijderen_bewaken() from public, anon, authenticated;

drop trigger if exists club_leden_verwijderen_bewaken on public.club_leden;
create trigger club_leden_verwijderen_bewaken
  before update of status on public.club_leden
  for each row execute function public.club_lid_verwijderen_bewaken();

-- ── Stap 1: aanvragen ─────────────────────────────────────────────────────────
create or replace function public.club_lid_verwijderen_aanvragen(p_user uuid, p_lid uuid, p_door text, p_dagen integer default 30)
returns timestamptz
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_status text;
  v_definitief timestamptz;
begin
  if p_dagen is null or p_dagen < 1 or p_dagen > 90 then
    raise exception 'ongeldige termijn';
  end if;
  select l.status into v_status from public.club_leden l where l.id = p_lid and l.user_id = p_user for update;
  if not found then
    raise exception 'lid niet gevonden' using errcode = 'P0002';
  end if;
  if exists (select 1 from public.club_lid_verwijderingen v where v.lid_id = p_lid) then
    raise exception 'al aangevraagd' using errcode = '23505';
  end if;

  v_definitief := now() + make_interval(days => p_dagen);
  insert into public.club_lid_verwijderingen (lid_id, user_id, definitief_op, aangevraagd_door, vorige_status)
  values (p_lid, p_user, v_definitief, left(coalesce(nullif(trim(p_door), ''), 'Onbekend'), 80), v_status);

  update public.club_leden set status = 'gestopt', bijgewerkt_op = now() where id = p_lid and user_id = p_user;

  -- Overal uitgelogd uit de ledenapp.
  delete from public.club_lid_sessies where lid_id = p_lid and user_id = p_user;

  -- Plaatsen in toekomstige lessen en afspraken vrijgeven.
  update public.club_reserveringen r
  set status = 'geannuleerd', geannuleerd_op = now(), gewijzigd_op = now(), wachtpositie = null
  from public.club_lessen les
  where r.les_id = les.id and r.lid_id = p_lid and r.user_id = p_user
    and r.status in ('geboekt', 'wachtlijst') and les.start_op > now();

  update public.club_afspraken
  set status = 'geannuleerd', geannuleerd_op = now(), gewijzigd_op = now()
  where lid_id = p_lid and user_id = p_user and status = 'gepland' and start_op > now();

  -- Geen mails of berichten meer naar dit lid.
  update public.club_meldingen
  set status = 'overgeslagen', reden = 'Lid wordt verwijderd', gewijzigd_op = now()
  where lid_id = p_lid and user_id = p_user and status = 'gepland';

  return v_definitief;
end
$$;

-- ── Terugdraaien binnen de termijn ────────────────────────────────────────────
create or replace function public.club_lid_verwijderen_terugdraaien(p_user uuid, p_lid uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_status text;
begin
  delete from public.club_lid_verwijderingen v
  where v.lid_id = p_lid and v.user_id = p_user
  returning v.vorige_status into v_status;
  if not found then
    return false;
  end if;
  update public.club_leden set status = v_status, bijgewerkt_op = now() where id = p_lid and user_id = p_user;
  return true;
end
$$;

-- ── Stap 2: definitief verwijderen (alles in een transactie) ──────────────────
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

  -- Namen om uit het logboek te halen: het lid en de leads die het lid werden.
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
  delete from public.club_trainingslog where lid_id = p_lid;
  delete from public.club_schemas where lid_id = p_lid;
  delete from public.club_afspraken where lid_id = p_lid;
  delete from public.club_challenge_deelnemers where lid_id = p_lid;
  delete from public.club_opvolgtaken where lid_id = p_lid;
  delete from public.club_leden where id = p_lid and user_id = p_user;
  -- De aanvraag verdwijnt mee (on delete cascade).

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

-- ── De nachtelijke ronde: verlopen aanvragen afronden ─────────────────────────
create or replace function public.club_lid_verwijderingen_afronden()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r record;
  n integer := 0;
begin
  for r in
    select v.user_id, v.lid_id from public.club_lid_verwijderingen v
    where v.definitief_op <= now() order by v.definitief_op limit 500
  loop
    begin
      perform public.club_lid_definitief_verwijderen(r.user_id, r.lid_id, 'Systeem (na 30 dagen)');
      n := n + 1;
    exception when others then
      -- Een lid dat niet lukt houdt de rest niet tegen; morgen opnieuw.
      raise warning 'club_lid_verwijderingen_afronden: lid % mislukt: %', r.lid_id, sqlerrm;
    end;
  end loop;
  return n;
end
$$;

-- ── Alleen de server ──────────────────────────────────────────────────────────
revoke all on function public.club_lid_verwijderen_aanvragen(uuid, uuid, text, integer) from public, anon, authenticated;
revoke all on function public.club_lid_verwijderen_terugdraaien(uuid, uuid) from public, anon, authenticated;
revoke all on function public.club_lid_definitief_verwijderen(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.club_lid_verwijderingen_afronden() from public, anon, authenticated;
grant execute on function public.club_lid_verwijderen_aanvragen(uuid, uuid, text, integer) to service_role;
grant execute on function public.club_lid_verwijderen_terugdraaien(uuid, uuid) to service_role;
grant execute on function public.club_lid_definitief_verwijderen(uuid, uuid, text) to service_role;
grant execute on function public.club_lid_verwijderingen_afronden() to service_role;

-- Elke nacht om 03:50 UTC (na de demo-verversing en het opruimen van fouten).
do $$
begin
  if exists (select 1 from cron.job where jobname = 'club_lid_verwijderingen_afronden') then
    perform cron.unschedule('club_lid_verwijderingen_afronden');
  end if;
  perform cron.schedule(
    'club_lid_verwijderingen_afronden',
    '50 3 * * *',
    $job$select public.club_lid_verwijderingen_afronden()$job$
  );
end
$$;

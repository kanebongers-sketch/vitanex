-- 449: AVG compleet. Alleen toevoegen, idempotent.
--
-- 1. club_privacy_instellingen: bewaartermijnen per sportschool (instelbaar in
--    Instellingen > Sportschool > Privacy en bewaren). Geen rij = standaard.
-- 2. club_lid_definitief_verwijderen: nieuwe versie die ALLE tabellen met een
--    lid_id expliciet noemt (vervangt 429, 441 en 443; nieuw: betalen, push). Verkopen
--    blijven voor de fiscale bewaarplicht, maar zonder lid (lid_id null).
--    De lijst in code staat in src/lib/club/leden/avg/tabellen.ts; een test
--    faalt als een nieuwe migratie een tabel met lid_id maakt die daar niet staat.
-- 3. club_lead_anonimiseren: een lead (ook uit de widget) wissen op verzoek.
-- 4. club_medewerker_anonimiseren: een (oud-)medewerker wissen op verzoek. Uren
--    blijven (fiscale bewaarplicht loonadministratie, 7 jaar), zonder naam.
-- 5. club_privacy_opruimen: elke nacht bewaartermijnen toepassen (pg_cron).
--
-- Alle functies: security definer, vaste search_path, alleen service_role.
-- Demodata (demo = true) blijft buiten het automatisch opruimen; die ververst
-- club_demo_verversen() zelf.

-- ── 1. Bewaartermijnen per sportschool ────────────────────────────────────────
create table if not exists public.club_privacy_instellingen (
  user_id uuid primary key,
  leads_maanden integer not null default 12 check (leads_maanden between 3 and 36),
  oud_leden_maanden integer not null default 24 check (oud_leden_maanden between 6 and 84),
  bezoeken_maanden integer not null default 24 check (bezoeken_maanden between 3 and 84),
  logboek_maanden integer not null default 24 check (logboek_maanden between 6 and 84),
  bijgewerkt_op timestamptz not null default now()
);

alter table public.club_privacy_instellingen enable row level security;
alter table public.club_privacy_instellingen force row level security;
revoke all on public.club_privacy_instellingen from public, anon, authenticated;

-- Markering: deze rij is al geanonimiseerd (niet opnieuw doen, niet tonen als persoon).
alter table public.club_leads add column if not exists geanonimiseerd_op timestamptz;
alter table public.club_medewerkers add column if not exists geanonimiseerd_op timestamptz;

-- ── Hulp: een naam in vrije "door/auteur/wie"-kolommen vervangen ──────────────
-- Alleen exacte overeenkomst (hoofdletters en spaties tellen niet), zodat
-- andere tekst ongemoeid blijft.
create or replace function public.club_avg_naam_vervangen(p_user uuid, p_naam text, p_nieuw text)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  n integer := 0;
  k integer;
  v text := lower(trim(p_naam));
begin
  if v is null or char_length(v) < 2 then
    return 0;
  end if;
  update public.club_logboek set wie = p_nieuw where user_id = p_user and lower(trim(wie)) = v;
  get diagnostics k = row_count; n := n + k;
  update public.club_notities set auteur = p_nieuw where user_id = p_user and lower(trim(auteur)) = v;
  get diagnostics k = row_count; n := n + k;
  update public.club_lead_historie set auteur = p_nieuw where user_id = p_user and lower(trim(auteur)) = v;
  get diagnostics k = row_count; n := n + k;
  update public.club_kladblok set auteur = p_nieuw where user_id = p_user and lower(trim(auteur)) = v;
  get diagnostics k = row_count; n := n + k;
  update public.club_agenda set auteur = p_nieuw where user_id = p_user and lower(trim(auteur)) = v;
  get diagnostics k = row_count; n := n + k;
  update public.club_voedingsplannen set bijgewerkt_door = p_nieuw where user_id = p_user and lower(trim(bijgewerkt_door)) = v;
  get diagnostics k = row_count; n := n + k;
  update public.club_opvolgtaken set afgehandeld_door = p_nieuw where user_id = p_user and lower(trim(afgehandeld_door)) = v;
  get diagnostics k = row_count; n := n + k;
  update public.club_diensten set bevestigd_door = p_nieuw where user_id = p_user and lower(trim(bevestigd_door)) = v;
  get diagnostics k = row_count; n := n + k;
  update public.club_diensten set goedgekeurd_door = p_nieuw where user_id = p_user and lower(trim(goedgekeurd_door)) = v;
  get diagnostics k = row_count; n := n + k;
  update public.club_taak_afvinken set wie = p_nieuw where user_id = p_user and lower(trim(wie)) = v;
  get diagnostics k = row_count; n := n + k;
  update public.club_taak_notities set wie = p_nieuw where user_id = p_user and lower(trim(wie)) = v;
  get diagnostics k = row_count; n := n + k;
  update public.club_taak_afsluitrondes set wie = p_nieuw where user_id = p_user and lower(trim(wie)) = v;
  get diagnostics k = row_count; n := n + k;
  update public.club_community_groepsleden set toegevoegd_door = p_nieuw where user_id = p_user and lower(trim(toegevoegd_door)) = v;
  get diagnostics k = row_count; n := n + k;
  update public.club_community_berichten set beoordeeld_door = p_nieuw where user_id = p_user and lower(trim(beoordeeld_door)) = v;
  get diagnostics k = row_count; n := n + k;
  return n;
end
$$;

-- ── 2. Een lid definitief verwijderen (vervangt 429 en 441) ───────────────────
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
  n_verkopen integer;
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

  -- 2. Verkopen in de ledenapp: fiscale bewaarplicht (7 jaar), dus de
  --    verkoop blijft, maar zonder lid. Tegoeden en mutaties gaan weg.
  update public.club_betalen_verkopen set lid_id = null where lid_id = p_lid and user_id = p_user;
  get diagnostics n_verkopen = row_count;
  delete from public.club_betalen_mutaties where lid_id = p_lid and user_id = p_user;
  delete from public.club_betalen_tegoeden where lid_id = p_lid and user_id = p_user;

  -- 3. Leads die dit lid werden: persoonsgegevens weg, status en bron blijven.
  delete from public.club_lead_historie where lead_id = any (v_leads);
  update public.club_afspraken set notitie = null where lead_id = any (v_leads) and lid_id is distinct from p_lid;
  update public.club_leads
  set naam = 'Verwijderd lid', email = null, telefoon = null, interesse = null, verloren_reden = null,
      lid_id = null, toestemming_contact = false, geanonimiseerd_op = now(), bijgewerkt_op = now()
  where id = any (v_leads);
  get diagnostics n_leads = row_count;

  -- 4. Alles van het lid zelf.
  delete from public.club_lid_sessies where lid_id = p_lid;
  delete from public.club_lid_toegang where lid_id = p_lid;
  delete from public.club_push_abonnementen where lid_id = p_lid;
  delete from public.club_meldingen where lid_id = p_lid;
  delete from public.club_meldingen_voorkeuren where lid_id = p_lid;
  delete from public.club_notities where lid_id = p_lid;
  delete from public.club_intakes where lid_id = p_lid;
  delete from public.club_metingen where lid_id = p_lid;
  delete from public.club_voedingsplannen where lid_id = p_lid;
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
  -- Het lid zelf; club_lid_verwijderingen verdwijnt mee (on delete cascade).
  delete from public.club_leden where id = p_lid and user_id = p_user;

  -- 5. Logboek: de naam eruit, en een regel zonder naam erbij.
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
    'verkopen_anoniem', n_verkopen,
    'leads_anoniem', n_leads,
    'logboek_geschoond', n_logboek
  );
end
$$;

-- ── 3. Een lead wissen (op verzoek of na de bewaartermijn) ────────────────────
-- Naam, contact en vrije tekst weg; status, bron, vestiging en datums blijven
-- voor de conversiecijfers. Een lead die lid werd hoort bij het lid: weigeren.
create or replace function public.club_lead_anonimiseren(p_user uuid, p_lead uuid, p_wie text default 'Systeem')
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_lead public.club_leads%rowtype;
  v_naam text;
begin
  select * into v_lead from public.club_leads ld where ld.id = p_lead and ld.user_id = p_user for update;
  if not found or v_lead.geanonimiseerd_op is not null then
    return false;
  end if;
  v_naam := lower(trim(v_lead.naam));

  delete from public.club_lead_historie where lead_id = p_lead and user_id = p_user;
  update public.club_afspraken set notitie = null where lead_id = p_lead and user_id = p_user and lid_id is null;
  update public.club_leads
  set naam = 'Verwijderde lead', email = null, telefoon = null, interesse = null, verloren_reden = null,
      toestemming_contact = false, geanonimiseerd_op = now(), bijgewerkt_op = now()
  where id = p_lead and user_id = p_user;

  if char_length(v_naam) >= 3 then
    update public.club_logboek lb set onderwerp = 'Verwijderde lead'
    where lb.user_id = p_user and lb.onderwerp is not null and position(v_naam in lower(lb.onderwerp)) > 0;
  end if;
  insert into public.club_logboek (user_id, vestiging, wie, actie, onderwerp)
  values (p_user, v_lead.vestiging, left(coalesce(nullif(trim(p_wie), ''), 'Systeem'), 80), 'Lead gewist (AVG)', null);
  return true;
end
$$;

-- ── 4. Een medewerker wissen (op verzoek, na uit dienst) ──────────────────────
-- De rij blijft bestaan als "Oud-medewerker" zodat diensten, uren, lessen en
-- schema's kloppen (uren: fiscale bewaarplicht). Naam, e-mail, inlog,
-- beschikbaarheid (kan ziekte of verlof bevatten) en vrije opmerkingen gaan weg.
create or replace function public.club_medewerker_anonimiseren(p_user uuid, p_mw uuid, p_wie text default 'Systeem')
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_mw public.club_medewerkers%rowtype;
  v_nieuw text;
begin
  select * into v_mw from public.club_medewerkers m where m.id = p_mw and m.user_id = p_user for update;
  if not found or v_mw.geanonimiseerd_op is not null then
    return false;
  end if;
  v_nieuw := 'Oud-medewerker ' || upper(left(replace(p_mw::text, '-', ''), 4));

  -- Inloggen kan niet meer (sessies gaan mee via cascade).
  delete from public.club_medewerker_toegang where medewerker_id = p_mw and user_id = p_user;
  delete from public.club_beschikbaarheid where medewerker_id = p_mw and user_id = p_user;
  delete from public.club_rooster_notities where medewerker_id = p_mw and user_id = p_user;
  update public.club_diensten set uren_opmerking = null, notitie = null where medewerker_id = p_mw and user_id = p_user;
  update public.club_taak_afvinken set notitie = null where medewerker_id = p_mw and user_id = p_user;
  delete from public.club_taak_notities where medewerker_id = p_mw and user_id = p_user;
  -- Lopende koppelingen los: geen coach, opvolger of standaard-ontvanger meer.
  update public.club_leden set coach_id = null where coach_id = p_mw and user_id = p_user;
  update public.club_leads set medewerker_id = null where medewerker_id = p_mw and user_id = p_user;
  update public.club_opvolgtaken set medewerker_id = null where medewerker_id = p_mw and user_id = p_user and status <> 'afgehandeld';
  update public.club_automatiseringen set medewerker_id = null where medewerker_id = p_mw and user_id = p_user;
  update public.club_agenda set medewerker_id = null where medewerker_id = p_mw and user_id = p_user;
  update public.club_support set melder_naam = v_nieuw where melder_id = p_mw and user_id = p_user;

  perform public.club_avg_naam_vervangen(p_user, v_mw.naam, v_nieuw);
  -- Ook waar de naam in het onderwerp van het logboek staat (bijv. "Medewerker aangepast").
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
$$;

-- ── 5. Elke nacht: bewaartermijnen toepassen ──────────────────────────────────
create or replace function public.club_privacy_opruimen()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r record;
  n_leads integer := 0;
  n_oud integer := 0;
  n_bezoeken integer := 0;
  n_boekingen integer := 0;
  n_logboek integer := 0;
  n_meldingen integer;
  n_sessies integer;
  n_push integer;
  n_rem integer;
  n_support integer;
  n_personeel integer;
  n_diensten integer;
  n_ayg integer;
  k integer;
begin
  -- a) Per sportschool, met de eigen termijnen (geen rij = standaard).
  for r in
    select o.id as user_id,
      coalesce(p.leads_maanden, 12) as leads_m,
      coalesce(p.oud_leden_maanden, 24) as oud_m,
      coalesce(p.bezoeken_maanden, 24) as bezoek_m,
      coalesce(p.logboek_maanden, 24) as logboek_m
    from public.club_organisaties o
    left join public.club_privacy_instellingen p on p.user_id = o.id
  loop
    -- Leads: 12 maanden (standaard) na het laatste contact.
    perform public.club_lead_anonimiseren(r.user_id, ld.id, 'Bewaartermijn')
    from public.club_leads ld
    where ld.user_id = r.user_id and ld.demo = false and ld.lid_id is null and ld.geanonimiseerd_op is null
      and greatest(ld.aangemaakt_op, ld.bijgewerkt_op, coalesce(ld.proefles_op, ld.aangemaakt_op), coalesce(ld.opvolgen_op::timestamptz, ld.aangemaakt_op),
            coalesce((select max(h.op) from public.club_lead_historie h where h.lead_id = ld.id), ld.aangemaakt_op))
          < now() - make_interval(months => r.leads_m);
    get diagnostics k = row_count; n_leads := n_leads + k;

    -- Oud-leden: na de termijn een verzoek tot verwijderen (30 dagen terug te
    -- draaien door de sportschool), niet meteen definitief.
    perform public.club_lid_verwijderen_aanvragen(r.user_id, l.id, 'Bewaartermijn oud-leden')
    from public.club_leden l
    where l.user_id = r.user_id and l.demo = false and l.status in ('gestopt', 'opgezegd')
      and coalesce(l.einddatum, l.bijgewerkt_op::date) < (now() - make_interval(months => r.oud_m))::date
      and l.bijgewerkt_op < now() - make_interval(months => r.oud_m)
      and not exists (select 1 from public.club_lid_verwijderingen v where v.lid_id = l.id)
      and not exists (select 1 from public.club_checkins c where c.lid_id = l.id and c.op >= now() - make_interval(months => r.oud_m));
    get diagnostics k = row_count; n_oud := n_oud + k;

    -- Bezoeken en boekingen van gegeven lessen: los van het lid (tellingen blijven).
    update public.club_checkins set lid_id = null
    where user_id = r.user_id and demo = false and lid_id is not null and op < now() - make_interval(months => r.bezoek_m);
    get diagnostics k = row_count; n_bezoeken := n_bezoeken + k;

    update public.club_reserveringen rs set lid_id = null
    from public.club_lessen les
    where rs.les_id = les.id and rs.user_id = r.user_id and rs.demo = false and rs.lid_id is not null
      and les.start_op < now() - make_interval(months => r.bezoek_m);
    get diagnostics k = row_count; n_boekingen := n_boekingen + k;

    -- Logboek.
    delete from public.club_logboek where user_id = r.user_id and op < now() - make_interval(months => r.logboek_m);
    get diagnostics k = row_count; n_logboek := n_logboek + k;
  end loop;

  -- b) Vaste termijnen (voor alle sportscholen gelijk).
  -- Berichten en mails aan leden: 12 maanden.
  delete from public.club_meldingen
  where demo = false and coalesce(verstuurd_op, gepland_op, aangemaakt_op) < now() - interval '12 months';
  get diagnostics n_meldingen = row_count;

  -- Verlopen sessies (leden, medewerkers, beheerders).
  delete from public.club_lid_sessies where verloopt_op < now();
  get diagnostics n_sessies = row_count;
  delete from public.club_medewerker_sessies where verloopt_op < now();
  get diagnostics k = row_count; n_sessies := n_sessies + k;
  delete from public.club_beheerder_sessies where verloopt_op < now();
  get diagnostics k = row_count; n_sessies := n_sessies + k;

  -- Push-toestellen die een half jaar niets kregen.
  delete from public.club_push_abonnementen where coalesce(laatst_gebruikt_op, aangemaakt_op) < now() - interval '6 months';
  get diagnostics n_push = row_count;

  -- Remmen tegen misbruik (alleen hashes): een week.
  delete from public.club_widget_rem where op < now() - interval '7 days';
  get diagnostics n_rem = row_count;
  delete from public.club_app_aanvragen where aangemaakt_op < now() - interval '7 days';
  get diagnostics k = row_count; n_rem := n_rem + k;

  -- Hulpvragen aan AI Your Gym: 24 maanden na de laatste wijziging.
  delete from public.club_support where coalesce(bijgewerkt_op, aangemaakt_op) < now() - interval '24 months';
  get diagnostics n_support = row_count;

  -- Personeel: beschikbaarheid (kan ziekte of verlof noemen), taken en
  -- afsluitrondes na 24 maanden; diensten en uren na 7 jaar (bewaarplicht).
  delete from public.club_beschikbaarheid where demo = false and datum is not null and coalesce(datum_tot, datum) < current_date - interval '24 months';
  get diagnostics n_personeel = row_count;
  delete from public.club_rooster_notities where demo = false and datum < current_date - interval '24 months';
  get diagnostics k = row_count; n_personeel := n_personeel + k;
  delete from public.club_taak_afvinken where demo = false and datum < current_date - interval '24 months';
  get diagnostics k = row_count; n_personeel := n_personeel + k;
  delete from public.club_taak_notities where demo = false and datum < current_date - interval '24 months';
  get diagnostics k = row_count; n_personeel := n_personeel + k;
  delete from public.club_taak_afsluitrondes where demo = false and datum < current_date - interval '24 months';
  get diagnostics k = row_count; n_personeel := n_personeel + k;
  delete from public.club_diensten where demo = false and datum < current_date - interval '7 years';
  get diagnostics n_diensten = row_count;

  -- AI Your Gym-website: demo-aanvragen 12 maanden; aanmeldingen die nooit
  -- klant werden 12 maanden. Klanten blijven (overeenkomst, facturen).
  delete from public.ayg_demo_aanvragen where aangemaakt_op < now() - interval '12 months';
  get diagnostics n_ayg = row_count;
  delete from public.ayg_aanmeldingen
  where status in ('aanvraag', 'wacht_op_betaling') and organisatie_id is null and aangemaakt_op < now() - interval '12 months';
  get diagnostics k = row_count; n_ayg := n_ayg + k;

  return jsonb_build_object(
    'leads_gewist', n_leads, 'oud_leden_aangevraagd', n_oud, 'bezoeken_anoniem', n_bezoeken, 'boekingen_anoniem', n_boekingen,
    'logboek_weg', n_logboek, 'meldingen_weg', n_meldingen, 'sessies_weg', n_sessies, 'push_weg', n_push, 'rem_weg', n_rem,
    'support_weg', n_support, 'personeel_weg', n_personeel, 'diensten_weg', n_diensten, 'website_weg', n_ayg
  );
end
$$;

-- ── Alleen de server ──────────────────────────────────────────────────────────
revoke all on function public.club_avg_naam_vervangen(uuid, text, text) from public, anon, authenticated;
revoke all on function public.club_lid_definitief_verwijderen(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.club_lead_anonimiseren(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.club_medewerker_anonimiseren(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.club_privacy_opruimen() from public, anon, authenticated;
grant execute on function public.club_avg_naam_vervangen(uuid, text, text) to service_role;
grant execute on function public.club_lid_definitief_verwijderen(uuid, uuid, text) to service_role;
grant execute on function public.club_lead_anonimiseren(uuid, uuid, text) to service_role;
grant execute on function public.club_medewerker_anonimiseren(uuid, uuid, text) to service_role;
grant execute on function public.club_privacy_opruimen() to service_role;

-- Elke nacht om 04:05 UTC, na het afronden van verwijderverzoeken (03:50).
do $$
begin
  if exists (select 1 from cron.job where jobname = 'club_privacy_opruimen') then
    perform cron.unschedule('club_privacy_opruimen');
  end if;
  perform cron.schedule('club_privacy_opruimen', '5 4 * * *', $job$select public.club_privacy_opruimen()$job$);
end
$$;

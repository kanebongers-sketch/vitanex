-- 482: Club, data voor behoud (strategie 31-10-2026, roadmap punt 1.18).
--
-- Vastleggen waarom leden gaan en wat opvolgen oplevert, zodat de cijfers over
-- behoud later op echte gegevens staan. Een vaste lijst, geen vrije tekst als
-- bron. Alleen toevoegen; idempotent.
--
-- 1. club_lid_opzeggingen: bij opzeggen of stoppen op de ledenkaart een
--    verplichte reden uit een vaste lijst plus een optionele toelichting.
--    Bij de reden gezondheid nooit een toelichting (alleen de categorie, geen
--    details over de gezondheid van het lid).
-- 2. club_opvolgtaken.uitkomst: wat het opvolgen opleverde (bij Gedaan).
-- 3. club_lead_historie.uitkomst: wat een contactmoment met een lead opleverde.
--
-- AVG (src/lib/club/leden/avg/tabellen.ts, test tabellen.test.ts):
--  - club_lid_opzeggingen zit in de inzage (export).
--  - Bij definitief verwijderen blijft de reden als anonieme telling (lid_id,
--    toelichting en wie leeg); zo blijven de cijfers per reden kloppen.
--  - Bewaartermijn: na de termijn van oud-leden (standaard 24 maanden) gaat de
--    rij los van het lid en is de toelichting weg (club_privacy_opruimen).
--  - De uitkomsten zijn kolommen in tabellen die al in de AVG-regels zitten.
--
-- Alle tabellen: RLS aan en geforceerd, geen policies; alleen de server.

-- ── 1. Opzegredenen ───────────────────────────────────────────────────────────
create table if not exists public.club_lid_opzeggingen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  vestiging text not null check (char_length(vestiging) between 1 and 60),
  lid_id uuid references public.club_leden(id) on delete set null,
  actie text not null check (actie in ('opzeggen', 'stoppen')),
  reden text not null check (reden in ('prijs', 'verhuizing', 'tijd', 'gezondheid', 'begeleiding', 'faciliteiten', 'andere_sportschool', 'doel_bereikt', 'anders')),
  toelichting text check (toelichting is null or char_length(toelichting) between 1 and 300),
  einddatum date,
  vastgelegd_door text check (vastgelegd_door is null or char_length(vastgelegd_door) <= 80),
  demo boolean not null default false,
  aangemaakt_op timestamptz not null default now(),
  -- Gezondheid: alleen de categorie, nooit details.
  constraint club_lid_opzeggingen_gezondheid_zonder_tekst check (reden <> 'gezondheid' or toelichting is null)
);
create index if not exists club_lid_opzeggingen_lid on public.club_lid_opzeggingen (lid_id, aangemaakt_op desc);
create index if not exists club_lid_opzeggingen_cijfers on public.club_lid_opzeggingen (user_id, vestiging, aangemaakt_op desc);

alter table public.club_lid_opzeggingen enable row level security;
alter table public.club_lid_opzeggingen force row level security;
revoke all on public.club_lid_opzeggingen from anon, authenticated, public;

-- ── 2. Uitkomst van een opvolgtaak ────────────────────────────────────────────
alter table public.club_opvolgtaken add column if not exists uitkomst text;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'club_opvolgtaken_uitkomst_check') then
    alter table public.club_opvolgtaken add constraint club_opvolgtaken_uitkomst_check
      check (uitkomst is null or uitkomst in ('bereikt_blijft', 'bereikt_twijfelt', 'niet_bereikt', 'wil_opzeggen', 'opgezegd'));
  end if;
end $$;

-- ── 3. Uitkomst van een contactmoment met een lead ────────────────────────────
alter table public.club_lead_historie add column if not exists uitkomst text;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'club_lead_historie_uitkomst_check') then
    alter table public.club_lead_historie add constraint club_lead_historie_uitkomst_check
      check (uitkomst is null or uitkomst in ('niet_bereikt', 'bereikt_twijfelt', 'afspraak_gemaakt', 'geen_interesse', 'lid_geworden'));
  end if;
end $$;

-- ── 4. Definitief verwijderen (466 plus de opzegredenen) ──────────────────────
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
  v_blokkade text;
  v_had_betalen boolean;
  v_opdracht uuid;
  v_klant record;
  n_checkins integer;
  n_reserveringen_anoniem integer;
  n_reserveringen_weg integer;
  n_verkopen integer;
  n_leads integer;
  n_logboek integer;
  n_contracten integer;
  n_facturen integer;
  n_mandaten_weg integer;
  n_mandaten_blijft integer;
  n_opdrachten integer := 0;
begin
  select * into v_lid from public.club_leden l where l.id = p_lid and l.user_id = p_user for update;
  if not found then
    return jsonb_build_object('verwijderd', false);
  end if;

  -- Geld gaat voor: zolang er een contract loopt of iets openstaat, niet verwijderen.
  -- De nachtelijke ronde probeert het de volgende nacht opnieuw.
  v_blokkade := public.club_betalen_lid_blokkade(p_user, p_lid);
  if v_blokkade is not null then
    raise exception 'lid heeft nog geld openstaan (%)', v_blokkade using errcode = 'AYG01';
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

  -- 2b. Lidgeld (migratie 460 en 461). Eerst onthouden of er iets te regelen is.
  select exists (select 1 from public.club_betalen_contracten c where c.lid_id = p_lid and c.user_id = p_user)
      or exists (select 1 from public.club_betalen_klanten k where k.lid_id = p_lid and k.user_id = p_user)
      or exists (select 1 from public.club_betalen_facturen f where f.lid_id = p_lid and f.user_id = p_user)
    into v_had_betalen;

  -- Opdrachten en herinneringen van dit lid: weg (de blokkade zorgt dat er niets openstaat).
  delete from public.club_betalen_opdrachten where lid_id = p_lid and user_id = p_user;
  delete from public.club_betalen_herinneringen where lid_id = p_lid and user_id = p_user;

  -- Facturen: een concept heeft geen nummer en geen bewaarplicht, dat gaat weg (de regels mee).
  -- Definitieve facturen blijven zonder lid; mailadres en notitie gaan weg. Naam en adres staan
  -- op de factuur zelf en blijven tot bewaren_tot (wettelijk verplicht op een factuur).
  delete from public.club_betalen_facturen where lid_id = p_lid and user_id = p_user and status = 'concept';
  update public.club_betalen_facturen
  set lid_id = null, klant_email = null, notitie = null, gewijzigd_op = now()
  where lid_id = p_lid and user_id = p_user;
  get diagnostics n_facturen = row_count;

  update public.club_betalen_betalingen set lid_id = null, fout_bericht = null, gewijzigd_op = now()
  where lid_id = p_lid and user_id = p_user;
  update public.club_betalen_terugbetalingen set lid_id = null, toelichting = null
  where lid_id = p_lid and user_id = p_user;
  update public.club_betalen_geschillen set lid_id = null, toelichting = null
  where lid_id = p_lid and user_id = p_user;
  -- Het kasboek is alleen toevoegen; lid_id naar null is de enige toegestane wijziging.
  update public.club_betalen_boekingen set lid_id = null where lid_id = p_lid and user_id = p_user;

  -- Contracten en pauzes: bewaard zonder lid, vrije tekst leeg.
  update public.club_betalen_contracten set lid_id = null, notitie = null, gewijzigd_op = now()
  where lid_id = p_lid and user_id = p_user;
  get diagnostics n_contracten = row_count;
  update public.club_betalen_pauzes set lid_id = null, reden = null
  where lid_id = p_lid and user_id = p_user;

  -- Een gezin waarvan dit lid het hoofd was: geen naam en geen hoofd meer.
  update public.club_betalen_gezinnen set hoofd_lid_id = null, naam = null
  where hoofd_lid_id = p_lid and user_id = p_user;

  -- Mandaten: weg na de SEPA-termijn [CHECK 13 maanden na de laatste incasso]. Zo niet,
  -- dan blijft alleen het kenmerk bestaan: zonder lid, zonder klant en zonder cijfers.
  delete from public.club_betalen_mandaten
  where lid_id = p_lid and user_id = p_user
    and (laatste_incasso_op is null or laatste_incasso_op < now() - interval '13 months');
  get diagnostics n_mandaten_weg = row_count;
  update public.club_betalen_mandaten
  set lid_id = null, klant_id = null, laatste4 = null, status = 'ingetrokken', is_standaard = false
  where lid_id = p_lid and user_id = p_user;
  get diagnostics n_mandaten_blijft = row_count;

  -- Klanten: weg. Eerst een opdracht in de outbox om de Stripe-klant te wissen
  -- (anoniem: zonder lid, alleen de Stripe-id's).
  for v_klant in
    select k.id, k.stripe_klant_id,
           coalesce(k.stripe_account_id, (select a.stripe_account_id from public.club_betalen_accounts a where a.user_id = p_user)) as account
    from public.club_betalen_klanten k where k.lid_id = p_lid and k.user_id = p_user
  loop
    if v_klant.stripe_klant_id is not null and v_klant.account is not null then
      v_opdracht := gen_random_uuid();
      insert into public.club_betalen_opdrachten (id, user_id, lid_id, soort, idempotentie_sleutel, payload)
      values (v_opdracht, p_user, null, 'klant_verwijderen', 'ayg_klant_verwijderen_' || v_opdracht::text,
              jsonb_build_object('stripe_klant_id', v_klant.stripe_klant_id, 'stripe_account_id', v_klant.account));
      n_opdrachten := n_opdrachten + 1;
    end if;
  end loop;
  delete from public.club_betalen_klanten where lid_id = p_lid and user_id = p_user;

  -- Het controlelog krijgt een regel zonder naam, zonder id van het lid en zonder wie (dat staat in het logboek).
  if v_had_betalen then
    perform public.club_betalen_audit_schrijf(
      p_user, 'systeem', null, 'lid_verwijderd_avg', 'lid', null, null,
      jsonb_build_object('contracten', n_contracten, 'facturen', n_facturen, 'mandaten_weg', n_mandaten_weg,
                         'mandaten_blijven', n_mandaten_blijft, 'stripe_klant_wissen', n_opdrachten)
    );
  end if;

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
  -- Koppelingen met health-apps (migratie 463). Het synclog, de tokens, de metingen en de
  -- toestemmingen gaan weg. Intrekken bij de leverancier doet de server vooraf (de
  -- database kan de leverancier niet bellen); lukt dat niet, dan zijn de tokens toch weg.
  delete from public.club_health_sync_log s
  using public.club_health_koppelingen kp
  where s.koppeling_id = kp.id and kp.lid_id = p_lid and kp.user_id = p_user;
  delete from public.club_health_metingen where lid_id = p_lid;
  delete from public.club_health_koppelingen where lid_id = p_lid;
  delete from public.club_health_toestemmingen where lid_id = p_lid;
  -- Voedingsdagboek (migratie 466).
  delete from public.club_voeding_logs where lid_id = p_lid and user_id = p_user;
  delete from public.club_voeding_favorieten where lid_id = p_lid and user_id = p_user;
  delete from public.club_voeding_producten where lid_id = p_lid and user_id = p_user;
  delete from public.club_voeding_instellingen where lid_id = p_lid and user_id = p_user;
  -- Opzegredenen (migratie 482): de reden blijft als anonieme telling, zonder lid,
  -- zonder toelichting en zonder wie het vastlegde.
  update public.club_lid_opzeggingen set lid_id = null, toelichting = null, vastgelegd_door = null
  where lid_id = p_lid and user_id = p_user;
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
    'logboek_geschoond', n_logboek,
    'contracten_anoniem', n_contracten,
    'facturen_anoniem', n_facturen,
    'mandaten_weg', n_mandaten_weg,
    'mandaten_blijven', n_mandaten_blijft,
    'stripe_klant_wissen', n_opdrachten
  );
end
$$;

-- ── 5. Elke nacht: bewaartermijnen toepassen (466 plus de opzegredenen) ───────
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
  n_voeding integer := 0;
  n_meldingen integer;
  n_sessies integer;
  n_push integer;
  n_rem integer;
  n_support integer;
  n_personeel integer;
  n_diensten integer;
  n_ayg integer;
  n_facturen_anoniem integer := 0;
  n_mandaten integer := 0;
  n_stripe_events integer := 0;
  n_opdrachten integer := 0;
  v_lidgeld_fout boolean := false;
  n_health_metingen integer := 0;
  n_health_overig integer := 0;
  v_health_fout boolean := false;
  k integer;
begin
  -- a) Per sportschool, met de eigen termijnen (geen rij = standaard).
  for r in
    select o.id as user_id,
      coalesce(p.leads_maanden, 12) as leads_m,
      coalesce(p.oud_leden_maanden, 24) as oud_m,
      coalesce(p.bezoeken_maanden, 24) as bezoek_m,
      coalesce(p.logboek_maanden, 24) as logboek_m,
      coalesce(p.voeding_dagboek_maanden, 12) as voeding_m
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
    -- draaien door de sportschool), niet meteen definitief. Een oud-lid met een
    -- contract of een openstaande betaling wordt overgeslagen tot het geld klopt.
    perform public.club_lid_verwijderen_aanvragen(r.user_id, l.id, 'Bewaartermijn oud-leden')
    from public.club_leden l
    where l.user_id = r.user_id and l.demo = false and l.status in ('gestopt', 'opgezegd')
      and coalesce(l.einddatum, l.bijgewerkt_op::date) < (now() - make_interval(months => r.oud_m))::date
      and l.bijgewerkt_op < now() - make_interval(months => r.oud_m)
      and not exists (select 1 from public.club_lid_verwijderingen v where v.lid_id = l.id)
      and not exists (select 1 from public.club_checkins c where c.lid_id = l.id and c.op >= now() - make_interval(months => r.oud_m))
      and public.club_betalen_lid_blokkade(l.user_id, l.id) is null;
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

    -- Opzegredenen (migratie 482): na de termijn van oud-leden los van het lid en zonder
    -- toelichting; de reden zelf blijft als anonieme telling.
    update public.club_lid_opzeggingen
    set lid_id = null, toelichting = null, vastgelegd_door = null
    where user_id = r.user_id and demo = false and aangemaakt_op < now() - make_interval(months => r.oud_m)
      and (lid_id is not null or toelichting is not null or vastgelegd_door is not null);

    -- Voedingsdagboek (migratie 466): dagen ouder dan de termijn.
    delete from public.club_voeding_logs where user_id = r.user_id and datum < (now() - make_interval(months => r.voeding_m))::date;
    get diagnostics k = row_count; n_voeding := n_voeding + k;
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

  -- Het lidgeld-deel staat in een eigen blok: gaat dat mis, dan blijft de rest van de
  -- opruiming (hierboven) gewoon staan en komt er een waarschuwing in het log.
  begin
    -- Lidgeld (migratie 460 en 461).
    -- Facturen: na de wettelijke bewaartermijn (bewaren_tot) naam en adres anoniem; de
    -- bedragen blijven. De pdf is dan ook niet meer nodig (de server ruimt het bestand op).
    update public.club_betalen_facturen
    set klant_naam = 'Geanonimiseerd', klant_adres = null, klant_email = null, notitie = null,
        pdf_pad = null, anoniem_op = now(), gewijzigd_op = now()
    where anoniem_op is null and bewaren_tot is not null and bewaren_tot < current_date and status <> 'concept';
    get diagnostics n_facturen_anoniem = row_count;

    -- Mandaten zonder lid verdwijnen na de SEPA-termijn [CHECK 13 maanden na de laatste
    -- incasso]; ingetrokken of mislukte mandaten van bestaande leden ook.
    delete from public.club_betalen_mandaten
    where (lid_id is null and (laatste_incasso_op is null or laatste_incasso_op < now() - interval '13 months'))
       or (status in ('ingetrokken', 'mislukt', 'inactief') and coalesce(laatste_incasso_op, aangemaakt_op) < now() - interval '13 months');
    get diagnostics n_mandaten = row_count;

    -- Stripe-events: 90 dagen (Stripe stuurt hooguit een paar dagen opnieuw).
    delete from public.club_betalen_stripe_events where ontvangen_op < now() - interval '90 days';
    get diagnostics n_stripe_events = row_count;

    -- Afgeronde opdrachten om een Stripe-klant te wissen: 90 dagen.
    delete from public.club_betalen_opdrachten
    where soort = 'klant_verwijderen' and status in ('klaar', 'geannuleerd')
      and coalesce(klaar_op, aangemaakt_op) < now() - interval '90 days';
    get diagnostics n_opdrachten = row_count;
  exception when others then
    v_lidgeld_fout := true;
    raise warning 'club_privacy_opruimen: lidgeld-deel mislukt: %', sqlerrm;
  end;

  -- Health-apps (migratie 463), in een eigen blok: gaat dit mis, dan blijft de rest staan.
  -- De regels per leverancier staan in src/lib/club/health/providers.ts (test: migratie.test.ts).
  begin
    -- Metingen van een soort waarvoor het lid (niet meer) toestemming geeft: weg.
    -- Zo blijft niets staan na intrekken, ook als het wissen in de app mislukte.
    delete from public.club_health_metingen m
    where not exists (
      select 1 from (
        select t.delen from public.club_health_toestemmingen t
        where t.lid_id = m.lid_id and t.user_id = m.user_id
        order by t.gegeven_op desc limit 1
      ) laatste
      where m.soort = any (laatste.delen)
    );
    get diagnostics n_health_metingen = row_count;
    -- Bronnen die bij ontkoppelen alles gewist willen hebben (Strava): zonder koppeling weg.
    delete from public.club_health_metingen m
    where m.bron in ('strava')
      and not exists (select 1 from public.club_health_koppelingen kp
                      where kp.lid_id = m.lid_id and kp.bron = m.bron and kp.status in ('actief', 'fout', 'opnieuw_koppelen'));
    get diagnostics k = row_count; n_health_metingen := n_health_metingen + k;
    -- Metingen uit apps: 24 maanden.
    delete from public.club_health_metingen where gemeten_op < now() - interval '24 months';
    get diagnostics k = row_count; n_health_metingen := n_health_metingen + k;
    -- Synclog: 90 dagen. Ingetrokken koppelingen (zonder tokens): na 30 dagen weg.
    delete from public.club_health_sync_log where gestart_op < now() - interval '90 days';
    get diagnostics n_health_overig = row_count;
    delete from public.club_health_koppelingen where status = 'ingetrokken' and gewijzigd_op < now() - interval '30 days';
    get diagnostics k = row_count; n_health_overig := n_health_overig + k;
  exception when others then
    v_health_fout := true;
    raise warning 'club_privacy_opruimen: health-deel mislukt: %', sqlerrm;
  end;

  return jsonb_build_object(
    'health_metingen_weg', n_health_metingen, 'health_overig_weg', n_health_overig, 'health_fout', v_health_fout,
    'leads_gewist', n_leads, 'oud_leden_aangevraagd', n_oud, 'bezoeken_anoniem', n_bezoeken, 'boekingen_anoniem', n_boekingen,
    'logboek_weg', n_logboek, 'voeding_weg', n_voeding, 'meldingen_weg', n_meldingen, 'sessies_weg', n_sessies, 'push_weg', n_push, 'rem_weg', n_rem,
    'support_weg', n_support, 'personeel_weg', n_personeel, 'diensten_weg', n_diensten, 'website_weg', n_ayg,
    'facturen_anoniem', n_facturen_anoniem, 'mandaten_weg', n_mandaten, 'stripe_events_weg', n_stripe_events,
    'opdrachten_weg', n_opdrachten, 'lidgeld_fout', v_lidgeld_fout
  );
end
$$;

-- ── Alleen de server ──────────────────────────────────────────────────────────
revoke all on function public.club_lid_definitief_verwijderen(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.club_privacy_opruimen() from public, anon, authenticated;
grant execute on function public.club_lid_definitief_verwijderen(uuid, uuid, text) to service_role;
grant execute on function public.club_privacy_opruimen() to service_role;

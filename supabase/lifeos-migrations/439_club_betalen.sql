-- 439: Club, betalen in de ledenapp (losse producten van de sportschool).
--
-- Een lid koopt in de ledenapp een losse les of drop-in, een strippenkaart,
-- een PT-pakket of een los product. Het geld gaat via Stripe Connect (direct
-- charges op het Express-account van de sportschool) naar de sportschool zelf.
-- Het lidmaatschap zelf blijft bij Sportivity of het eigen systeem.
--
--   club_betalen_accounts       het Connect-account per sportschool, plus de schakelaar per sportschool
--   club_betalen_producten      wat de sportschool verkoopt (prijs in centen incl. btw)
--   club_betalen_verkopen       elke aankoop, met een vaste kopie van het product
--   club_betalen_tegoeden       lessen of PT-sessies die een lid nog heeft
--   club_betalen_mutaties       elke wijziging van een tegoed (aankoop, afboeken, terug)
--   club_betalen_stripe_events  elk Stripe-event een keer (idempotentie)
--
-- Alles op user_id (= club_organisaties.id). Alleen de server (service role)
-- leest en schrijft: RLS aan en geforceerd, geen policies, alles ingetrokken
-- voor anon en authenticated. De functies zijn alleen voor service_role.
-- Idempotent; voegt alleen toe.

create table if not exists public.club_betalen_accounts (
  user_id uuid primary key,
  stripe_account_id text unique check (stripe_account_id is null or stripe_account_id ~ '^acct_[A-Za-z0-9]{6,250}$'),
  charges_aan boolean not null default false,
  uitbetalen_aan boolean not null default false,
  gegevens_compleet boolean not null default false,
  -- De sportschool zet betalen in de ledenapp zelf aan of uit (standaard uit).
  betalen_aan boolean not null default false,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now()
);

create table if not exists public.club_betalen_producten (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  naam text not null check (char_length(naam) between 2 and 80),
  omschrijving text check (omschrijving is null or char_length(omschrijving) <= 300),
  type text not null check (type in ('losse_les', 'strippenkaart', 'pt_pakket', 'product')),
  -- Stripe rekent minimaal 50 cent af; maximaal 5000 euro per product.
  prijs_cent integer not null check (prijs_cent between 50 and 500000),
  btw_procent integer not null check (btw_procent in (9, 21)),
  tegoeden integer check (tegoeden is null or tegoeden between 1 and 200),
  geldig_dagen integer check (geldig_dagen is null or geldig_dagen between 1 and 1095),
  -- null = alle vestigingen van de sportschool.
  vestigingen text[] check (vestigingen is null or cardinality(vestigingen) between 1 and 60),
  actief boolean not null default true,
  volgorde integer not null default 0,
  aangemaakt_op timestamptz not null default now(),
  gewijzigd_op timestamptz not null default now(),
  constraint club_betalen_producten_tegoeden check (
    (type = 'product' and tegoeden is null)
    or (type = 'losse_les' and tegoeden = 1)
    or (type in ('strippenkaart', 'pt_pakket') and tegoeden is not null)
  )
);
create index if not exists club_betalen_producten_user on public.club_betalen_producten (user_id, actief, volgorde);

create table if not exists public.club_betalen_verkopen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  lid_id uuid references public.club_leden(id) on delete set null,
  product_id uuid references public.club_betalen_producten(id) on delete set null,
  vestiging text,
  -- Vaste kopie van het product op het moment van kopen.
  product_naam text not null check (char_length(product_naam) between 1 and 80),
  type text not null check (type in ('losse_les', 'strippenkaart', 'pt_pakket', 'product')),
  tegoeden integer check (tegoeden is null or tegoeden between 1 and 200),
  geldig_dagen integer check (geldig_dagen is null or geldig_dagen between 1 and 1095),
  vestigingen text[],
  btw_procent integer not null check (btw_procent in (9, 21)),
  bedrag_cent integer not null check (bedrag_cent between 50 and 500000),
  platform_fee_cent integer not null default 0 check (platform_fee_cent >= 0),
  status text not null default 'open' check (status in ('open', 'betaald', 'mislukt', 'verlopen', 'terugbetaald')),
  stripe_account_id text not null check (stripe_account_id ~ '^acct_[A-Za-z0-9]{6,250}$'),
  stripe_sessie_id text unique check (stripe_sessie_id is null or stripe_sessie_id ~ '^cs_(test|live)_[A-Za-z0-9]{10,250}$'),
  stripe_payment_intent text check (stripe_payment_intent is null or stripe_payment_intent ~ '^pi_[A-Za-z0-9_]{6,250}$'),
  betaald_op timestamptz,
  terugbetaling_aangevraagd_op timestamptz,
  terugbetaald_cent integer not null default 0 check (terugbetaald_cent >= 0),
  terugbetaald_op timestamptz,
  aangemaakt_op timestamptz not null default now()
);
create index if not exists club_betalen_verkopen_user on public.club_betalen_verkopen (user_id, aangemaakt_op desc);
create index if not exists club_betalen_verkopen_lid on public.club_betalen_verkopen (user_id, lid_id);
create index if not exists club_betalen_verkopen_intent on public.club_betalen_verkopen (stripe_payment_intent);

create table if not exists public.club_betalen_tegoeden (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  lid_id uuid not null references public.club_leden(id) on delete cascade,
  verkoop_id uuid unique references public.club_betalen_verkopen(id) on delete set null,
  soort text not null check (soort in ('les', 'pt')),
  product_naam text not null check (char_length(product_naam) between 1 and 80),
  totaal integer not null check (totaal between 1 and 200),
  saldo integer not null,
  geldig_tot timestamptz,
  vestigingen text[],
  aangemaakt_op timestamptz not null default now(),
  constraint club_betalen_tegoeden_saldo check (saldo between 0 and totaal)
);
create index if not exists club_betalen_tegoeden_lid on public.club_betalen_tegoeden (user_id, lid_id, soort);

create table if not exists public.club_betalen_mutaties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  tegoed_id uuid not null references public.club_betalen_tegoeden(id) on delete cascade,
  lid_id uuid not null references public.club_leden(id) on delete cascade,
  aantal integer not null check (aantal <> 0 and aantal between -200 and 200),
  reden text not null check (reden in ('aankoop', 'les', 'pt', 'terug', 'terugbetaling')),
  reservering_id uuid,
  afspraak_id uuid,
  door text check (door is null or char_length(door) <= 80),
  op timestamptz not null default now()
);
create index if not exists club_betalen_mutaties_tegoed on public.club_betalen_mutaties (tegoed_id, op);
create index if not exists club_betalen_mutaties_reservering on public.club_betalen_mutaties (user_id, reservering_id) where reservering_id is not null;
create index if not exists club_betalen_mutaties_afspraak on public.club_betalen_mutaties (user_id, afspraak_id) where afspraak_id is not null;

create table if not exists public.club_betalen_stripe_events (
  event_id text primary key check (event_id ~ '^evt_[A-Za-z0-9_]{6,250}$'),
  type text not null check (char_length(type) <= 80),
  ontvangen_op timestamptz not null default now()
);
create index if not exists club_betalen_stripe_events_ontvangen on public.club_betalen_stripe_events (ontvangen_op);

do $$
declare t text;
begin
  foreach t in array array['club_betalen_accounts', 'club_betalen_producten', 'club_betalen_verkopen', 'club_betalen_tegoeden', 'club_betalen_mutaties', 'club_betalen_stripe_events'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('revoke all on public.%I from anon, authenticated, public', t);
  end loop;
end $$;

-- ─── Een betaalde verkoop afronden: precies een keer, met tegoed ─────────────
-- Uitkomst: 'ok', 'dubbel' (al betaald), 'onbekend' of 'afwijkend' (sessie,
-- account of bedrag klopt niet: niets doen en melden).
create or replace function public.club_betalen_afronden(p_verkoop uuid, p_sessie text, p_intent text, p_bedrag integer, p_account text)
returns text
language plpgsql
set search_path = public
as $$
declare
  v public.club_betalen_verkopen%rowtype;
  tegoed_id uuid;
begin
  select * into v from public.club_betalen_verkopen where id = p_verkoop for update;
  if not found then return 'onbekend'; end if;
  if v.status in ('betaald', 'terugbetaald') then return 'dubbel'; end if;
  if v.stripe_sessie_id is distinct from p_sessie or v.stripe_account_id <> p_account or v.bedrag_cent <> p_bedrag then
    return 'afwijkend';
  end if;
  update public.club_betalen_verkopen
     set status = 'betaald', betaald_op = now(), stripe_payment_intent = coalesce(p_intent, stripe_payment_intent)
   where id = v.id;
  if v.type <> 'product' and v.lid_id is not null then
    insert into public.club_betalen_tegoeden (user_id, lid_id, verkoop_id, soort, product_naam, totaal, saldo, geldig_tot, vestigingen)
    values (
      v.user_id, v.lid_id, v.id,
      case when v.type = 'pt_pakket' then 'pt' else 'les' end,
      v.product_naam, coalesce(v.tegoeden, 1), coalesce(v.tegoeden, 1),
      case when v.geldig_dagen is null then null else now() + make_interval(days => v.geldig_dagen) end,
      v.vestigingen
    )
    returning id into tegoed_id;
    insert into public.club_betalen_mutaties (user_id, tegoed_id, lid_id, aantal, reden, door)
    values (v.user_id, tegoed_id, v.lid_id, coalesce(v.tegoeden, 1), 'aankoop', 'Stripe');
  end if;
  return 'ok';
end $$;

-- ─── Een tegoed afboeken voor een les of een PT-afspraak ─────────────────────
-- Kiest het tegoed dat het eerst verloopt, dat geldig is in deze vestiging.
-- Per reservering of afspraak hooguit een keer netto (opnieuw boeken na
-- teruggeven mag wel). Uitkomst: het id van het tegoed, of null als er geen
-- bruikbaar tegoed is. Een dubbele afboeking geeft de fout 'al_afgeboekt'.
create or replace function public.club_betalen_afboeken(p_user uuid, p_lid uuid, p_soort text, p_vestiging text, p_reservering uuid, p_afspraak uuid, p_door text)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  netto integer;
  gekozen uuid;
begin
  if p_soort not in ('les', 'pt') or (p_reservering is null) = (p_afspraak is null) then
    raise exception 'ongeldig';
  end if;
  -- Een slot per lid: twee afboekingen tegelijk wachten op elkaar.
  perform pg_advisory_xact_lock(hashtext('club_betalen_' || p_lid::text));
  select coalesce(sum(m.aantal), 0) into netto
    from public.club_betalen_mutaties m
   where m.user_id = p_user and m.lid_id = p_lid
     and ((p_reservering is not null and m.reservering_id = p_reservering) or (p_afspraak is not null and m.afspraak_id = p_afspraak));
  if netto < 0 then raise exception 'al_afgeboekt'; end if;
  select t.id into gekozen
    from public.club_betalen_tegoeden t
   where t.user_id = p_user and t.lid_id = p_lid and t.soort = p_soort and t.saldo > 0
     and (t.geldig_tot is null or t.geldig_tot > now())
     and (t.vestigingen is null or p_vestiging = any (t.vestigingen))
   order by t.geldig_tot asc nulls last, t.aangemaakt_op asc
   limit 1
   for update;
  if gekozen is null then return null; end if;
  update public.club_betalen_tegoeden set saldo = saldo - 1 where id = gekozen;
  insert into public.club_betalen_mutaties (user_id, tegoed_id, lid_id, aantal, reden, reservering_id, afspraak_id, door)
  values (p_user, gekozen, p_lid, -1, p_soort, p_reservering, p_afspraak, left(p_door, 80));
  return gekozen;
end $$;

-- ─── Een afgeboekt tegoed teruggeven (les op tijd afgemeld, afboeking ongedaan) ─
-- Geeft true als er iets terugging. Komt op het tegoed waar het vandaan kwam,
-- ook als dat inmiddels verlopen is (dan is het niet meer bruikbaar).
create or replace function public.club_betalen_teruggeven(p_user uuid, p_lid uuid, p_reservering uuid, p_afspraak uuid, p_door text)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  netto integer;
  bron uuid;
begin
  if (p_reservering is null) = (p_afspraak is null) then raise exception 'ongeldig'; end if;
  perform pg_advisory_xact_lock(hashtext('club_betalen_' || p_lid::text));
  select coalesce(sum(m.aantal), 0) into netto
    from public.club_betalen_mutaties m
   where m.user_id = p_user and m.lid_id = p_lid
     and ((p_reservering is not null and m.reservering_id = p_reservering) or (p_afspraak is not null and m.afspraak_id = p_afspraak));
  if netto >= 0 then return false; end if;
  select m.tegoed_id into bron
    from public.club_betalen_mutaties m
   where m.user_id = p_user and m.lid_id = p_lid and m.aantal < 0
     and ((p_reservering is not null and m.reservering_id = p_reservering) or (p_afspraak is not null and m.afspraak_id = p_afspraak))
   order by m.op desc
   limit 1;
  update public.club_betalen_tegoeden set saldo = saldo + 1 where id = bron and saldo < totaal;
  if not found then return false; end if;
  insert into public.club_betalen_mutaties (user_id, tegoed_id, lid_id, aantal, reden, reservering_id, afspraak_id, door)
  values (p_user, bron, p_lid, 1, 'terug', p_reservering, p_afspraak, left(p_door, 80));
  return true;
end $$;

-- ─── Een terugbetaling van Stripe verwerken ──────────────────────────────────
-- p_terug = het totaal dat Stripe nu heeft terugbetaald (charge.amount_refunded).
-- Bij volledig terugbetaald vervalt wat er nog op het tegoed staat.
create or replace function public.club_betalen_terugbetaald(p_intent text, p_account text, p_terug integer)
returns text
language plpgsql
set search_path = public
as $$
declare
  v public.club_betalen_verkopen%rowtype;
  t public.club_betalen_tegoeden%rowtype;
begin
  select * into v from public.club_betalen_verkopen
   where stripe_payment_intent = p_intent and stripe_account_id = p_account
   for update;
  if not found then return 'onbekend'; end if;
  if p_terug <= v.terugbetaald_cent then return 'dubbel'; end if;
  update public.club_betalen_verkopen
     set terugbetaald_cent = least(p_terug, bedrag_cent),
         status = case when p_terug >= bedrag_cent then 'terugbetaald' else status end,
         terugbetaald_op = case when p_terug >= bedrag_cent then now() else terugbetaald_op end
   where id = v.id;
  if p_terug >= v.bedrag_cent then
    select * into t from public.club_betalen_tegoeden where verkoop_id = v.id for update;
    if found and t.saldo > 0 then
      update public.club_betalen_tegoeden set saldo = 0 where id = t.id;
      insert into public.club_betalen_mutaties (user_id, tegoed_id, lid_id, aantal, reden, door)
      values (t.user_id, t.id, t.lid_id, -t.saldo, 'terugbetaling', 'Stripe');
    end if;
  end if;
  return 'ok';
end $$;

revoke all on function public.club_betalen_afronden(uuid, text, text, integer, text) from public, anon, authenticated;
revoke all on function public.club_betalen_afboeken(uuid, uuid, text, text, uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.club_betalen_teruggeven(uuid, uuid, uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.club_betalen_terugbetaald(text, text, integer) from public, anon, authenticated;
grant execute on function public.club_betalen_afronden(uuid, text, text, integer, text) to service_role;
grant execute on function public.club_betalen_afboeken(uuid, uuid, text, text, uuid, uuid, text) to service_role;
grant execute on function public.club_betalen_teruggeven(uuid, uuid, uuid, uuid, text) to service_role;
grant execute on function public.club_betalen_terugbetaald(text, text, integer) to service_role;

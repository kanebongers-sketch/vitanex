-- 460: Club, ledenbetalingen via Stripe Connect, fase 2: aanbod, klanten, mandaten, contracten.
-- Bouwplan: docs/aiyourgym/betalen/BOUWPLAN.md (sectie 2.1 en 2.2). Alleen toevoegen, idempotent.
--
--   club_betalen_plannen              wat de sportschool verkoopt (prijs in centen incl. btw), per lidmaatschapsvorm
--   club_betalen_plan_prijzen         prijsversies met een ingangsdatum (lopende contracten houden hun prijs)
--   club_betalen_kortingen            kortingen en acties
--   club_betalen_gezinnen             gezinskorting (vanaf het hoeveelste lid)
--   club_betalen_klanten              de Stripe-klant per lid
--   club_betalen_mandaten             betaalmethode en SEPA-machtiging (alleen kenmerken, nooit een IBAN of kaartnummer)
--   club_betalen_contracten           het contract van een lid, met een bevroren kopie van plan, prijs en korting
--   club_betalen_contract_wijzigingen alleen toevoegen: elke wijziging van een contract
--   club_betalen_pauzes               pauze of bevriezen, zonder overlap per contract
--   club_betalen_accounts             extra kolommen: schakelaars en gegevens voor facturen
--
-- Alles op user_id (= club_organisaties.id). Alleen de server (service role) leest en
-- schrijft: RLS aan en geforceerd, geen policies, alles ingetrokken voor anon,
-- authenticated en public. Bedragen zijn gehele centen met check-regels.
-- Kalenderdatums zijn date in Nederlandse tijd.
--
-- AVG: elke tabel met een lid_id staat in src/lib/club/leden/avg/tabellen.ts en in
-- club_lid_definitief_verwijderen (migratie 462). Contracten en pauzes blijven zonder
-- lid bestaan (fiscale bewaarplicht), klanten gaan weg, mandaten na de SEPA-termijn.
--
-- Bewuste afwijkingen van het plan:
--   * plannen.interval heet interval_soort (interval is een SQL-woord);
--   * gezinnen verwijzen met hoofd_lid_id (niet lid_id), zodat de AVG-functie dit
--     expliciet afhandelt;
--   * club_betalen_producten krijgt de typen dagpas en dienst NIET hier: dat vraagt
--     het vervangen van een check-regel en blijft een aparte, bewuste migratie.

create extension if not exists btree_gist with schema extensions;

-- ── Extra kolommen op het Connect-account ─────────────────────────────────────
-- lidgeld_aan en incasso_aan staan standaard uit; schaduw standaard aan (de cyclus
-- maakt dan alleen conceptfacturen). Voor bestaande rijen verandert er niets.
alter table public.club_betalen_accounts
  add column if not exists lidgeld_aan boolean not null default false,
  add column if not exists incasso_aan boolean not null default false,
  add column if not exists schaduw boolean not null default true,
  add column if not exists crediteur_naam text check (crediteur_naam is null or char_length(crediteur_naam) between 2 and 70),
  add column if not exists voorwaarden_url text check (voorwaarden_url is null or (char_length(voorwaarden_url) <= 300 and voorwaarden_url ~ '^https://')),
  add column if not exists herinner_schema jsonb not null default '[]'::jsonb check (jsonb_typeof(herinner_schema) = 'array'),
  add column if not exists toegang_bij_achterstand text not null default 'open' check (toegang_bij_achterstand in ('open', 'dicht'));

-- ── Aanbod ────────────────────────────────────────────────────────────────────
create table if not exists public.club_betalen_plannen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  -- Een vorm met plannen kan niet worden verwijderd (restrict): geld gaat voor.
  vorm_id uuid not null references public.club_lidmaatschapsvormen(id) on delete restrict,
  naam text not null check (char_length(naam) between 2 and 80),
  actief boolean not null default true,
  interval_soort text not null check (interval_soort in ('week', 'vier_weken', 'maand', 'kwartaal', 'jaar')),
  -- Stripe rekent minimaal 50 cent af; maximaal 10.000 euro per termijn.
  bedrag_cent integer not null check (bedrag_cent between 50 and 1000000),
  -- [CHECK] tarieven: 0 (vrijgesteld), 9 en 21. De juiste waarde komt uit het regelbestand.
  btw_procent integer not null check (btw_procent in (0, 9, 21)),
  -- null = onbepaalde tijd. De wet (Wet van Dam) wordt in code bewaakt, niet hier.
  contract_maanden integer check (contract_maanden is null or contract_maanden between 1 and 36),
  opzegtermijn_dagen integer not null default 30 check (opzegtermijn_dagen between 0 and 90),
  verlenging text not null default 'onbepaald' check (verlenging in ('geen', 'onbepaald')),
  proef_dagen integer not null default 0 check (proef_dagen between 0 and 60),
  inschrijfkosten_cent integer not null default 0 check (inschrijfkosten_cent between 0 and 100000),
  -- null = alle vestigingen van de sportschool.
  vestigingen text[] check (vestigingen is null or cardinality(vestigingen) between 1 and 60),
  doelgroep text not null default 'iedereen' check (doelgroep in ('iedereen', 'student', 'jeugd', 'senior', 'bedrijf')),
  vereist_bewijs boolean not null default false,
  -- Dag van de maand waarop gefactureerd wordt; null = de startdag van het contract.
  factuur_dag integer check (factuur_dag is null or factuur_dag between 1 and 28),
  pro_rata_eerste boolean not null default true,
  volgorde integer not null default 0,
  aangemaakt_op timestamptz not null default now(),
  gewijzigd_op timestamptz not null default now(),
  unique (user_id, id)
);
create unique index if not exists club_betalen_plannen_naam on public.club_betalen_plannen (user_id, vorm_id, lower(btrim(naam)));
create index if not exists club_betalen_plannen_vorm on public.club_betalen_plannen (vorm_id);
create index if not exists club_betalen_plannen_user on public.club_betalen_plannen (user_id, actief, volgorde);

create table if not exists public.club_betalen_plan_prijzen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  plan_id uuid not null,
  bedrag_cent integer not null check (bedrag_cent between 50 and 1000000),
  btw_procent integer not null check (btw_procent in (0, 9, 21)),
  geldig_vanaf date not null,
  -- Wanneer de wijziging aan de leden is aangekondigd (voor de wet-controle in code).
  aangekondigd_op timestamptz,
  aangemaakt_op timestamptz not null default now(),
  constraint club_betalen_plan_prijzen_plan foreign key (user_id, plan_id)
    references public.club_betalen_plannen (user_id, id) on delete cascade,
  unique (plan_id, geldig_vanaf)
);
create index if not exists club_betalen_plan_prijzen_plan on public.club_betalen_plan_prijzen (user_id, plan_id, geldig_vanaf desc);

create table if not exists public.club_betalen_kortingen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  naam text not null check (char_length(naam) between 2 and 80),
  code text check (code is null or code ~ '^[A-Za-z0-9_-]{3,30}$'),
  soort text not null check (soort in ('procent', 'bedrag')),
  -- Procent (1 tot 100) of centen per termijn.
  waarde integer not null,
  -- null = voor alle plannen.
  plan_id uuid,
  geldig_vanaf date,
  geldig_tot date,
  -- Hoeveel termijnen de korting telt; null = de hele looptijd.
  duur_termijnen integer check (duur_termijnen is null or duur_termijnen between 1 and 60),
  max_gebruik integer check (max_gebruik is null or max_gebruik >= 1),
  gebruikt integer not null default 0 check (gebruikt >= 0),
  vereist_bewijs boolean not null default false,
  actief boolean not null default true,
  aangemaakt_op timestamptz not null default now(),
  constraint club_betalen_kortingen_waarde check (
    (soort = 'procent' and waarde between 1 and 100)
    or (soort = 'bedrag' and waarde between 1 and 1000000)
  ),
  constraint club_betalen_kortingen_periode check (geldig_tot is null or geldig_vanaf is null or geldig_tot >= geldig_vanaf),
  constraint club_betalen_kortingen_plan foreign key (user_id, plan_id)
    references public.club_betalen_plannen (user_id, id) on delete cascade,
  unique (user_id, id)
);
create unique index if not exists club_betalen_kortingen_code on public.club_betalen_kortingen (user_id, lower(code)) where code is not null;
create index if not exists club_betalen_kortingen_plan on public.club_betalen_kortingen (user_id, plan_id);

create table if not exists public.club_betalen_gezinnen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  -- Vrije tekst (kan een achternaam bevatten): leeg bij verwijderen van het hoofdlid.
  naam text check (naam is null or char_length(naam) <= 80),
  hoofd_lid_id uuid references public.club_leden(id) on delete set null,
  -- De gezinskorting geldt vanaf dit hoeveelste lid (2 = vanaf het tweede lid).
  gezin_volgorde_vanaf integer not null default 2 check (gezin_volgorde_vanaf between 2 and 10),
  korting_id uuid,
  aangemaakt_op timestamptz not null default now(),
  constraint club_betalen_gezinnen_korting foreign key (user_id, korting_id)
    references public.club_betalen_kortingen (user_id, id),
  unique (user_id, id)
);
create index if not exists club_betalen_gezinnen_hoofd on public.club_betalen_gezinnen (hoofd_lid_id);
create index if not exists club_betalen_gezinnen_korting on public.club_betalen_gezinnen (user_id, korting_id);

-- ── Lid en betalen ────────────────────────────────────────────────────────────
create table if not exists public.club_betalen_klanten (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  -- restrict: de AVG-functie verwijdert eerst de klant, dan pas het lid.
  lid_id uuid not null references public.club_leden(id) on delete restrict,
  stripe_klant_id text unique check (stripe_klant_id is null or stripe_klant_id ~ '^cus_[A-Za-z0-9]{6,250}$'),
  stripe_account_id text check (stripe_account_id is null or stripe_account_id ~ '^acct_[A-Za-z0-9]{6,250}$'),
  aangemaakt_op timestamptz not null default now(),
  unique (user_id, lid_id),
  unique (user_id, id)
);
-- De foreign key op club_leden (restrict) zoekt op lid_id alleen.
create index if not exists club_betalen_klanten_lid on public.club_betalen_klanten (lid_id);

create table if not exists public.club_betalen_mandaten (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  -- null na het verwijderen van het lid: het kenmerk blijft tot de SEPA-termijn voorbij is.
  lid_id uuid references public.club_leden(id) on delete set null,
  klant_id uuid references public.club_betalen_klanten(id) on delete set null,
  stripe_pm_id text unique check (stripe_pm_id is null or stripe_pm_id ~ '^pm_[A-Za-z0-9]{6,250}$'),
  stripe_mandate_id text check (stripe_mandate_id is null or stripe_mandate_id ~ '^mandate_[A-Za-z0-9]{6,250}$'),
  type text not null check (type in ('sepa_debit', 'card', 'ideal')),
  -- Alleen de laatste vier cijfers, nooit meer.
  laatste4 text check (laatste4 is null or laatste4 ~ '^[0-9]{4}$'),
  status text not null default 'actief' check (status in ('actief', 'ingetrokken', 'mislukt', 'inactief')),
  is_standaard boolean not null default false,
  bron text not null default 'checkout' check (bron in ('checkout', 'setup', 'sepa_formulier', 'import')),
  machtiging_kenmerk text check (machtiging_kenmerk is null or char_length(machtiging_kenmerk) <= 60),
  ondertekend_op timestamptz,
  -- Voor de SEPA-termijn [CHECK 13 maanden na de laatste incasso].
  laatste_incasso_op timestamptz,
  aangemaakt_op timestamptz not null default now(),
  unique (user_id, id)
);
-- Hooguit een actieve standaard per lid.
create unique index if not exists club_betalen_mandaten_standaard on public.club_betalen_mandaten (user_id, lid_id)
  where is_standaard and status = 'actief' and lid_id is not null;
create index if not exists club_betalen_mandaten_lid on public.club_betalen_mandaten (lid_id, user_id);
create index if not exists club_betalen_mandaten_klant on public.club_betalen_mandaten (klant_id);
create index if not exists club_betalen_mandaten_opruimen on public.club_betalen_mandaten (laatste_incasso_op) where lid_id is null;

create table if not exists public.club_betalen_contracten (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  -- null na het verwijderen van het lid: het contract blijft voor de bewaarplicht.
  lid_id uuid references public.club_leden(id) on delete set null,
  plan_id uuid not null,
  vorm_id uuid not null references public.club_lidmaatschapsvormen(id) on delete restrict,
  gezin_id uuid,
  gezin_volgorde integer check (gezin_volgorde is null or gezin_volgorde between 1 and 20),
  mandaat_id uuid references public.club_betalen_mandaten(id) on delete set null,
  korting_id uuid,
  status text not null default 'concept' check (status in (
    'concept', 'wacht_op_machtiging', 'proef', 'actief', 'gepauzeerd',
    'opgezegd', 'beeindigd', 'gestopt_wegens_achterstand'
  )),
  -- Bevroren kopie van plan, prijs en korting op het moment van afsluiten.
  plan_naam text not null check (char_length(plan_naam) between 1 and 80),
  interval_soort text not null check (interval_soort in ('week', 'vier_weken', 'maand', 'kwartaal', 'jaar')),
  bedrag_cent integer not null check (bedrag_cent between 50 and 1000000),
  btw_procent integer not null check (btw_procent in (0, 9, 21)),
  korting_soort text check (korting_soort is null or korting_soort in ('procent', 'bedrag')),
  korting_waarde integer check (korting_waarde is null or korting_waarde >= 1),
  -- Hoeveel kortingstermijnen er nog zijn; null = de hele looptijd.
  korting_termijnen_over integer check (korting_termijnen_over is null or korting_termijnen_over >= 0),
  contract_maanden integer check (contract_maanden is null or contract_maanden between 1 and 36),
  opzegtermijn_dagen integer not null default 30 check (opzegtermijn_dagen between 0 and 90),
  verlenging text not null default 'onbepaald' check (verlenging in ('geen', 'onbepaald')),
  factuur_dag integer check (factuur_dag is null or factuur_dag between 1 and 28),
  pro_rata_eerste boolean not null default true,
  inschrijfkosten_cent integer not null default 0 check (inschrijfkosten_cent between 0 and 100000),
  vestigingen text[],
  -- Data (Nederlandse kalender).
  startdatum date not null,
  proef_tot date,
  -- Einde van de afgesproken looptijd, of de einddatum na opzeggen.
  einddatum date,
  opgezegd_op date,
  opzeg_einddatum date,
  -- Tot en met welke dag er gefactureerd is (de cyclus gaat hier verder).
  gefactureerd_tot date,
  voorwaarden_versie text check (voorwaarden_versie is null or char_length(voorwaarden_versie) <= 40),
  akkoord_op timestamptz,
  -- Vrije tekst: leeg bij verwijderen van het lid.
  notitie text check (notitie is null or char_length(notitie) <= 300),
  aangemaakt_op timestamptz not null default now(),
  gewijzigd_op timestamptz not null default now(),
  constraint club_betalen_contracten_plan foreign key (user_id, plan_id)
    references public.club_betalen_plannen (user_id, id),
  constraint club_betalen_contracten_gezin foreign key (user_id, gezin_id)
    references public.club_betalen_gezinnen (user_id, id),
  constraint club_betalen_contracten_korting foreign key (user_id, korting_id)
    references public.club_betalen_kortingen (user_id, id),
  constraint club_betalen_contracten_einde check (einddatum is null or einddatum >= startdatum),
  constraint club_betalen_contracten_proef check (proef_tot is null or proef_tot >= startdatum),
  constraint club_betalen_contracten_korting_paar check ((korting_soort is null) = (korting_waarde is null)),
  unique (user_id, id)
);
-- Een lopend contract per lid per vorm: de harde rem tegen een dubbel contract.
create unique index if not exists club_betalen_contracten_lopend on public.club_betalen_contracten (user_id, lid_id, vorm_id)
  where lid_id is not null and status in ('concept', 'wacht_op_machtiging', 'proef', 'actief', 'gepauzeerd', 'opgezegd', 'gestopt_wegens_achterstand');
create index if not exists club_betalen_contracten_lid on public.club_betalen_contracten (lid_id, user_id);
create index if not exists club_betalen_contracten_plan on public.club_betalen_contracten (user_id, plan_id);
create index if not exists club_betalen_contracten_vorm on public.club_betalen_contracten (vorm_id);
create index if not exists club_betalen_contracten_gezin on public.club_betalen_contracten (user_id, gezin_id) where gezin_id is not null;
create index if not exists club_betalen_contracten_korting on public.club_betalen_contracten (user_id, korting_id) where korting_id is not null;
create index if not exists club_betalen_contracten_mandaat on public.club_betalen_contracten (mandaat_id) where mandaat_id is not null;
-- De maandcyclus: welke contracten zijn aan de beurt.
create index if not exists club_betalen_contracten_cyclus on public.club_betalen_contracten (user_id, status, gefactureerd_tot);

create table if not exists public.club_betalen_contract_wijzigingen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  contract_id uuid not null,
  soort text not null check (soort in (
    'aangemaakt', 'status', 'prijs', 'planwissel', 'pauze', 'opzegging', 'opzegging_ingetrokken',
    'machtiging', 'korting', 'einddatum', 'anders'
  )),
  van_status text,
  naar_status text,
  -- Alleen ids, bedragen en datums, nooit vrije tekst: deze tabel is alleen toevoegen.
  oud jsonb,
  nieuw jsonb,
  reden_code text check (reden_code is null or char_length(reden_code) <= 40),
  door_rol text not null default 'systeem' check (door_rol in ('systeem', 'lid', 'medewerker', 'clubmanager', 'eigenaar', 'platform', 'stripe')),
  door_ref text check (door_ref is null or char_length(door_ref) <= 80),
  op timestamptz not null default now(),
  constraint club_betalen_contract_wijzigingen_contract foreign key (user_id, contract_id)
    references public.club_betalen_contracten (user_id, id)
);
create index if not exists club_betalen_contract_wijzigingen_contract on public.club_betalen_contract_wijzigingen (user_id, contract_id, op);

-- Alleen toevoegen: bijwerken, verwijderen en leegmaken worden geweigerd.
create or replace function public.club_betalen_alleen_toevoegen()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  raise exception '% is alleen toevoegen (% geweigerd)', tg_table_name, tg_op using errcode = 'AYG10';
end
$$;

revoke all on function public.club_betalen_alleen_toevoegen() from public, anon, authenticated;

drop trigger if exists club_betalen_contract_wijzigingen_vast on public.club_betalen_contract_wijzigingen;
create trigger club_betalen_contract_wijzigingen_vast
  before update or delete on public.club_betalen_contract_wijzigingen
  for each row execute function public.club_betalen_alleen_toevoegen();
drop trigger if exists club_betalen_contract_wijzigingen_leeg on public.club_betalen_contract_wijzigingen;
create trigger club_betalen_contract_wijzigingen_leeg
  before truncate on public.club_betalen_contract_wijzigingen
  for each statement execute function public.club_betalen_alleen_toevoegen();

create table if not exists public.club_betalen_pauzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  contract_id uuid not null,
  lid_id uuid references public.club_leden(id) on delete set null,
  -- Beide dagen tellen mee (inclusief).
  van date not null,
  tot date not null,
  status text not null default 'gepland' check (status in ('gepland', 'actief', 'beeindigd', 'geannuleerd')),
  -- Vrije tekst (kan een reden als blessure bevatten): leeg bij verwijderen van het lid.
  reden text check (reden is null or char_length(reden) <= 300),
  -- Verrekening in centen (creditnota of lagere volgende factuur), voor de controle.
  verrekening_cent integer not null default 0 check (verrekening_cent between 0 and 1000000),
  aangemaakt_op timestamptz not null default now(),
  constraint club_betalen_pauzes_periode check (tot >= van),
  constraint club_betalen_pauzes_contract foreign key (user_id, contract_id)
    references public.club_betalen_contracten (user_id, id)
);
create index if not exists club_betalen_pauzes_contract on public.club_betalen_pauzes (user_id, contract_id, van);
create index if not exists club_betalen_pauzes_lid on public.club_betalen_pauzes (lid_id, user_id) where lid_id is not null;

-- Geen overlap van pauzes binnen een contract (geannuleerde tellen niet mee).
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'club_betalen_pauzes_geen_overlap') then
    alter table public.club_betalen_pauzes add constraint club_betalen_pauzes_geen_overlap
      exclude using gist (contract_id with =, daterange(van, tot, '[]') with &&)
      where (status <> 'geannuleerd');
  end if;
end $$;

-- ── Alleen de server ──────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'club_betalen_plannen', 'club_betalen_plan_prijzen', 'club_betalen_kortingen', 'club_betalen_gezinnen',
    'club_betalen_klanten', 'club_betalen_mandaten', 'club_betalen_contracten',
    'club_betalen_contract_wijzigingen', 'club_betalen_pauzes'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('revoke all on public.%I from anon, authenticated, public', t);
  end loop;
end $$;

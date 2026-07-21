-- ─── LifeOS 150 — Finance: omzet, kosten, facturen ──────────────────────────
--
-- Draaien op het LIFEOS-project (bbklogjersviaoocgrve), NIET op MentaForce.
-- Zie README.md in deze map.
--
-- Fase 2 van het AI Work OS. Handmatig-eerst en EERLIJK: dit slaat alleen op wat
-- Kane zelf invoert (of wat uit een klantbetaling in de CRM komt). Er wordt niets
-- verzonnen — een leeg finance-scherm toont "nog geen data", geen fantasiecijfers.
-- Een boekhoudkoppeling kan later additief; dit model draagt dat (categorie +
-- optionele bron-velden) zonder herbouw.
--
-- Twee tabellen, twee vragen:
--   finance_transacties — wat is er ECHT binnengekomen/uitgegaan? (omzet/winst)
--   finance_facturen    — wat staat er nog OPEN? (cashflow, verlopen facturen)
--
-- Waarom in de LifeOS-DB, niet MentaForce: dit zijn Kane's eigen bedrijfscijfers
-- en klantbetalingen (persoonsgegevens van derden). Zie 140_crm en admin.ts.
--
-- Idempotent: opnieuw draaien is veilig.

-- ─── finance_transacties ────────────────────────────────────────────────────

create table if not exists public.finance_transacties (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users (id) on delete cascade,

  -- 'omzet' (geld erin) of 'kosten' (geld eruit). Allowlist: een typfout mag falen
  -- bij het schrijven, niet stil je winst vervuilen.
  soort         text        not null,

  -- Euro's, altijd positief. Het teken zit in `soort`, niet in het bedrag — zo kan
  -- een som per soort nooit per ongeluk optellen wat had moeten aftrekken.
  bedrag        numeric(12,2) not null,

  omschrijving  text        not null,

  -- Vrije categorie ('abonnement', 'huur', 'materiaal'…), voor het uitsplitsen van
  -- kosten. Optioneel — een MVP dwingt geen categorieënboom af.
  categorie     text,

  -- De dag waarop het geld liep. Los van `aangemaakt_op` (wanneer je 't invoerde).
  datum         date        not null,

  -- Optionele koppeling aan een CRM-persoon: een klantbetaling hoort bij een klant.
  -- `on delete set null`: verwijder je de klant, dan blijft de omzet staan (die was
  -- echt), maar zonder dode verwijzing.
  persoon_id    uuid        references public.crm_personen (id) on delete set null,

  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now(),

  constraint finance_transacties_soort_geldig
    check (soort in ('omzet', 'kosten')),

  constraint finance_transacties_bedrag_positief
    check (bedrag > 0 and bedrag <= 100000000),

  constraint finance_transacties_omschrijving_lengte
    check (length(btrim(omschrijving)) between 1 and 500),

  constraint finance_transacties_categorie_lengte
    check (categorie is null or length(categorie) <= 100)
);

-- DE overzicht-query: alles van een gebruiker op datum (maand-aggregatie, trend).
create index if not exists finance_transacties_periode_idx
  on public.finance_transacties (user_id, datum desc);

-- Kosten uitsplitsen per categorie ("welke kostenpost groeit te snel?").
create index if not exists finance_transacties_categorie_idx
  on public.finance_transacties (user_id, categorie)
  where categorie is not null;

alter table public.finance_transacties enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'finance_transacties' and policyname = 'finance_transacties_eigen'
  ) then
    create policy finance_transacties_eigen on public.finance_transacties
      for all
      using (user_id = (select auth.uid()))
      with check (user_id = (select auth.uid()));
  end if;
end $$;

-- ─── finance_facturen ───────────────────────────────────────────────────────
-- Wat je hebt gefactureerd maar (nog) niet binnen is. Voedt cashflow en de
-- "deze factuur is verlopen"-waarschuwing. Aparte tabel van transacties: een
-- factuur is een VERWACHTING, een transactie is een FEIT. Wordt een factuur
-- betaald, dan hoort daar een omzet-transactie bij (de app kan dat koppelen).

create table if not exists public.finance_facturen (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users (id) on delete cascade,

  -- De klantnaam als vrije tekst (een factuur kan naar iemand buiten je CRM), met
  -- een optionele harde koppeling aan een CRM-persoon als 't wél een klant is.
  klant         text        not null,
  persoon_id    uuid        references public.crm_personen (id) on delete set null,

  bedrag        numeric(12,2) not null,

  -- 'open' (verstuurd, wacht), 'betaald' (binnen), 'verlopen' (over de vervaldag).
  -- De app kan 'open' → 'verlopen' afleiden uit de vervaldatum; we bewaren 'm ook
  -- expliciet zodat een handmatige status (bv. kwijtgescholden) kan.
  status        text        not null default 'open',

  factuurdatum  date        not null,
  vervaldatum   date,

  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now(),

  constraint finance_facturen_status_geldig
    check (status in ('open', 'betaald', 'verlopen')),

  constraint finance_facturen_bedrag_positief
    check (bedrag > 0 and bedrag <= 100000000),

  constraint finance_facturen_klant_lengte
    check (length(btrim(klant)) between 1 and 200),

  -- Een vervaldatum vóór de factuurdatum is een invoerfout.
  constraint finance_facturen_datum_logisch
    check (vervaldatum is null or vervaldatum >= factuurdatum)
);

-- Openstaande facturen op vervaldatum: "wat komt eraan / wat is te laat?".
create index if not exists finance_facturen_open_idx
  on public.finance_facturen (user_id, status, vervaldatum);

alter table public.finance_facturen enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'finance_facturen' and policyname = 'finance_facturen_eigen'
  ) then
    create policy finance_facturen_eigen on public.finance_facturen
      for all
      using (user_id = (select auth.uid()))
      with check (user_id = (select auth.uid()));
  end if;
end $$;

-- ─── bijgewerkt_op bijhouden ────────────────────────────────────────────────
-- Hergebruikt de trigger-functie uit 001_fundament (zoals 140_crm).

do $$
begin
  if exists (select 1 from pg_proc where proname = 'zet_bijgewerkt_op') then
    if not exists (select 1 from pg_trigger where tgname = 'finance_transacties_bijgewerkt_op') then
      create trigger finance_transacties_bijgewerkt_op
        before update on public.finance_transacties
        for each row execute function public.zet_bijgewerkt_op();
    end if;
    if not exists (select 1 from pg_trigger where tgname = 'finance_facturen_bijgewerkt_op') then
      create trigger finance_facturen_bijgewerkt_op
        before update on public.finance_facturen
        for each row execute function public.zet_bijgewerkt_op();
    end if;
  end if;
end $$;

-- ─── Zelfcontrole ───────────────────────────────────────────────────────────
-- Hard falen als RLS of een index ontbreekt, zoals de andere LifeOS-migraties.

do $$
begin
  if not (select relrowsecurity from pg_class where relname = 'finance_transacties') then
    raise exception 'RLS staat niet aan op finance_transacties';
  end if;
  if not (select relrowsecurity from pg_class where relname = 'finance_facturen') then
    raise exception 'RLS staat niet aan op finance_facturen';
  end if;
  if not exists (select 1 from pg_indexes where indexname = 'finance_transacties_periode_idx') then
    raise exception 'index finance_transacties_periode_idx ontbreekt';
  end if;
  if not exists (select 1 from pg_indexes where indexname = 'finance_facturen_open_idx') then
    raise exception 'index finance_facturen_open_idx ontbreekt';
  end if;
end $$;

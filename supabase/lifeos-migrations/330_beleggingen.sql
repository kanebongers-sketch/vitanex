-- ─── LifeOS — beleggingen bijhouden ─────────────────────────────────────────
-- Je posities (handmatig of uit een DEGIRO-export), de laatst opgehaalde koersen
-- (Yahoo Finance, ± 15 min vertraagd) en per dag je portefeuillewaarde voor het
-- verloop. LifeOS koopt/verkoopt niets en koppelt niet aan je broker: dit is een
-- overzicht van wat jij invoert.
-- Alleen de service-role schrijft/leest (RLS aan, geen policy — zoals de rest).

create table if not exists public.belegging_posities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  symbool text not null,
  isin text,
  naam text not null,
  valuta text not null,
  aantal numeric not null check (aantal > 0),
  -- Gemiddelde aankoopkoers per stuk (DEGIRO: "GAK"), in de valuta van de notering.
  aankoopprijs numeric check (aankoopprijs is null or aankoopprijs >= 0),
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now(),
  unique (user_id, symbool)
);
alter table public.belegging_posities enable row level security;

create table if not exists public.belegging_rekening (
  user_id uuid primary key,
  cash_eur numeric not null default 0,
  bijgewerkt_op timestamptz not null default now()
);
alter table public.belegging_rekening enable row level security;

-- Koersen én wisselkoersen (bv. 'EURUSD=X'), als cache: Yahoo blijft de bron.
create table if not exists public.belegging_koersen (
  user_id uuid not null,
  symbool text not null,
  koers numeric not null,
  vorige_slot numeric,
  valuta text not null,
  markt_tijd timestamptz,
  opgehaald_op timestamptz not null default now(),
  primary key (user_id, symbool)
);
alter table public.belegging_koersen enable row level security;

-- Eén regel per dag: de laatst gemeten waarde van die dag. Begint op de dag dat je
-- start met bijhouden — geen verzonnen terugrekening.
create table if not exists public.belegging_historie (
  user_id uuid not null,
  dag date not null,
  waarde_eur numeric not null,
  inleg_eur numeric,
  bijgewerkt_op timestamptz not null default now(),
  primary key (user_id, dag)
);
alter table public.belegging_historie enable row level security;

-- 331: optioneel je inleg in euro per positie (DEGIRO: waarde − ongerealiseerde W/V).
-- Voor een notering in dollars rekent DEGIRO met de wisselkoers van toen; met deze
-- waarde loopt jouw winst/verlies gelijk met DEGIRO.
alter table public.belegging_posities add column if not exists inleg_eur numeric check (inleg_eur is null or inleg_eur >= 0);

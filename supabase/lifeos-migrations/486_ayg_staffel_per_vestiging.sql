-- ─── 486: staffelprijzen per vestiging op aantal actieve leden ──────────────
-- Besluit Kane (31-10-2026): de prijs per pakket hangt af van het aantal
-- actieve leden per vestiging (tot 25, 50, 100, 200, 500, 1000, 5000; daarboven
-- prijs op maat). Geen bundelkorting meer. De bedragen staan alleen in Stripe
-- (getrapte prijzen) en in docs/aiyourgym/STRIPE.md.
--
-- Stripe staat dezelfde prijs niet twee keer in een abonnement toe. Daarom heeft
-- elke vestiging een eigen Stripe-abonnement (dezelfde klant, dezelfde
-- pakketten); de hoeveelheid van elke regel is het aantal actieve leden.
--
-- 1. ayg_vestiging_abonnementen: welk Stripe-abonnement bij welke vestiging hoort.
--    Het abonnement uit de checkout (ayg_aanmeldingen.stripe_subscription_id)
--    hoort bij de eerste vestiging; de cron en Club koppelen het hier.
--    status 'aanmaken' = geclaimd, nog niet (zeker) bij Stripe gemaakt; de cron
--    probeert het opnieuw (eerst zoeken bij Stripe op metadata, nooit dubbel).
-- 2. ayg_staffel_log: de dagelijkse telling per abonnement, een rij per dag
--    (uniek), zodat de cron idempotent is en alles controleerbaar blijft.
--    Alleen aantallen, geen persoonsgegevens.
--
-- Geen policies: alleen de server (service role) leest en schrijft.
-- Alleen toevoegen, idempotent. NIET automatisch uitvoeren: Kane voert hem uit.

create table if not exists public.ayg_vestiging_abonnementen (
  id uuid primary key default gen_random_uuid(),
  organisatie_id uuid not null references public.club_organisaties(id) on delete cascade,
  vestiging text not null check (char_length(vestiging) between 1 and 80),
  stripe_customer_id text check (stripe_customer_id is null or stripe_customer_id ~ '^cus_[A-Za-z0-9]{6,250}$'),
  stripe_subscription_id text unique check (stripe_subscription_id is null or stripe_subscription_id ~ '^sub_[A-Za-z0-9]{6,250}$'),
  -- hoofd = het abonnement uit de checkout bij het aanmelden; vestiging = later in Club gemaakt.
  bron text not null default 'vestiging' check (bron in ('hoofd', 'vestiging')),
  status text not null default 'aanmaken' check (status in ('aanmaken', 'actief', 'opgezegd')),
  -- De laatst bij Stripe gezette hoeveelheid (aantal actieve leden, minimaal 1).
  hoeveelheid integer check (hoeveelheid is null or hoeveelheid >= 1),
  -- De laatste telling van actieve leden.
  actieve_leden integer check (actieve_leden is null or actieve_leden >= 0),
  geteld_op timestamptz,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now(),
  unique (organisatie_id, vestiging)
);

create index if not exists ayg_vestiging_abonnementen_status on public.ayg_vestiging_abonnementen (status);

alter table public.ayg_vestiging_abonnementen enable row level security;

comment on table public.ayg_vestiging_abonnementen is
  'Een Stripe-abonnement per vestiging (besluit Kane 31-10-2026, staffel op actieve leden). Alleen service role.';

create table if not exists public.ayg_staffel_log (
  id uuid primary key default gen_random_uuid(),
  organisatie_id uuid not null references public.club_organisaties(id) on delete cascade,
  vestiging text not null check (char_length(vestiging) between 1 and 80),
  stripe_subscription_id text not null check (stripe_subscription_id ~ '^sub_[A-Za-z0-9]{6,250}$'),
  -- De dag van de telling (Nederlandse tijd).
  dag date not null,
  actieve_leden integer not null check (actieve_leden >= 0),
  hoeveelheid_oud integer,
  hoeveelheid_nieuw integer,
  -- Bovengrens van de staffel (25 tot 5000); null = prijs op maat (boven 5000).
  staffel_oud integer,
  staffel_nieuw integer,
  uitkomst text not null check (uitkomst in ('gelijk', 'bijgewerkt', 'op_maat', 'opgezegd', 'fout')),
  -- Is de eigenaar gemaild over een andere staffel?
  gemaild boolean not null default false,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now(),
  unique (stripe_subscription_id, dag)
);

create index if not exists ayg_staffel_log_org on public.ayg_staffel_log (organisatie_id, dag desc);

alter table public.ayg_staffel_log enable row level security;

comment on table public.ayg_staffel_log is
  'Dagelijkse telling van actieve leden per vestigingsabonnement en wat er bij Stripe is gezet (proration_behavior=none). Alleen aantallen.';

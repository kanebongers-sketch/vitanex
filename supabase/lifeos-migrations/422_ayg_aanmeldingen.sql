-- ─── AI Your Gym: aanmelden en betalen ──────────────────────────────────────
-- Een sportschool meldt zich aan op aiyourgym.com (/aiyourgym/aanmelden). Met
-- een Stripe-prijs voor het pakket volgt Stripe Checkout (abonnement met
-- proefperiode); daarna richt de webhook precies een keer de sportschool in
-- (club_organisaties) met de eigenaar als beheerder. Zonder prijs blijft het
-- een aanvraag die Kane zelf oppakt. Code: src/lib/aiyourgym/.
--
-- ayg_stripe_events: elk Stripe-event wordt een keer verwerkt (idempotentie).
-- Alleen de server (service role) leest en schrijft: RLS aan, geen policies,
-- alles ingetrokken voor anon en authenticated. Idempotent; voegt alleen toe.

create table if not exists public.ayg_aanmeldingen (
  id uuid primary key default gen_random_uuid(),
  pakket text not null check (pakket in ('start', 'club', 'keten')),
  sportschool_naam text not null check (char_length(sportschool_naam) between 2 and 60),
  slug text not null check (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  aantal_vestigingen integer not null check (aantal_vestigingen between 1 and 40),
  eigenaar_naam text not null check (char_length(eigenaar_naam) between 2 and 60),
  eigenaar_email text not null check (char_length(eigenaar_email) <= 120 and eigenaar_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  eigenaar_telefoon text not null check (char_length(eigenaar_telefoon) between 8 and 20),
  status text not null check (status in ('aanvraag', 'wacht_op_betaling', 'inrichten', 'actief', 'betaling_mislukt', 'gepauzeerd', 'opgezegd', 'test')),
  stripe_customer_id text check (stripe_customer_id is null or char_length(stripe_customer_id) <= 255),
  stripe_subscription_id text check (stripe_subscription_id is null or char_length(stripe_subscription_id) <= 255),
  stripe_session_id text unique check (stripe_session_id is null or char_length(stripe_session_id) <= 255),
  organisatie_id uuid references public.club_organisaties (id) on delete set null,
  akkoord_op timestamptz not null,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now()
);

create index if not exists ayg_aanmeldingen_slug on public.ayg_aanmeldingen (slug, status);
create index if not exists ayg_aanmeldingen_status on public.ayg_aanmeldingen (status, aangemaakt_op desc);
create unique index if not exists ayg_aanmeldingen_abonnement on public.ayg_aanmeldingen (stripe_subscription_id) where stripe_subscription_id is not null;
create index if not exists ayg_aanmeldingen_organisatie on public.ayg_aanmeldingen (organisatie_id) where organisatie_id is not null;

alter table public.ayg_aanmeldingen enable row level security;
revoke all on public.ayg_aanmeldingen from anon, authenticated;

create table if not exists public.ayg_stripe_events (
  event_id text primary key check (event_id ~ '^evt_[A-Za-z0-9_]{6,250}$'),
  type text not null check (char_length(type) <= 80),
  ontvangen_op timestamptz not null default now()
);
create index if not exists ayg_stripe_events_ontvangen on public.ayg_stripe_events (ontvangen_op);

alter table public.ayg_stripe_events enable row level security;
revoke all on public.ayg_stripe_events from anon, authenticated;

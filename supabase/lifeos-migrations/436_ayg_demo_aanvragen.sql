-- ─── AI Your Gym: demo-aanvragen van de website ─────────────────────────────
-- Een sportschool vraagt op /aiyourgym/demo-aanvragen een gratis demo aan (een
-- persoonlijk gesprek). Kane belt of mailt zelf terug; er gaat niets automatisch
-- naar buiten. Kane ziet de aanvragen op /clubkane/platform en zet ze op
-- 'afgehandeld'. Code: src/lib/aiyourgym/demo-aanvraag*.ts.
--
-- ip_hash: een sha256 van het IP-adres, alleen voor de rem per IP (geen IP zelf).
-- Alleen de server (service role) leest en schrijft: RLS aan en geforceerd, geen
-- policies, alles ingetrokken voor anon, authenticated en public. Idempotent;
-- voegt alleen toe.

create table if not exists public.ayg_demo_aanvragen (
  id uuid primary key default gen_random_uuid(),
  naam text not null check (char_length(naam) between 2 and 60),
  sportschool text not null check (char_length(sportschool) between 2 and 80),
  email text not null check (char_length(email) <= 120 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  telefoon text not null check (char_length(telefoon) between 8 and 20),
  vestigingen integer not null check (vestigingen between 1 and 500),
  soort text not null check (soort in ('zelfstandig', 'boutique', 'pt-studio', 'keten', 'yoga', 'vechtsport', 'bootcamp', 'anders')),
  moment text not null check (moment in ('ochtend', 'middag', 'avond', 'maakt-niet-uit')),
  opmerking text check (opmerking is null or char_length(opmerking) <= 1000),
  ip_hash text check (ip_hash is null or ip_hash ~ '^[0-9a-f]{64}$'),
  status text not null default 'open' check (status in ('open', 'afgehandeld')),
  afgehandeld_op timestamptz,
  akkoord_op timestamptz not null,
  aangemaakt_op timestamptz not null default now()
);

create index if not exists ayg_demo_aanvragen_status on public.ayg_demo_aanvragen (status, aangemaakt_op desc);
create index if not exists ayg_demo_aanvragen_email_tijd on public.ayg_demo_aanvragen (email, aangemaakt_op desc);
create index if not exists ayg_demo_aanvragen_ip_tijd on public.ayg_demo_aanvragen (ip_hash, aangemaakt_op desc) where ip_hash is not null;

alter table public.ayg_demo_aanvragen enable row level security;
alter table public.ayg_demo_aanvragen force row level security;
revoke all on public.ayg_demo_aanvragen from anon, authenticated, public;

-- ─── Club: eigen login voor eigenaren en clubmanagers ───────────────────────
-- Tot nu toe kon alleen Kane in Club (beheerder-sessie van de PT-app). Met deze
-- tabellen krijgt elke sportschool (club_organisaties) eigen beheerders met de
-- rol eigenaar of clubmanager. Zij loggen in met een persoonlijke link plus een
-- zelf gekozen pincode van 6 cijfers die Kane goedkeurt (zoals de PT-app), en
-- zien ALLEEN hun eigen sportschool: hun organisatie_id is de user_id waarop
-- alle club_*-tabellen filteren.
--
-- De code zet deze login pas open met de schakelaar CLUB_EIGEN_LOGIN
-- (src/lib/club/beheerders/schakelaar.ts). Die staat standaard UIT.
--
-- Pincode: alleen scrypt-hash met eigen salt. Sessie: alleen de sha256 van het
-- token. Geen policies: alleen de server (service role) leest en schrijft.
-- Idempotent; voegt alleen toe.

create table if not exists public.club_beheerders (
  id uuid primary key default gen_random_uuid(),
  organisatie_id uuid not null references public.club_organisaties (id) on delete cascade,
  naam text not null check (char_length(naam) between 1 and 60),
  email text check (email is null or (char_length(email) <= 120 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  rol text not null check (rol in ('eigenaar', 'clubmanager')),
  -- Het geheime deel van de persoonlijke link (24 tekens, 144 bits willekeur).
  code text not null unique check (code ~ '^[A-Za-z0-9_-]{24}$'),
  actief boolean not null default true,
  pin_hash text,
  pin_status text not null default 'geen' check (pin_status in ('geen', 'wacht', 'actief')),
  pin_aangevraagd_op timestamptz,
  mislukt integer not null default 0 check (mislukt >= 0),
  geblokkeerd_tot timestamptz,
  blokkades integer not null default 0 check (blokkades >= 0),
  laatst_ingelogd_op timestamptz,
  aangemaakt_op timestamptz not null default now()
);
create index if not exists club_beheerders_organisatie on public.club_beheerders (organisatie_id);

alter table public.club_beheerders enable row level security;

create table if not exists public.club_beheerder_sessies (
  token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  beheerder_id uuid not null references public.club_beheerders (id) on delete cascade,
  verloopt_op timestamptz not null,
  laatst_gebruikt_op timestamptz,
  aangemaakt_op timestamptz not null default now()
);
create index if not exists club_beheerder_sessies_beheerder on public.club_beheerder_sessies (beheerder_id);

alter table public.club_beheerder_sessies enable row level security;

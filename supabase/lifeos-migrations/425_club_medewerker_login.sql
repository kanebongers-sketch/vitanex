-- ─── Club: eigen login voor medewerkers ──────────────────────────────────────
-- Na Kane (PT-app) en de beheerders van een sportschool (migratie 410) loggen
-- nu ook medewerkers (club_medewerkers: trainer, groepslesinstructeur,
-- clubmanager, administratie) zelf in. De eigenaar of clubmanager deelt vanuit
-- Instellingen > Medewerkers een persoonlijke link uit (ook als QR-code). De
-- medewerker kiest zelf een pincode van 6 cijfers en noemt de controlecode van
-- 4 cijfers; de eigenaar of clubmanager keurt de pincode goed door die code in
-- te vullen (geen goedkeuring van Kane nodig). Daarna ziet de medewerker alleen
-- de onderdelen van zijn rollen en alleen zijn eigen vestigingen.
--
-- De code zet deze login pas open met de schakelaar CLUB_EIGEN_LOGIN
-- (src/lib/club/beheerders/schakelaar.ts). Die staat standaard UIT.
--
-- Pincode: alleen scrypt-hash met eigen salt. Sessie: alleen de sha256 van het
-- token. Geen policies: alleen de server (service role) leest en schrijft.
-- Idempotent; voegt alleen toe.

create table if not exists public.club_medewerker_toegang (
  id uuid primary key default gen_random_uuid(),
  -- De sportschool (club_organisaties.id), gelijk aan club_medewerkers.user_id.
  user_id uuid not null,
  medewerker_id uuid not null references public.club_medewerkers (id) on delete cascade,
  -- Het geheime deel van de persoonlijke link (24 tekens, 144 bits willekeur).
  code text not null unique check (code ~ '^[A-Za-z0-9_-]{24}$'),
  actief boolean not null default true,
  pin_hash text check (pin_hash is null or char_length(pin_hash) <= 200),
  pin_status text not null default 'geen' check (pin_status in ('geen', 'wacht', 'actief')),
  pin_aangevraagd_op timestamptz,
  mislukt integer not null default 0 check (mislukt >= 0),
  geblokkeerd_tot timestamptz,
  blokkades integer not null default 0 check (blokkades >= 0),
  laatst_ingelogd_op timestamptz,
  aangemaakt_op timestamptz not null default now(),
  gewijzigd_op timestamptz not null default now()
);
-- Een medewerker heeft hooguit een inloglink.
create unique index if not exists club_medewerker_toegang_medewerker on public.club_medewerker_toegang (medewerker_id);
create index if not exists club_medewerker_toegang_user on public.club_medewerker_toegang (user_id);

alter table public.club_medewerker_toegang enable row level security;
revoke all on public.club_medewerker_toegang from public, anon, authenticated;

create table if not exists public.club_medewerker_sessies (
  token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  toegang_id uuid not null references public.club_medewerker_toegang (id) on delete cascade,
  medewerker_id uuid not null references public.club_medewerkers (id) on delete cascade,
  user_id uuid not null,
  verloopt_op timestamptz not null,
  laatst_gebruikt_op timestamptz,
  aangemaakt_op timestamptz not null default now()
);
create index if not exists club_medewerker_sessies_toegang on public.club_medewerker_sessies (toegang_id, aangemaakt_op desc);
create index if not exists club_medewerker_sessies_verloopt on public.club_medewerker_sessies (verloopt_op);

alter table public.club_medewerker_sessies enable row level security;
revoke all on public.club_medewerker_sessies from public, anon, authenticated;

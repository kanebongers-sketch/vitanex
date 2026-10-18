-- ─── Club: leden loggen zelf in op de ledenapp (/mijn) ─────────────────────
-- Een lid krijgt van de sportschool een persoonlijke link (/mijn/start/<code>,
-- als QR op de ledenkaart), kiest zelf een pincode van 6 cijfers en krijgt
-- daarna een sessie van hooguit 90 dagen op dat toestel.
--
-- De code zet deze login pas open met de schakelaar CLUB_LEDEN_LOGIN
-- (src/lib/club/ledenlogin/schakelaar.ts). Die staat standaard UIT.
--
-- Pincode: alleen een scrypt-hash met eigen salt. Sessie: alleen de sha256 van
-- het token. Een nieuwe link maakt de oude ongeldig, wist de pincode en logt
-- alle toestellen uit. Geen policies: alleen de server (service role) leest en
-- schrijft; anon en authenticated hebben geen enkel recht.
-- Idempotent; voegt alleen toe.

create table if not exists public.club_lid_toegang (
  id uuid primary key default gen_random_uuid(),
  -- De sportschool (club_organisaties.id), zoals bij alle club_*-tabellen.
  user_id uuid not null,
  lid_id uuid not null references public.club_leden (id) on delete cascade,
  -- Het geheime deel van de persoonlijke link (24 tekens, 144 bits willekeur).
  code text not null unique check (code ~ '^[A-Za-z0-9_-]{24}$'),
  code_gemaakt_op timestamptz not null default now(),
  actief boolean not null default true,
  pin_hash text check (pin_hash is null or char_length(pin_hash) <= 200),
  pin_gekozen_op timestamptz,
  mislukt integer not null default 0 check (mislukt >= 0),
  geblokkeerd_tot timestamptz,
  blokkades integer not null default 0 check (blokkades >= 0),
  laatst_ingelogd_op timestamptz,
  aangemaakt_op timestamptz not null default now(),
  gewijzigd_op timestamptz not null default now()
);
-- Een lid heeft hooguit een toegang per sportschool.
create unique index if not exists club_lid_toegang_lid on public.club_lid_toegang (user_id, lid_id);

alter table public.club_lid_toegang enable row level security;
revoke all on public.club_lid_toegang from public, anon, authenticated;

create table if not exists public.club_lid_sessies (
  token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  toegang_id uuid not null references public.club_lid_toegang (id) on delete cascade,
  user_id uuid not null,
  lid_id uuid not null references public.club_leden (id) on delete cascade,
  verloopt_op timestamptz not null,
  laatst_gebruikt_op timestamptz,
  aangemaakt_op timestamptz not null default now()
);
create index if not exists club_lid_sessies_toegang on public.club_lid_sessies (toegang_id, aangemaakt_op desc);
create index if not exists club_lid_sessies_lid on public.club_lid_sessies (user_id, lid_id);
create index if not exists club_lid_sessies_verloopt on public.club_lid_sessies (verloopt_op);

alter table public.club_lid_sessies enable row level security;
revoke all on public.club_lid_sessies from public, anon, authenticated;

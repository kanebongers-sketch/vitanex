-- ─── 484: tweestapsverificatie (TOTP) voor accounts van AI Your Gym ─────────
-- Punt 1.10 van de technische roadmap (31-10-2026). Nu alleen het master
-- account van het platform (club_platform_accounts); de tabel heeft al een
-- kolom per soort account, zodat eigenaren en clubmanagers (club_beheerders)
-- later zonder nieuwe tabel mee kunnen. Precies een account per rij.
--
-- geheim: het TOTP-geheim, versleuteld met AES-256-GCM (sleutel CLUB_2FA_SLEUTEL
-- op de server, nooit hier). herstel_hashes: alleen de sha256 van de tien
-- herstelcodes; een gebruikte code verdwijnt uit de lijst. laatste_stap: de
-- laatst gebruikte tijdstap, zodat een code geen tweede keer werkt. De tellers
-- remmen het raden van codes, los van de wachtwoordtellers.
--
-- club_tweestaps_wacht: na een goed wachtwoord, voor de code. Alleen de sha256
-- van het token (httpOnly-cookie), vijf minuten geldig; de sessie ontstaat pas
-- na de tweede stap.
--
-- Geen policies: alleen de server (service role) leest en schrijft. Alleen
-- toevoegen, idempotent. Geen persoonsgegevens behalve de koppeling aan het account.

create table if not exists public.club_tweestaps (
  id uuid primary key default gen_random_uuid(),
  account_soort text not null check (account_soort in ('platform', 'beheerder')),
  platform_account_id uuid unique references public.club_platform_accounts (id) on delete cascade,
  beheerder_id uuid unique references public.club_beheerders (id) on delete cascade,
  -- De sportschool bij een beheerder (voor de tenant-filter); leeg bij het platform.
  organisatie_id uuid,
  geheim text not null check (char_length(geheim) between 20 and 400 and geheim like 'v1.%'),
  aan boolean not null default false,
  bevestigd_op timestamptz,
  herstel_hashes text[] not null default '{}' check (cardinality(herstel_hashes) <= 20),
  laatste_stap bigint,
  mislukt integer not null default 0 check (mislukt >= 0),
  geblokkeerd_tot timestamptz,
  blokkades integer not null default 0 check (blokkades >= 0),
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now(),
  constraint club_tweestaps_een_account check (
    (account_soort = 'platform' and platform_account_id is not null and beheerder_id is null and organisatie_id is null)
    or (account_soort = 'beheerder' and beheerder_id is not null and platform_account_id is null and organisatie_id is not null)
  ),
  constraint club_tweestaps_aan_bevestigd check (not aan or bevestigd_op is not null)
);
create index if not exists club_tweestaps_organisatie_id_idx on public.club_tweestaps (organisatie_id);

alter table public.club_tweestaps enable row level security;
revoke all on public.club_tweestaps from anon, authenticated;

create table if not exists public.club_tweestaps_wacht (
  token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  account_soort text not null check (account_soort in ('platform', 'beheerder')),
  platform_account_id uuid references public.club_platform_accounts (id) on delete cascade,
  beheerder_id uuid references public.club_beheerders (id) on delete cascade,
  verloopt_op timestamptz not null,
  aangemaakt_op timestamptz not null default now(),
  constraint club_tweestaps_wacht_een_account check (
    (account_soort = 'platform' and platform_account_id is not null and beheerder_id is null)
    or (account_soort = 'beheerder' and beheerder_id is not null and platform_account_id is null)
  )
);
create index if not exists club_tweestaps_wacht_platform_idx on public.club_tweestaps_wacht (platform_account_id);
create index if not exists club_tweestaps_wacht_beheerder_idx on public.club_tweestaps_wacht (beheerder_id);

alter table public.club_tweestaps_wacht enable row level security;
revoke all on public.club_tweestaps_wacht from anon, authenticated;

-- Noodherstel (telefoon en herstelcodes kwijt): alleen de database-eigenaar in de
-- SQL-editor. Zet tweestapsverificatie uit voor het platform-account met dit
-- e-mailadres en logt alle toestellen uit. Daarna inloggen met alleen het wachtwoord
-- en opnieuw instellen in Club.
create or replace function public.club_platform_tweestaps_uit(p_email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  select id into v_id from public.club_platform_accounts where email = lower(trim(p_email));
  if v_id is null then
    return false;
  end if;
  delete from public.club_tweestaps where platform_account_id = v_id;
  delete from public.club_tweestaps_wacht where platform_account_id = v_id;
  delete from public.club_platform_sessies where account_id = v_id;
  return true;
end;
$$;

revoke all on function public.club_platform_tweestaps_uit(text) from public, anon, authenticated;

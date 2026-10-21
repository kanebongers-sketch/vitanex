-- ─── AI Your Gym: master account van de platform-eigenaar (Kane) ────────────
-- Besluit Kane 21-10-2026: AI Your Gym (website, Club, ledenapp, widget) en
-- Fit Factory PT zijn twee aparte apps. Club herkende Kane tot nu toe aan de
-- beheerder-sessie van de PT-app op fitfactorypt.nl; die cookie werkt niet op
-- aiyourgym.com en mag ook niet gedeeld worden. Daarom een eigen platform-inlog:
-- een persoonlijke link plus een zelf gekozen pincode van 6 cijfers.
--
-- Rol platform_eigenaar: ziet en beheert alle sportscholen (wisselen, aanmaken,
-- beheerders). beheerder_id is de beheerder_id in club_organisaties.
--
-- De link: alleen de sha256 van het geheime deel staat hier (link_hash). Een
-- nieuwe link (eerste keer, of herstel bij een vergeten pincode) maakt ALLEEN de
-- functie club_platform_startlink(email), uit te voeren in de SQL-editor of via
-- de beheertool; er is geen openbaar formulier. De functie wist de pincode en
-- alle sessies en geeft de link terug. Met die link kiest Kane binnen 24 uur een
-- pincode; daarna is dezelfde link de vaste inloglink (link plus pincode).
--
-- Pincode: alleen scrypt-hash met eigen salt (door de server gezet). Sessie:
-- alleen de sha256 van het token. Geen policies: alleen de server (service role)
-- leest en schrijft. Het e-mailadres staat zoals bij club_beheerders (gewone
-- tekst, kleine letters) en komt nooit in logs. Idempotent; voegt alleen toe.

create table if not exists public.club_platform_accounts (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (char_length(email) <= 120 and email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  naam text not null default 'Kane' check (char_length(naam) between 1 and 60),
  rol text not null default 'platform_eigenaar' check (rol in ('platform_eigenaar')),
  beheerder_id uuid not null,
  link_hash text unique check (link_hash is null or link_hash ~ '^[0-9a-f]{64}$'),
  -- Tot dit moment kan met de link een pincode gekozen worden; daarna niet meer.
  link_kiezen_tot timestamptz,
  pin_hash text,
  actief boolean not null default true,
  mislukt integer not null default 0 check (mislukt >= 0),
  geblokkeerd_tot timestamptz,
  blokkades integer not null default 0 check (blokkades >= 0),
  laatst_ingelogd_op timestamptz,
  aangemaakt_op timestamptz not null default now()
);

alter table public.club_platform_accounts enable row level security;

create table if not exists public.club_platform_sessies (
  token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  account_id uuid not null references public.club_platform_accounts (id) on delete cascade,
  verloopt_op timestamptz not null,
  laatst_gebruikt_op timestamptz,
  aangemaakt_op timestamptz not null default now()
);
create index if not exists club_platform_sessies_account on public.club_platform_sessies (account_id);

alter table public.club_platform_sessies enable row level security;

revoke all on public.club_platform_accounts from anon, authenticated;
revoke all on public.club_platform_sessies from anon, authenticated;

-- Het master account van Kane, zonder pincode en zonder link: die maakt
-- club_platform_startlink. beheerder_id = de eigenaar van de eerste sportschool
-- (Fit Factory: daar is id gelijk aan beheerder_id).
insert into public.club_platform_accounts (email, naam, rol, beheerder_id)
select 'kanebongers@gmail.com', 'Kane', 'platform_eigenaar', o.beheerder_id
from public.club_organisaties o
where o.id = o.beheerder_id
order by o.aangemaakt_op
limit 1
on conflict (email) do nothing;

-- Een nieuwe link voor een platform-account: wist de pincode, de tellers en alle
-- sessies (alle toestellen uit) en geeft de link terug. 24 uur om een pincode
-- te kiezen. Alleen voor de database-eigenaar en de server, nooit voor de browser.
create or replace function public.club_platform_startlink(p_email text, p_basis text default 'https://aiyourgym.com')
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id uuid;
  v_code text;
begin
  select id into v_id from public.club_platform_accounts where email = lower(trim(p_email)) and actief;
  if v_id is null then
    raise exception 'Geen actief platform-account met dit e-mailadres.';
  end if;
  if p_basis !~ '^https?://[a-z0-9.-]+(:[0-9]{1,5})?$' then
    raise exception 'Ongeldig adres. Gebruik bijvoorbeeld https://aiyourgym.com';
  end if;
  -- 32 tekens base64url (192 bits willekeur).
  v_code := translate(encode(extensions.gen_random_bytes(24), 'base64'), '+/', '-_');
  update public.club_platform_accounts
     set link_hash = encode(extensions.digest(v_code, 'sha256'), 'hex'),
         link_kiezen_tot = now() + interval '24 hours',
         pin_hash = null,
         mislukt = 0,
         geblokkeerd_tot = null,
         blokkades = 0
   where id = v_id;
  delete from public.club_platform_sessies where account_id = v_id;
  return p_basis || '/clubinloggen/platform/' || v_code;
end;
$$;

revoke all on function public.club_platform_startlink(text, text) from public, anon, authenticated;

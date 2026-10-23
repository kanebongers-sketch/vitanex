-- ─── AI Your Gym: master account met e-mailadres en wachtwoord ──────────────
-- Besluit Kane 23-10-2026: geen pincode meer op aiyourgym.com. Het master
-- account logt in op /inloggen met e-mailadres en wachtwoord.
--
-- wachtwoord_hash: alleen een scrypt-hash met eigen salt (door de server gezet,
-- "s2:N:r:p:salt:hash"). pin_hash blijft bestaan zodat sessies van voor deze
-- wijziging geldig blijven tot ze verlopen; de server zet hem op null zodra er
-- een wachtwoord is.
--
-- club_platform_startlink(email): maakt nu een eenmalige link om een wachtwoord
-- te kiezen (24 uur), wist een bestaand wachtwoord en pincode en logt alle
-- toestellen uit. Voor de eerste keer en voor herstel. Alleen voor de
-- database-eigenaar en de server. Idempotent; voegt alleen toe of vervangt de functie.

alter table public.club_platform_accounts
  add column if not exists wachtwoord_hash text check (wachtwoord_hash is null or wachtwoord_hash ~ '^s2:[0-9]+:[0-9]+:[0-9]+:[0-9a-f]{32}:[0-9a-f]{64}$');

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
         wachtwoord_hash = null,
         mislukt = 0,
         geblokkeerd_tot = null,
         blokkades = 0
   where id = v_id;
  delete from public.club_platform_sessies where account_id = v_id;
  return p_basis || '/clubinloggen/platform/' || v_code;
end;
$$;

revoke all on function public.club_platform_startlink(text, text) from public, anon, authenticated;

-- ─── Club: leden loggen in met e-mailadres en wachtwoord ───────────────────
-- Besluit Kane 23-10-2026: op aiyourgym.com geen links met codes en geen
-- pincodes meer om in te loggen. Een lid logt op de ledenapp (/mijn) in met
-- e-mailadres en een sterk wachtwoord.
--
-- De persoonlijke link (/mijn/start/<code>) blijft, maar alleen als eenmalige
-- uitnodiging: daarmee bevestigt het lid zijn e-mailadres en kiest het een
-- wachtwoord (ook bij "wachtwoord vergeten"). code_gebruikt_op zet de link na
-- gebruik dicht; een nieuwe uitnodiging maakt een nieuwe code zonder het
-- wachtwoord of de sessies te raken.
--
-- Een account hoort bij een lid van een sportschool (user_id). Binnen een
-- sportschool is een e-mailadres met wachtwoord uniek, zodat inloggen precies
-- een lid vindt. Hetzelfde adres mag bij een andere sportschool ook een account
-- hebben; bij inloggen kiest het subdomein (of het lid) de sportschool.
--
-- wachtwoord_hash: alleen een scrypt-hash met eigen salt ("s2:N:r:p:salt:hash",
-- src/lib/club/kern/wachtwoord.ts). Valt onder de bestaande lid-gegevens: de rij
-- verdwijnt in club_lid_definitief_verwijderen (delete from club_lid_toegang)
-- en het e-mailadres staat in de AVG-export (de hash niet).
--
-- Bestaande pincodes en sessies blijven werken tot het lid een wachtwoord
-- kiest (dan wordt pin_hash gewist). Er is geen pincode-inlog meer.
-- Geen policies: alleen de server (service role). Idempotent; voegt alleen toe.

alter table public.club_lid_toegang
  add column if not exists email text
    check (email is null or (char_length(email) <= 120 and email = lower(email) and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')),
  add column if not exists wachtwoord_hash text
    check (wachtwoord_hash is null or wachtwoord_hash ~ '^s2:[0-9]+:[0-9]+:[0-9]+:[0-9a-f]{32}:[0-9a-f]{64}$'),
  add column if not exists wachtwoord_gekozen_op timestamptz,
  add column if not exists code_gebruikt_op timestamptz;

-- Binnen een sportschool een account per e-mailadres.
create unique index if not exists club_lid_toegang_email
  on public.club_lid_toegang (user_id, email)
  where wachtwoord_hash is not null and actief;

-- Inloggen zoekt op e-mailadres over alle sportscholen.
create index if not exists club_lid_toegang_inloggen
  on public.club_lid_toegang (email)
  where wachtwoord_hash is not null and actief;

-- "Heeft de app": een wachtwoord (of nog een oude pincode).
create index if not exists club_lid_toegang_met_wachtwoord
  on public.club_lid_toegang (user_id, lid_id)
  where actief and wachtwoord_hash is not null;

-- ─── Club: medewerkers loggen in met e-mailadres en wachtwoord ──────────────
-- Besluit Kane 23-10-2026: op aiyourgym.com geen links met codes en geen
-- pincodes meer. De eigenaar of clubmanager nodigt een medewerker uit met een
-- e-mailadres; de medewerker krijgt een eenmalige uitnodigingslink (7 dagen
-- geldig), kiest een sterk wachtwoord en is meteen binnen. Daarna logt hij in
-- op aiyourgym.com/inloggen, net als de eigenaar. Geen controlecode meer.
--
-- Alles hoort bij de inlog van de medewerker (club_medewerker_toegang). Die rij
-- verdwijnt bij club_medewerker_anonimiseren (migratie 449), dus e-mailadres,
-- wachtwoord-hash en uitnodiging worden dan mee gewist.
--
--   email                    het inlogadres (kleine letters, door de server gezet)
--   wachtwoord_hash          alleen een scrypt-hash met eigen salt ("s2:N:r:p:salt:hash")
--   uitnodiging_hash         de sha256 van de uitnodigingstoken, nooit de token zelf
--   uitnodiging_verloopt_op  tot wanneer de uitnodiging werkt
--
-- Een e-mailadres met wachtwoord hoort bij precies een account: uniek over alle
-- actieve medewerkerlogins (index) en niet gelijk aan een actieve beheerder met
-- wachtwoord (trigger hieronder, met dezelfde foutcode als een unieke index).
-- Bestaande pincodes en sessies blijven werken tot de medewerker een
-- wachtwoord kiest. Geen policies: alleen de server (service role).
-- Idempotent; voegt alleen toe.

alter table public.club_medewerker_toegang
  add column if not exists email text check (email is null or (email = lower(email) and char_length(email) between 3 and 120)),
  add column if not exists wachtwoord_hash text check (wachtwoord_hash is null or wachtwoord_hash ~ '^s2:[0-9]+:[0-9]+:[0-9]+:[0-9a-f]{32}:[0-9a-f]{64}$'),
  add column if not exists uitnodiging_hash text check (uitnodiging_hash is null or uitnodiging_hash ~ '^[0-9a-f]{64}$'),
  add column if not exists uitnodiging_verloopt_op timestamptz;

create unique index if not exists club_medewerker_toegang_email_wachtwoord
  on public.club_medewerker_toegang (email)
  where wachtwoord_hash is not null and actief;

create unique index if not exists club_medewerker_toegang_uitnodiging
  on public.club_medewerker_toegang (uitnodiging_hash)
  where uitnodiging_hash is not null;

-- Een e-mailadres met wachtwoord mag niet ook bij een beheerder met wachtwoord horen.
create or replace function public.club_medewerker_email_uniek()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.email is not null and new.wachtwoord_hash is not null and new.actief and exists (
    select 1 from public.club_beheerders b
    where lower(b.email) = new.email and b.wachtwoord_hash is not null and b.actief
  ) then
    raise exception 'e-mailadres al in gebruik' using errcode = '23505';
  end if;
  return new;
end
$$;

revoke all on function public.club_medewerker_email_uniek() from public, anon, authenticated;

drop trigger if exists club_medewerker_toegang_email_uniek on public.club_medewerker_toegang;
create trigger club_medewerker_toegang_email_uniek
  before insert or update of email, wachtwoord_hash, actief on public.club_medewerker_toegang
  for each row execute function public.club_medewerker_email_uniek();

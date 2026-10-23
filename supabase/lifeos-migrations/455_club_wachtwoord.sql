-- ─── AI Your Gym: inloggen met e-mailadres en wachtwoord ────────────────────
-- Besluit Kane 23-10-2026: op aiyourgym.com logt een sportschool in met
-- e-mailadres en een sterk wachtwoord in plaats van een link plus code.
--
-- club_beheerders.wachtwoord_hash: alleen een scrypt-hash met eigen salt (door de
-- server gezet, "s2:N:r:p:salt:hash"). Een e-mailadres met wachtwoord is uniek
-- over alle actieve beheerders, zodat inloggen precies een persoon vindt.
--
-- ayg_aanmeldingen.eigenaar_wachtwoord_hash: de hash van het wachtwoord dat de
-- eigenaar bij het aanmelden koos, alleen tot de sportschool is ingericht; daarna
-- zet de server hem op null. Nooit het wachtwoord zelf.
--
-- Geen policies: alleen de server (service role) leest en schrijft, zoals de
-- rest van deze tabellen. Idempotent; voegt alleen toe.

alter table public.club_beheerders
  add column if not exists wachtwoord_hash text check (wachtwoord_hash is null or wachtwoord_hash ~ '^s2:[0-9]+:[0-9]+:[0-9]+:[0-9a-f]{32}:[0-9a-f]{64}$');

create unique index if not exists club_beheerders_email_wachtwoord
  on public.club_beheerders (lower(email))
  where wachtwoord_hash is not null and actief;

alter table public.ayg_aanmeldingen
  add column if not exists eigenaar_wachtwoord_hash text check (eigenaar_wachtwoord_hash is null or eigenaar_wachtwoord_hash ~ '^s2:[0-9]+:[0-9]+:[0-9]+:[0-9a-f]{32}:[0-9a-f]{64}$');

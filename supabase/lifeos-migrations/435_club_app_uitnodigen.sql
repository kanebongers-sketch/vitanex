-- ─── Club: leden op de app krijgen (uitnodigen en zelf een link aanvragen) ──
-- 1. club_meldingen krijgt twee soorten mail:
--      app_uitnodiging  de sportschool nodigt een lid uit voor de ledenapp
--                       (ontdubbeld per lid per dag via de sleutel)
--      app_link         een lid vroeg zelf een inloglink aan op /mijn/aanvragen
--    De link zelf staat nooit in de wachtrij: de cron maakt of pakt hem pas
--    bij het versturen (src/lib/club/app-uitnodigen/link-voor-mail.ts).
-- 2. club_app_aanvragen: de rem op /mijn/aanvragen (max 3 per uur per
--    e-mailadres, en per IP). Alleen hashes, geen adressen; rijen ouder dan
--    een dag ruimt de route zelf op.
--
-- Geen policies: alleen de server (service role); anon en authenticated
-- hebben geen enkel recht. Idempotent; voegt alleen toe.

alter table public.club_meldingen drop constraint if exists club_meldingen_soort_check;
alter table public.club_meldingen add constraint club_meldingen_soort_check check (soort in (
  'les_geboekt', 'les_wachtlijst', 'les_afgemeld', 'les_doorgeschoven', 'les_herinnering', 'les_geannuleerd',
  'afspraak_geboekt', 'afspraak_verplaatst', 'afspraak_herinnering', 'afspraak_afgemeld', 'afspraak_geannuleerd',
  'app_uitnodiging', 'app_link'
));

create table if not exists public.club_app_aanvragen (
  id uuid primary key default gen_random_uuid(),
  -- De sportschool waarvoor de aanvraag was (null als die niet te bepalen was).
  user_id uuid,
  email_hash text not null check (char_length(email_hash) = 64),
  ip_hash text not null check (char_length(ip_hash) = 64),
  aangemaakt_op timestamptz not null default now()
);

create index if not exists club_app_aanvragen_email on public.club_app_aanvragen (email_hash, aangemaakt_op desc);
create index if not exists club_app_aanvragen_ip on public.club_app_aanvragen (ip_hash, aangemaakt_op desc);
create index if not exists club_app_aanvragen_oud on public.club_app_aanvragen (aangemaakt_op);

alter table public.club_app_aanvragen enable row level security;
revoke all on public.club_app_aanvragen from public, anon, authenticated;

-- "Heeft de app" in de ledenlijst: actieve toegang met een gekozen pincode.
create index if not exists club_lid_toegang_met_app on public.club_lid_toegang (user_id, lid_id) where actief and pin_hash is not null;

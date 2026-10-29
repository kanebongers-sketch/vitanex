-- 466: AI Your Gym modulair (besluit Kane 29-10-2026)
-- Een sportschool neemt een of meer losse pakketten af. Een onderdeel is pas
-- zichtbaar als het pakket is afgenomen EN de sportschool het zelf aan heeft
-- staan (club_organisaties.modules). Alleen toevoegen, niets verwijderen.
--   club_organisaties.pakketten   de afgenomen pakketten (licentie). Bestaande
--                                 sportscholen (Fit Factory, demo, testaccounts)
--                                 krijgen alles; de standaard is ook alles, zodat
--                                 een sportschool die Kane met de hand aanmaakt
--                                 alles heeft. Aanmelden zet precies de keuze.
--   ayg_aanmeldingen.pakketten    de gekozen pakketten bij het aanmelden.
--   ayg_aanmeldingen.pakket       mag nu ook 'los' (de nieuwe, modulaire
--                                 aanmelding; de oude waarden blijven geldig).
--   ayg_pakket_wijzigingen        pakketten erbij of opzeggen vanuit Club,
--                                 zolang Stripe het niet zelf doet (aanvraag of
--                                 testbetaling), plus wat Stripe deed.

alter table public.club_organisaties
  add column if not exists pakketten text[] not null
  default array['administratie', 'lessen', 'training', 'afspraken', 'team', 'groei']::text[];

alter table public.club_organisaties drop constraint if exists club_organisaties_pakketten_check;
alter table public.club_organisaties add constraint club_organisaties_pakketten_check
  check (pakketten <@ array['administratie', 'lessen', 'training', 'afspraken', 'team', 'groei']::text[]);

alter table public.ayg_aanmeldingen add column if not exists pakketten text[];
alter table public.ayg_aanmeldingen drop constraint if exists ayg_aanmeldingen_pakketten_check;
alter table public.ayg_aanmeldingen add constraint ayg_aanmeldingen_pakketten_check
  check (pakketten is null or (cardinality(pakketten) between 1 and 6
    and pakketten <@ array['administratie', 'lessen', 'training', 'afspraken', 'team', 'groei']::text[]));

-- De oude check (start, club, keten) wordt ruimer: 'los' erbij. Bestaande rijen blijven geldig.
alter table public.ayg_aanmeldingen drop constraint if exists ayg_aanmeldingen_pakket_check;
alter table public.ayg_aanmeldingen add constraint ayg_aanmeldingen_pakket_check
  check (pakket in ('start', 'club', 'keten', 'los'));

create table if not exists public.ayg_pakket_wijzigingen (
  id uuid primary key default gen_random_uuid(),
  organisatie_id uuid not null references public.club_organisaties(id) on delete cascade,
  pakket text not null check (pakket in ('administratie', 'lessen', 'training', 'afspraken', 'team', 'groei')),
  actie text not null check (actie in ('erbij', 'opzeggen')),
  -- aanvraag: Kane regelt het; test: testbetaling, meteen verwerkt; stripe: via Stripe verwerkt.
  status text not null check (status in ('aanvraag', 'test', 'stripe', 'verwerkt', 'geannuleerd')),
  wie text,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now()
);

create index if not exists ayg_pakket_wijzigingen_org on public.ayg_pakket_wijzigingen (organisatie_id, aangemaakt_op desc);
-- Een open aanvraag per pakket per sportschool (dubbelklikken maakt er geen twee).
create unique index if not exists ayg_pakket_wijzigingen_open
  on public.ayg_pakket_wijzigingen (organisatie_id, pakket) where status = 'aanvraag';

alter table public.ayg_pakket_wijzigingen enable row level security;
-- Geen policies: alleen de service role (de server) leest en schrijft.

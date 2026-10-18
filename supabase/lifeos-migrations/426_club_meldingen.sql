-- ─── Club: meldingen aan leden (e-mail en de lijst in de ledenapp) ──────────
-- Bevestiging, afmelding, doorgeschoven van de wachtlijst, herinnering en
-- annulering van groepslessen en afspraken met een trainer.
--
-- club_meldingen is de wachtrij: een rij per melding per kanaal ('email' of
-- 'app'). De sleutel is uniek per gebeurtenis en kanaal, zodat er nooit dubbel
-- wordt gemaild. De cron-route /api/cron/club-meldingen verstuurt wat aan de
-- beurt is. Mailen gebeurt alleen met CLUB_MAILS_ACTIEF=1 en nooit naar
-- demo-leden of leden van een demo-sportschool (zie src/lib/club/meldingen).
--
-- club_meldingen_instellingen: per sportschool welke meldingen uit staan en de
-- herinnertijden. club_meldingen_voorkeuren: per lid de afmelding voor mail,
-- met het token uit de afmeldlink.
--
-- Geen policies: alleen de server (service role) leest en schrijft; anon en
-- authenticated hebben geen enkel recht. Idempotent; voegt alleen toe.

create table if not exists public.club_meldingen (
  id uuid primary key default gen_random_uuid(),
  -- De sportschool (club_organisaties.id), zoals bij alle club_*-tabellen.
  user_id uuid not null,
  lid_id uuid not null references public.club_leden (id) on delete cascade,
  soort text not null check (soort in (
    'les_geboekt', 'les_wachtlijst', 'les_afgemeld', 'les_doorgeschoven', 'les_herinnering', 'les_geannuleerd',
    'afspraak_geboekt', 'afspraak_verplaatst', 'afspraak_herinnering', 'afspraak_afgemeld', 'afspraak_geannuleerd'
  )),
  kanaal text not null check (kanaal in ('email', 'app')),
  -- Uniek per gebeurtenis, bv. "les_herinnering:<reservering>:<geboekt_op>".
  sleutel text not null check (char_length(sleutel) between 3 and 200),
  onderwerp text not null check (char_length(onderwerp) between 1 and 200),
  inhoud text not null check (char_length(inhoud) between 1 and 4000),
  status text not null default 'gepland' check (status in ('gepland', 'bezig', 'verstuurd', 'mislukt', 'overgeslagen')),
  -- Waarom overgeslagen of mislukt (kort, zonder persoonsgegevens).
  reden text check (reden is null or char_length(reden) <= 200),
  bron_soort text check (bron_soort is null or bron_soort in ('reservering', 'afspraak')),
  bron_id uuid,
  -- De starttijd van de les of afspraak toen de melding werd ingepland:
  -- een herinnering gaat alleen als die nog klopt.
  bron_start timestamptz,
  gepland_op timestamptz not null default now(),
  verstuurd_op timestamptz,
  gelezen_op timestamptz,
  pogingen integer not null default 0 check (pogingen between 0 and 20),
  demo boolean not null default false,
  aangemaakt_op timestamptz not null default now(),
  gewijzigd_op timestamptz not null default now()
);

create unique index if not exists club_meldingen_uniek on public.club_meldingen (user_id, sleutel, kanaal);
-- De wachtrij: wat gepland staat, op tijd.
create index if not exists club_meldingen_wachtrij on public.club_meldingen (gepland_op) where status = 'gepland';
create index if not exists club_meldingen_bezig on public.club_meldingen (gewijzigd_op) where status = 'bezig';
-- De lijst in de ledenapp.
create index if not exists club_meldingen_lid on public.club_meldingen (user_id, lid_id, kanaal, verstuurd_op desc);
-- Herinneringen laten vervallen bij een annulering.
create index if not exists club_meldingen_bron on public.club_meldingen (user_id, bron_id) where bron_id is not null;

alter table public.club_meldingen enable row level security;
revoke all on public.club_meldingen from public, anon, authenticated;

create table if not exists public.club_meldingen_instellingen (
  user_id uuid primary key,
  -- De soorten die uit staan; ontbreekt een soort, dan staat hij aan.
  uit text[] not null default '{}',
  les_herinnering_min integer not null default 120 check (les_herinnering_min between 15 and 2880),
  afspraak_herinnering_min integer not null default 1440 check (afspraak_herinnering_min between 15 and 10080),
  gewijzigd_op timestamptz not null default now()
);

alter table public.club_meldingen_instellingen enable row level security;
revoke all on public.club_meldingen_instellingen from public, anon, authenticated;

create table if not exists public.club_meldingen_voorkeuren (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  lid_id uuid not null references public.club_leden (id) on delete cascade,
  -- Het geheime deel van de afmeldlink (32 tekens, 192 bits willekeur).
  afmeld_token text not null unique check (afmeld_token ~ '^[A-Za-z0-9_-]{32}$'),
  herinneringen_per_mail boolean not null default true,
  mails boolean not null default true,
  gewijzigd_op timestamptz not null default now()
);
create unique index if not exists club_meldingen_voorkeuren_lid on public.club_meldingen_voorkeuren (user_id, lid_id);

alter table public.club_meldingen_voorkeuren enable row level security;
revoke all on public.club_meldingen_voorkeuren from public, anon, authenticated;

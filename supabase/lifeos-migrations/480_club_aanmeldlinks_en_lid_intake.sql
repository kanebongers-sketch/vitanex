-- 480: Club, nieuwe leden van A tot Z (besluit Kane 30-10-2026).
--
-- Leden melden zich nooit aan via een openbare pagina. Ofwel de sportschool
-- voegt ze toe (naam en e-mail, daarna een uitnodiging), ofwel het lid meldt
-- zich zelf aan via een aanmeldlink of QR die de sportschool maakt en deelt.
-- Daarna vult het lid zelf een korte intake in de ledenapp in.
--
-- 1. club_aanmeldlinks: de links van de sportschool (geheime code, per
--    vestiging, optioneel vast aan een lidmaatschapsvorm, vervaldatum en
--    aantal keer gebruiken, altijd in te trekken).
-- 2. club_aanmeldingen: een aanmelding die nog op de code uit de mail wacht
--    (bewijs dat het e-mailadres van de aanmelder is). Kort bewaard: de app
--    wist rijen ouder dan een dag. Geen lid_id: het lid bestaat pas na afronden.
-- 3. club_leden: waar het lid vandaan kwam (link), de vastgelegde toestemming
--    bij aanmelden en wanneer het team de melding zag.
-- 4. club_intakes: wie de intake invulde (trainer of lid), de toestemming
--    voor gezondheidsgegevens met tijd en tekstversie, en wanneer het team de
--    melding "Intake ingevuld" zag.
--
-- Alleen de server schrijft (RLS aan, geen policies). Idempotent, alleen toevoegen.

create table if not exists public.club_aanmeldlinks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  vestiging text not null check (char_length(vestiging) between 1 and 60),
  code text not null check (code ~ '^[A-Za-z0-9_-]{24}$'),
  naam text check (char_length(naam) <= 80),
  vorm_id uuid references public.club_lidmaatschapsvormen(id) on delete set null,
  -- null = onbeperkt (herbruikbaar, bijvoorbeeld een QR aan de balie).
  max_gebruik int check (max_gebruik between 1 and 10000),
  gebruikt int not null default 0 check (gebruikt >= 0),
  verloopt_op timestamptz,
  ingetrokken_op timestamptz,
  gemaakt_door text check (char_length(gemaakt_door) <= 80),
  aangemaakt_op timestamptz not null default now()
);
create unique index if not exists club_aanmeldlinks_code on public.club_aanmeldlinks (code);
create index if not exists club_aanmeldlinks_org on public.club_aanmeldlinks (user_id, vestiging, aangemaakt_op desc);
alter table public.club_aanmeldlinks enable row level security;
revoke all on public.club_aanmeldlinks from anon, authenticated;

create table if not exists public.club_aanmeldingen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  link_id uuid not null references public.club_aanmeldlinks(id) on delete cascade,
  -- sha256 van het token dat alleen de browser van de aanmelder kent.
  token_hash text not null check (char_length(token_hash) = 64),
  email text not null check (char_length(email) <= 120),
  email_hash text not null check (char_length(email_hash) = 64),
  ip_hash text not null check (char_length(ip_hash) = 64),
  voornaam text not null check (char_length(voornaam) between 1 and 60),
  achternaam text not null check (char_length(achternaam) between 1 and 80),
  telefoon text check (char_length(telefoon) <= 30),
  geboortedatum date,
  -- null = er is geen code verstuurd (het adres hoort al bij een lid): afronden lukt nooit.
  code_hash text check (char_length(code_hash) = 64),
  pogingen int not null default 0 check (pogingen >= 0),
  verstuurd int not null default 1 check (verstuurd >= 0),
  toestemming_op timestamptz not null,
  toestemming_versie text not null check (char_length(toestemming_versie) <= 20),
  verloopt_op timestamptz not null,
  afgerond_op timestamptz,
  aangemaakt_op timestamptz not null default now()
);
create unique index if not exists club_aanmeldingen_token on public.club_aanmeldingen (token_hash);
create index if not exists club_aanmeldingen_rem_ip on public.club_aanmeldingen (ip_hash, aangemaakt_op);
create index if not exists club_aanmeldingen_rem_email on public.club_aanmeldingen (email_hash, aangemaakt_op);
create index if not exists club_aanmeldingen_link on public.club_aanmeldingen (link_id, aangemaakt_op);
alter table public.club_aanmeldingen enable row level security;
revoke all on public.club_aanmeldingen from anon, authenticated;

alter table public.club_leden add column if not exists aangemeld_via uuid references public.club_aanmeldlinks(id) on delete set null;
alter table public.club_leden add column if not exists aanmelding_op timestamptz;
alter table public.club_leden add column if not exists aanmelding_toestemming_versie text check (char_length(aanmelding_toestemming_versie) <= 20);
alter table public.club_leden add column if not exists aanmelding_gezien_op timestamptz;
create index if not exists club_leden_nieuwe_aanmelding on public.club_leden (user_id, vestiging) where aanmelding_op is not null and aanmelding_gezien_op is null;

alter table public.club_intakes add column if not exists bron text not null default 'trainer' check (bron in ('trainer', 'lid'));
alter table public.club_intakes add column if not exists toestemming_op timestamptz;
alter table public.club_intakes add column if not exists toestemming_versie text check (char_length(toestemming_versie) <= 20);
alter table public.club_intakes add column if not exists gezien_op timestamptz;
create index if not exists club_intakes_lid_nieuw on public.club_intakes (user_id) where bron = 'lid' and gezien_op is null;

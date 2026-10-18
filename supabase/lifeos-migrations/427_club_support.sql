-- ─── Club: vragen en problemen melden (helpcentrum) ─────────────────────────
-- Iedereen die in Club binnen is (Kane, een eigenaar of clubmanager) meldt in
-- /clubkane/hulp een vraag, probleem of wens. Kane ziet alles op
-- /clubkane/hulp/meldingen, zet de status (open, bezig, klaar) en schrijft een
-- antwoord dat de melder in het helpcentrum terugziet. Er gaat geen mail naar
-- buiten. Per sportschool (user_id = club_organisaties.id); melder_id is het persoon-id
-- (beheerder of medewerker), null voor Kane. Code: src/lib/club/hulp/.
--
-- Zelfde beveiliging als de andere club_*-tabellen: RLS aan zonder policies,
-- alleen de server (service role) leest en schrijft. Idempotent; voegt alleen toe.

create table if not exists public.club_support (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  soort text not null check (soort in ('vraag', 'probleem', 'wens')),
  onderwerp text not null check (char_length(onderwerp) between 3 and 120),
  beschrijving text not null check (char_length(beschrijving) between 10 and 4000),
  pagina text check (pagina is null or (char_length(pagina) <= 200 and pagina ~ '^/')),
  melder_id uuid,
  melder_naam text not null check (char_length(melder_naam) between 1 and 80),
  melder_rol text not null check (melder_rol in ('beheerder', 'eigenaar', 'clubmanager', 'medewerker')),
  status text not null default 'open' check (status in ('open', 'bezig', 'klaar')),
  antwoord text check (antwoord is null or char_length(antwoord) <= 4000),
  beantwoord_op timestamptz,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now()
);

create index if not exists club_support_sportschool on public.club_support (user_id, aangemaakt_op desc);
create index if not exists club_support_melder on public.club_support (melder_id, aangemaakt_op desc) where melder_id is not null;
create index if not exists club_support_status on public.club_support (status, aangemaakt_op desc);

alter table public.club_support enable row level security;
alter table public.club_support force row level security;
revoke all on public.club_support from anon, authenticated, public;

-- Ook medewerkers met een eigen login kunnen melden (rol medewerker).
alter table public.club_support drop constraint if exists club_support_melder_rol_check;
alter table public.club_support add constraint club_support_melder_rol_check check (melder_rol in ('beheerder', 'eigenaar', 'clubmanager', 'medewerker'));

-- ─── Club: web push-meldingen in de ledenapp ───────────────────────────────
-- Een derde kanaal naast mail en de lijst in de app. Een lid zet meldingen aan
-- met een tik (Profiel of de vraag op Home); de browser geeft dan een
-- abonnement (endpoint plus sleutels) dat hier per toestel staat.
--
-- 1. club_push_abonnementen: per toestel een abonnement van een lid. Uniek op
--    endpoint (een toestel hoort bij precies een lid; logt een ander lid in op
--    hetzelfde toestel en zet meldingen aan, dan gaat het abonnement over).
--    sessie_hash = de sessie waarmee het is aangemaakt: bij uitloggen gaat het
--    abonnement van dat toestel weg. Een lid hoort bij dezelfde sportschool
--    (samengestelde sleutel), en verdwijnt het lid, dan ook de abonnementen.
-- 2. club_meldingen krijgt kanaal 'push' (zelfde sleutel, dus nooit dubbel).
-- 3. club_meldingen_voorkeuren.push: false = het lid zette push uit.
--
-- Versturen: /api/cron/club-meldingen, alleen met CLUB_PUSH_ACTIEF=1 en de
-- VAPID-sleutels, nooit voor demo (src/lib/club/push).
-- Geen policies: alleen de server (service role); anon en authenticated
-- hebben geen enkel recht. Idempotent; voegt alleen toe.

create unique index if not exists club_leden_id_user on public.club_leden (id, user_id);

create table if not exists public.club_push_abonnementen (
  id uuid primary key default gen_random_uuid(),
  -- De sportschool (club_organisaties.id), zoals bij alle club_*-tabellen.
  user_id uuid not null,
  lid_id uuid not null,
  -- Alleen https-adressen van bekende push-diensten (gecontroleerd in de code).
  endpoint text not null check (char_length(endpoint) between 20 and 1000 and endpoint like 'https://%'),
  -- Publieke sleutel van het toestel (65 bytes) en het auth-geheim (16 bytes), base64url.
  p256dh text not null check (p256dh ~ '^[A-Za-z0-9_-]{87}$'),
  auth text not null check (auth ~ '^[A-Za-z0-9_-]{22}$'),
  -- Kort, alleen om het toestel te herkennen ("Chrome op Android").
  user_agent text check (user_agent is null or char_length(user_agent) <= 120),
  sessie_hash text check (sessie_hash is null or sessie_hash ~ '^[0-9a-f]{64}$'),
  aangemaakt_op timestamptz not null default now(),
  laatst_gebruikt_op timestamptz,
  constraint club_push_abonnementen_lid_zelfde_org foreign key (lid_id, user_id)
    references public.club_leden (id, user_id) on delete cascade
);

create unique index if not exists club_push_abonnementen_endpoint on public.club_push_abonnementen (endpoint);
create index if not exists club_push_abonnementen_lid on public.club_push_abonnementen (user_id, lid_id);
create index if not exists club_push_abonnementen_sessie on public.club_push_abonnementen (sessie_hash) where sessie_hash is not null;

alter table public.club_push_abonnementen enable row level security;
revoke all on public.club_push_abonnementen from public, anon, authenticated;

alter table public.club_meldingen drop constraint if exists club_meldingen_kanaal_check;
alter table public.club_meldingen add constraint club_meldingen_kanaal_check check (kanaal in ('email', 'app', 'push'));

alter table public.club_meldingen_voorkeuren add column if not exists push boolean not null default true;

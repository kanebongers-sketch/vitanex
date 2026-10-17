-- ─── Club: meerdere sportscholen (organisaties) ─────────────────────────────
-- Club wordt software voor meerdere sportscholen, elk met een eigen omgeving en
-- strikt gescheiden data (besluit Kane 17-10-2026).
--
-- Hoe de scheiding werkt: elke club_*-tabel heeft al een kolom user_id en elke
-- query filtert daarop. Het id van een organisatie IS die user_id. Fit Factory
-- krijgt als id de bestaande eigenaar (LIFEOS_USER_ID), zodat geen enkele
-- bestaande rij hoeft te veranderen. Een nieuwe sportschool krijgt een nieuw id
-- en ziet dus nooit data van een ander.
--
-- beheerder_id: wie deze organisatie mag openen (nu alleen Kane). Rollen voor
-- eigenaren en clubmanagers van andere sportscholen komen met hun eigen login.
--
-- Huisstijl: naam, slogan, logo (Supabase Storage, bucket club-logo), accentkleur
-- en thema (donker of licht). Onderdelen: modules die uit kunnen staan.
-- Idempotent; voegt alleen toe.

create table if not exists public.club_organisaties (
  id uuid primary key,
  beheerder_id uuid not null,
  naam text not null check (char_length(naam) between 1 and 60),
  slogan text check (char_length(slogan) <= 80),
  -- Pad in de bucket club-logo (<org-id>/<bestand>), of 'ingebouwd:fitfactory'.
  logo text check (logo is null or logo = 'ingebouwd:fitfactory' or logo ~ '^[0-9a-f-]{36}/[a-z0-9-]{1,60}\.(png|webp|svg|jpg)$'),
  kleur_accent text not null default '#B58E5C' check (kleur_accent ~ '^#[0-9A-Fa-f]{6}$'),
  thema text not null default 'donker' check (thema in ('donker', 'licht')),
  -- { "lessen": false, ... } = uit. Ontbreekt een sleutel, dan staat het onderdeel aan.
  modules jsonb not null default '{}'::jsonb,
  demo boolean not null default false,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now()
);
create index if not exists club_organisaties_beheerder on public.club_organisaties (beheerder_id);

alter table public.club_organisaties enable row level security;
-- Geen policies: alleen de server (service role) leest en schrijft.

-- Vestigingen horen bij een organisatie via user_id (zoals alle andere tabellen).

-- Fit Factory: de eerste klant, met het bestaande id.
insert into public.club_organisaties (id, beheerder_id, naam, slogan, logo, kleur_accent, thema)
select uid, uid, 'Fit Factory', 'Meet. Train. Repeat.', 'ingebouwd:fitfactory', '#B58E5C', 'donker'
from (select user_id as uid from public.pt_lead_links where rol = 'beheerder' limit 1) b
on conflict (id) do nothing;

-- Opslag voor logo's: openbaar leesbaar (het logo staat in de app), schrijven alleen via de server.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('club-logo', 'club-logo', true, 1048576, array['image/png', 'image/webp', 'image/svg+xml', 'image/jpeg'])
on conflict (id) do nothing;

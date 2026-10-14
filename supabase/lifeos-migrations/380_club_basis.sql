-- ─── Fit Factory clubsoftware: de basis ─────────────────────────────────────
-- De all-in software voor de Fit Factory-vestigingen (leden, lesrooster en
-- reserveren, check-in, leads, intakes en schema's, ledenapp). Testfase: alleen
-- voor Kane op fitfactorypt.nl/clubkane. Geen financiele gegevens: geld,
-- incasso en contracten blijven in Sportivity; hier staat alleen de naam van het
-- abonnement en de status, zoals Sportivity die doorgeeft.
--
-- Zelfde opzet als de PT-tabellen: single-tenant (user_id = LIFEOS_USER_ID), RLS
-- aan zonder policies, dus alleen de service-role (server) leest en schrijft.
-- Vestigingen zijn de sleutels uit src/lib/lifeos/pt-dashboard/clubs.ts.
-- Rijen met demo = true zijn verzonnen voorbeelddata en worden voor de pilot
-- met een delete op demo weggehaald.

create table if not exists public.club_vestigingen (
  vestiging text primary key check (vestiging in ('budel','bergeijk','someren','eindhoven_boschdijk','eindhoven_tongelre','eersel','oisterwijk','bladel')),
  user_id uuid not null,
  naam text not null check (char_length(naam) <= 80),
  adres text check (char_length(adres) <= 160),
  -- Regels voor reserveren: { annuleer_uren, no_show_drempel, no_show_blokkade_dagen, reserveer_dagen_vooruit, max_open_reserveringen, checkin_venster_min }
  regels jsonb not null default '{}'::jsonb,
  -- Openingstijden per weekdag: { "1": ["06:00","23:00"], ... } (1 = maandag)
  openingstijden jsonb not null default '{}'::jsonb,
  aangemaakt_op timestamptz not null default now()
);

create table if not exists public.club_medewerkers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  naam text not null check (char_length(naam) between 1 and 80),
  email text check (char_length(email) <= 160),
  rollen text[] not null default '{}' check (rollen <@ array['balie','trainer','instructeur','manager']::text[]),
  vestigingen text[] not null default '{}',
  actief boolean not null default true,
  demo boolean not null default false,
  aangemaakt_op timestamptz not null default now()
);

create table if not exists public.club_leden (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  vestiging text not null references public.club_vestigingen(vestiging),
  lidnummer text check (char_length(lidnummer) <= 40),
  sportivity_id text check (char_length(sportivity_id) <= 80),
  voornaam text not null check (char_length(voornaam) between 1 and 60),
  achternaam text not null check (char_length(achternaam) between 1 and 80),
  email text check (char_length(email) <= 160),
  telefoon text check (char_length(telefoon) <= 40),
  geboortedatum date,
  geslacht text check (geslacht in ('man','vrouw','anders')),
  -- Alleen de naam van het abonnement (bv. "All-in 12 maanden"), geen bedragen.
  abonnement text check (char_length(abonnement) <= 80),
  status text not null default 'actief' check (status in ('actief','gepauzeerd','opgezegd','gestopt','proef')),
  lid_sinds date,
  einddatum date,
  -- Voor de QR-code in de ledenapp; nooit het lidnummer zelf in de QR.
  qr_token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  tags text[] not null default '{}',
  coach_id uuid references public.club_medewerkers(id) on delete set null,
  demo boolean not null default false,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now()
);
create unique index if not exists club_leden_sportivity on public.club_leden (user_id, sportivity_id) where sportivity_id is not null;
create index if not exists club_leden_vestiging on public.club_leden (user_id, vestiging, status);
create index if not exists club_leden_naam on public.club_leden (user_id, lower(achternaam), lower(voornaam));

create table if not exists public.club_notities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  lid_id uuid not null references public.club_leden(id) on delete cascade,
  auteur text check (char_length(auteur) <= 80),
  tekst text not null check (char_length(tekst) between 1 and 2000),
  vastgepind boolean not null default false,
  aangemaakt_op timestamptz not null default now()
);
create index if not exists club_notities_lid on public.club_notities (lid_id, aangemaakt_op desc);

create table if not exists public.club_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  lid_id uuid not null references public.club_leden(id) on delete cascade,
  vestiging text not null references public.club_vestigingen(vestiging),
  op timestamptz not null default now(),
  bron text not null default 'balie' check (bron in ('balie','qr','bandje','les')),
  demo boolean not null default false
);
create index if not exists club_checkins_vestiging_op on public.club_checkins (user_id, vestiging, op desc);
create index if not exists club_checkins_lid_op on public.club_checkins (lid_id, op desc);

create table if not exists public.club_zalen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  vestiging text not null references public.club_vestigingen(vestiging),
  naam text not null check (char_length(naam) between 1 and 60),
  capaciteit int not null default 20 check (capaciteit between 1 and 500),
  actief boolean not null default true
);

create table if not exists public.club_lestypen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  naam text not null check (char_length(naam) between 1 and 60),
  omschrijving text check (char_length(omschrijving) <= 600),
  -- Soort bepaalt het icoon/de groep in het rooster.
  soort text not null default 'kracht' check (soort in ('kracht','cardio','mind_body','dans','spinning','functioneel','overig')),
  duur_min int not null default 60 check (duur_min between 10 and 240),
  intensiteit int not null default 2 check (intensiteit between 1 and 3),
  actief boolean not null default true
);

-- Een vaste les in de week (bv. elke dinsdag 19:00 Spinning in zaal 2).
create table if not exists public.club_lesseries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  vestiging text not null references public.club_vestigingen(vestiging),
  lestype_id uuid not null references public.club_lestypen(id) on delete cascade,
  zaal_id uuid references public.club_zalen(id) on delete set null,
  instructeur_id uuid references public.club_medewerkers(id) on delete set null,
  weekdag int not null check (weekdag between 1 and 7),
  starttijd time not null,
  duur_min int not null check (duur_min between 10 and 240),
  capaciteit int not null check (capaciteit between 1 and 500),
  vanaf date not null,
  tot date,
  actief boolean not null default true,
  demo boolean not null default false
);

-- Een concrete les op een datum. Uit een serie gegenereerd of los gepland.
create table if not exists public.club_lessen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  vestiging text not null references public.club_vestigingen(vestiging),
  serie_id uuid references public.club_lesseries(id) on delete set null,
  lestype_id uuid not null references public.club_lestypen(id) on delete cascade,
  zaal_id uuid references public.club_zalen(id) on delete set null,
  instructeur_id uuid references public.club_medewerkers(id) on delete set null,
  start_op timestamptz not null,
  eind_op timestamptz not null,
  capaciteit int not null check (capaciteit between 1 and 500),
  status text not null default 'gepland' check (status in ('gepland','geannuleerd')),
  annuleer_reden text check (char_length(annuleer_reden) <= 200),
  demo boolean not null default false,
  check (eind_op > start_op)
);
create unique index if not exists club_lessen_serie_start on public.club_lessen (serie_id, start_op) where serie_id is not null;
create index if not exists club_lessen_vestiging_start on public.club_lessen (user_id, vestiging, start_op);

create table if not exists public.club_reserveringen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  les_id uuid not null references public.club_lessen(id) on delete cascade,
  lid_id uuid not null references public.club_leden(id) on delete cascade,
  status text not null default 'geboekt' check (status in ('geboekt','wachtlijst','geannuleerd','aanwezig','no_show')),
  -- Volgorde op de wachtlijst (lager = eerder aan de beurt).
  wachtpositie int,
  geboekt_op timestamptz not null default now(),
  gewijzigd_op timestamptz not null default now(),
  bron text not null default 'app' check (bron in ('app','balie','instructeur')),
  demo boolean not null default false
);
create unique index if not exists club_reserveringen_uniek on public.club_reserveringen (les_id, lid_id);
create index if not exists club_reserveringen_lid on public.club_reserveringen (lid_id, geboekt_op desc);

create table if not exists public.club_leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  vestiging text not null references public.club_vestigingen(vestiging),
  naam text not null check (char_length(naam) between 1 and 120),
  email text check (char_length(email) <= 160),
  telefoon text check (char_length(telefoon) <= 40),
  bron text not null default 'website' check (bron in ('website','balie','telefoon','social','verwijzing','actie','overig')),
  interesse text check (char_length(interesse) <= 200),
  status text not null default 'nieuw' check (status in ('nieuw','contact','proefles','proefles_geweest','lid','verloren')),
  proefles_op timestamptz,
  proefles_les_id uuid references public.club_lessen(id) on delete set null,
  opvolgen_op date,
  verloren_reden text check (char_length(verloren_reden) <= 200),
  medewerker_id uuid references public.club_medewerkers(id) on delete set null,
  lid_id uuid references public.club_leden(id) on delete set null,
  toestemming_contact boolean not null default false,
  demo boolean not null default false,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now()
);
create index if not exists club_leads_status on public.club_leads (user_id, vestiging, status);

create table if not exists public.club_lead_historie (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  lead_id uuid not null references public.club_leads(id) on delete cascade,
  soort text not null check (soort in ('notitie','status','gebeld','gemaild','proefles')),
  tekst text check (char_length(tekst) <= 1000),
  auteur text check (char_length(auteur) <= 80),
  op timestamptz not null default now()
);
create index if not exists club_lead_historie_lead on public.club_lead_historie (lead_id, op desc);

create table if not exists public.club_intakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  lid_id uuid not null references public.club_leden(id) on delete cascade,
  medewerker_id uuid references public.club_medewerkers(id) on delete set null,
  datum date not null default current_date,
  -- Vrije, gestructureerde antwoorden: { doelen: [], ervaring, blessures, medicatie, beschikbaarheid, motivatie, ... }
  antwoorden jsonb not null default '{}'::jsonb,
  -- Metingen: { gewicht_kg, lengte_cm, vetpercentage, buikomtrek_cm, rusthartslag, bloeddruk }
  metingen jsonb not null default '{}'::jsonb,
  -- Toestemming voor het vastleggen van gezondheidsgegevens (AVG, bijzondere gegevens).
  toestemming_gezondheid boolean not null default false,
  notitie text check (char_length(notitie) <= 2000),
  demo boolean not null default false,
  aangemaakt_op timestamptz not null default now()
);
create index if not exists club_intakes_lid on public.club_intakes (lid_id, datum desc);

create table if not exists public.club_oefeningen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  naam text not null check (char_length(naam) between 1 and 80),
  spiergroep text not null check (spiergroep in ('borst','rug','schouders','biceps','triceps','benen','billen','buik','onderrug','kuiten','hele_lichaam','cardio')),
  materiaal text not null default 'geen' check (materiaal in ('geen','dumbbell','barbell','kettlebell','machine','kabel','band','bank','cardio_apparaat','overig')),
  niveau int not null default 1 check (niveau between 1 and 3),
  uitleg text check (char_length(uitleg) <= 1200),
  aandachtspunten text check (char_length(aandachtspunten) <= 600),
  video_url text check (char_length(video_url) <= 300),
  actief boolean not null default true
);
create unique index if not exists club_oefeningen_naam on public.club_oefeningen (user_id, lower(naam));

create table if not exists public.club_schemas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  -- null = sjabloon dat je op een lid kunt zetten.
  lid_id uuid references public.club_leden(id) on delete cascade,
  naam text not null check (char_length(naam) between 1 and 80),
  doel text check (doel in ('afvallen','spiermassa','kracht','conditie','gezondheid','revalidatie','sport')),
  niveau int not null default 1 check (niveau between 1 and 3),
  weken int check (weken between 1 and 52),
  medewerker_id uuid references public.club_medewerkers(id) on delete set null,
  status text not null default 'actief' check (status in ('concept','actief','afgerond')),
  notitie text check (char_length(notitie) <= 1000),
  demo boolean not null default false,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now()
);
create index if not exists club_schemas_lid on public.club_schemas (lid_id, status);

create table if not exists public.club_schema_oefeningen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  schema_id uuid not null references public.club_schemas(id) on delete cascade,
  -- Trainingsdag binnen het schema: 1 = dag A, 2 = dag B, ...
  dag int not null default 1 check (dag between 1 and 7),
  volgorde int not null default 0,
  oefening_id uuid not null references public.club_oefeningen(id) on delete restrict,
  sets int check (sets between 1 and 20),
  herhalingen text check (char_length(herhalingen) <= 20),
  gewicht_kg numeric(6,2),
  rust_sec int check (rust_sec between 0 and 600),
  notitie text check (char_length(notitie) <= 300)
);
create index if not exists club_schema_oefeningen_schema on public.club_schema_oefeningen (schema_id, dag, volgorde);

-- Wat een lid in de ledenapp afvinkt: een gedane training uit zijn schema.
create table if not exists public.club_trainingslog (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  lid_id uuid not null references public.club_leden(id) on delete cascade,
  schema_id uuid references public.club_schemas(id) on delete set null,
  dag int,
  op timestamptz not null default now(),
  -- Per oefening wat er echt gedaan is: [{ oefening_id, sets: [{ herhalingen, gewicht_kg }] }]
  uitgevoerd jsonb not null default '[]'::jsonb,
  demo boolean not null default false
);
create index if not exists club_trainingslog_lid on public.club_trainingslog (lid_id, op desc);

-- Wat een medewerker in het systeem deed (wie checkte in, wie annuleerde een les).
create table if not exists public.club_logboek (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  vestiging text,
  wie text check (char_length(wie) <= 80),
  actie text not null check (char_length(actie) <= 80),
  onderwerp text check (char_length(onderwerp) <= 200),
  op timestamptz not null default now()
);
create index if not exists club_logboek_op on public.club_logboek (user_id, op desc);

-- Alles alleen via de server.
do $$
declare t text;
begin
  foreach t in array array['club_vestigingen','club_medewerkers','club_leden','club_notities','club_checkins','club_zalen','club_lestypen','club_lesseries','club_lessen','club_reserveringen','club_leads','club_lead_historie','club_intakes','club_oefeningen','club_schemas','club_schema_oefeningen','club_trainingslog','club_logboek']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;

-- ─── Club: nieuws en berichten aan leden ─────────────────────────────────────
-- Berichten die leden in de ledenapp op Home zien (nieuwe les, aangepaste
-- openingstijden, een actie). Per sportschool (user_id = club_organisaties.id).
-- Zelfde beveiliging als de andere club_*-tabellen: RLS aan zonder policies,
-- alleen de server (service role) leest en schrijft.
--
-- Doelgroep:
--   vestigingen leeg = alle vestigingen van de sportschool, anders alleen deze slugs
--   statussen   leeg = alle leden, anders alleen leden met een van deze statussen
--   tag         null = geen eis, anders alleen leden met deze tag
-- Zichtbaar van zichtbaar_van tot zichtbaar_tot (null = geen einde).
-- Pushmeldingen en e-mail: komt later (er wordt hier niets verstuurd).

create table if not exists public.club_berichten (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  titel text not null check (char_length(titel) between 1 and 80),
  tekst text not null default '' check (char_length(tekst) <= 2000),
  soort text not null default 'nieuws' check (soort in ('nieuws', 'actie', 'belangrijk')),
  vestigingen text[] not null default '{}',
  statussen text[] not null default '{}',
  tag text check (tag is null or char_length(tag) between 1 and 40),
  zichtbaar_van timestamptz not null default now(),
  zichtbaar_tot timestamptz,
  vastgepind boolean not null default false,
  aangemaakt_door text,
  demo boolean not null default false,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now(),
  check (zichtbaar_tot is null or zichtbaar_tot > zichtbaar_van)
);
create index if not exists club_berichten_lijst on public.club_berichten (user_id, zichtbaar_van desc);
alter table public.club_berichten enable row level security;
revoke all on public.club_berichten from anon, authenticated;

-- ─── Demodata (demo = true) ──────────────────────────────────────────────────
-- Fit Factory (vestiging budel) en Voorbeeld Gym (voorbeeld-centrum, voorbeeld-noord).
-- Idempotent: een bericht wordt alleen toegevoegd als dezelfde titel er nog niet staat.

insert into public.club_berichten (user_id, titel, tekst, soort, vestigingen, statussen, tag, zichtbaar_van, zichtbaar_tot, vastgepind, aangemaakt_door, demo)
select v.user_id::uuid, v.titel, v.tekst, v.soort, v.vestigingen, v.statussen, v.tag, v.van, v.tot, v.vast, 'Kane', true
from (values
  ('67b0a700-3f1d-425e-9646-98c237e34fd7', 'Nieuw: Functional Fit op dinsdag',
   E'Vanaf deze week staat er elke dinsdag om 19:00 een nieuwe groepsles op het rooster: Functional Fit.\n\nIn 45 minuten werk je aan kracht, conditie en beweeglijkheid. Geschikt voor elk niveau.\n\n- Boek via het tabblad Lessen\n- Neem een handdoek en een flesje water mee',
   'nieuws', array['budel']::text[], '{}'::text[], null::text, now() - interval '2 days', now() + interval '28 days', true),
  ('67b0a700-3f1d-425e-9646-98c237e34fd7', 'Openingstijden rond kerst',
   E'Rond de feestdagen zijn we korter open.\n\n- 24 december: 06:00 tot 17:00\n- 25 en 26 december: 09:00 tot 13:00\n- 31 december: 06:00 tot 17:00\n- 1 januari: gesloten\n\nDe groepslessen op deze dagen vervallen.',
   'belangrijk', '{}'::text[], '{}'::text[], null::text, timestamptz '2026-12-01 08:00+01', timestamptz '2027-01-02 00:00+01', true),
  ('67b0a700-3f1d-425e-9646-98c237e34fd7', 'Neem een vriend mee',
   E'Train samen, dat is leuker. Neem deze maand een vriend of vriendin gratis mee voor een proeftraining.\n\nMeld je even bij de balie, dan zetten we het klaar.',
   'actie', array['budel']::text[], array['actief']::text[], null::text, now() - interval '5 days', now() + interval '25 days', false),
  ('67b0a700-3f1d-425e-9646-98c237e34fd7', 'Welkom bij je proefperiode',
   E'Fijn dat je er bent. Plan in je eerste week een gratis kennismaking met een trainer, dan maken we samen een schema dat bij je past.',
   'nieuws', array['budel']::text[], array['proef']::text[], null::text, now() - interval '20 days', null::timestamptz, false),
  ('de000000-0000-4000-8000-0000000000c1', 'Nieuwe les: Spinning Power',
   E'Op donderdag om 18:30 start Spinning Power in Voorbeeld Centrum.\n\nEen intensieve fietsles van 45 minuten op muziek. Er zijn 16 fietsen, dus boek op tijd.',
   'nieuws', array['voorbeeld-centrum']::text[], '{}'::text[], null::text, now() - interval '1 day', now() + interval '30 days', true),
  ('de000000-0000-4000-8000-0000000000c1', 'Kerst: aangepaste openingstijden',
   E'Op 25 en 26 december zijn beide vestigingen open van 09:00 tot 14:00. Op 1 januari zijn we dicht.\n\nDe rest van de feestdagen ben je gewoon welkom op de normale tijden.',
   'belangrijk', '{}'::text[], '{}'::text[], null::text, timestamptz '2026-12-01 08:00+01', timestamptz '2027-01-02 00:00+01', false),
  ('de000000-0000-4000-8000-0000000000c1', 'Actie: neem een vriend mee',
   E'Breng een vriend mee en jullie krijgen allebei een gratis sporttas.\n\n- Geldt voor nieuwe leden\n- Zolang de voorraad strekt',
   'actie', '{}'::text[], array['actief']::text[], null::text, now() - interval '3 days', now() + interval '21 days', false),
  ('de000000-0000-4000-8000-0000000000c1', 'Kleedkamers Noord vernieuwd',
   E'De kleedkamers in Voorbeeld Noord zijn klaar. Dank voor je geduld tijdens de verbouwing.',
   'nieuws', array['voorbeeld-noord']::text[], '{}'::text[], null::text, now() - interval '40 days', now() - interval '10 days', false)
) as v(user_id, titel, tekst, soort, vestigingen, statussen, tag, van, tot, vast)
where not exists (
  select 1 from public.club_berichten b where b.user_id = v.user_id::uuid and b.titel = v.titel and b.demo = true
);

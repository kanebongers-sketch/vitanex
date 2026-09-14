-- ─── LifeOS — leren van correcties op het autohernoemen ─────────────────────
-- Het autohernoemen (cron/lifeos-agenda-sync → agenda/hernoem.ts) schrijft een
-- kale-naam-afspraak om naar de volledige naam + rol-tag ("Kevin" → "Kevin
-- Cranenbroeck PT"). Deze migratie geeft het een geheugen, zodat het LEERT van
-- jouw correcties:
--
--   • hernoem_geschreven — de exacte titel die LifeOS zelf schreef. Verandert de
--     titel later naar iets anders, dan heb JIJ 'm gecorrigeerd.
--   • hernoem_geblokkeerd — zodra dat gebeurt, gaat deze vlag aan en raakt LifeOS
--     die afspraak nooit meer automatisch aan.
--
-- Twee additieve, nullable/default-kolommen. Bestaande rijen blijven ongemoeid, en
-- de sync-upsert (opslag.ts → bewaarEvents) noemt deze kolommen niet, dus ze
-- overleven elke sync-ronde.
--
-- Toegepast op het lifeos-project (bbklogjersviaoocgrve) via de Supabase-migratie
-- `agenda_hernoem_leren`; dit bestand is het bijbehorende record in de repo.

alter table public.agenda_events
  add column if not exists hernoem_geschreven text,
  add column if not exists hernoem_geblokkeerd boolean not null default false;

comment on column public.agenda_events.hernoem_geschreven is
  'De titel die LifeOS zelf schreef bij een autohernoem. null = nooit door ons hernoemd.';
comment on column public.agenda_events.hernoem_geblokkeerd is
  'true = de gebruiker heeft onze hernoem gecorrigeerd; nooit meer automatisch hernoemen.';

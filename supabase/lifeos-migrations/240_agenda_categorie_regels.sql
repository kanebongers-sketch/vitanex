-- ─── LifeOS — geleerde categorie-regels voor de agenda ──────────────────────
-- Wijs je een afspraak op het categorieën-scherm zelf een bak toe, dan onthoudt
-- LifeOS dat hier: per GENORMALISEERDE titel (lowercase, witruimte samengevouwen)
-- de gekozen categorie. Elke volgende afspraak met dezelfde titel valt dan in
-- diezelfde bak — zo leert het systeem van jouw herindeling, en wint jouw regel
-- van de auto-categorie (zie lib/lifeos/agenda/categorie.ts → categoriseerMet).
--
-- Single-tenant (alleen Kane), dus geen FK naar een users-tabel; user_id filtert.
-- Toegepast op het lifeos-project (bbklogjersviaoocgrve) via de Supabase-migratie
-- `agenda_categorie_regels`; dit bestand is het bijbehorende record in de repo.

create table if not exists public.agenda_categorie_regels (
  user_id       uuid        not null,
  titel_norm    text        not null,
  categorie     text        not null,
  bijgewerkt_op timestamptz not null default now(),
  primary key (user_id, titel_norm),
  constraint agenda_categorie_regels_titel_niet_leeg check (length(titel_norm) between 1 and 300),
  constraint agenda_categorie_regels_categorie_geldig
    check (categorie in ('pt_klant', 'budel_team', 'pt_team', 'management', 'persoonlijk', 'overig'))
);

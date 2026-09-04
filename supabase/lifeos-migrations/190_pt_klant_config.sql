-- ─── LifeOS 190 — PT-klant-config: frequentie, locatie, vakantie ────────────
-- Draait op het LIFEOS-project (bbklogjersviaoocgrve). Zie README.md.
--
-- Per PT-klant (crm_personen, groep pt_klant): hoe vaak per week (1 of 2), waar
-- (Bergeijk/Someren/Budel) en of 'ie tijdelijk op vakantie is. Zo kan het
-- dashboard per kalenderweek zien wie er nog ingepland moet worden — en niemand
-- vergeten. Kolommen zijn nullable: voor niet-PT-klanten simpelweg leeg.
--
-- Idempotent.

alter table public.crm_personen add column if not exists sessies_per_week smallint;
alter table public.crm_personen add column if not exists locatie text;
alter table public.crm_personen add column if not exists vakantie_tot date;

alter table public.crm_personen drop constraint if exists crm_sessies_per_week_geldig;
alter table public.crm_personen add constraint crm_sessies_per_week_geldig
  check (sessies_per_week is null or sessies_per_week in (1, 2));

alter table public.crm_personen drop constraint if exists crm_locatie_geldig;
alter table public.crm_personen add constraint crm_locatie_geldig
  check (locatie is null or locatie in ('bergeijk', 'someren', 'budel'));

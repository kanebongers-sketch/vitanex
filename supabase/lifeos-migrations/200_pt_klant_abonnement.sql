-- ─── LifeOS 200 — PT-klant: abonnement (bepaalt de inplan-cadans) ───────────
-- Draait op het LIFEOS-project. Zie README.md.
--
-- Het abonnement bepaalt hoe vaak je een klant inplant. `sessies_per_week` (uit
-- 190) kon alleen 1 of 2 — maar er is ook een tweewekelijks abonnement. Daarom
-- een expliciet abonnement-veld met drie waarden, plus een duo-vlag (twee personen
-- in één sessie, zelfde cadans). Nullable: niet-ingesteld = default 1×/week.
--
-- Idempotent.

alter table public.crm_personen add column if not exists abonnement text;
alter table public.crm_personen add column if not exists duo boolean not null default false;

alter table public.crm_personen drop constraint if exists crm_abonnement_geldig;
alter table public.crm_personen add constraint crm_abonnement_geldig
  check (abonnement is null or abonnement in ('wekelijks_1', 'wekelijks_2', 'tweewekelijks_1'));

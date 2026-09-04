-- ─── LifeOS 180 — taken: vrije categorie (Apple-Notes-mapje) ────────────────
-- Draait op het LIFEOS-project (bbklogjersviaoocgrve). Zie README.md.
--
-- Eén simpele, vrije categorie per taak (een "mapje" zoals in Apple Notes). Geen
-- aparte tabel, geen allowlist: de categorieën ontstaan uit wat je typt, en een
-- lege waarde is gewoon "geen categorie". Zo blijft het licht — precies de
-- bedoeling: een rustige afvinklijst, geen projectadministratie.
--
-- Idempotent: opnieuw draaien is veilig.

alter table public.taken add column if not exists categorie text;

alter table public.taken drop constraint if exists taken_categorie_lengte;
alter table public.taken add constraint taken_categorie_lengte
  check (char_length(coalesce(categorie, '')) <= 120);

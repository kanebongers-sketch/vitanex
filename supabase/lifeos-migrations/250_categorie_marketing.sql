-- ─── LifeOS — Marketing als categorie/groep ─────────────────────────────────
-- Marit doet marketing/social media; er kwam een nieuwe CRM-groep "marketing" bij
-- (zie lib/lifeos/crm/crm.ts → GROEPEN/GROEP_DEFS). `crm_personen.groep` is vrije
-- tekst zonder check-constraint, dus daar hoeft niets aan de DB te veranderen.
--
-- De geleerde categorie-regels (agenda_categorie_regels) hebben WÉL een
-- check-constraint op `categorie`; die moet "marketing" toestaan, anders kan het
-- categorieën-scherm geen regel opslaan die naar Marketing wijst.
--
-- Toegepast op het lifeos-project (bbklogjersviaoocgrve); dit bestand is het
-- bijbehorende record in de repo.

alter table public.agenda_categorie_regels
  drop constraint if exists agenda_categorie_regels_categorie_geldig;

alter table public.agenda_categorie_regels
  add constraint agenda_categorie_regels_categorie_geldig
  check (categorie in ('pt_klant', 'budel_team', 'pt_team', 'management', 'marketing', 'persoonlijk', 'overig'));

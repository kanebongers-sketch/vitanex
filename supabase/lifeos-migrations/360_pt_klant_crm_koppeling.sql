-- ─── LifeOS — PT-klant ↔ CRM-klant (Kane's eigen klanten) ───────────────────
-- Kane beheert zijn eigen PT-klanten in de PT-app; zijn inplanning draait op de
-- CRM-groep pt_klant. Deze koppeling laat de app de CRM-klant bijhouden (zie
-- src/lib/lifeos/pt-dashboard/crm-sync.ts). Verdwijnt de CRM-klant, dan vervalt
-- alleen de koppeling.

alter table public.pt_klanten
  add column if not exists crm_persoon_id uuid references public.crm_personen (id) on delete set null;

create unique index if not exists pt_klanten_crm_persoon on public.pt_klanten (crm_persoon_id) where crm_persoon_id is not null;

-- ─── LifeOS — PT-app: clubmanager-rol ──────────────────────────────────────
-- Elk van de 8 clubs heeft een manager. Een clubmanager logt in met een eigen
-- pincode (zoals een PT'er, Kane keurt goed met de controlecode) en kijkt mee
-- met zijn eigen club: leads, klanten met abonnement (zonder bedragen) en de
-- prestaties per PT'er. Alleen lezen; geen omzet, geen klantdossiers
-- (gezondheidsgegevens), geen coachgesprekken. Kane voegt managers toe onder
-- Beheer; een manager is een CRM-persoon in 'management'.

alter table public.pt_lead_links
  add column if not exists club text;

alter table public.pt_lead_links drop constraint if exists pt_lead_links_club_check;
alter table public.pt_lead_links add constraint pt_lead_links_club_check check (club is null or club in
  ('budel', 'bergeijk', 'someren', 'eindhoven_boschdijk', 'eindhoven_tongelre', 'eersel', 'oisterwijk', 'bladel'));

alter table public.pt_lead_links drop constraint if exists pt_lead_links_rol_check;
alter table public.pt_lead_links add constraint pt_lead_links_rol_check check (rol in ('pt', 'eigenaar', 'beheerder', 'clubmanager'));

-- Een clubmanager hoort altijd bij precies één club.
alter table public.pt_lead_links drop constraint if exists pt_lead_links_clubmanager_club;
alter table public.pt_lead_links add constraint pt_lead_links_clubmanager_club check (rol <> 'clubmanager' or club is not null);

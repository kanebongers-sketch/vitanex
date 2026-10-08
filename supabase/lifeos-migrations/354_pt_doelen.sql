-- ─── LifeOS — PT-dashboard: doelen per PT'er ────────────────────────────────
-- Kane zet per PT'er een paar doelen; de PT'er ziet ze met voortgang op
-- /<naam>, Kane in /lifeos/pt-team. Eén rij per PT'er (persoon_id = pk).
-- Elk doel is optioneel (null = geen doel). De voortgang wordt niet opgeslagen:
-- die volgt altijd uit pt_leads en pt_klanten (src/lib/lifeos/pt-dashboard/doelen.ts).
--
--   leads_per_week      — leads gesproken deze week (ma t/m zo)
--   klanten_per_maand   — leads die klant werden, gesproken in deze kalendermaand
--   abonnementen_doel   — lopende PT-abonnementen (een stand, geen tempo)
--   notitie             — korte toelichting van Kane, zichtbaar voor de PT'er
--
-- Alleen de service-role (achter de founder-gate of de PT-sessie) leest en
-- schrijft; RLS staat aan zonder policies, net als pt_klanten.

create table if not exists public.pt_doelen (
  persoon_id uuid primary key references public.crm_personen (id) on delete cascade,
  user_id uuid not null,
  leads_per_week smallint check (leads_per_week is null or leads_per_week between 0 and 100),
  klanten_per_maand smallint check (klanten_per_maand is null or klanten_per_maand between 0 and 50),
  abonnementen_doel smallint check (abonnementen_doel is null or abonnementen_doel between 0 and 200),
  notitie text check (notitie is null or char_length(notitie) <= 300),
  bijgewerkt_op timestamptz not null default now()
);
create index if not exists pt_doelen_user on public.pt_doelen (user_id);
alter table public.pt_doelen enable row level security;

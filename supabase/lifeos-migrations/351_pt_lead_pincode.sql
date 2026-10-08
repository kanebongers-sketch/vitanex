-- ─── LifeOS — lead tracker: leesbare link + zelfgekozen pincode ─────────────
-- De link wordt gewoon mentaforce.nl/lead/<naam> (bv. /lead/joey). Omdat een naam
-- te raden is, beveiligt een pincode de leads: de PT'er kiest 'm zelf bij het
-- eerste bezoek, Kane keurt 'm goed in het dashboard (zo kan niet iemand anders
-- als eerste een pin zetten). Daarna logt de PT'er één keer per toestel in.
--
-- pin_status: geen → wacht (gekozen, nog niet goedgekeurd) → actief.
-- Brute force: na 5 foute pogingen 15 minuten dicht (`mislukt`, `geblokkeerd_tot`).

alter table public.pt_lead_links drop constraint if exists pt_lead_links_code_check;
alter table public.pt_lead_links add constraint pt_lead_links_code_check check (code ~ '^[a-z0-9-]{2,60}$');

alter table public.pt_lead_links
  add column if not exists pin_hash text,
  add column if not exists pin_status text not null default 'geen' check (pin_status in ('geen', 'wacht', 'actief')),
  add column if not exists pin_aangevraagd_op timestamptz,
  add column if not exists mislukt int not null default 0,
  add column if not exists geblokkeerd_tot timestamptz;

-- Eén rij per ingelogd toestel. Alleen de sha256 van het token staat hier; het
-- token zelf zit in een httpOnly-cookie. Pin resetten = sessies weg.
create table if not exists public.pt_lead_sessies (
  token_hash text primary key,
  persoon_id uuid not null references public.pt_lead_links (persoon_id) on delete cascade,
  verloopt_op timestamptz not null,
  aangemaakt_op timestamptz not null default now()
);
create index if not exists pt_lead_sessies_persoon on public.pt_lead_sessies (persoon_id);
alter table public.pt_lead_sessies enable row level security;

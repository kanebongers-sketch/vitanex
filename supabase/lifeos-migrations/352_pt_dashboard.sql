-- ─── LifeOS — PT-dashboard: rijkere leads + klanten met abonnement ──────────
-- De lead tracker volgt nu het model van de Excel-tracker die het team gebruikte
-- (club, bron, interesse, status, volgende stap, opvolgdatum, review/referral),
-- en elke PT'er houdt zijn PT-klanten met abonnement bij. Abonnementen en prijzen
-- komen uit "Fit Factory Personal Training Abonnementen 2026" (zie
-- src/lib/lifeos/pt-dashboard/abonnementen.ts); hier staat alleen de soort.
-- pt_leads was nog leeg toen dit liep, dus de checks mogen hard wisselen.

alter table public.pt_leads drop constraint if exists pt_leads_bron_check;
alter table public.pt_leads drop constraint if exists pt_leads_status_check;
alter table public.pt_leads drop constraint if exists pt_leads_notitie_check;
alter table public.pt_leads alter column status set default 'nieuw';
alter table public.pt_leads add constraint pt_leads_bron_check
  check (bron in ('vloer', 'proefles', 'intake', 'referral', 'social', 'mailing', 'bellen', 'walk_in', 'anders'));
alter table public.pt_leads add constraint pt_leads_status_check
  check (status in ('nieuw', 'opvolgen', 'proefles', 'intake', 'later', 'geen_interesse', 'klant'));
alter table public.pt_leads add constraint pt_leads_notitie_check
  check (notitie is null or char_length(notitie) <= 1000);

alter table public.pt_leads
  add column if not exists locatie text check (locatie is null or locatie in
    ('budel', 'bergeijk', 'someren', 'eindhoven_boschdijk', 'eindhoven_tongelre', 'eersel', 'oisterwijk', 'bladel')),
  add column if not exists interesse text check (interesse is null or interesse in ('koud', 'lauw', 'warm', 'direct', 'niet_relevant')),
  add column if not exists volgende_stap text check (volgende_stap is null or volgende_stap in
    ('bellen', 'appen', 'mailen', 'proefles_plannen', 'intake_plannen', 'later_opvolgen', 'afgesloten')),
  add column if not exists opvolgdatum date,
  add column if not exists review_gevraagd boolean not null default false,
  add column if not exists referral_gevraagd boolean not null default false,
  add column if not exists kent_iemand text check (kent_iemand is null or char_length(kent_iemand) <= 200);

create table if not exists public.pt_klanten (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  -- De PT'er (trainer) bij wie deze klant traint.
  persoon_id uuid not null references public.crm_personen (id) on delete cascade,
  lead_id uuid references public.pt_leads (id) on delete set null,
  naam text not null check (char_length(naam) between 1 and 120),
  contact text check (contact is null or char_length(contact) <= 160),
  -- Bij een duo: de tweede persoon (één rij = één abonnement = één prijs).
  duo_partner text check (duo_partner is null or char_length(duo_partner) <= 120),
  locatie text not null check (locatie in
    ('budel', 'bergeijk', 'someren', 'eindhoven_boschdijk', 'eindhoven_tongelre', 'eersel', 'oisterwijk', 'bladel')),
  abonnement text not null check (abonnement in ('1x', '2x', 'duo_1x', 'duo_2x')),
  startdatum date not null,
  status text not null default 'actief' check (status in ('actief', 'bevroren', 'opgezegd', 'gestopt')),
  opgezegd_op date,
  notitie text check (notitie is null or char_length(notitie) <= 1000),
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now()
);
create index if not exists pt_klanten_persoon on public.pt_klanten (user_id, persoon_id, startdatum desc);
alter table public.pt_klanten enable row level security;

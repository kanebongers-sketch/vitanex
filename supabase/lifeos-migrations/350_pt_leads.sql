-- ─── LifeOS — lead tracker per PT'er ────────────────────────────────────────
-- Elke PT'er krijgt een eigen, onraadbare link (mentaforce.nl/lead/<naam>-<code>)
-- waarop hij invult welke mensen hij gesproken heeft. Jij ziet het terug in het
-- wekelijkse coachgesprek. Geen inlog voor de PT'er: de code ís de sleutel, dus
-- die is willekeurig en lang genoeg om niet te raden (naam alleen zou dat wel zijn,
-- en leads zijn persoonsgegevens).
-- Alleen de service-role (RLS aan, geen policy); de publieke pagina loopt via de server.

create table if not exists public.pt_lead_links (
  persoon_id uuid primary key references public.crm_personen (id) on delete cascade,
  user_id uuid not null,
  code text not null unique check (code ~ '^[a-z0-9-]{8,80}$'),
  actief boolean not null default true,
  aangemaakt_op timestamptz not null default now()
);
alter table public.pt_lead_links enable row level security;

create table if not exists public.pt_leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  persoon_id uuid not null references public.crm_personen (id) on delete cascade,
  naam text not null check (char_length(naam) between 1 and 120),
  contact text check (contact is null or char_length(contact) <= 160),
  bron text not null check (bron in ('gym', 'social', 'via_via', 'website', 'anders')),
  status text not null default 'gesproken' check (status in ('gesproken', 'afspraak', 'proefles', 'klant', 'geen_interesse')),
  notitie text check (notitie is null or char_length(notitie) <= 500),
  gesproken_op date not null default current_date,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now()
);
create index if not exists pt_leads_persoon on public.pt_leads (user_id, persoon_id, aangemaakt_op desc);
alter table public.pt_leads enable row level security;

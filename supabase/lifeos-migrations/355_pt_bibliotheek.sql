-- ─── LifeOS — PT-app: documenten + kennisbank (Fit Factory Personal Training) ─
-- De PT'ers krijgen in hun app (mentaforce.nl/<naam>) toegang tot de documenten
-- uit de Fit Factory PT-map (protocol, intake, abonnementen, Fit Guide, PT
-- Academy, handleiding). LET OP: de code-repo is openbaar — interne documenten
-- staan daarom NOOIT in de repo of in /public, maar:
--   * de bestanden in een PRIVÉ storage-bucket `pt-documenten` (alleen service-role;
--     de app geeft na de pincode een kortlevende signed URL);
--   * de leesbare inhoud (kennisbank) in `pt_kennis` (secties als jsonb).
-- Kane beheert de documenten via LifeOS. RLS aan, geen policies.

insert into storage.buckets (id, name, public)
values ('pt-documenten', 'pt-documenten', false)
on conflict (id) do nothing;

create table if not exists public.pt_documenten (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  titel text not null check (char_length(titel) between 1 and 140),
  beschrijving text check (beschrijving is null or char_length(beschrijving) <= 400),
  categorie text not null check (categorie in ('protocollen', 'klant', 'academy', 'handleiding', 'overig')),
  -- Pad in de bucket `pt-documenten`, bv. 'protocollen/pt-protocol-2026.pdf'.
  pad text not null unique check (char_length(pad) between 3 and 300),
  mime text not null,
  grootte bigint not null check (grootte >= 0),
  volgorde int not null default 0,
  zichtbaar boolean not null default true,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now()
);
create index if not exists pt_documenten_cat on public.pt_documenten (user_id, categorie, volgorde);
alter table public.pt_documenten enable row level security;

create table if not exists public.pt_kennis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,80}$'),
  titel text not null check (char_length(titel) between 1 and 140),
  ondertitel text check (ondertitel is null or char_length(ondertitel) <= 300),
  categorie text not null check (categorie in ('protocollen', 'klant', 'academy', 'handleiding', 'overig')),
  -- Uit welk document dit komt (getoond als bron), bv. 'PT Protocol 2026'.
  bron text,
  -- Optioneel: het bijbehorende document om te openen/downloaden.
  document_id uuid references public.pt_documenten (id) on delete set null,
  volgorde int not null default 0,
  -- [{ "id": "13-weken", "kop": "…", "blokken": [{ "soort": "tekst"|"lijst"|"tabel"|"tip", … }] }]
  secties jsonb not null default '[]'::jsonb check (jsonb_typeof(secties) = 'array'),
  zichtbaar boolean not null default true,
  bijgewerkt_op timestamptz not null default now()
);
create index if not exists pt_kennis_cat on public.pt_kennis (user_id, categorie, volgorde);
alter table public.pt_kennis enable row level security;

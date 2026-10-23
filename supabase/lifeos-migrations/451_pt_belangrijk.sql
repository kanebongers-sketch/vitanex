-- ─── LifeOS — PT-app: "Belangrijk" bovenaan het startscherm van de PT'ers ───
-- Kane (beheerder) zet algemene aandachtspunten klaar die voor elke PT'er gelden
-- (bv. "Vraag om referrals", "Vraag om een recensie"). PT'ers zien de actieve
-- punten bovenaan hun startscherm en kunnen een punt als gedaan afvinken.
-- Daarnaast geven PT'ers hun kledingmaten door; zolang die ontbreken staat dat
-- als eerste punt bovenaan. Kane gebruikt de maten bij het uitgeven van kleding
-- (zie 368_pt_kleding).
--   pt_belangrijk_punten  — de algemene punten (alleen Kane beheert)
--   pt_belangrijk_gedaan  — welke PT'er welk punt heeft afgevinkt
--   pt_kledingmaten       — de maten per PT'er (bovenkleding en onderkleding)
-- Let op: pt_aandachtspunten bestaat al en is iets anders (de persoonlijke punten
-- uit coachgesprekken); daarom heten deze tabellen pt_belangrijk_*.
-- Alleen de service-role (RLS aan, geen policies), net als de andere PT-tabellen.
-- Alleen toevoegen: geen bestaande tabel verandert.

create table if not exists public.pt_belangrijk_punten (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  titel text not null check (char_length(titel) between 1 and 80),
  uitleg text check (uitleg is null or char_length(uitleg) <= 300),
  -- Optioneel: een https-link of een pad binnen de app (begint met /).
  link text check (link is null or (char_length(link) <= 500 and (link like 'https://%' or link like '/%'))),
  volgorde int not null default 0 check (volgorde between 0 and 10000),
  actief boolean not null default true,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now()
);
create index if not exists pt_belangrijk_punten_volgorde on public.pt_belangrijk_punten (user_id, volgorde);
alter table public.pt_belangrijk_punten enable row level security;

create table if not exists public.pt_belangrijk_gedaan (
  punt_id uuid not null references public.pt_belangrijk_punten (id) on delete cascade,
  persoon_id uuid not null references public.crm_personen (id) on delete cascade,
  gedaan_op timestamptz not null default now(),
  primary key (punt_id, persoon_id)
);
create index if not exists pt_belangrijk_gedaan_persoon on public.pt_belangrijk_gedaan (persoon_id);
alter table public.pt_belangrijk_gedaan enable row level security;

create table if not exists public.pt_kledingmaten (
  user_id uuid not null,
  persoon_id uuid not null references public.crm_personen (id) on delete cascade,
  -- Shirt, hoodie, jas.
  boven text not null check (char_length(boven) between 1 and 12),
  -- Short, broek.
  onder text not null check (char_length(onder) between 1 and 12),
  bijgewerkt_op timestamptz not null default now(),
  primary key (user_id, persoon_id)
);
alter table public.pt_kledingmaten enable row level security;

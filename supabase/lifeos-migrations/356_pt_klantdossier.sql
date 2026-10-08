-- ─── LifeOS — PT-dashboard: klantdossier (intake + metingen) ────────────────
-- Per PT-klant (pt_klanten, migratie 352) een digitaal intakeformulier en de
-- metingen door het 13-weekse traject heen (start, tussentijds, eind).
--
--   pt_intakes   — één rij per klant. `antwoorden` is een jsonb-object met
--                  veld-id → antwoord; welke velden er zijn, staat als data in
--                  src/lib/lifeos/pt-dashboard/intake.ts (en wordt daar gevalideerd).
--                  Bevat gezondheidsgegevens (medische screening): alleen de
--                  service-role leest/schrijft, achter de PT-sessie.
--   pt_metingen  — elke meting een rij. Velden volgen de startmeting van het
--                  intakeformulier (gewicht + omtrekmaten, cardio- en krachttest,
--                  foto's). Alles optioneel; de app vraagt minstens één waarde.
--
-- RLS staat aan zonder policies, net als pt_klanten: alleen de service-role.
-- Klant weg → dossier weg (on delete cascade).

create table if not exists public.pt_intakes (
  klant_id uuid primary key references public.pt_klanten (id) on delete cascade,
  user_id uuid not null,
  -- De PT'er (trainer) bij wie deze klant traint.
  persoon_id uuid not null references public.crm_personen (id) on delete cascade,
  antwoorden jsonb not null default '{}'::jsonb
    check (jsonb_typeof(antwoorden) = 'object' and pg_column_size(antwoorden) <= 32768),
  -- Datum van de intake (afgeleid van het antwoord "Datum intake").
  ingevuld_op date,
  bijgewerkt_op timestamptz not null default now()
);
create index if not exists pt_intakes_persoon on public.pt_intakes (user_id, persoon_id);
alter table public.pt_intakes enable row level security;

create table if not exists public.pt_metingen (
  id uuid primary key default gen_random_uuid(),
  klant_id uuid not null references public.pt_klanten (id) on delete cascade,
  user_id uuid not null,
  persoon_id uuid not null references public.crm_personen (id) on delete cascade,
  datum date not null,
  soort text not null check (soort in ('start', 'tussen', 'eind')),
  gewicht_kg numeric(5, 1) check (gewicht_kg is null or gewicht_kg between 20 and 400),
  taille_cm numeric(5, 1) check (taille_cm is null or taille_cm between 20 and 300),
  heup_cm numeric(5, 1) check (heup_cm is null or heup_cm between 20 and 300),
  borst_cm numeric(5, 1) check (borst_cm is null or borst_cm between 20 and 300),
  arm_cm numeric(5, 1) check (arm_cm is null or arm_cm between 10 and 100),
  been_cm numeric(5, 1) check (been_cm is null or been_cm between 10 and 150),
  -- eGym-cardiotest: de uitkomst zoals het toestel hem geeft (vrije notatie).
  cardiotest text check (cardiotest is null or char_length(cardiotest) <= 80),
  -- Krachttest: 1RM (ervaren) of 5RM (beginner), per oefening.
  kracht_oefening text check (kracht_oefening is null or char_length(kracht_oefening) <= 80),
  kracht_rm smallint check (kracht_rm is null or kracht_rm in (1, 5)),
  kracht_kg numeric(5, 1) check (kracht_kg is null or kracht_kg between 0 and 500),
  fotos_gemaakt boolean not null default false,
  notitie text check (notitie is null or char_length(notitie) <= 500),
  aangemaakt_op timestamptz not null default now()
);
create index if not exists pt_metingen_klant on public.pt_metingen (klant_id, datum);
create index if not exists pt_metingen_persoon on public.pt_metingen (user_id, persoon_id);
alter table public.pt_metingen enable row level security;

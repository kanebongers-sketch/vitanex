-- ─── Club: intakevragen per sportschool ─────────────────────────────────────
-- Elke sportschool (user_id) stelt haar eigen intakeformulier samen.
-- sleutel is gevuld bij een vaste vraag van Club (doelen, niveau, de
-- gezondheidsvragen ...): die vult een veld van de intake; soort en opties
-- liggen dan vast in de code (src/lib/club/intakevragen/kern.ts). sleutel null
-- is een eigen vraag; het antwoord komt in club_intakes.antwoorden.eigen, met
-- een kopie van de vraag, zodat oude intakes leesbaar blijven.
-- Ontbreken er rijen, dan geldt de standaardset uit de code.
-- gezondheid = true: alleen tonen en opslaan met toestemming van het lid (AVG).
-- Idempotent; voegt alleen toe. Alleen de server schrijft (RLS aan, geen policies).

create table if not exists public.club_intakevragen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  sleutel text,
  vraag text not null check (char_length(vraag) between 1 and 160),
  uitleg text check (uitleg is null or char_length(uitleg) <= 300),
  soort text not null check (soort in ('kort', 'lang', 'keuze', 'meerkeuze', 'ja_nee', 'schaal_1_10', 'getal')),
  opties jsonb not null default '[]'::jsonb check (jsonb_typeof(opties) = 'array'),
  verplicht boolean not null default false,
  gezondheid boolean not null default false,
  sectie text not null default 'Overig' check (char_length(sectie) between 1 and 40),
  volgorde integer not null default 0,
  actief boolean not null default true,
  demo boolean not null default false,
  aangemaakt_op timestamptz not null default now()
);

-- Een vaste vraag hooguit een keer per sportschool (null telt niet mee: eigen vragen).
create unique index if not exists club_intakevragen_sleutel on public.club_intakevragen (user_id, sleutel);
create index if not exists club_intakevragen_volgorde on public.club_intakevragen (user_id, volgorde);

alter table public.club_intakevragen enable row level security;

-- ── Demodata: Voorbeeld Gym heeft een iets andere vragenlijst ───────────────
-- Een eigen sectie Kennismaking bovenaan, twee extra leefstijlvragen en een
-- extra gezondheidsvraag. De vaste vragen vult Club zelf aan (standaardset).
-- Volgorde past tussen de standaardset (10, 20 ... 170).
insert into public.club_intakevragen (user_id, sleutel, vraag, uitleg, soort, opties, verplicht, gezondheid, sectie, volgorde, actief, demo)
select 'de000000-0000-4000-8000-0000000000c1'::uuid, null, v.vraag, v.uitleg, v.soort, v.opties::jsonb, v.verplicht, v.gezondheid, v.sectie, v.volgorde, true, true
from (values
  ('Hoe heb je ons gevonden?', 'Zo weten we welke kanalen werken.', 'keuze',
   '["Via vrienden of familie", "Instagram of Facebook", "Google", "Langsgelopen", "Via mijn werkgever", "Anders"]', true, false, 'Kennismaking', 1),
  ('Heb je eerder bij een sportschool getraind?', null, 'ja_nee', '[]', false, false, 'Kennismaking', 2),
  ('Hoe goed slaap je meestal?', '1 is heel slecht, 10 is uitstekend.', 'schaal_1_10', '[]', false, false, 'Leefstijl', 65),
  ('Wat voor werk doe je?', 'Bijvoorbeeld zittend werk, staand werk of in ploegen.', 'kort', '[]', false, false, 'Leefstijl', 66),
  ('Ben je de afgelopen zes maanden geopereerd?', null, 'ja_nee', '[]', false, true, 'Gezondheid', 175)
) as v(vraag, uitleg, soort, opties, verplicht, gezondheid, sectie, volgorde)
where not exists (
  select 1 from public.club_intakevragen q
  where q.user_id = 'de000000-0000-4000-8000-0000000000c1'::uuid and q.vraag = v.vraag
);

-- ─── LifeOS 160 — het 4-weken trainingsblok: VOORTGANG ──────────────────────
--
-- Draaien op het LIFEOS-project (bbklogjersviaoocgrve), NIET op MentaForce.
-- Zie README.md in deze map.
--
-- ─── WAAROM DIT EEN UITBREIDING IS EN GEEN NIEUWE TABELLENSET ───────────────
--
-- Het PROGRAMMA (welke sessie op welke dag, welke oefening, hoeveel sets, welke
-- rep-range, hoeveel RIR) is STATISCHE CODE-DATA. Het staat in
-- `src/lib/lifeos/blok/` en verandert alleen als Kane het blok herschrijft — niet
-- per dag, niet per gebruiker. Zo'n programma in de database zetten levert een
-- tweede bron van waarheid op die stil uit de pas gaat lopen met de code die het
-- rendert, plus een migratie voor elke tekstwijziging. Dat doen we niet.
--
-- Wat WEL in de database hoort is de VOORTGANG: welke sessie ben je begonnen,
-- welke sets heb je écht gelogd, met welk gewicht, hoe voelde het. Dat is een
-- meting, en metingen hebben we al een huis voor:
--
--   public.trainingen     — één rij per sessie (070_training)
--   public.oefening_sets  — één rij per set    (070_training)
--
-- Een `blok_sessies`/`blok_sets`-paar ernaast zou die tabellen dupliceren met
-- exact dezelfde kolommen. Gevolg: twee plekken waar een training kan staan, dus
-- twee plekken die Vita's beweging-regel (`actieve-minuten.ts`), de dagbriefing en
-- het weekoverzicht allemaal moeten kennen — en de eerste die je vergeet, liegt
-- stil ("je trainde niet"). Daarom breidt 160 de bestaande tabellen uit met drie
-- kolommen die zeggen WELKE programma-sessie een rij is, en niets meer.
--
-- Alleen Zone 2/Hyrox krijgt een eigen tabel (`blok_cardio`), en wel omdat die
-- velden (afstand, pace, hartslag, per-station-tijden) écht niet in `trainingen`
-- passen: ze zouden zes nullable kolommen toevoegen die bij 4 van de 6 sessies
-- per week altijd leeg blijven.
--
-- ─── DE REGEL DIE HIER OOK GELDT: gepland ≠ gedaan ──────────────────────────
-- 070 legde vast dat `gepland = true` een VOORNEMEN is dat geen meetvelden mag
-- dragen. `voltooid_op` is óók een meting ("hier ben ik echt mee klaar"), dus die
-- valt onder dezelfde regel — zie `trainingen_gepland_niet_voltooid` hieronder.
--
-- Idempotent: opnieuw draaien is veilig. Deze migratie verwijdert nooit een log.

-- ─── Voorwaarde: 070_training moet gedraaid zijn ────────────────────────────
-- Zonder die migratie bestaan `trainingen`/`oefening_sets` niet en faalt alles
-- hieronder met een kryptische "relation does not exist". Liever hier, met de
-- oorzaak erbij.

do $$
begin
  if not exists (
    select 1 from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relname = 'trainingen'
  ) then
    raise exception
      '160 verwacht public.trainingen (migratie 070_training). Draai 070 eerst — zie README.md.';
  end if;
  if not exists (
    select 1 from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relname = 'oefening_sets'
  ) then
    raise exception
      '160 verwacht public.oefening_sets (migratie 070_training). Draai 070 eerst — zie README.md.';
  end if;
end $$;

-- ─── 1. trainingen: welke programma-sessie is deze rij? ─────────────────────

alter table public.trainingen add column if not exists sessie_code text;
alter table public.trainingen add column if not exists blok_week   smallint;
alter table public.trainingen add column if not exists voltooid_op timestamptz;

comment on column public.trainingen.sessie_code is
  'De code van de programma-sessie (upper_a, lower_a, zone2, upper_b, lower_b, hyrox). null = losse training buiten het blok. De allowlist leeft in de code (src/lib/lifeos/blok/types.ts), niet hier: het programma mag wijzigen zonder migratie.';
comment on column public.trainingen.blok_week is
  'Welke week van het 4-weken blok (1..4). null = geen blok-sessie. Bepaalt de week-modulatie (RIR-offset, isolatievolume).';
comment on column public.trainingen.voltooid_op is
  'Wanneer de sessie is afgerond. null = nog bezig of gepland. Dit is een meting: alleen hierop mag een weekoverzicht "gedaan" claimen.';

-- Constraints los van de `add column` (en niet inline): zo krijgt ook een
-- database waar de kolom al met de hand is toegevoegd de check er alsnog bij.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'trainingen_blok_week_geldig') then
    alter table public.trainingen add constraint trainingen_blok_week_geldig
      check (blok_week is null or blok_week between 1 and 4);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'trainingen_sessie_code_lengte') then
    alter table public.trainingen add constraint trainingen_sessie_code_lengte
      check (sessie_code is null or length(btrim(sessie_code)) between 1 and 60);
  end if;

  -- Zelfde regel als trainingen_gepland_meet_niet uit 070: een voornemen draagt
  -- geen metingen, en "afgerond" is een meting. Zonder deze check kan een rij
  -- beweren dat een plan al klaar is.
  if not exists (select 1 from pg_constraint where conname = 'trainingen_gepland_niet_voltooid') then
    alter table public.trainingen add constraint trainingen_gepland_niet_voltooid
      check (gepland = false or voltooid_op is null);
  end if;
end $$;

-- "Hoe ging upper_a de vorige keer?" — de progressie-engine zoekt per sessiecode
-- door de historie. Partieel: losse trainingen (sessie_code null) horen niet in
-- deze index en maken hem alleen groter.
create index if not exists trainingen_blok_sessie_idx
  on public.trainingen (user_id, sessie_code)
  where sessie_code is not null;

-- (user_id, datum) bestaat al sinds 070 als `trainingen_user_datum_idx`. Hier
-- staat hij alleen zodat een database die 070 in een oudere vorm heeft hem toch
-- krijgt; `if not exists` maakt dit een no-op op elke normale installatie.
create index if not exists trainingen_user_datum_idx
  on public.trainingen (user_id, datum desc);

-- Eén rij per sessie per dag. Dit is wat `startSessie()` in opslag.ts idempotent
-- maakt: twee snelle kliks (of twee tabs) doen een upsert op dit sleutelpaar in
-- plaats van twee sessies aan te maken. Nulls zijn distinct in een unieke index,
-- dus losse trainingen (sessie_code null) blijven onbeperkt naast elkaar bestaan.
-- Veilig aan te leggen: `sessie_code` is nieuw, dus alle bestaande rijen hebben
-- daar null en kunnen niet botsen.
create unique index if not exists trainingen_blok_sessie_uniek
  on public.trainingen (user_id, datum, sessie_code);

-- ─── 2. oefening_sets: RIR en een notitie per set ───────────────────────────

alter table public.oefening_sets add column if not exists rir     smallint;
alter table public.oefening_sets add column if not exists notitie text;

comment on column public.oefening_sets.rir is
  'Reps in reserve: hoeveel herhalingen had je nog ín de tank. 0 = tot falen. Nullable — niet ingevuld is niet 0 (dat zou een maximale set suggereren die je niet deed).';
comment on column public.oefening_sets.notitie is
  'Vrije opmerking bij deze set ("laatste rep wankel", "band eronder"). Optioneel.';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'oefening_sets_rir_geldig') then
    alter table public.oefening_sets add constraint oefening_sets_rir_geldig
      check (rir is null or rir between 0 and 10);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'oefening_sets_notitie_lengte') then
    alter table public.oefening_sets add constraint oefening_sets_notitie_lengte
      check (notitie is null or length(notitie) <= 1000);
  end if;
end $$;

-- ── De unieke set-sleutel: geen dubbele logs ────────────────────────────────
-- De logger schrijft per set, tijdens de sessie, op een telefoon met een
-- wisselende verbinding. Zonder unieke sleutel maakt elke retry een tweede rij en
-- staat er straks "5 sets" waar je er 3 deed — een verzonnen volume, precies wat
-- dit project niet doet. Mét deze index is loggen een upsert (zie `logSet()`).
--
-- Bestaande dubbelen zouden het aanleggen laten falen. In dat geval stopt deze
-- migratie mét uitleg in plaats van logs weg te gooien: welke van twee sets de
-- echte is, weet alleen Kane.

do $$
declare
  dubbel bigint;
begin
  if exists (select 1 from pg_indexes where indexname = 'oefening_sets_set_uniek') then
    return;
  end if;

  select count(*) into dubbel
    from (
      select training_id, oefening, set_nummer
        from public.oefening_sets
       where set_nummer is not null
       group by training_id, oefening, set_nummer
      having count(*) > 1
    ) d;

  if dubbel > 0 then
    raise exception
      'oefening_sets bevat % dubbele (training_id, oefening, set_nummer)-combinatie(s). Deze migratie verwijdert geen logs: ruim ze eerst zelf op en draai 160 opnieuw.',
      dubbel;
  end if;
end $$;

create unique index if not exists oefening_sets_set_uniek
  on public.oefening_sets (training_id, oefening, set_nummer);

-- ─── 3. blok_cardio: Zone 2 en Hyrox in detail ──────────────────────────────
-- Eén rij per cardio-sessie, gekoppeld aan de `trainingen`-rij die de sessie IS.
-- Deze tabel voegt niets toe wat `trainingen` al weet (datum, soort, RPE staan
-- daar) — alleen wat je van een duurinspanning wilt terugzien.
--
-- Alles nullable behalve `soort`: wie zijn hartslag niet mat, heeft geen hartslag
-- van 0. Zelfde regel als 070/010 — geen meting = null, nooit 0.

create table if not exists public.blok_cardio (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users (id) on delete cascade,

  -- De sessie waar dit detail bij hoort. Cascade: verwijder je de training, dan
  -- verdwijnt het cardio-detail mee — een detail zonder sessie is een wees.
  training_id   uuid        references public.trainingen (id) on delete cascade,

  -- Allowlist: alleen de twee cardio-sessies van het blok. Een typfout mag hier
  -- falen bij het schrijven, niet later een sessie in een fantoom-soort parkeren.
  soort         text        not null check (soort in ('zone2', 'hyrox')),

  duur_minuten        int      check (duur_minuten is null or (duur_minuten > 0 and duur_minuten <= 1440)),
  afstand_meter       int      check (afstand_meter is null or (afstand_meter >= 0 and afstand_meter <= 1000000)),
  gem_hartslag        smallint check (gem_hartslag is null or gem_hartslag between 30 and 250),
  gem_pace_sec_per_km int      check (gem_pace_sec_per_km is null or (gem_pace_sec_per_km > 0 and gem_pace_sec_per_km <= 3600)),
  rpe                 smallint check (rpe is null or rpe between 1 and 10),

  -- Per Hyrox-station: [{naam, tijd_sec, afstand_meter, gewicht_kg, reps, rpe}].
  -- jsonb en geen aparte tabel: de stations zijn een lijst die je in z'n geheel
  -- leest en in z'n geheel overschrijft, nooit los bevraagt. Wél gegarandeerd een
  -- ARRAY — een los object hier zou de UI laten struikelen op `.map`.
  onderdelen    jsonb       check (onderdelen is null or jsonb_typeof(onderdelen) = 'array'),

  aangemaakt_op timestamptz not null default now()
);

comment on table public.blok_cardio is
  'Detail bij een Zone 2- of Hyrox-sessie uit het 4-weken blok. Eén rij per trainingen-rij. RLS: user_id = auth.uid().';
comment on column public.blok_cardio.onderdelen is
  'Hyrox-stations als jsonb-array: [{naam, tijd_sec, afstand_meter, gewicht_kg, reps, rpe}]. null bij zone2.';
comment on column public.blok_cardio.gem_hartslag is
  'Gemiddelde hartslag in slagen per minuut. Nullable: niet gemeten is niet 0.';

-- Eén cardio-detail per sessie. Dit is óók de conflict-sleutel van de upsert in
-- `bewaarCardio()`: opnieuw opslaan werkt de rij bij in plaats van er een tweede
-- naast te zetten. Niet-partieel (dus zonder `where training_id is not null`),
-- want PostgREST kan een partiële index niet als conflict-doel gebruiken; nulls
-- zijn distinct, dus een losse rij zonder sessie blijft mogelijk.
create unique index if not exists blok_cardio_training_uniek
  on public.blok_cardio (training_id);

-- De overzicht-query: alle cardio van een gebruiker, opgezocht per sessie.
create index if not exists blok_cardio_user_idx
  on public.blok_cardio (user_id, training_id);

-- RLS in de stijl van 140/150: één `for all`-policy op eigen rijen. De
-- service-role-client (zie src/lib/lifeos/admin.ts) omzeilt RLS en filtert daarom
-- ZELF op user_id — dat is de regel in elke opslag-module, niet een extra policy.
alter table public.blok_cardio enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'blok_cardio' and policyname = 'blok_cardio_eigen'
  ) then
    create policy blok_cardio_eigen on public.blok_cardio
      for all
      using (user_id = (select auth.uid()))
      with check (user_id = (select auth.uid()));
  end if;
end $$;

-- ─── 4. blok_start: wanneer begon het 4-weken blok? ────────────────────────
-- Eén rij per gebruiker met de startdatum. Zonder deze datum kan de code niet
-- weten of vandaag week 1 of week 3 is (zie blokWeekVoorDatum in programma.ts).
-- Een aparte mini-tabel i.p.v. een kolom op `profiel`: de blokstart is een
-- LifeOS-ding en `profiel` is gedeeld met MentaForce — die grens houden we scherp.

create table if not exists public.blok_start (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  start_datum  date not null,
  bijgewerkt_op timestamptz not null default now()
);

comment on table public.blok_start is
  'De startdatum van Kane''s huidige 4-weken trainingsblok (LifeOS). Eén rij per gebruiker; opnieuw beginnen = deze datum bijwerken.';

alter table public.blok_start enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'blok_start' and policyname = 'blok_start_eigen'
  ) then
    create policy blok_start_eigen on public.blok_start
      for all
      using (user_id = (select auth.uid()))
      with check (user_id = (select auth.uid()));
  end if;
end $$;

-- ─── Zelfcontrole ───────────────────────────────────────────────────────────
-- Faalt de migratie als een kolom, index, constraint of RLS ontbreekt. Beter nu
-- hard falen dan een logger die stil dubbele sets wegschrijft.

do $$
declare
  ontbreekt text;
begin
  select string_agg(v.tabel || '.' || v.kolom, ', ')
    into ontbreekt
    from (values
      ('trainingen',    'sessie_code'),
      ('trainingen',    'blok_week'),
      ('trainingen',    'voltooid_op'),
      ('oefening_sets', 'rir'),
      ('oefening_sets', 'notitie')
    ) as v(tabel, kolom)
   where not exists (
     select 1 from information_schema.columns c
      where c.table_schema = 'public'
        and c.table_name::text = v.tabel
        and c.column_name::text = v.kolom
   );

  if ontbreekt is not null then
    raise exception 'kolommen ontbreken: %', ontbreekt;
  end if;

  if not (select relrowsecurity from pg_class where relname = 'blok_cardio') then
    raise exception 'RLS staat niet aan op blok_cardio';
  end if;

  select string_agg(v.naam, ', ')
    into ontbreekt
    from (values
      ('trainingen_blok_sessie_idx'),
      ('trainingen_user_datum_idx'),
      ('trainingen_blok_sessie_uniek'),
      ('oefening_sets_set_uniek'),
      ('blok_cardio_training_uniek'),
      ('blok_cardio_user_idx')
    ) as v(naam)
   where not exists (select 1 from pg_indexes where indexname::text = v.naam);

  if ontbreekt is not null then
    raise exception 'indexen ontbreken: %', ontbreekt;
  end if;

  select string_agg(v.naam, ', ')
    into ontbreekt
    from (values
      ('trainingen_blok_week_geldig'),
      ('trainingen_sessie_code_lengte'),
      ('trainingen_gepland_niet_voltooid'),
      ('oefening_sets_rir_geldig'),
      ('oefening_sets_notitie_lengte')
    ) as v(naam)
   where not exists (select 1 from pg_constraint where conname::text = v.naam);

  if ontbreekt is not null then
    raise exception 'constraints ontbreken: %', ontbreekt;
  end if;
end $$;

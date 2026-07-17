-- ─── LifeOS 100 — Slimme taken: projecten, impact, inspanning, energie ──────
--
-- Draaien op het LIFEOS-project (bbklogjersviaoocgrve), NIET op MentaForce.
-- Zie README.md in deze map.
--
-- Bouwt de taken uit 020 uit van "titel + dag + top-3" naar een taak die genoeg
-- weet om de vraag te beantwoorden die er 's ochtends toe doet: wat doe ik nú?
--
-- ─── WAT HIER BEWUST NIET IN ZIT: een prioriteit-kolom ──────────────────────
--
--   De voor de hand liggende zet is een `prioriteit`-kolom (hoog/midden/laag).
--   Die is hier weggelaten, en dat is de belangrijkste keuze van deze migratie.
--
--   Prioriteit is geen FEIT over een taak, het is een CONCLUSIE uit vier feiten:
--   hoeveel het uitmaakt (impact), wanneer het moet (deadline), wat het kost
--   (inspanning) en of je er de energie voor hebt (energie). Sla je de conclusie
--   óók op, dan heb je twee bronnen van waarheid die gegarandeerd uit elkaar
--   lopen: je verzet de deadline en de prioriteit blijft op "laag" staan.
--
--   Daarom: de vier feiten staan hier, de prioriteit wordt berekend in
--   `src/lib/lifeos/taken/prioriteit.ts` — puur en testbaar. Verander een feit
--   en de prioriteit volgt vanzelf. (Zie ook .claude/rules/architecture.md:
--   "Geen redundante computed state — leid af uit de bron".)
--
--   Eerlijke prijs: je kunt een taak niet handmatig naar boven forceren "omdat
--   ik het zeg". Dat is met opzet — daar is de top-3 voor (020). De top-3 is
--   jouw wil, de berekende prioriteit is het advies. Twee verschillende dingen,
--   allebei zichtbaar.
--
-- Idempotent: opnieuw draaien is veilig.

-- ─── projecten ──────────────────────────────────────────────────────────────
-- Een taak zonder context is een taak die je niet plaatst. Projecten zijn de
-- lichtste vorm van context die werkt: een naam, een kleur, actief of niet.
-- Bewust GEEN status/fase/deadline op projectniveau — dat is projectmanagement,
-- en dat lost hier geen probleem op dat Kane heeft.

create table if not exists public.projecten (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users (id) on delete cascade,
  naam          text        not null,
  -- Vrije notitie: waar gaat dit project over? Voedt straks Vita's context.
  omschrijving  text,
  -- Gearchiveerd i.p.v. verwijderd: taken van een afgerond project blijven
  -- bestaan, en "wat heb ik in Q2 gedaan?" blijft beantwoordbaar.
  actief        boolean     not null default true,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now(),

  constraint projecten_naam_niet_leeg
    check (length(btrim(naam)) between 1 and 120),

  constraint projecten_omschrijving_lengte
    check (omschrijving is null or length(omschrijving) <= 2000)
);

-- Eén project per naam per gebruiker: anders krijg je stilletjes twee keer
-- "MentaForce" en verdeelt je werk zich over allebei. Case-insensitief, want
-- "mentaforce" en "MentaForce" zijn hetzelfde project.
create unique index if not exists projecten_naam_uniek
  on public.projecten (user_id, lower(btrim(naam)));

create index if not exists projecten_user_actief_idx
  on public.projecten (user_id, actief);

alter table public.projecten enable row level security;

-- Single-tenant: user_id = auth.uid(). Zie 001_fundament.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'projecten' and policyname = 'projecten_eigen'
  ) then
    create policy projecten_eigen on public.projecten
      for all
      using (user_id = (select auth.uid()))
      with check (user_id = (select auth.uid()));
  end if;
end $$;

-- ─── taken: de vier feiten ──────────────────────────────────────────────────

alter table public.taken
  -- Hoeveel maakt deze taak uit? 1 = ruis, 5 = dit verandert iets.
  -- Nullable met opzet: een taak die je net gedumpt hebt heeft nog geen oordeel,
  -- en een verzonnen 3 is erger dan geen waarde (null ≠ midden).
  add column if not exists impact smallint,

  -- Wat kost het? In minuten, want dat is wat je tegen je agenda houdt.
  add column if not exists inspanning_minuten integer,

  -- Welke energie vraagt het? Diep werk om 22:00 inplannen is de klassieke
  -- planningsfout; hiermee kan de dagplanner dat weigeren.
  add column if not exists energie text,

  -- De HARDE datum: wanneer moet dit af zijn. Los van `datum` uit 020, want dat
  -- is "voor welke dag heb ik het gepland". Die twee lopen constant uiteen — je
  -- plant iets op maandag dat vrijdag moet. Beide bewaren is geen duplicatie
  -- maar het verschil tussen voornemen en verplichting.
  add column if not exists deadline date,

  add column if not exists project_id uuid references public.projecten (id) on delete set null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'taken_impact_bereik') then
    alter table public.taken add constraint taken_impact_bereik
      check (impact is null or impact between 1 and 5);
  end if;

  -- Bovengrens 8 uur: alles daarboven is geen taak maar een project. De grens is
  -- er niet om streng te doen maar omdat de dagplanner anders een taak van
  -- "3000 minuten" netjes in een blok van 90 probeert te passen.
  if not exists (select 1 from pg_constraint where conname = 'taken_inspanning_bereik') then
    alter table public.taken add constraint taken_inspanning_bereik
      check (inspanning_minuten is null or inspanning_minuten between 1 and 480);
  end if;

  -- Allowlist, geen vrij tekstveld: een typfout ('hoogg') mag hier falen bij het
  -- schrijven i.p.v. stil door de planner genegeerd worden. Zelfde keuze als
  -- notities.soort in 050.
  if not exists (select 1 from pg_constraint where conname = 'taken_energie_geldig') then
    alter table public.taken add constraint taken_energie_geldig
      check (energie is null or energie in ('laag', 'midden', 'hoog'));
  end if;
end $$;

-- De dagplanner-query: open taken van deze gebruiker, gesorteerd op wat telt.
-- Partieel op `not klaar`, want afgevinkte taken vraagt de planner nooit op — en
-- die bak groeit oneindig.
create index if not exists taken_open_planner_idx
  on public.taken (user_id, deadline, impact desc)
  where klaar = false;

create index if not exists taken_project_idx
  on public.taken (project_id)
  where project_id is not null;

-- ─── bijgewerkt_op bijhouden ────────────────────────────────────────────────
-- Hergebruikt de trigger-functie uit 001_fundament.

do $$
begin
  if exists (select 1 from pg_proc where proname = 'zet_bijgewerkt_op')
     and not exists (
       select 1 from pg_trigger where tgname = 'projecten_bijgewerkt_op'
     ) then
    create trigger projecten_bijgewerkt_op
      before update on public.projecten
      for each row execute function public.zet_bijgewerkt_op();
  end if;
end $$;

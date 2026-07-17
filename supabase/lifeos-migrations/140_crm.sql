-- ─── LifeOS 140 — CRM: mensen managen (klanten + teams) ─────────────────────
--
-- Draaien op het LIFEOS-project (bbklogjersviaoocgrve), NIET op MentaForce.
-- Zie README.md in deze map.
--
-- Kane managet drie groepen mensen vanuit één bord:
--   pt_klant    — zijn PT-klanten: wie moet hij benaderen, wat is de status?
--   budel_team  — het team van Budel de Fitness
--   pt_team     — zijn PT-team
--
-- Elke groep is een eigen kanban: de STATUS is de kolom (de "plek" waar je een
-- tegel naartoe sleept), en `follow_up_datum` is de "dag" waarop je iemand wilt
-- benaderen. Zo dekt dit model beide dingen die Kane vroeg: slepen tussen
-- statuskolommen én iemand op een dag inplannen.
--
-- ─── WAAROM DIT IN DE LIFEOS-DB HOORT, NIET MENTAFORCE ──────────────────────
--   Dit zijn persoonsgegevens van DERDEN — klanten en teamleden, met naam,
--   telefoon, e-mail en persoonlijke notities. MentaForce belooft medewerkers van
--   klantbedrijven juist dat het hen niet kan zien (anoniem, k-anoniem). Kane's
--   CRM hoort daar niet tussen. LifeOS is single-tenant (alleen Kane) en heeft die
--   belofte niet — hier mag dit veilig staan. Zie admin.ts.
--
-- Idempotent: opnieuw draaien is veilig.

-- ─── crm_personen ───────────────────────────────────────────────────────────

create table if not exists public.crm_personen (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users (id) on delete cascade,
  naam          text        not null,

  -- Welke groep. Allowlist: een typfout ('pt_klanten') mag hier falen bij het
  -- schrijven, niet een persoon in een fantoom-tab laten verdwijnen.
  groep         text        not null,

  -- De huidige status = de kanban-kolom. De DB kent de UNIE van alle statussen
  -- (vangnet tegen een typfout die iemand in een lege kolom parkeert); WELKE
  -- status bij WELKE groep hoort, bewaakt de app (`src/lib/lifeos/crm/`). Dat is
  -- diepteverdediging met twee doelen: de DB vangt de typfout, de app vangt de
  -- combinatie "teamlid met een klant-status".
  status        text        not null,

  -- Positie binnen de kolom, voor de sleep-volgorde. Een real (geen int) zodat je
  -- een tegel TUSSEN twee andere kunt laten vallen door het gemiddelde te nemen —
  -- zonder alle andere rijen te hoeven hernummeren. De API herbalanceert als de
  -- getallen te dicht op elkaar komen.
  sortering     real        not null default 0,

  -- De "dag" waarop Kane deze persoon wil benaderen. null = niet ingepland.
  -- Los van de status: je kunt "moet benaderen" zijn zonder dag, of een dag
  -- hebben terwijl je al "benaderd" bent (opvolgmoment).
  follow_up_datum date,

  -- Contact. Alles optioneel — een teamlid heeft niet altijd een e-mail in dit
  -- systeem, en een halve rij is geen reden om 'm te weigeren.
  telefoon      text,
  email         text,

  -- Vrije notitie: de "bijzonderheden" die in de popup staan. Het lopende verhaal
  -- naast het gestructureerde historie-log hieronder.
  bijzonderheden text,

  -- Wanneer Kane deze persoon voor het laatst echt benaderde. Voedt "wie heb ik
  -- te lang niet gesproken?". null = nog nooit (of onbekend) — niet 0, niet nu.
  laatste_contact_op timestamptz,

  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now(),

  constraint crm_personen_naam_niet_leeg
    check (length(btrim(naam)) between 1 and 200),

  constraint crm_personen_groep_geldig
    check (groep in ('pt_klant', 'budel_team', 'pt_team')),

  -- De unie van alle statussen over alle groepen. De app dwingt de precieze
  -- groep↔status-regel af; dit is het vangnet tegen een kale typfout.
  constraint crm_personen_status_geldig
    check (status in (
      -- pt_klant — de uitgebreide benader-pipeline
      'moet_benaderen', 'benaderd', 'wacht_op_reactie', 'afspraak_ingepland',
      'actieve_klant', 'inactief',
      -- budel_team + pt_team — de simpelere management-flow
      'nieuw', 'actief', 'aandacht_nodig', 'gesprek_plannen'
    )),

  constraint crm_personen_bijzonderheden_lengte
    check (bijzonderheden is null or length(bijzonderheden) <= 5000),

  constraint crm_personen_telefoon_lengte
    check (telefoon is null or length(telefoon) <= 40),

  constraint crm_personen_email_lengte
    check (email is null or length(email) <= 320)
);

-- DE bord-query: alle personen van een groep, per status-kolom, op sleepvolgorde.
create index if not exists crm_personen_bord_idx
  on public.crm_personen (user_id, groep, status, sortering);

-- "Wie moet ik (binnenkort) benaderen?" — alleen de ingeplande, op datum.
create index if not exists crm_personen_followup_idx
  on public.crm_personen (user_id, follow_up_datum)
  where follow_up_datum is not null;

alter table public.crm_personen enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'crm_personen' and policyname = 'crm_personen_eigen'
  ) then
    create policy crm_personen_eigen on public.crm_personen
      for all
      using (user_id = (select auth.uid()))
      with check (user_id = (select auth.uid()));
  end if;
end $$;

-- ─── crm_historie ───────────────────────────────────────────────────────────
-- Het logboek per persoon: elke statuswissel, elk contactmoment, elke losse
-- notitie. Dit is wat de popup toont als "status-geschiedenis en bijzonderheden".
--
-- Bewust een APART log en geen kolom op de persoon: een status is één waarde (waar
-- staat 'ie nu?), maar de geschiedenis is een groeiende lijst (hoe kwam 'ie hier?).
-- Die twee in één rij proppen betekent de historie overschrijven bij elke wissel —
-- precies wat je hier NIET wilt.

create table if not exists public.crm_historie (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users (id) on delete cascade,
  persoon_id    uuid        not null references public.crm_personen (id) on delete cascade,

  -- Wat voor gebeurtenis. Allowlist.
  soort         text        not null,

  -- Bij een statuswissel: van waar naar waar. null bij andere soorten.
  van_status    text,
  naar_status   text,

  -- Vrije tekst bij de gebeurtenis ("gebeld, geen gehoor", "intake gepland voor
  -- vrijdag"). Optioneel — een kale statuswissel heeft geen tekst nodig.
  notitie       text,

  aangemaakt_op timestamptz not null default now(),

  constraint crm_historie_soort_geldig
    check (soort in ('status_wijziging', 'notitie', 'contact_gelegd', 'follow_up_gezet')),

  constraint crm_historie_notitie_lengte
    check (notitie is null or length(notitie) <= 5000),

  -- Een statuswissel zonder naar-status is geen wissel. Andersom mag een
  -- niet-wissel geen status-velden dragen — anders liegt het log over wat er
  -- gebeurde.
  constraint crm_historie_status_consistent
    check (
      (soort = 'status_wijziging' and naar_status is not null)
      or (soort <> 'status_wijziging' and van_status is null and naar_status is null)
    )
);

-- De popup-query: alle gebeurtenissen van één persoon, nieuwste eerst.
create index if not exists crm_historie_persoon_idx
  on public.crm_historie (persoon_id, aangemaakt_op desc);

alter table public.crm_historie enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'crm_historie' and policyname = 'crm_historie_eigen'
  ) then
    create policy crm_historie_eigen on public.crm_historie
      for all
      using (user_id = (select auth.uid()))
      with check (user_id = (select auth.uid()));
  end if;
end $$;

-- ─── bijgewerkt_op bijhouden ────────────────────────────────────────────────
-- Hergebruikt de trigger-functie uit 001_fundament.

do $$
begin
  if exists (select 1 from pg_proc where proname = 'zet_bijgewerkt_op')
     and not exists (
       select 1 from pg_trigger where tgname = 'crm_personen_bijgewerkt_op'
     ) then
    create trigger crm_personen_bijgewerkt_op
      before update on public.crm_personen
      for each row execute function public.zet_bijgewerkt_op();
  end if;
end $$;

-- ─── Zelfcontrole ───────────────────────────────────────────────────────────
-- Faalt de migratie als RLS niet aanstaat of een index ontbreekt (zoals de andere
-- LifeOS-migraties). Beter nu hard falen dan later een stille RLS-lek.

do $$
begin
  if not (select relrowsecurity from pg_class where relname = 'crm_personen') then
    raise exception 'RLS staat niet aan op crm_personen';
  end if;
  if not (select relrowsecurity from pg_class where relname = 'crm_historie') then
    raise exception 'RLS staat niet aan op crm_historie';
  end if;
  if not exists (select 1 from pg_indexes where indexname = 'crm_personen_bord_idx') then
    raise exception 'index crm_personen_bord_idx ontbreekt';
  end if;
  if not exists (select 1 from pg_indexes where indexname = 'crm_historie_persoon_idx') then
    raise exception 'index crm_historie_persoon_idx ontbreekt';
  end if;
end $$;

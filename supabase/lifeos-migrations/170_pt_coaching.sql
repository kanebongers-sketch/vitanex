-- ─── LifeOS 170 — PT-coaching: evaluaties per sessie ────────────────────────
--
-- Draaien op het LIFEOS-project (bbklogjersviaoocgrve), NIET op MentaForce.
-- Zie README.md in deze map.
--
-- Kane spreekt elke ~2 weken elke PT-klant. Na een sessie legt hij vast hoe het
-- met de klant gaat (drie korte scores + een notitie) en plant hij de volgende in.
-- Deze tabel is dat logboek: één rij per afgeronde coaching, gekoppeld aan de
-- CRM-persoon. Het verloop over tijd (gaat het beter/slechter?) lees je eruit.
--
-- ─── WAAROM DIT IN DE LIFEOS-DB HOORT, NIET MENTAFORCE ──────────────────────
--   Dit zijn persoonlijke observaties over DERDEN (klanten). MentaForce belooft
--   medewerkers van klantbedrijven juist anonimiteit; Kane's coaching-notities
--   horen daar niet tussen. LifeOS is single-tenant (alleen Kane). Zie admin.ts.
--
-- Idempotent: opnieuw draaien is veilig.

create table if not exists public.pt_coaching (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users (id) on delete cascade,

  -- De PT-klant. Verdwijnt de persoon uit het CRM, dan verdwijnt zijn coaching-
  -- geschiedenis mee — die hoort bij niemand anders.
  persoon_id    uuid        not null references public.crm_personen (id) on delete cascade,

  -- Drie korte scores, elk 1..5. Bewust smallint met een bereik-constraint: de DB
  -- vangt een 0 of 7 af, de app hervalideert (diepteverdediging).
  score_algemeen   smallint  not null,
  score_energie    smallint  not null,
  score_voortgang  smallint  not null,

  -- Wat besproken is, en een optioneel aandachtspunt / rode vlag. Vrije tekst,
  -- begrensd zodat een plak-ongeluk de rij niet opblaast.
  notitie          text,
  aandachtspunt    text,

  aangemaakt_op    timestamptz not null default now(),

  constraint pt_coaching_score_bereik check (
    score_algemeen  between 1 and 5 and
    score_energie   between 1 and 5 and
    score_voortgang between 1 and 5
  ),
  constraint pt_coaching_notitie_lengte      check (char_length(coalesce(notitie, '')) <= 4000),
  constraint pt_coaching_aandachtspunt_lengte check (char_length(coalesce(aandachtspunt, '')) <= 2000)
);

-- Per persoon, nieuwste eerst: precies hoe de kaart en de tijdlijn 'm lezen.
create index if not exists pt_coaching_persoon_idx
  on public.pt_coaching (persoon_id, aangemaakt_op desc);

-- RLS aan. LifeOS praat met de service-role (die RLS omzeilt achter de founder-
-- gate), maar we spiegelen de conventie: aan staan + een eigen-rij-policy, zodat
-- een per ongeluk met de anon-key benaderde tabel niets prijsgeeft.
alter table public.pt_coaching enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'pt_coaching' and policyname = 'pt_coaching_eigen'
  ) then
    create policy pt_coaching_eigen on public.pt_coaching
      for all
      using (user_id = (select auth.uid()))
      with check (user_id = (select auth.uid()));
  end if;
end $$;

-- ─── Verificatie: falen als de vorm niet klopt ──────────────────────────────
do $$
begin
  if not (select relrowsecurity from pg_class where relname = 'pt_coaching') then
    raise exception 'RLS staat niet aan op pt_coaching';
  end if;
  if not exists (select 1 from pg_indexes where indexname = 'pt_coaching_persoon_idx') then
    raise exception 'index pt_coaching_persoon_idx ontbreekt';
  end if;
end $$;

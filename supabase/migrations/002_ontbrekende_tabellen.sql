-- ================================================================
-- MentaForce – Migratie 002: alle ontbrekende tabellen
-- Voer dit uit in Supabase → SQL Editor
-- ================================================================

-- ── 1. checkins (legacy score-tabel, gelezen door dashboard/portaal) ──────

create table if not exists checkins (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  bedrijf_id    uuid,
  energie       numeric(3,1),
  slaap         numeric(3,1),
  fysiek_pijn   numeric(3,1),
  fysiek_beweging numeric(3,1),
  werkdruk      numeric(3,1),
  mentaal_focus numeric(3,1),
  mentaal_stress numeric(3,1),
  mentaal_balans numeric(3,1),
  motivatie     numeric(3,1),
  sociaal_team  numeric(3,1),
  sociaal_steun numeric(3,1),
  herstel       numeric(3,1),
  created_at    timestamptz not null default now()
);

alter table checkins enable row level security;

create policy "checkins: eigen lezen"
  on checkins for select using (auth.uid() = user_id);

create policy "checkins: eigen aanmaken"
  on checkins for insert with check (auth.uid() = user_id);

create policy "checkins: hr leest bedrijf"
  on checkins for select using (
    exists (
      select 1 from profiles hr
      join profiles mwd on mwd.id = checkins.user_id
      where hr.id = auth.uid() and hr.rol in ('hr','admin')
        and hr.bedrijf_id = mwd.bedrijf_id and hr.bedrijf_id is not null
    )
  );

create policy "checkins: admin leest alles"
  on checkins for select using (
    exists (select 1 from profiles where id = auth.uid() and rol = 'admin')
  );

create index if not exists idx_checkins_user on checkins(user_id);
create index if not exists idx_checkins_created on checkins(created_at desc);

-- ── 2. checkin_status (view voor HR dashboard) ───────────────────────────

create or replace view checkin_status as
select
  p.id,
  p.naam,
  p.bedrijf_id,
  p.avatar_url,
  coalesce((
    select true from checkins c
    where c.user_id = p.id
      and c.created_at >= date_trunc('week', now() at time zone 'Europe/Brussels')
    limit 1
  ), false) as deze_week_ingevuld,
  (
    select round(
      (coalesce(c.energie,0) + coalesce(c.slaap,0) + coalesce(c.mentaal_focus,0)
       + coalesce(c.motivatie,0) + coalesce(c.mentaal_balans,0)) / 5.0, 1)
    from checkins c where c.user_id = p.id
    order by c.created_at desc limit 1
  ) as laatste_score,
  (
    select c.created_at from checkins c where c.user_id = p.id
    order by c.created_at desc limit 1
  ) as laatste_checkin
from profiles p
where p.rol = 'medewerker';

-- ── 3. gewoonte_logs ─────────────────────────────────────────────────────

create table if not exists gewoonte_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  gewoonte   text not null,
  datum      date not null default current_date,
  unique (user_id, gewoonte, datum)
);

alter table gewoonte_logs enable row level security;

create policy "gewoonte_logs: eigen lezen"
  on gewoonte_logs for select using (auth.uid() = user_id);

create policy "gewoonte_logs: eigen aanmaken"
  on gewoonte_logs for insert with check (auth.uid() = user_id);

create policy "gewoonte_logs: eigen verwijderen"
  on gewoonte_logs for delete using (auth.uid() = user_id);

create index if not exists idx_gewoonte_logs_user_datum
  on gewoonte_logs(user_id, datum desc);

-- ── 4. journal_entries ───────────────────────────────────────────────────

create table if not exists journal_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  inhoud        text not null,
  stemming      text,
  aangemaakt_op timestamptz not null default now()
);

alter table journal_entries enable row level security;

create policy "journal: eigen lezen"
  on journal_entries for select using (auth.uid() = user_id);

create policy "journal: eigen aanmaken"
  on journal_entries for insert with check (auth.uid() = user_id);

create policy "journal: eigen verwijderen"
  on journal_entries for delete using (auth.uid() = user_id);

create index if not exists idx_journal_user on journal_entries(user_id, aangemaakt_op desc);

-- ── 5. burnout_scans ─────────────────────────────────────────────────────

create table if not exists burnout_scans (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  bedrijf_id    uuid,
  uitputting    numeric(4,1),
  cynisme       numeric(4,1),
  efficaciteit  numeric(4,1),
  risico_niveau text check (risico_niveau in ('laag','matig','hoog','kritiek')),
  aangemaakt_op timestamptz not null default now()
);

alter table burnout_scans enable row level security;

create policy "burnout: eigen lezen"
  on burnout_scans for select using (auth.uid() = user_id);

create policy "burnout: eigen aanmaken"
  on burnout_scans for insert with check (auth.uid() = user_id);

create index if not exists idx_burnout_user on burnout_scans(user_id, aangemaakt_op desc);

-- ── 6. berichten (teamchat) ───────────────────────────────────────────────

create table if not exists berichten (
  id            uuid primary key default gen_random_uuid(),
  bedrijf_id    uuid not null,
  user_id       uuid not null references auth.users(id) on delete cascade,
  inhoud        text not null,
  aangemaakt_op timestamptz not null default now()
);

alter table berichten enable row level security;

create policy "berichten: bedrijf lezen"
  on berichten for select using (
    exists (select 1 from profiles where id = auth.uid() and bedrijf_id = berichten.bedrijf_id)
  );

create policy "berichten: eigen aanmaken"
  on berichten for insert with check (
    auth.uid() = user_id and
    exists (select 1 from profiles where id = auth.uid() and bedrijf_id = berichten.bedrijf_id)
  );

create index if not exists idx_berichten_bedrijf on berichten(bedrijf_id, aangemaakt_op asc);

-- ── 7. gesprekken (DM threads) ────────────────────────────────────────────

create table if not exists gesprekken (
  id             uuid primary key default gen_random_uuid(),
  bedrijf_id     uuid not null,
  deelnemer1_id  uuid not null references auth.users(id) on delete cascade,
  deelnemer2_id  uuid not null references auth.users(id) on delete cascade,
  aangemaakt_op  timestamptz not null default now(),
  unique (deelnemer1_id, deelnemer2_id)
);

alter table gesprekken enable row level security;

create policy "gesprekken: deelnemers lezen"
  on gesprekken for select using (
    auth.uid() = deelnemer1_id or auth.uid() = deelnemer2_id
  );

create policy "gesprekken: aanmaken"
  on gesprekken for insert with check (
    auth.uid() = deelnemer1_id or auth.uid() = deelnemer2_id
  );

-- ── 8. dm_berichten ───────────────────────────────────────────────────────

create table if not exists dm_berichten (
  id            uuid primary key default gen_random_uuid(),
  gesprek_id    uuid not null references gesprekken(id) on delete cascade,
  bedrijf_id    uuid not null,
  zender_id     uuid not null references auth.users(id) on delete cascade,
  inhoud        text not null,
  aangemaakt_op timestamptz not null default now()
);

alter table dm_berichten enable row level security;

create policy "dm: deelnemers lezen"
  on dm_berichten for select using (
    exists (
      select 1 from gesprekken g
      where g.id = gesprek_id
        and (g.deelnemer1_id = auth.uid() or g.deelnemer2_id = auth.uid())
    )
  );

create policy "dm: zender aanmaken"
  on dm_berichten for insert with check (auth.uid() = zender_id);

create index if not exists idx_dm_gesprek on dm_berichten(gesprek_id, aangemaakt_op asc);

-- ── 9. feedback_hr ────────────────────────────────────────────────────────

create table if not exists feedback_hr (
  id            uuid primary key default gen_random_uuid(),
  bedrijf_id    uuid not null,
  inhoud        text not null,
  categorie     text,
  aangemaakt_op timestamptz not null default now()
);

alter table feedback_hr enable row level security;

create policy "feedback_hr: aanmaken"
  on feedback_hr for insert with check (
    exists (select 1 from profiles where id = auth.uid() and bedrijf_id = feedback_hr.bedrijf_id)
  );

create policy "feedback_hr: hr leest"
  on feedback_hr for select using (
    exists (
      select 1 from profiles
      where id = auth.uid() and rol in ('hr','admin')
        and bedrijf_id = feedback_hr.bedrijf_id
    )
  );

create index if not exists idx_feedback_bedrijf on feedback_hr(bedrijf_id, aangemaakt_op desc);

-- ── 10. pulse_surveys ─────────────────────────────────────────────────────

create table if not exists pulse_surveys (
  id              uuid primary key default gen_random_uuid(),
  bedrijf_id      uuid not null,
  aangemaakt_door uuid references auth.users(id) on delete set null,
  titel           text not null,
  vragen          jsonb not null default '[]',
  actief          boolean not null default true,
  aangemaakt_op   timestamptz not null default now()
);

alter table pulse_surveys enable row level security;

create policy "surveys: bedrijf lezen"
  on pulse_surveys for select using (
    exists (select 1 from profiles where id = auth.uid() and bedrijf_id = pulse_surveys.bedrijf_id)
  );

create policy "surveys: hr aanmaken"
  on pulse_surveys for insert with check (
    exists (select 1 from profiles where id = auth.uid() and rol in ('hr','admin')
      and bedrijf_id = pulse_surveys.bedrijf_id)
  );

create policy "surveys: hr bijwerken"
  on pulse_surveys for update using (
    exists (select 1 from profiles where id = auth.uid() and rol in ('hr','admin')
      and bedrijf_id = pulse_surveys.bedrijf_id)
  );

-- ── 11. survey_antwoorden ─────────────────────────────────────────────────

create table if not exists survey_antwoorden (
  id            uuid primary key default gen_random_uuid(),
  survey_id     uuid not null references pulse_surveys(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  antwoorden    jsonb not null default '{}',
  aangemaakt_op timestamptz not null default now(),
  unique (survey_id, user_id)
);

alter table survey_antwoorden enable row level security;

create policy "survey_antwoorden: eigen aanmaken"
  on survey_antwoorden for insert with check (auth.uid() = user_id);

create policy "survey_antwoorden: eigen lezen"
  on survey_antwoorden for select using (auth.uid() = user_id);

create policy "survey_antwoorden: hr leest anoniem"
  on survey_antwoorden for select using (
    exists (
      select 1 from pulse_surveys ps
      join profiles hr on hr.bedrijf_id = ps.bedrijf_id
      where ps.id = survey_id and hr.id = auth.uid() and hr.rol in ('hr','admin')
    )
  );

-- ── 12. uitnodiging_tokens ────────────────────────────────────────────────

create table if not exists uitnodiging_tokens (
  id              uuid primary key default gen_random_uuid(),
  bedrijf_id      uuid not null,
  email           text not null,
  token           text not null unique default encode(gen_random_bytes(24), 'hex'),
  aangemaakt_door uuid references auth.users(id) on delete set null,
  gebruikt        boolean not null default false,
  aangemaakt_op   timestamptz not null default now()
);

alter table uitnodiging_tokens enable row level security;

create policy "tokens: hr leest eigen bedrijf"
  on uitnodiging_tokens for select using (
    exists (select 1 from profiles where id = auth.uid() and rol in ('hr','admin')
      and bedrijf_id = uitnodiging_tokens.bedrijf_id)
  );

create policy "tokens: hr aanmaken"
  on uitnodiging_tokens for insert with check (
    exists (select 1 from profiles where id = auth.uid() and rol in ('hr','admin')
      and bedrijf_id = uitnodiging_tokens.bedrijf_id)
  );

create policy "tokens: hr verwijderen"
  on uitnodiging_tokens for delete using (
    exists (select 1 from profiles where id = auth.uid() and rol in ('hr','admin')
      and bedrijf_id = uitnodiging_tokens.bedrijf_id)
  );

-- Iedereen kan token opzoeken (voor uitnodigingspagina)
create policy "tokens: publiek token opzoeken"
  on uitnodiging_tokens for select using (true);

create policy "tokens: bijwerken als gebruikt"
  on uitnodiging_tokens for update using (true);

create index if not exists idx_tokens_token on uitnodiging_tokens(token);
create index if not exists idx_tokens_bedrijf on uitnodiging_tokens(bedrijf_id);

-- ── 13. Realtime inschakelen voor chat ───────────────────────────────────

alter publication supabase_realtime add table berichten;
alter publication supabase_realtime add table dm_berichten;

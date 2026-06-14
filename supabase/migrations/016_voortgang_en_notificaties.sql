-- ================================================================
-- MentaForce – Migratie 016: Voortgang tracking & notificatie prefs
-- ================================================================

-- ── 1. Notificatie voorkeuren per gebruiker ───────────────────────────────────
create table if not exists notificatie_voorkeuren (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  checkin_reminder boolean not null default true,
  stemming_reminder boolean not null default false,
  slaap_reminder   boolean not null default false,
  reminder_tijd    time not null default '08:00',
  push_token       text,
  bijgewerkt_op    timestamptz not null default now()
);

alter table notificatie_voorkeuren enable row level security;

create policy "notificatie_voorkeuren: eigen"
  on notificatie_voorkeuren for all using (auth.uid() = user_id);

-- ── 2. Focus sessions (detailleerd per sessie) ───────────────────────────────
create table if not exists focus_sessies (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  type           text not null default 'pomodoro' check (type in ('pomodoro', 'deep', 'quick', 'adem')),
  duur_minuten   int not null check (duur_minuten > 0),
  notitie        text,
  aangemaakt_op  timestamptz not null default now()
);

alter table focus_sessies enable row level security;

create policy "focus_sessies: eigen"
  on focus_sessies for all using (auth.uid() = user_id);

create index if not exists idx_focus_sessies_user_datum
  on focus_sessies(user_id, aangemaakt_op desc);

-- ── 3. Dankbaarheid logs (als die nog niet bestaat) ──────────────────────────
create table if not exists dankbaarheid_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  datum         date not null default current_date,
  items         jsonb not null default '[]'::jsonb,
  aangemaakt_op timestamptz not null default now(),
  unique (user_id, datum)
);

alter table dankbaarheid_logs enable row level security;

create policy "dankbaarheid_logs: eigen"
  on dankbaarheid_logs for all using (auth.uid() = user_id);

create index if not exists idx_dankbaarheid_logs_user_datum
  on dankbaarheid_logs(user_id, datum desc);

-- ── 4. Wellbeing weekrapporten (gecached AI-gegenereerd) ─────────────────────
create table if not exists wellbeing_weekrapporten (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  week_start    date not null,
  samenvatting  text,
  patroon       text,
  tip           text,
  score_label   text,
  stats         jsonb default '{}'::jsonb,
  aangemaakt_op timestamptz not null default now(),
  unique (user_id, week_start)
);

alter table wellbeing_weekrapporten enable row level security;

create policy "wellbeing_weekrapporten: eigen"
  on wellbeing_weekrapporten for all using (auth.uid() = user_id);

-- ── 5. Reflectie entries (wekelijkse reflectie) ──────────────────────────────
create table if not exists reflectie_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  week_start    date not null,
  antwoorden    jsonb not null default '{}'::jsonb,
  aangemaakt_op timestamptz not null default now(),
  unique (user_id, week_start)
);

alter table reflectie_entries enable row level security;

create policy "reflectie_entries: eigen"
  on reflectie_entries for all using (auth.uid() = user_id);

create index if not exists idx_reflectie_entries_user_week
  on reflectie_entries(user_id, week_start desc);

-- ── 6. Psych-veiligheid logs ──────────────────────────────────────────────────
create table if not exists psych_veiligheid_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  bedrijf_id    uuid references bedrijven(id),
  score         int not null check (score between 1 and 10),
  dimensies     jsonb default '{}'::jsonb,
  notitie       text,
  aangemaakt_op timestamptz not null default now()
);

alter table psych_veiligheid_logs enable row level security;

create policy "psych_veiligheid_logs: eigen"
  on psych_veiligheid_logs for all using (auth.uid() = user_id);

create policy "psych_veiligheid_logs: hr leest bedrijf"
  on psych_veiligheid_logs for select using (
    exists (select 1 from profiles where id = auth.uid() and rol in ('hr','admin') and bedrijf_id = psych_veiligheid_logs.bedrijf_id)
  );

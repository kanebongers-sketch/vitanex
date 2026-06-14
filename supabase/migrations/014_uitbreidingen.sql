-- ================================================================
-- MentaForce – Migratie 014: Uitbreidingen
-- Coach geheugen, burnout predictor, achievements, focus timer,
-- team uitdagingen, werkgeluk, dankbaarheid, eNPS
-- ================================================================

-- ── 1. Coach samenvattingen (persistent memory) ───────────────────────────────
create table if not exists coach_samenvattingen (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  week_start    date not null,
  samenvatting  text not null,
  inzichten     jsonb default '[]'::jsonb,
  aangemaakt_op timestamptz not null default now(),
  unique (user_id, week_start)
);

alter table coach_samenvattingen enable row level security;

create policy "coach_samenvattingen: eigen"
  on coach_samenvattingen for all using (auth.uid() = user_id);

create index if not exists idx_coach_samenvattingen_user
  on coach_samenvattingen(user_id, week_start desc);

-- ── 2. Burnout predictor scores (wekelijks berekend) ─────────────────────────
create table if not exists burnout_predictor_scores (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  week_start       date not null,
  risico_score     numeric(5,2) not null check (risico_score between 0 and 100),
  trending         text check (trending in ('stijgend', 'dalend', 'stabiel')),
  dominante_factor text,
  details          jsonb default '{}'::jsonb,
  aangemaakt_op    timestamptz not null default now(),
  unique (user_id, week_start)
);

alter table burnout_predictor_scores enable row level security;

create policy "burnout_predictor: eigen lezen"
  on burnout_predictor_scores for select using (auth.uid() = user_id);

create policy "burnout_predictor: eigen aanmaken"
  on burnout_predictor_scores for insert with check (auth.uid() = user_id);

create policy "burnout_predictor: eigen bijwerken"
  on burnout_predictor_scores for update using (auth.uid() = user_id);

create policy "burnout_predictor: hr team"
  on burnout_predictor_scores for select using (
    exists (
      select 1 from profiles hr
      join profiles mwd on mwd.id = burnout_predictor_scores.user_id
      where hr.id = auth.uid() and hr.rol in ('hr', 'admin')
        and hr.bedrijf_id = mwd.bedrijf_id and hr.bedrijf_id is not null
    )
  );

create index if not exists idx_burnout_predictor_user
  on burnout_predictor_scores(user_id, week_start desc);

-- ── 3. Achievements (badges) ──────────────────────────────────────────────────
create table if not exists achievements (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  naam         text not null,
  beschrijving text not null,
  icon         text not null,
  xp_beloning  int not null default 50,
  categorie    text check (categorie in (
    'check-in', 'coaching', 'sport', 'voeding', 'streak', 'team', 'mijlpaal'
  ))
);

alter table achievements enable row level security;

create policy "achievements: iedereen leest"
  on achievements for select using (true);

insert into achievements (slug, naam, beschrijving, icon, xp_beloning, categorie) values
  ('eerste_checkin',   'Eerste stap',        'Je eerste check-in ingevuld!',                    '🎯', 100, 'check-in'),
  ('checkin_5',        'Op weg',             '5 check-ins voltooid',                             '⭐', 150, 'check-in'),
  ('checkin_10',       'Vaste gewoonte',      '10 check-ins voltooid',                            '🏅', 250, 'check-in'),
  ('checkin_25',       'Welzijnskampioen',    '25 check-ins voltooid',                            '🏆', 500, 'check-in'),
  ('streak_3',         '3 weken op rij',      '3 opeenvolgende weken ingecheckt',                 '🔥', 200, 'streak'),
  ('streak_8',         'Maand vol',           '8 weken op rij — geweldig!',                       '💪', 400, 'streak'),
  ('streak_26',        'Half jaar!',          '26 weken op rij — een prestatie van formaat',      '🌟', 1000, 'streak'),
  ('eerste_coach',     'Eerste gesprek',      'Eerste gesprek met de AI Coach gevoerd',           '💬', 75, 'coaching'),
  ('coach_10',         'Vaste gesprekspartner','10 coach-gesprekken gevoerd',                     '🧠', 200, 'coaching'),
  ('eerste_training',  'Sportief begin',      'Eerste training gelogd',                           '💪', 100, 'sport'),
  ('training_10',      'Atleet in wording',   '10 trainingen gelogd',                             '🏋️', 300, 'sport'),
  ('score_80',         'Topvorm',             'Vitaliteitsscore van 80 of hoger behaald',         '✨', 200, 'mijlpaal'),
  ('burnout_laag',     'Veerkrachtig',        '4 weken op rij laag burn-out risico',              '🛡️', 300, 'mijlpaal'),
  ('disc_voltooid',    'Zelfinzicht',         'DISC-profiel ingevuld',                            '🎭', 100, 'mijlpaal'),
  ('dankbaarheid_7',   'Dankbaar hart',       '7 dagen dankbaarheidslogboek bijgehouden',        '🙏', 150, 'mijlpaal'),
  ('focus_100',        'Focusmeester',        '100 minuten gefocust werken gelogd',               '⏱️', 200, 'mijlpaal')
on conflict (slug) do nothing;

-- ── 4. Achievements behaald (per gebruiker) ───────────────────────────────────
create table if not exists achievements_behaald (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references achievements(id) on delete cascade,
  behaald_op     timestamptz not null default now(),
  unique (user_id, achievement_id)
);

alter table achievements_behaald enable row level security;

create policy "achievements_behaald: eigen"
  on achievements_behaald for all using (auth.uid() = user_id);

create index if not exists idx_achievements_behaald_user
  on achievements_behaald(user_id, behaald_op desc);

-- ── 5. Focus timer logs ───────────────────────────────────────────────────────
create table if not exists focus_timer_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  datum         date not null default current_date,
  duur_minuten  int not null check (duur_minuten > 0),
  type          text not null default 'pomodoro'
    check (type in ('pomodoro', 'deep_work', 'pauze', 'adem')),
  aangemaakt_op timestamptz not null default now()
);

alter table focus_timer_logs enable row level security;

create policy "focus_timer_logs: eigen"
  on focus_timer_logs for all using (auth.uid() = user_id);

create index if not exists idx_focus_timer_user_datum
  on focus_timer_logs(user_id, datum desc);

-- ── 6. Team uitdagingen ───────────────────────────────────────────────────────
create table if not exists team_uitdagingen (
  id              uuid primary key default gen_random_uuid(),
  bedrijf_id      uuid not null,
  aangemaakt_door uuid references auth.users(id) on delete set null,
  naam            text not null,
  beschrijving    text,
  type            text check (type in (
    'stappen', 'checkin', 'sport', 'voeding', 'meditatie', 'focus', 'custom'
  )),
  doel_waarde     numeric(10,2),
  eenheid         text,
  start_datum     date not null,
  eind_datum      date not null,
  actief          boolean not null default true,
  aangemaakt_op   timestamptz not null default now()
);

alter table team_uitdagingen enable row level security;

create policy "team_uitdagingen: bedrijf leest"
  on team_uitdagingen for select using (
    exists (
      select 1 from profiles where id = auth.uid()
        and bedrijf_id = team_uitdagingen.bedrijf_id
    )
  );

create policy "team_uitdagingen: hr maakt aan"
  on team_uitdagingen for insert with check (
    exists (
      select 1 from profiles where id = auth.uid()
        and rol in ('hr', 'admin')
        and bedrijf_id = team_uitdagingen.bedrijf_id
    )
  );

create policy "team_uitdagingen: hr beheert"
  on team_uitdagingen for update using (
    exists (
      select 1 from profiles where id = auth.uid()
        and rol in ('hr', 'admin')
        and bedrijf_id = team_uitdagingen.bedrijf_id
    )
  );

-- ── 7. Team uitdaging voortgang ───────────────────────────────────────────────
create table if not exists team_uitdaging_logs (
  id           uuid primary key default gen_random_uuid(),
  uitdaging_id uuid not null references team_uitdagingen(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  datum        date not null default current_date,
  waarde       numeric(10,2),
  notitie      text,
  aangemaakt_op timestamptz not null default now()
);

alter table team_uitdaging_logs enable row level security;

create policy "team_uitdaging_logs: eigen aanmaken"
  on team_uitdaging_logs for insert with check (auth.uid() = user_id);

create policy "team_uitdaging_logs: bedrijf leest"
  on team_uitdaging_logs for select using (
    exists (
      select 1 from team_uitdagingen tu
      join profiles p on p.bedrijf_id = tu.bedrijf_id
      where tu.id = uitdaging_id and p.id = auth.uid()
    )
  );

create index if not exists idx_uitdaging_logs_uitdaging
  on team_uitdaging_logs(uitdaging_id, datum desc);

-- ── 8. Dankbaarheidslogboek ───────────────────────────────────────────────────
create table if not exists dankbaarheid_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  datum         date not null default current_date,
  items         text[] not null,
  aangemaakt_op timestamptz not null default now(),
  unique (user_id, datum)
);

alter table dankbaarheid_logs enable row level security;

create policy "dankbaarheid_logs: eigen"
  on dankbaarheid_logs for all using (auth.uid() = user_id);

create index if not exists idx_dankbaarheid_user
  on dankbaarheid_logs(user_id, datum desc);

-- ── 9. Werkgeluk metingen ─────────────────────────────────────────────────────
create table if not exists werkgeluk_metingen (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  bedrijf_id      uuid,
  week_start      date not null,
  zingeving       int check (zingeving between 1 and 5),
  plezier         int check (plezier between 1 and 5),
  verbinding      int check (verbinding between 1 and 5),
  groei           int check (groei between 1 and 5),
  werkgeluk_score numeric(3,1),
  aangemaakt_op   timestamptz not null default now(),
  unique (user_id, week_start)
);

alter table werkgeluk_metingen enable row level security;

create policy "werkgeluk: eigen"
  on werkgeluk_metingen for all using (auth.uid() = user_id);

create policy "werkgeluk: hr team"
  on werkgeluk_metingen for select using (
    exists (
      select 1 from profiles hr
      join profiles mwd on mwd.id = werkgeluk_metingen.user_id
      where hr.id = auth.uid() and hr.rol in ('hr', 'admin')
        and hr.bedrijf_id = mwd.bedrijf_id and hr.bedrijf_id is not null
    )
  );

create index if not exists idx_werkgeluk_user
  on werkgeluk_metingen(user_id, week_start desc);

-- ── 10. eNPS metingen ─────────────────────────────────────────────────────────
create table if not exists enps_metingen (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  bedrijf_id    uuid not null,
  maand         text not null,
  score         int not null check (score between 0 and 10),
  reden         text,
  aangemaakt_op timestamptz not null default now(),
  unique (user_id, maand)
);

alter table enps_metingen enable row level security;

create policy "enps: eigen aanmaken"
  on enps_metingen for insert with check (auth.uid() = user_id);

create policy "enps: eigen lezen"
  on enps_metingen for select using (auth.uid() = user_id);

create policy "enps: hr leest bedrijf"
  on enps_metingen for select using (
    exists (
      select 1 from profiles where id = auth.uid()
        and rol in ('hr', 'admin')
        and bedrijf_id = enps_metingen.bedrijf_id
    )
  );

create index if not exists idx_enps_bedrijf_maand
  on enps_metingen(bedrijf_id, maand desc);

-- ── 11. Psych veiligheid metingen ─────────────────────────────────────────────
create table if not exists psych_veiligheid_metingen (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  bedrijf_id      uuid not null,
  week_start      date not null,
  vrijheid_spreken int check (vrijheid_spreken between 1 and 5),
  fouten_ok       int check (fouten_ok between 1 and 5),
  idee_delen      int check (idee_delen between 1 and 5),
  score           numeric(3,1),
  aangemaakt_op   timestamptz not null default now(),
  unique (user_id, week_start)
);

alter table psych_veiligheid_metingen enable row level security;

create policy "psych_veiligheid: eigen aanmaken"
  on psych_veiligheid_metingen for insert with check (auth.uid() = user_id);

create policy "psych_veiligheid: eigen lezen"
  on psych_veiligheid_metingen for select using (auth.uid() = user_id);

create policy "psych_veiligheid: hr leest bedrijf"
  on psych_veiligheid_metingen for select using (
    exists (
      select 1 from profiles where id = auth.uid()
        and rol in ('hr', 'admin')
        and bedrijf_id = psych_veiligheid_metingen.bedrijf_id
    )
  );

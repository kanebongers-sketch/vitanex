-- ================================================================
-- MentaForce – Migratie 015: Stress, slaap en stemming tracking
-- ================================================================

-- ── 1. Stress logs ────────────────────────────────────────────────────────────
create table if not exists stress_logs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  stress_niveau  int not null check (stress_niveau between 1 and 10),
  notitie        text,
  techniek       text check (techniek in ('box', '478', 'grounding', 'pmr')),
  aangemaakt_op  timestamptz not null default now()
);

alter table stress_logs enable row level security;

create policy "stress_logs: eigen"
  on stress_logs for all using (auth.uid() = user_id);

create index if not exists idx_stress_logs_user_datum
  on stress_logs(user_id, aangemaakt_op desc);

-- ── 2. Slaap logs ─────────────────────────────────────────────────────────────
create table if not exists slaap_logs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  datum           date not null,
  uren_slaap      numeric(3,1) not null check (uren_slaap between 0 and 24),
  kwaliteit       int check (kwaliteit between 1 and 5),
  bedtijd         time,
  wektijd         time,
  notitie         text,
  aangemaakt_op   timestamptz not null default now(),
  unique (user_id, datum)
);

alter table slaap_logs enable row level security;

create policy "slaap_logs: eigen"
  on slaap_logs for all using (auth.uid() = user_id);

create index if not exists idx_slaap_logs_user_datum
  on slaap_logs(user_id, datum desc);

-- ── 3. Groeiplannen (AI-gegenereerd persoonlijk groeiplan) ───────────────────
create table if not exists groeiplannen (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  periode_start    date not null,
  doelen           jsonb default '[]'::jsonb,
  sterke_punten    jsonb default '[]'::jsonb,
  aandachtspunten  jsonb default '[]'::jsonb,
  acties           jsonb default '[]'::jsonb,
  aangemaakt_op    timestamptz not null default now()
);

alter table groeiplannen enable row level security;

create policy "groeiplannen: eigen"
  on groeiplannen for all using (auth.uid() = user_id);

create index if not exists idx_groeiplannen_user
  on groeiplannen(user_id, aangemaakt_op desc);

-- ── 4. Stemming logs (quick daily mood) ───────────────────────────────────────
create table if not exists stemming_logs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  stemming       int not null check (stemming between 1 and 5),
  energie        int check (energie between 1 and 5),
  emoji          text,
  notitie        text,
  aangemaakt_op  timestamptz not null default now()
);

alter table stemming_logs enable row level security;

create policy "stemming_logs: eigen"
  on stemming_logs for all using (auth.uid() = user_id);

create index if not exists idx_stemming_logs_user_datum
  on stemming_logs(user_id, aangemaakt_op desc);

-- ── 5. Pulse survey vragen (HR beheert) ───────────────────────────────────────
create table if not exists pulse_survey_vragen (
  id          uuid primary key default gen_random_uuid(),
  bedrijf_id  uuid not null references bedrijven(id) on delete cascade,
  vraag       text not null,
  type        text not null check (type in ('schaal', 'tekst', 'ja_nee', 'meerkeuze')),
  opties      jsonb,
  volgorde    int not null default 0,
  actief      boolean not null default true,
  aangemaakt_op timestamptz not null default now()
);

alter table pulse_survey_vragen enable row level security;

create policy "pulse_vragen: lees bedrijf"
  on pulse_survey_vragen for select using (
    exists (select 1 from profiles where id = auth.uid() and bedrijf_id = pulse_survey_vragen.bedrijf_id)
  );

create policy "pulse_vragen: hr beheert"
  on pulse_survey_vragen for all using (
    exists (select 1 from profiles where id = auth.uid() and rol in ('hr','admin') and bedrijf_id = pulse_survey_vragen.bedrijf_id)
  );

-- ── 6. Pulse survey antwoorden ────────────────────────────────────────────────
create table if not exists pulse_survey_antwoorden (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  bedrijf_id    uuid not null references bedrijven(id) on delete cascade,
  vraag_id      uuid not null references pulse_survey_vragen(id) on delete cascade,
  antwoord      text not null,
  aangemaakt_op timestamptz not null default now()
);

alter table pulse_survey_antwoorden enable row level security;

create policy "pulse_antwoorden: eigen aanmaken"
  on pulse_survey_antwoorden for insert with check (auth.uid() = user_id);

create policy "pulse_antwoorden: eigen lezen"
  on pulse_survey_antwoorden for select using (auth.uid() = user_id);

create policy "pulse_antwoorden: hr leest anoniem via bedrijf"
  on pulse_survey_antwoorden for select using (
    exists (select 1 from profiles where id = auth.uid() and rol in ('hr','admin') and bedrijf_id = pulse_survey_antwoorden.bedrijf_id)
  );

create index if not exists idx_pulse_antwoorden_bedrijf
  on pulse_survey_antwoorden(bedrijf_id, aangemaakt_op desc);

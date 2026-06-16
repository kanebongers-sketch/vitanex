-- ═══════════════════════════════════════════════════════════
-- AI Content Operating System — Kane Bongers
-- ═══════════════════════════════════════════════════════════

-- Content pillars definitie
create table if not exists content_pillars (
  id          text primary key,
  label       text not null,
  emoji       text not null,
  kleur       text not null,
  doelgroep   text,
  problemen   text[],
  platforms   text[],
  volgorde    int default 0
);

insert into content_pillars (id, label, emoji, kleur, doelgroep, problemen, platforms, volgorde) values
  ('fitness',           'Fitness',             '💪', '#1D9E75', 'Ambitieuze ondernemers 28–45 jaar die te weinig bewegen', array['Geen tijd', 'Weet niet waar te beginnen', 'Snel opbranden', 'Motivatiegebrek'], array['Instagram','TikTok','YouTube'], 1),
  ('ondernemen',        'Ondernemen',          '🚀', '#185FA5', 'Ondernemers en freelancers die willen groeien', array['Stress door werkdruk', 'Gebrek aan systeem', 'Slechte werk-privé balans'], array['LinkedIn','Instagram'], 2),
  ('discipline',        'Discipline',          '🧱', '#0D1117', 'Professionals die consistentie willen bouwen', array['Uitstellen', 'Geen routine', 'Wilskrachtproblemen'], array['Instagram','TikTok'], 3),
  ('leefstijl',         'Leefstijl',           '🌿', '#8B5CF6', 'Mensen die duurzaam gezond willen leven', array['Slechte gewoonten', 'Slaaptekort', 'Slechte voeding'], array['Instagram','TikTok','YouTube'], 4),
  ('stressmanagement',  'Stressmanagement',    '⚡', '#E24B4A', 'Ondernemers en managers met hoge prestatiedruk', array['Burn-out risico', 'Chronische stress', 'Geen herstel'], array['LinkedIn','Instagram'], 5),
  ('performance',       'Performance',         '📈', '#BA7517', 'High performers die hun top willen bereiken', array['Energie tekort', 'Focus problemen', 'Suboptimale resultaten'], array['LinkedIn','YouTube'], 6),
  ('persoonlijke-groei','Persoonlijke Groei',  '🧠', '#1D9E75', 'Professionals die zichzelf willen ontwikkelen', array['Vastlopen', 'Identiteitsvragen', 'Gebrek aan richting'], array['Instagram','LinkedIn'], 7)
on conflict (id) do nothing;

-- Content ideas bank
create table if not exists content_ideas (
  id          uuid primary key default gen_random_uuid(),
  pillar_id   text references content_pillars(id),
  titel       text not null,
  hook        text,
  format      text check (format in ('reel','carousel','post','video','nieuwsbrief','linkedin')),
  platform    text[],
  status      text default 'idee' check (status in ('idee','gepland','opgenomen','gepubliceerd','gearchiveerd')),
  prioriteit  int default 3 check (prioriteit between 1 and 5),
  tags        text[],
  notities    text,
  aangemaakt_op timestamptz default now(),
  gepland_voor  date,
  gepubliceerd_op timestamptz
);

-- Dagelijkse briefings
create table if not exists content_briefings (
  id          uuid primary key default gen_random_uuid(),
  datum       date not null unique,
  videos      jsonb not null default '[]',
  totale_opnametijd_sec int default 0,
  gegenereerd_op timestamptz default now(),
  status      text default 'concept' check (status in ('concept','actief','voltooid'))
);

-- Video opnames tracking
create table if not exists content_opnames (
  id            uuid primary key default gen_random_uuid(),
  briefing_id   uuid references content_briefings(id),
  idea_id       uuid references content_ideas(id),
  titel         text not null,
  pillar_id     text references content_pillars(id),
  hook          text,
  script        text,
  broll         text[],
  locatie       text,
  duur_sec      int,
  platform      text[],
  status        text default 'te_filmen' check (status in ('te_filmen','gefilmd','bewerkt','gepubliceerd')),
  notities      text,
  aangemaakt_op timestamptz default now()
);

-- RLS uitschakelen voor eigen tabel (owner-only app)
alter table content_pillars    enable row level security;
alter table content_ideas      enable row level security;
alter table content_briefings  enable row level security;
alter table content_opnames    enable row level security;

create policy "Allow all for authenticated" on content_pillars    for all using (auth.role() = 'authenticated');
create policy "Allow all for authenticated" on content_ideas      for all using (auth.role() = 'authenticated');
create policy "Allow all for authenticated" on content_briefings  for all using (auth.role() = 'authenticated');
create policy "Allow all for authenticated" on content_opnames    for all using (auth.role() = 'authenticated');

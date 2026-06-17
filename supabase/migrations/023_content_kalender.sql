-- 023: content kalender — wekelijkse planner per platform
create table if not exists content_kalender (
  id              uuid primary key default gen_random_uuid(),
  week_start      date not null unique,
  instagram       jsonb not null default '[]',
  facebook        jsonb not null default '[]',
  linkedin        jsonb not null default '[]',
  groei_acties    jsonb not null default '[]',
  gegenereerd_op  timestamptz default now()
);

alter table content_kalender enable row level security;
create policy "Allow all for authenticated" on content_kalender for all using (auth.role() = 'authenticated');

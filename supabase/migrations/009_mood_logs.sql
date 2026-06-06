create table if not exists mood_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  datum date not null default current_date,
  stemming text not null check (stemming in ('moe','gestrest','ok','blij','energiek')),
  aangemaakt_op timestamptz default now(),
  unique (user_id, datum)  -- één per dag
);

alter table mood_logs enable row level security;

create policy "Users see own mood logs" on mood_logs
  for all using (auth.uid() = user_id);

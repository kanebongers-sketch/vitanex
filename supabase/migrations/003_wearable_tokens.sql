create table if not exists wearable_tokens (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  provider      text not null check (provider in ('fitbit','google_calendar')),
  access_token  text not null,
  refresh_token text,
  expires_at    timestamptz,
  scope         text,
  raw_data      jsonb,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now(),
  unique (user_id, provider)
);

alter table wearable_tokens enable row level security;

create policy "tokens: eigen lezen"
  on wearable_tokens for select using (auth.uid() = user_id);

create policy "tokens: admin alles"
  on wearable_tokens for all using (
    exists (select 1 from profiles where id = auth.uid() and rol = 'admin')
  );

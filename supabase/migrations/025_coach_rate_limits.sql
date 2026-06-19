-- Rate limiting tabel voor de AI coach
-- Slaat berichten op per gebruiker zodat de serverless rate limiter
-- niet bij elke cold start reset (in-memory Map was niet persistent)
create table if not exists public.coach_rate_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  aangemaakt_op timestamptz not null default now()
);

-- Index voor snelle queries op user_id + tijdstip
create index if not exists coach_rate_limits_user_tijd_idx
  on public.coach_rate_limits (user_id, aangemaakt_op desc);

-- RLS: gebruikers mogen niets lezen of schrijven — alleen de server (admin client) heeft toegang
alter table public.coach_rate_limits enable row level security;

-- Automatisch opruimen van rijen ouder dan 2 uur (via pg_cron als beschikbaar)
-- Anders: de query filtert al op het laatste uur, oude rijen zijn onschadelijk

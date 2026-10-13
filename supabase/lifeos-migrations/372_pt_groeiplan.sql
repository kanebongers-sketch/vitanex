-- ─── PT-app — groeiplan (meer PT-klanten) ───────────────────────────────────
-- Eén plan per account: focus, doel per club en acties per rol (zie
-- src/lib/lifeos/pt-dashboard/groeiplan.ts). Kane en de eigenaren schrijven via
-- de PT-app-API (service role); niemand anders leest of schrijft direct.

create table if not exists public.pt_groeiplan (
  user_id uuid primary key,
  plan jsonb not null,
  bijgewerkt_op timestamptz not null default now(),
  bijgewerkt_door text
);
alter table public.pt_groeiplan enable row level security;
revoke all on public.pt_groeiplan from anon, authenticated;

-- 055 — Legt vast wat in productie al bestond maar nooit in een migratie stond
-- (security-review 09-10-2026): health_native_logs en stemming_logs.datum.
-- Volledig idempotent; op de bestaande database verandert er niets.

create table if not exists public.health_native_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  datum date not null,
  stappen integer,
  slaap_minuten integer,
  hartslag_gemiddeld numeric,
  calorieen integer,
  bron text not null check (bron in ('health_connect', 'healthkit', 'google_health')),
  aangemaakt_op timestamptz not null default now()
);
create unique index if not exists health_native_logs_user_id_datum_bron_key
  on public.health_native_logs (user_id, datum, bron);
alter table public.health_native_logs enable row level security;
do $$ begin
  if not exists (select 1 from pg_policy where polrelid = 'public.health_native_logs'::regclass) then
    create policy "Eigen health logs" on public.health_native_logs
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

alter table public.stemming_logs add column if not exists datum date not null default current_date;

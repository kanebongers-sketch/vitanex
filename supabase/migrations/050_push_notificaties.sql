-- 050 — push-notificaties: apparaat-tokens, per-gebruiker voorkeuren en een
-- verzendlog (voor de daglimiet + dedup). Native-klaar (Capacitor push): het
-- platform-veld draagt ios | android | web zodat één model FCM én APNs bedient.
-- Idempotent. Toegepast op het MentaForce-project via apply_migration; repo-bron.

-- ── Apparaat-tokens ──────────────────────────────────────────────────────────
create table if not exists public.push_tokens (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  token            text not null,
  platform         text not null default 'android',
  aangemaakt_op    timestamptz not null default now(),
  laatst_gezien_op timestamptz not null default now(),
  unique (user_id, token)
);

comment on column public.push_tokens.platform is 'ios | android | web — bepaalt of de melding via APNs, FCM of web-push gaat';

create index if not exists push_tokens_user_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'push_tokens' and policyname = 'push_tokens: eigen lezen') then
    create policy "push_tokens: eigen lezen"    on public.push_tokens for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'push_tokens' and policyname = 'push_tokens: eigen aanmaken') then
    create policy "push_tokens: eigen aanmaken" on public.push_tokens for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'push_tokens' and policyname = 'push_tokens: eigen bijwerken') then
    create policy "push_tokens: eigen bijwerken" on public.push_tokens for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'push_tokens' and policyname = 'push_tokens: eigen verwijderen') then
    create policy "push_tokens: eigen verwijderen" on public.push_tokens for delete using (auth.uid() = user_id);
  end if;
end $$;

-- ── Voorkeuren (één rij per gebruiker) ───────────────────────────────────────
create table if not exists public.push_voorkeuren (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  checkin_aan      boolean not null default true,
  streak_aan       boolean not null default true,
  vita_week_aan    boolean not null default true,
  stiltetijd_start time not null default '22:00',
  stiltetijd_eind  time not null default '08:00',
  max_per_dag      smallint not null default 2,
  bijgewerkt_op    timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'push_voorkeuren_max_geldig') then
    alter table public.push_voorkeuren add constraint push_voorkeuren_max_geldig check (max_per_dag between 0 and 5);
  end if;
end $$;

alter table public.push_voorkeuren enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'push_voorkeuren' and policyname = 'push_voorkeuren: eigen lezen') then
    create policy "push_voorkeuren: eigen lezen"    on public.push_voorkeuren for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'push_voorkeuren' and policyname = 'push_voorkeuren: eigen aanmaken') then
    create policy "push_voorkeuren: eigen aanmaken" on public.push_voorkeuren for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'push_voorkeuren' and policyname = 'push_voorkeuren: eigen bijwerken') then
    create policy "push_voorkeuren: eigen bijwerken" on public.push_voorkeuren for update using (auth.uid() = user_id);
  end if;
end $$;

-- ── Verzendlog (daglimiet + dedup per type/dag) ──────────────────────────────
create table if not exists public.push_log (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  type         text not null,
  verzonden_op timestamptz not null default now(),
  datum        date not null
);

create index if not exists push_log_user_datum_idx on public.push_log (user_id, datum);

alter table public.push_log enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'push_log' and policyname = 'push_log: eigen lezen') then
    create policy "push_log: eigen lezen" on public.push_log for select using (auth.uid() = user_id);
  end if;
end $$;
-- Inserts in push_log gebeuren uitsluitend server-side via de service-role (cron).

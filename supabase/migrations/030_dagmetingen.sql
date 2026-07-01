-- ================================================================
-- MentaForce – Migratie 030: Dagmetingen (stappen per dag)
-- ================================================================
-- Bron voor /api/stappen (handmatige invoer + toekomstige health-sync).
-- Eén rij per gebruiker per dag; idempotente upsert op (user_id, datum).

create table if not exists dagmetingen (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  datum          date not null,
  stappen        int,
  bron           text,
  aangemaakt_op  timestamptz not null default now(),
  unique (user_id, datum)
);

alter table dagmetingen enable row level security;

drop policy if exists "dagmetingen: eigen" on dagmetingen;
create policy "dagmetingen: eigen"
  on dagmetingen for all using (auth.uid() = user_id);

create index if not exists idx_dagmetingen_user_datum
  on dagmetingen(user_id, datum desc);

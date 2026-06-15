-- ================================================================
-- MentaForce – Migratie 018: werkgeluk quick check
-- ================================================================

create table if not exists werkgeluk_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  score         integer not null check (score >= 1 and score <= 10),
  notitie       text,
  datum         date not null default current_date,
  aangemaakt_op timestamptz not null default now(),
  unique (user_id, datum)
);

alter table werkgeluk_logs enable row level security;

-- Medewerker kan eigen rijen lezen
create policy "werkgeluk_logs: eigen lezen"
  on werkgeluk_logs for select
  using (auth.uid() = user_id);

-- Medewerker kan eigen rijen invoegen
create policy "werkgeluk_logs: eigen invoegen"
  on werkgeluk_logs for insert
  with check (auth.uid() = user_id);

-- Medewerker kan eigen rijen bijwerken (upsert)
create policy "werkgeluk_logs: eigen bijwerken"
  on werkgeluk_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- HR/admin kan rijen van hun bedrijf lezen
create policy "werkgeluk_logs: hr leest bedrijf"
  on werkgeluk_logs for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.rol in ('hr', 'admin')
        and p.bedrijf_id = (
          select bedrijf_id from profiles where id = werkgeluk_logs.user_id limit 1
        )
    )
  );

create index if not exists idx_werkgeluk_logs_user_datum
  on werkgeluk_logs(user_id, datum desc);

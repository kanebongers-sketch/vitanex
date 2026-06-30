-- ================================================================
-- MentaForce – Migratie 028: user_xp (progressie-bron van waarheid)
-- ================================================================
-- De XP/level-voortgang werd tot nu toe alleen in localStorage bewaard en
-- ad-hoc naar een handmatig aangemaakte user_xp-tabel gesynct (zonder migratie).
-- Daardoor was voortgang niet duurzaam (reset per device / cache-clear) en
-- ontbrak de tabel op een verse database. Deze migratie zet de tabel vast als
-- versie-beheerde bron van waarheid. IF NOT EXISTS laat een bestaande
-- productie-tabel ongemoeid.

create table if not exists user_xp (
  user_id             uuid primary key references auth.users(id) on delete cascade,
  xp                  int  not null default 0 check (xp >= 0),
  checkin_count       int  not null default 0,
  goals_completed     int  not null default 0,
  streak_record       int  not null default 0,
  achievements        jsonb not null default '[]'::jsonb,
  history             jsonb not null default '[]'::jsonb,
  last_checkin_datum  date,
  last_goal_log_datum date,
  last_decay_check    date,
  bijgewerkt_op       timestamptz not null default now()
);

-- Zelfhelend: als de tabel al handmatig bestond met een afwijkende vorm, vul de
-- ontbrekende kolommen aan zodat de API-upsert nooit op een missende kolom breekt.
alter table user_xp add column if not exists xp                  int  not null default 0;
alter table user_xp add column if not exists checkin_count       int  not null default 0;
alter table user_xp add column if not exists goals_completed     int  not null default 0;
alter table user_xp add column if not exists streak_record       int  not null default 0;
alter table user_xp add column if not exists achievements        jsonb not null default '[]'::jsonb;
alter table user_xp add column if not exists history             jsonb not null default '[]'::jsonb;
alter table user_xp add column if not exists last_checkin_datum  date;
alter table user_xp add column if not exists last_goal_log_datum date;
alter table user_xp add column if not exists last_decay_check    date;
alter table user_xp add column if not exists bijgewerkt_op       timestamptz not null default now();

alter table user_xp enable row level security;

drop policy if exists "user_xp: eigen" on user_xp;

-- Een gebruiker mag uitsluitend zijn/haar eigen voortgang zien en muteren.
-- (De API leest/schrijft via de service-role en omzeilt RLS; deze policy is de
--  defensieve grens voor direct client-toegang.)
create policy "user_xp: eigen"
  on user_xp for all using (auth.uid() = user_id);

-- 048 — cardio_sessies: handmatig gelogde cardio voor de consumenten-sportapp.
-- Later ook via Apple Health / Google Health / Strava (vandaar de bron-kolom).
-- Al toegepast op het MentaForce-project via apply_migration; dit bestand is de
-- bron-van-waarheid voor de repo. Idempotent.

create table if not exists public.cardio_sessies (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references public.profiles(id) on delete cascade,
  datum         date        not null default current_date,
  soort         text        not null check (length(btrim(soort)) between 1 and 40),
  duur_minuten  int         check (duur_minuten is null or (duur_minuten > 0 and duur_minuten <= 1440)),
  afstand_meter int         check (afstand_meter is null or (afstand_meter >= 0 and afstand_meter <= 1000000)),
  gem_hartslag  smallint    check (gem_hartslag is null or gem_hartslag between 30 and 250),
  rpe           smallint    check (rpe is null or rpe between 1 and 10),
  notitie       text        check (notitie is null or length(notitie) <= 1000),
  bron          text        not null default 'handmatig',
  aangemaakt_op timestamptz not null default now()
);

comment on table public.cardio_sessies is
  'Handmatig (later gekoppeld) gelogde cardio-sessies van de consumenten-sportapp. RLS: user_id = auth.uid().';

create index if not exists cardio_sessies_user_datum_idx
  on public.cardio_sessies (user_id, datum desc);

alter table public.cardio_sessies enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'cardio_sessies' and policyname = 'cardio_sessies_eigen'
  ) then
    create policy cardio_sessies_eigen on public.cardio_sessies
      for all
      using (user_id = (select auth.uid()))
      with check (user_id = (select auth.uid()));
  end if;
end $$;

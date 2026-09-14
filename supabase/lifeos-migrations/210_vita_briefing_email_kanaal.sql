-- ─── LifeOS — vita_briefingen (met kanaal 'email') ──────────────────────────
-- De dagbriefing wordt samengevoegd met de dagplanning-mail. Die mail gebruikt
-- het per-dag-slot in `vita_briefingen` om nooit dubbel te versturen — op kanaal
-- 'email'. In dit project bestond de tabel nog niet (migratie 120 is er niet
-- toegepast), dus die maken we hier aan, meteen met beide kanalen toegestaan.
-- Dit spiegelt 120; de expliciete uitnodiging daar was: "Uitbreiden mag — bewust."

create table if not exists public.vita_briefingen (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users (id) on delete cascade,
  datum         date        not null,
  kanaal        text        not null,
  inhoud        text,
  aangemaakt_op timestamptz not null default now(),
  bezorgd_op    timestamptz,
  constraint vita_briefingen_kanaal_geldig check (kanaal in ('telegram', 'email')),
  constraint vita_briefingen_inhoud_lengte check (inhoud is null or length(inhoud) <= 8000)
);

-- Het slot: één briefing per gebruiker per dag per kanaal. Niet weghalen.
create unique index if not exists vita_briefingen_uniek
  on public.vita_briefingen (user_id, datum, kanaal);

create index if not exists vita_briefingen_bezorgd
  on public.vita_briefingen (user_id, bezorgd_op desc)
  where bezorgd_op is not null;

-- RLS: lezen mag (eigen rijen), schrijven uitsluitend server-side (service-role).
alter table public.vita_briefingen enable row level security;

drop policy if exists vita_briefingen_select_eigen on public.vita_briefingen;
create policy vita_briefingen_select_eigen on public.vita_briefingen
  for select to authenticated
  using (user_id = (select auth.uid()));

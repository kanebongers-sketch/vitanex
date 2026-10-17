-- ─── Club: sluitingsdagen, feestdagen en afwijkende openingstijden ──────────
-- Per sportschool (user_id) een dag waarop een vestiging dicht is of open met
-- andere tijden. vestiging = null geldt voor alle vestigingen; een regel voor
-- een vestiging zelf gaat voor (zie src/lib/club/sluiting/regels.ts).
-- Op een gesloten dag maakt de lesgenerator geen lessen; op een afwijkende dag
-- alleen lessen binnen de tijden. Verwijderen mag: dit is configuratie.
-- Idempotent; voegt alleen toe. Alleen de server schrijft (RLS aan, geen policies).

create table if not exists public.club_sluitingen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  vestiging text,
  datum date not null,
  soort text not null check (soort in ('gesloten', 'afwijkend')),
  open_van time,
  open_tot time,
  reden text not null check (char_length(reden) between 1 and 80),
  demo boolean not null default false,
  aangemaakt_op timestamptz not null default now(),
  constraint club_sluitingen_tijden check (
    (soort = 'gesloten' and open_van is null and open_tot is null)
    or (soort = 'afwijkend' and open_van is not null and open_tot is not null and open_tot > open_van)
  )
);

-- Een regel per dag per vestiging (of voor alle vestigingen): nooit dubbel.
create unique index if not exists club_sluitingen_uniek on public.club_sluitingen (user_id, coalesce(vestiging, ''), datum);
create index if not exists club_sluitingen_datum on public.club_sluitingen (user_id, datum);

alter table public.club_sluitingen enable row level security;

-- ── Demodata: Nederlandse feestdagen 2026 en 2027 ───────────────────────────
-- Fit Factory (alle vestigingen) en Voorbeeld Gym (alle vestigingen), plus een
-- paar regels voor een vestiging zelf om de voorrang te laten zien.
insert into public.club_sluitingen (user_id, vestiging, datum, soort, open_van, open_tot, reden, demo)
select o.user_id, null, f.datum::date, f.soort, f.van::time, f.tot::time, f.reden, true
from (values
  ('67b0a700-3f1d-425e-9646-98c237e34fd7'::uuid),
  ('de000000-0000-4000-8000-0000000000c1'::uuid)
) as o(user_id)
cross join (values
  ('2026-01-01', 'gesloten', null, null, 'Nieuwjaarsdag'),
  ('2026-04-05', 'afwijkend', '09:00', '14:00', 'Eerste Paasdag'),
  ('2026-04-06', 'afwijkend', '09:00', '14:00', 'Tweede Paasdag'),
  ('2026-04-27', 'afwijkend', '09:00', '16:00', 'Koningsdag'),
  ('2026-05-05', 'afwijkend', '08:00', '18:00', 'Bevrijdingsdag'),
  ('2026-05-14', 'afwijkend', '09:00', '14:00', 'Hemelvaartsdag'),
  ('2026-05-24', 'afwijkend', '09:00', '14:00', 'Eerste Pinksterdag'),
  ('2026-05-25', 'afwijkend', '09:00', '14:00', 'Tweede Pinksterdag'),
  ('2026-12-25', 'gesloten', null, null, 'Eerste Kerstdag'),
  ('2026-12-26', 'afwijkend', '09:00', '14:00', 'Tweede Kerstdag'),
  ('2027-01-01', 'gesloten', null, null, 'Nieuwjaarsdag'),
  ('2027-03-28', 'afwijkend', '09:00', '14:00', 'Eerste Paasdag'),
  ('2027-03-29', 'afwijkend', '09:00', '14:00', 'Tweede Paasdag'),
  ('2027-04-27', 'afwijkend', '09:00', '16:00', 'Koningsdag'),
  ('2027-05-05', 'afwijkend', '08:00', '18:00', 'Bevrijdingsdag'),
  ('2027-05-06', 'afwijkend', '09:00', '14:00', 'Hemelvaartsdag'),
  ('2027-05-16', 'afwijkend', '09:00', '14:00', 'Eerste Pinksterdag'),
  ('2027-05-17', 'afwijkend', '09:00', '14:00', 'Tweede Pinksterdag'),
  ('2027-12-25', 'gesloten', null, null, 'Eerste Kerstdag'),
  ('2027-12-26', 'afwijkend', '09:00', '14:00', 'Tweede Kerstdag')
) as f(datum, soort, van, tot, reden)
on conflict do nothing;

insert into public.club_sluitingen (user_id, vestiging, datum, soort, open_van, open_tot, reden, demo) values
  ('67b0a700-3f1d-425e-9646-98c237e34fd7', 'budel', '2026-10-21', 'afwijkend', '06:00', '14:00', 'Onderhoud kleedkamers', true),
  ('67b0a700-3f1d-425e-9646-98c237e34fd7', 'budel', '2026-12-24', 'afwijkend', '06:00', '18:00', 'Kerstavond', true),
  ('67b0a700-3f1d-425e-9646-98c237e34fd7', 'budel', '2026-12-31', 'afwijkend', '06:00', '17:00', 'Oudejaarsdag', true),
  ('de000000-0000-4000-8000-0000000000c1', 'voorbeeld-noord', '2026-10-22', 'gesloten', null, null, 'Nieuwe vloer in de groepsleszaal', true),
  ('de000000-0000-4000-8000-0000000000c1', 'voorbeeld-centrum', '2026-12-24', 'afwijkend', '07:00', '17:00', 'Kerstavond', true),
  ('de000000-0000-4000-8000-0000000000c1', 'voorbeeld-centrum', '2026-12-31', 'afwijkend', '07:00', '16:00', 'Oudejaarsdag', true)
on conflict do nothing;

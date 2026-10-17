-- ─── Club: challenges voor leden ────────────────────────────────────────────
-- Per sportschool (user_id) een challenge met een doel over een periode:
-- aantal bezoeken (check-ins), afgevinkte schema-trainingen, aanwezig bij
-- groepslessen of weken op rij met een bezoek. Voortgang en badges rekent Club
-- uit de bestaande data uit (src/lib/club/challenges/), er wordt niets extra
-- bijgehouden. Geen beloningen of prijzen: puur voortgang en erkenning.
-- vestigingen = '{}' betekent alle vestigingen. gestopt_op = vroegtijdig gestopt.
-- Inschrijven is alleen nodig als deelname = 'inschrijven' (club_challenge_deelnemers).
-- Idempotent; voegt alleen toe. Alleen de server schrijft (RLS aan, geen policies).

create table if not exists public.club_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  titel text not null check (char_length(titel) between 1 and 80),
  uitleg text check (char_length(uitleg) <= 600),
  soort text not null check (soort in ('bezoeken', 'trainingen', 'lessen', 'weken_op_rij')),
  doel int not null check (doel between 1 and 500),
  start_op date not null,
  eind_op date not null,
  vestigingen text[] not null default '{}',
  deelname text not null default 'automatisch' check (deelname in ('automatisch', 'inschrijven')),
  zichtbaar_app boolean not null default true,
  ranglijst boolean not null default false,
  gestopt_op timestamptz,
  demo boolean not null default false,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now(),
  constraint club_challenges_periode check (eind_op >= start_op and eind_op - start_op <= 366)
);
create index if not exists club_challenges_periode_idx on public.club_challenges (user_id, eind_op desc, start_op);

create table if not exists public.club_challenge_deelnemers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  challenge_id uuid not null references public.club_challenges(id) on delete cascade,
  lid_id uuid not null references public.club_leden(id) on delete cascade,
  ingeschreven_op timestamptz not null default now(),
  demo boolean not null default false
);
create unique index if not exists club_challenge_deelnemers_uniek on public.club_challenge_deelnemers (challenge_id, lid_id);
create index if not exists club_challenge_deelnemers_lid on public.club_challenge_deelnemers (user_id, lid_id);

alter table public.club_challenges enable row level security;
alter table public.club_challenge_deelnemers enable row level security;
revoke all on public.club_challenges from anon, authenticated;
revoke all on public.club_challenge_deelnemers from anon, authenticated;

-- ── Demodata ────────────────────────────────────────────────────────────────
-- Per sportschool een lopende challenge (oktober 2026), een afgelopen
-- (september 2026) en een geplande met inschrijven (november 2026).
insert into public.club_challenges (id, user_id, titel, uitleg, soort, doel, start_op, eind_op, vestigingen, deelname, zichtbaar_app, ranglijst, demo) values
  ('c4a11e00-0000-4000-8000-000000000001', '67b0a700-3f1d-425e-9646-98c237e34fd7', '12 keer trainen in oktober', 'Kom deze maand 12 keer sporten. Elke check-in telt, in welke zaal je ook traint.', 'bezoeken', 12, '2026-10-01', '2026-10-31', '{budel}', 'automatisch', true, true, true),
  ('c4a11e00-0000-4000-8000-000000000002', '67b0a700-3f1d-425e-9646-98c237e34fd7', 'Vier weken op rij', 'Sport in september elke week minstens een keer. Ritme is belangrijker dan tempo.', 'weken_op_rij', 4, '2026-09-01', '2026-09-30', '{budel}', 'automatisch', true, false, true),
  ('c4a11e00-0000-4000-8000-000000000003', '67b0a700-3f1d-425e-9646-98c237e34fd7', '6 groepslessen in november', 'Probeer in november 6 groepslessen. Schrijf je in en kies zelf welke lessen.', 'lessen', 6, '2026-11-01', '2026-11-30', '{budel}', 'inschrijven', true, true, true),
  ('c4a11e00-0000-4000-8000-000000000011', 'de000000-0000-4000-8000-0000000000c1', '12 keer trainen in oktober', 'Kom deze maand 12 keer sporten. Elke check-in telt.', 'bezoeken', 12, '2026-10-01', '2026-10-31', '{}', 'automatisch', true, true, true),
  ('c4a11e00-0000-4000-8000-000000000012', 'de000000-0000-4000-8000-0000000000c1', 'Vier weken op rij', 'Sport in september elke week minstens een keer.', 'weken_op_rij', 4, '2026-09-01', '2026-09-30', '{}', 'automatisch', true, false, true),
  ('c4a11e00-0000-4000-8000-000000000013', 'de000000-0000-4000-8000-0000000000c1', '8 keer naar Noord in november', 'Speciaal voor leden van Noord: 8 bezoeken in november. Schrijf je in om mee te doen.', 'bezoeken', 8, '2026-11-01', '2026-11-30', '{voorbeeld-noord}', 'inschrijven', true, false, true)
on conflict (id) do nothing;

-- ─── Club: leden maken zelf een voedingsplan (besluit Kane 30-10-2026) ──────
-- Een lid maakt in de ledenapp een eigen voedingsplan, met dezelfde inhoud als
-- de trainer (doel, kcal en macro's, maaltijden, adviezen). Een lid heeft nog
-- steeds een huidig plan (club_voedingsplannen, uniek op user_id en lid_id):
--   bron              wie het plan het laatst inhoudelijk bepaalde: trainer of lid.
--   voorstel          een voorstel van het lid bij een plan van de trainer
--                     (doel, kcal, macro's, adviezen, maaltijden; nooit
--                     lichaamsgegevens). De trainer neemt het over of wijst het af.
--   voorstel_op       wanneer het voorstel is gestuurd.
--   lid_toestemming_op  het lid koos uitdrukkelijk om gewicht, lengte, leeftijd
--                     en geslacht (berekening) bij het eigen plan te bewaren.
--                     Zonder toestemming bewaart de server geen berekening van het lid.
-- club_voeding_regels: per sportschool of leden het plan van de trainer mogen
-- overschrijven (standaard nee). Geen persoonsgegevens.
-- AVG: alles staat in club_voedingsplannen, dat al in de export (select *),
-- de verwijderfunctie en de bewaartermijn van een lid zit.
-- Idempotent; voegt alleen toe. Alleen de server schrijft (RLS aan, geen policies).

alter table public.club_voedingsplannen
  add column if not exists bron text not null default 'trainer',
  add column if not exists voorstel jsonb,
  add column if not exists voorstel_op timestamptz,
  add column if not exists lid_toestemming_op timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'club_voedingsplannen_bron_check') then
    alter table public.club_voedingsplannen add constraint club_voedingsplannen_bron_check check (bron in ('trainer', 'lid'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'club_voedingsplannen_voorstel_check') then
    alter table public.club_voedingsplannen add constraint club_voedingsplannen_voorstel_check check (voorstel is null or jsonb_typeof(voorstel) = 'object');
  end if;
end $$;

create index if not exists club_voedingsplannen_voorstel_idx on public.club_voedingsplannen (user_id, voorstel_op desc) where voorstel is not null;

create table if not exists public.club_voeding_regels (
  user_id uuid primary key,
  leden_overschrijven boolean not null default false,
  bijgewerkt_op timestamptz not null default now()
);

alter table public.club_voeding_regels enable row level security;
revoke all on public.club_voeding_regels from anon, authenticated;

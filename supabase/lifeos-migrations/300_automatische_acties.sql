-- ─── LifeOS — logboek van automatische acties ───────────────────────────────
-- Wat LifeOS zélf doet (status → Actieve klant, typfout in je agenda verbeteren,
-- een nieuwe PT-naam toevoegen) komt hier. Drie doelen:
--   1. Rapporteren: de ochtendmail meldt wat er de afgelopen dag automatisch ging.
--   2. Nooit twee keer: (user_id, soort, sleutel) is uniek — de insert is het slot.
--   3. Nooit terugvechten: draai jij iets terug (status terugzetten, persoon
--      verwijderen), dan staat de actie hier al en doet LifeOS het niet opnieuw.
-- Alleen de service-role schrijft/leest (RLS aan, geen policy — zoals de rest).

create table if not exists public.automatische_acties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  soort text not null check (soort in ('status_actief', 'typfout', 'persoon_toegevoegd')),
  sleutel text not null,
  omschrijving text not null,
  aangemaakt_op timestamptz not null default now(),
  unique (user_id, soort, sleutel)
);

create index if not exists automatische_acties_recent on public.automatische_acties (user_id, aangemaakt_op desc);

alter table public.automatische_acties enable row level security;

-- 054 — Ochtendmelding "Je Vandaag-kaart staat klaar" (MentaForce Vandaag-kaart).
-- Eén nieuwe voorkeur; standaard aan, net als de andere meldingen. Stiltetijd
-- en daglimiet uit 050 blijven gelden.
alter table public.push_voorkeuren
  add column if not exists vandaag_aan boolean not null default true;

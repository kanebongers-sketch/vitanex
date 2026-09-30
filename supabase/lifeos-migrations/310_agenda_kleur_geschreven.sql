-- ─── LifeOS — onthoud welke kleur LifeOS zelf op een afspraak zette ─────────
-- Elke afspraak in je persoonlijke agenda krijgt de kleur van zijn categorie
-- (lib/lifeos/agenda/kleur.ts). Staat er een kleur op die LifeOS níet schreef,
-- dan is dat jouw keuze en blijft hij. Daarvoor onthouden we per afspraak wat
-- LifeOS zelf zette.
alter table public.agenda_events add column if not exists kleur_geschreven text;

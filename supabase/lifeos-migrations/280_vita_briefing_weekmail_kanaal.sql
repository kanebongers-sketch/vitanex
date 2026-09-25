-- ─── LifeOS — weekmail krijgt een eigen per-dag-slot ────────────────────────
-- De weekmail had bewust GEEN claim: er was één trigger (GitHub-workflow), dus
-- geen race. Met de database-klok (migratie 270) is er een tweede trigger bij —
-- zonder slot zou je maandag twee weekmails krijgen. De route claimt nu, net als
-- de dagmail, één verzending per dag in vita_briefingen, op kanaal 'weekmail'.
-- Daarvoor moet het check-constraint dat kanaal kennen.
--
-- Toegepast op het lifeos-project (bbklogjersviaoocgrve); dit is het record.

alter table public.vita_briefingen drop constraint if exists vita_briefingen_kanaal_geldig;
alter table public.vita_briefingen
  add constraint vita_briefingen_kanaal_geldig check (kanaal in ('telegram', 'email', 'weekmail'));

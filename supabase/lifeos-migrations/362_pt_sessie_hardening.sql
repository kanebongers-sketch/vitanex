-- ─── LifeOS — PT-app: pincode en sessies harder dichtgezet ──────────────────
-- Hoort bij src/lib/lifeos/leads/links.ts + pin.ts. Toepassen VÓÓR de deploy
-- van die code: de code leest `blokkades` en `laatst_gebruikt_op`.
--
-- 1. `blokkades`: hoe vaak een link achter elkaar geblokkeerd raakte. Elke
--    blokkade duurt twee keer zo lang (15 → 30 → … → 480 min); na de zesde gaat
--    de link dicht tot Kane de pincode reset. Zo zijn hooguit 30 foute pins
--    mogelijk (0,003% van de 6-cijferige ruimte) in plaats van 480 per dag.
-- 2. `laatst_gebruikt_op`: een toestel dat 30 dagen niet geopend is, moet
--    opnieuw inloggen (gestolen/vergeten telefoon). De code werkt het hooguit
--    één keer per uur bij.
-- 3. Verlopen sessies worden 's nachts opgeruimd (pg_cron, zie migratie 270);
--    de code ruimt bij elke login ook per persoon op en houdt hooguit 8 toestellen.

alter table public.pt_lead_links
  add column if not exists blokkades int not null default 0 check (blokkades >= 0);

alter table public.pt_lead_sessies
  add column if not exists laatst_gebruikt_op timestamptz not null default now();

create index if not exists pt_lead_sessies_verloopt on public.pt_lead_sessies (verloopt_op);

-- Nachtelijke opruiming; `cron.schedule` op naam is idempotent (werkt een
-- bestaande job bij), net als de jobs in migratie 270.
select cron.schedule(
  'pt-sessies-opruimen',
  '20 4 * * *',
  $$delete from public.pt_lead_sessies where verloopt_op < now() or laatst_gebruikt_op < now() - interval '30 days'$$
);

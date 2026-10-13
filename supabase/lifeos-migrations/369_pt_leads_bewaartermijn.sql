-- ─── LifeOS — PT-app: bewaartermijn voor leads (AVG) ───────────────────────
-- Persoonsgegevens niet langer bewaren dan nodig: een lead met status
-- "geen interesse" die 12 maanden niet is bijgewerkt, wordt automatisch
-- verwijderd. Leads die nog lopen of klant werden blijven staan. Dagelijks om
-- 04:40 UTC, naast pt-sessies-opruimen (migratie 362). Een gekoppelde klant
-- verliest alleen de verwijzing (pt_klanten.lead_id: on delete set null).

do $$
begin
  if exists (select 1 from cron.job where jobname = 'pt-leads-bewaartermijn') then
    perform cron.unschedule('pt-leads-bewaartermijn');
  end if;
end $$;

select cron.schedule(
  'pt-leads-bewaartermijn',
  '40 4 * * *',
  $$delete from public.pt_leads where status = 'geen_interesse' and bijgewerkt_op < now() - interval '12 months'$$
);

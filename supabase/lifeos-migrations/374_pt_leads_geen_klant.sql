-- ─── PT-app — lead: "Geen klant geworden" ───────────────────────────────────
-- Naast "Geen interesse" (haakte meteen af) een eigen status voor wie wel een
-- intake of proefles had, maar niet instapte, met een optionele reden. Valt
-- onder dezelfde bewaartermijn (12 maanden niet bijgewerkt → weg, AVG).

alter table public.pt_leads drop constraint if exists pt_leads_status_check;
alter table public.pt_leads add constraint pt_leads_status_check
  check (status in ('nieuw', 'opvolgen', 'proefles', 'intake', 'later', 'geen_interesse', 'geen_klant', 'klant'));

alter table public.pt_leads add column if not exists geen_klant_reden text
  check (geen_klant_reden is null or geen_klant_reden in ('te_duur', 'geen_tijd', 'zelf_trainen', 'elders', 'anders'));

do $$
begin
  if exists (select 1 from cron.job where jobname = 'pt-leads-bewaartermijn') then
    perform cron.unschedule('pt-leads-bewaartermijn');
  end if;
end $$;

select cron.schedule(
  'pt-leads-bewaartermijn',
  '40 4 * * *',
  $$delete from public.pt_leads where status in ('geen_interesse', 'geen_klant') and bijgewerkt_op < now() - interval '12 months'$$
);

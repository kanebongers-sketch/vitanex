-- ─── LifeOS — PT-app: wekelijkse clubmail per clubmanager ──────────────────
-- Elke maandag een samenvatting van de club(s) naar de clubmanager (alleen
-- aantallen, geen namen van leads/klanten). Verstuurt alleen als er een
-- afzender is ingesteld (PT_MAIL_VAN, een in Resend geverifieerd domein) en de
-- manager een e-mailadres heeft (crm_personen.email).
-- pt_clubmail: één rij per manager per week = het slot tegen dubbel versturen.

create table if not exists public.pt_clubmail (
  persoon_id uuid not null references public.crm_personen (id) on delete cascade,
  week date not null,
  verzonden_op timestamptz not null default now(),
  primary key (persoon_id, week)
);
alter table public.pt_clubmail enable row level security;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'pt-clubmail') then
    perform cron.unschedule('pt-clubmail');
  end if;
end $$;

-- Maandag 06:30 UTC (08:30 NL zomertijd, 07:30 wintertijd), via de LifeOS-klok.
select cron.schedule('pt-clubmail', '30 6 * * 1', $$select lifeos_klok.roep('/api/cron/pt-clubmail')$$);

-- 488: AI Your Gym, de crons van Club en AI Your Gym vanuit de database. Alleen toevoegen, idempotent.
-- Uitgevoerd door Claude op 02-11-2026 (toestemming Kane: aanvullende migraties voor Club).
--
-- Mail, meldingen en de staffel werkten niet: de routes /api/aiyourgym/cron/*
-- stonden nergens ingepland (bedoeld was cron-job.org, nooit ingesteld). Net als
-- lifeos_klok (fitfactorypt.nl) roept ayg_klok nu aiyourgym.com aan, met het
-- geheim in een kop (x-cron-secret), nooit in de URL.
-- Geheim: eerst vault 'club_cron_secret' (zet die als CLUB_CRON_SECRET in Render
-- staat), anders 'lifeos_cron_secret' (= CRON_SECRET; de club-crons accepteren
-- dat zolang CLUB_CRON_SECRET leeg is, src/lib/club/kern/cron-geheim.ts).
-- Elke route doet niets zolang zijn eigen schakelaar of sleutel ontbreekt, en
-- dubbel draaien (ook naast cron-job.org) verstuurt nooit dubbel.
-- Terugdraaien: select cron.unschedule(jobname) from cron.job where jobname like 'ayg-%';
--               drop schema ayg_klok cascade;

create schema if not exists ayg_klok;
revoke all on schema ayg_klok from public;

create or replace function ayg_klok.roep(pad text)
returns bigint
language plpgsql
security definer
set search_path to ''
as $$
declare
  geheim text;
begin
  if pad !~ '^/api/aiyourgym/cron/[a-z-]+$' then
    raise exception 'ayg_klok.roep: onbekend pad %', pad;
  end if;
  select s.decrypted_secret into geheim from vault.decrypted_secrets s where s.name = 'club_cron_secret';
  if geheim is null then
    select s.decrypted_secret into geheim from vault.decrypted_secrets s where s.name = 'lifeos_cron_secret';
  end if;
  if geheim is null then
    raise notice 'ayg_klok: geen cron-geheim in de vault; % overgeslagen', pad;
    return null;
  end if;
  return net.http_get(
    url := 'https://aiyourgym.com' || pad,
    headers := jsonb_build_object('x-cron-secret', geheim),
    timeout_milliseconds := 60000
  );
end;
$$;

revoke all on function ayg_klok.roep(text) from public;

do $$
declare
  taak record;
begin
  for taak in
    select * from (values
      ('ayg-club-meldingen', '*/5 * * * *', '/api/aiyourgym/cron/club-meldingen'),
      ('ayg-club-inbox', '*/2 * * * *', '/api/aiyourgym/cron/club-inbox'),
      ('ayg-club-outbox', '1-59/2 * * * *', '/api/aiyourgym/cron/club-outbox'),
      ('ayg-staffel', '10 2 * * *', '/api/aiyourgym/cron/staffel'),
      ('ayg-proefmails', '13 8 * * *', '/api/aiyourgym/cron/proefmails')
    ) as t(naam, wanneer, pad)
  loop
    if exists (select 1 from cron.job where jobname = taak.naam) then
      perform cron.unschedule(taak.naam);
    end if;
    perform cron.schedule(taak.naam, taak.wanneer, format('select ayg_klok.roep(%L)', taak.pad));
  end loop;
end
$$;

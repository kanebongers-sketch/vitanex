-- ─── LifeOS — klok (pg_cron) roept fitfactorypt.nl aan ──────────────────────
-- mentaforce.nl staat uit (domein weggehaald in Render); dezelfde app draait
-- onder fitfactorypt.nl. Zonder deze wijziging faalde elke klokaanroep
-- (dagplanning, agenda-sync, weekmail, keep-alive) met "SSL connect error".
-- Alleen de URL wijzigt; geheim, kop en time-out blijven gelijk aan migratie 270.

create or replace function lifeos_klok.roep(pad text, met_geheim boolean default true)
returns bigint
language plpgsql
set search_path = ''
as $$
declare
  geheim text;
  kop jsonb := '{}'::jsonb;
begin
  if met_geheim then
    select s.decrypted_secret into geheim
    from vault.decrypted_secrets s
    where s.name = 'lifeos_cron_secret'
    limit 1;
    if geheim is null then
      raise notice 'lifeos_cron_secret ontbreekt in Vault; % overgeslagen', pad;
      return null;
    end if;
    kop := jsonb_build_object('x-cron-secret', geheim);
  end if;
  return net.http_get(
    url := 'https://fitfactorypt.nl' || pad,
    headers := kop,
    timeout_milliseconds := 60000
  );
end;
$$;

-- ─── LifeOS — de klok in de database (pg_cron + pg_net) ────────────────────
-- WAAROM: GitHub Actions-cron bleek geen klok. De "ochtendmail" (schema 05:00
-- UTC) werd in de praktijk elke dag rond 11:45 NL bezorgd — GitHub vuurde de
-- geplande tikken uren te laat af en liet de meeste vallen (± 1 van de 8 per
-- dag). Gemeten in vita_briefingen.bezorgd_op, sept 2026. De agenda-sync (elke
-- 30 min bedoeld) liep ± 4× per dag.
--
-- HOE: de database roept de cron-routes zelf aan op de minuut, via pg_cron
-- (planning) + pg_net (HTTP). Het gedeelde CRON_SECRET staat NIET in code of in
-- deze migratie maar in Supabase Vault onder de naam `lifeos_cron_secret`
-- (Dashboard → Project Settings → Vault). Ontbreekt het geheim, dan slaat
-- `lifeos_klok.roep` de aanroep over (NOTICE) — veilig, geen half werk.
--
-- De GitHub-workflows blijven als back-up staan. Dubbel aanroepen kan geen kwaad:
-- de dagmail claimt één verzending per dag (vita_briefingen), de weekmail idem,
-- en een agenda-sync is idempotent.
--
-- Tijden in UTC (pg_cron): 05:00 UTC = 07:00 NL zomer / 06:00 winter.
-- Toegepast op het lifeos-project (bbklogjersviaoocgrve); dit is het record.

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

-- Eigen schema, niet via PostgREST bereikbaar.
create schema if not exists lifeos_klok;
revoke all on schema lifeos_klok from public, anon, authenticated;

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
  -- 60s: de dagmail leest agenda + inbox + 8 weken PT-historie en mailt; ruim
  -- boven de 5s pg_net-standaard.
  return net.http_get(
    url := 'https://mentaforce.nl' || pad,
    headers := kop,
    timeout_milliseconds := 60000
  );
end;
$$;

revoke all on function lifeos_klok.roep(text, boolean) from public, anon, authenticated;

-- De dagmail + één herkansing (bv. als de app net wakker werd); de claim zorgt
-- dat er hooguit één mail per dag uitgaat.
select cron.schedule('lifeos-dagplanning', '0 5 * * 1-5', $$select lifeos_klok.roep('/api/cron/dagplanning-mail')$$);
select cron.schedule('lifeos-dagplanning-herkans', '30 5 * * 1-5', $$select lifeos_klok.roep('/api/cron/dagplanning-mail')$$);
select cron.schedule('lifeos-agenda-sync', '0,30 5-21 * * *', $$select lifeos_klok.roep('/api/cron/lifeos-agenda-sync')$$);
select cron.schedule('lifeos-weekmail', '0 6 * * 1', $$select lifeos_klok.roep('/api/cron/lifeos-weekmail')$$);
-- Keep-alive heeft geen geheim nodig: houdt de app wakker zodat de 05:00-mail
-- niet op een koude start stukloopt.
select cron.schedule('lifeos-keepalive', '*/10 * * * *', $$select lifeos_klok.roep('/api/ping', false)$$);

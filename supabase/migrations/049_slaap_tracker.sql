-- 049 — slaap tracker-klaar: slaap_logs krijgt bron + tracker-velden (slaapfasen,
-- efficiëntie, keren wakker, hartslag/HRV) + 'uitgerust'; slaapdoel op profiles.
-- Al toegepast op het MentaForce-project via apply_migration; dit is de repo-bron.
-- Idempotent. Alles nullable — handmatig vult het simpele deel, een wearable later
-- de rest (zelfde bron-patroon als cardio_sessies).

alter table public.slaap_logs add column if not exists bron             text not null default 'handmatig';
alter table public.slaap_logs add column if not exists uitgerust        smallint;
alter table public.slaap_logs add column if not exists slaap_diep_min   int;
alter table public.slaap_logs add column if not exists slaap_licht_min  int;
alter table public.slaap_logs add column if not exists slaap_rem_min    int;
alter table public.slaap_logs add column if not exists efficientie_pct  smallint;
alter table public.slaap_logs add column if not exists keren_wakker     smallint;
alter table public.slaap_logs add column if not exists gem_hartslag     smallint;
alter table public.slaap_logs add column if not exists hrv_ms           int;

comment on column public.slaap_logs.bron is 'handmatig | apple_health | google_health | oura | fitbit | whoop … (klaar voor latere tracker-koppeling)';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'slaap_logs_uitgerust_geldig') then
    alter table public.slaap_logs add constraint slaap_logs_uitgerust_geldig check (uitgerust is null or uitgerust between 1 and 5);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'slaap_logs_fasen_geldig') then
    alter table public.slaap_logs add constraint slaap_logs_fasen_geldig check (
      (slaap_diep_min is null or (slaap_diep_min between 0 and 1440)) and
      (slaap_licht_min is null or (slaap_licht_min between 0 and 1440)) and
      (slaap_rem_min is null or (slaap_rem_min between 0 and 1440))
    );
  end if;
  if not exists (select 1 from pg_constraint where conname = 'slaap_logs_metriek_geldig') then
    alter table public.slaap_logs add constraint slaap_logs_metriek_geldig check (
      (efficientie_pct is null or (efficientie_pct between 0 and 100)) and
      (keren_wakker is null or (keren_wakker between 0 and 100)) and
      (gem_hartslag is null or (gem_hartslag between 30 and 250)) and
      (hrv_ms is null or (hrv_ms between 0 and 500))
    );
  end if;
end $$;

alter table public.profiles add column if not exists slaap_doel_uren     numeric(3,1);
alter table public.profiles add column if not exists slaap_streefbedtijd time;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_slaap_doel_geldig') then
    alter table public.profiles add constraint profiles_slaap_doel_geldig check (slaap_doel_uren is null or (slaap_doel_uren between 0 and 24));
  end if;
end $$;

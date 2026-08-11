-- 051 — mentaal welzijn: stress (1-5) bij de dagelijkse stemming-log, zodat één
-- log stemming + energie + stress samen draagt (de nieuwe /welzijn-kern vouwt de
-- losse stemming/stress/mood-schermen samen). Idempotent, nullable.
-- Toegepast op het MentaForce-project via apply_migration; repo-bron.
-- NB: het oude stress_logs (1-10 + ademtechniek) blijft bestaan als legacy;
-- de nieuwe kern schrijft stress (1-5) hier, op stemming_logs.

alter table public.stemming_logs add column if not exists stress smallint;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'stemming_logs_stress_geldig') then
    alter table public.stemming_logs add constraint stemming_logs_stress_geldig check (stress is null or stress between 1 and 5);
  end if;
end $$;

-- ─── PT-app — clubmail tijdelijk uit ────────────────────────────────────────
-- Kane wil nog even wachten met mails naar clubmanagers. De job blijft bestaan
-- maar staat op inactief; weer aanzetten:
--   select cron.alter_job((select jobid from cron.job where jobname = 'pt-clubmail'), active := true);

select cron.alter_job((select jobid from cron.job where jobname = 'pt-clubmail'), active := false);

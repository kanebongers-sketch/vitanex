-- 016_health_logs_unique.sql
-- health_native_logs had geen unieke sleutel op (user_id, datum), waardoor
-- synchronisatie geen idempotente upserts kon doen. Eerst dubbele dagen
-- opruimen (nieuwste meting wint), dan de unieke index.
-- Toegepast op 11 juni 2026.

DELETE FROM public.health_native_logs h
WHERE h.id NOT IN (
  SELECT DISTINCT ON (user_id, datum) id
    FROM public.health_native_logs
   ORDER BY user_id, datum, aangemaakt_op DESC NULLS LAST, id
);

CREATE UNIQUE INDEX IF NOT EXISTS health_native_logs_user_datum_idx
  ON public.health_native_logs (user_id, datum);

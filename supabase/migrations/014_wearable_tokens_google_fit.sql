-- 014_wearable_tokens_google_fit.sql
-- De provider-constraint stond 'google_fit' niet toe, waardoor de
-- Google Fit OAuth-callback elke upsert weigerde.

ALTER TABLE public.wearable_tokens DROP CONSTRAINT IF EXISTS wearable_tokens_provider_check;
ALTER TABLE public.wearable_tokens ADD CONSTRAINT wearable_tokens_provider_check
  CHECK (provider IN ('fitbit', 'google_health', 'google_calendar', 'google_fit'));

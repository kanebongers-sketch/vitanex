-- ============================================================
-- Migration 027: AI-baseline analyse uit de uitgebreide onboarding-meting.
-- Idempotent. Eén jsonb-kolom op profiles; geen aparte tabel.
-- Herevaluaties overschrijven dezelfde kolom.
-- ============================================================
alter table profiles add column if not exists onboarding_ai_analyse jsonb;

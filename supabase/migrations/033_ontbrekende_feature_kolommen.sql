-- ================================================================
-- MentaForce – Migratie 033: ontbrekende feature-kolommen
-- ================================================================
-- Kolommen waar de code al naar schrijft/leest maar die nooit als
-- migratie bestonden. Zonder deze kolommen faalden de betreffende
-- features (profiel-bio opslaan, onboarding-AI-analyse persisteren,
-- documenten met HR delen, bedrijfs-plan, Fitbit-token-payload).

alter table profiles        add column if not exists bio text;
alter table profiles        add column if not exists onboarding_ai_analyse jsonb;
alter table documenten      add column if not exists gedeeld_met_hr boolean not null default false;
alter table bedrijven       add column if not exists plan text;
alter table wearable_tokens add column if not exists raw_data jsonb;

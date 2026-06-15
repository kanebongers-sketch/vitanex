-- Fix: migration 017 created an index on non-existent table 'uitdaging_logs'.
-- The correct table is 'team_uitdaging_logs' (created in migration 014).
DROP INDEX IF EXISTS idx_uitdaging_logs_uitdaging;

CREATE INDEX IF NOT EXISTS idx_uitdaging_logs_uitdaging
  ON team_uitdaging_logs(uitdaging_id, aangemaakt_op DESC);

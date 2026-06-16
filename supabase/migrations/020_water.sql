CREATE TABLE IF NOT EXISTS water_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ml integer NOT NULL CHECK (ml > 0 AND ml <= 2000),
  datum date NOT NULL DEFAULT CURRENT_DATE,
  aangemaakt_op timestamptz DEFAULT now()
);

ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "eigen water" ON water_logs FOR ALL USING (user_id = auth.uid());

CREATE INDEX ON water_logs(user_id, datum DESC);

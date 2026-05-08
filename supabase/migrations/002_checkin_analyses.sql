-- Tabel voor AI-gegenereerde vitaliteitsanalyses per check-in sessie
CREATE TABLE IF NOT EXISTS checkin_analyses (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sessie_id      uuid REFERENCES checkin_sessies(id) ON DELETE CASCADE,
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bedrijf_id     uuid,
  scores         jsonb,
  analyse_json   jsonb NOT NULL,
  gedeeld_met_hr boolean DEFAULT false,
  aangemaakt_op  timestamptz DEFAULT now()
);

-- Indexen
CREATE INDEX IF NOT EXISTS idx_analyses_user    ON checkin_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_bedrijf ON checkin_analyses(bedrijf_id);
CREATE INDEX IF NOT EXISTS idx_analyses_sessie  ON checkin_analyses(sessie_id);
CREATE INDEX IF NOT EXISTS idx_analyses_gedeeld ON checkin_analyses(bedrijf_id, gedeeld_met_hr);

-- RLS inschakelen
ALTER TABLE checkin_analyses ENABLE ROW LEVEL SECURITY;

-- Medewerker kan eigen analyses lezen en schrijven
CREATE POLICY "Eigen analyses lezen"
  ON checkin_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Eigen analyses aanmaken"
  ON checkin_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Eigen analyses bijwerken"
  ON checkin_analyses FOR UPDATE
  USING (auth.uid() = user_id);

-- HR kan gedeelde analyses van eigen bedrijf lezen
CREATE POLICY "HR gedeelde analyses lezen"
  ON checkin_analyses FOR SELECT
  USING (
    gedeeld_met_hr = true
    AND bedrijf_id IN (
      SELECT bedrijf_id FROM profiles
      WHERE id = auth.uid() AND rol IN ('hr', 'admin')
    )
  );

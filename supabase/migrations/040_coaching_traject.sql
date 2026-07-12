-- ============================================================
-- MentaForce — Coaching-traject (overlay op de coach↔klant-relatie)
-- ============================================================
-- Bouwt voort op migratie 037 (coach_klanten). Een traject is een
-- begeleidingslijn per coach↔klant (standaard 6 maanden), opgedeeld in
-- fases die elk één coaching-pijler centraal zetten:
--   body | mind | performance  (zie src/lib/coaching/pijlers.ts)
--
-- Dit is een OVERLAY-laag naast de 6 welzijnspijlers van de app; het
-- vervangt die metingen niet. Schrijven loopt via de service-role
-- API-routes (/api/coaching/traject) ná coach↔klant-verificatie; RLS
-- hieronder is defense-in-depth en dekt direct client-lezen.
-- ============================================================

-- ─── 1. Trajecten ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coaching_trajecten (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  klant_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  titel         text NOT NULL,
  doel          text,
  start_datum   date NOT NULL DEFAULT current_date,
  duur_maanden  int  NOT NULL DEFAULT 6  CHECK (duur_maanden BETWEEN 1 AND 24),
  status        text NOT NULL DEFAULT 'actief'
                  CHECK (status IN ('concept','actief','afgerond','gepauzeerd')),
  aangemaakt_op timestamptz DEFAULT now(),
  bijgewerkt_op timestamptz DEFAULT now(),
  CONSTRAINT coaching_trajecten_verschillend CHECK (coach_id != klant_id)
);

COMMENT ON TABLE  coaching_trajecten IS 'Begeleidingstraject per coach↔klant (overlay op coach_klanten), standaard 6 maanden';
COMMENT ON COLUMN coaching_trajecten.duur_maanden IS 'Beoogde looptijd in maanden (1–24); standaardmethode = 6';

-- Hergebruik de generieke updated_at-trigger uit migratie 005
DROP TRIGGER IF EXISTS trigger_coaching_trajecten_bijgewerkt ON coaching_trajecten;
CREATE TRIGGER trigger_coaching_trajecten_bijgewerkt
  BEFORE UPDATE ON coaching_trajecten
  FOR EACH ROW EXECUTE FUNCTION update_bijgewerkt_op();

-- ─── 2. Fases ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coaching_traject_fases (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  traject_id    uuid NOT NULL REFERENCES coaching_trajecten(id) ON DELETE CASCADE,
  volgorde      int  NOT NULL,
  titel         text NOT NULL,
  pijler        text NOT NULL CHECK (pijler IN ('body','mind','performance')),
  focus         text,
  week_van      int,
  week_tot      int,
  aangemaakt_op timestamptz DEFAULT now(),
  CONSTRAINT coaching_fase_week_range CHECK (
    week_van IS NULL OR week_tot IS NULL OR week_tot >= week_van
  )
);

COMMENT ON TABLE  coaching_traject_fases IS 'Fases binnen een traject; elke fase zet één pijler (body/mind/performance) centraal';
COMMENT ON COLUMN coaching_traject_fases.week_van IS '1-gebaseerd startweeknummer van de fase (t.o.v. traject start_datum)';

-- ─── 3. Row Level Security ──────────────────────────────────
ALTER TABLE coaching_trajecten     ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_traject_fases ENABLE ROW LEVEL SECURITY;

-- Coach beheert zijn eigen trajecten volledig
DROP POLICY IF EXISTS coaching_trajecten_coach ON coaching_trajecten;
CREATE POLICY coaching_trajecten_coach ON coaching_trajecten FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- Klant mag zijn eigen traject(en) lezen
DROP POLICY IF EXISTS coaching_trajecten_klant_lezen ON coaching_trajecten;
CREATE POLICY coaching_trajecten_klant_lezen ON coaching_trajecten FOR SELECT
  USING (klant_id = auth.uid());

-- Coach beheert fases van zijn eigen trajecten (via het bovenliggende traject)
DROP POLICY IF EXISTS coaching_fases_coach ON coaching_traject_fases;
CREATE POLICY coaching_fases_coach ON coaching_traject_fases FOR ALL
  USING (EXISTS (
    SELECT 1 FROM coaching_trajecten t
    WHERE t.id = coaching_traject_fases.traject_id AND t.coach_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM coaching_trajecten t
    WHERE t.id = coaching_traject_fases.traject_id AND t.coach_id = auth.uid()
  ));

-- Klant mag de fases van zijn eigen traject(en) lezen
DROP POLICY IF EXISTS coaching_fases_klant_lezen ON coaching_traject_fases;
CREATE POLICY coaching_fases_klant_lezen ON coaching_traject_fases FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM coaching_trajecten t
    WHERE t.id = coaching_traject_fases.traject_id AND t.klant_id = auth.uid()
  ));

-- ─── 4. Indexen ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_coaching_trajecten_klant_status
  ON coaching_trajecten (klant_id, status);
CREATE INDEX IF NOT EXISTS idx_coaching_trajecten_coach_klant
  ON coaching_trajecten (coach_id, klant_id);
CREATE INDEX IF NOT EXISTS idx_coaching_fases_traject_volgorde
  ON coaching_traject_fases (traject_id, volgorde);

-- ============================================================
-- MentaForce — Coaching-taken (coach wijst gewoontes toe aan klant)
-- ============================================================
-- STAP 3 bovenop de coach↔klant-relatie uit migratie 037.
--
-- Een menselijke coach (rol 'coach') wijst terugkerende taken/gewoontes
-- toe aan een gekoppelde klant. De klant vinkt ze dagelijks of wekelijks
-- af. Elke afvink schrijft OOK een rij in de bestaande `gewoonte_logs`
-- (via de server-route), zodat de streak- en achievement-infrastructuur
-- (migratie 002 + 029) meteen mee gaat leven.
--
-- Zichtbaarheid: de coach beheert alleen zijn eigen taken; de klant ziet
-- zijn toegewezen taken en beheert alleen zijn eigen completie-logs.
-- ============================================================

-- ─── 1. Taken-tabel ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coaching_taken (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id        uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  klant_id        uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  titel           text NOT NULL,
  beschrijving    text,
  pijler          text NOT NULL DEFAULT 'body'
                    CHECK (pijler IN ('body','mind','performance')),
  frequentie      text NOT NULL DEFAULT 'dagelijks'
                    CHECK (frequentie IN ('dagelijks','wekelijks')),
  -- gewenst aantal completies per week (dagelijks = 7)
  target_per_week int NOT NULL DEFAULT 7
                    CHECK (target_per_week BETWEEN 1 AND 7),
  actief          boolean NOT NULL DEFAULT true,
  aangemaakt_op   timestamptz DEFAULT now(),
  bijgewerkt_op   timestamptz DEFAULT now()
);

COMMENT ON TABLE  coaching_taken IS 'Terugkerende taken/gewoontes die een coach aan een gekoppelde klant toewijst';
COMMENT ON COLUMN coaching_taken.pijler IS 'Coaching-domein: body | mind | performance';
COMMENT ON COLUMN coaching_taken.target_per_week IS 'Gewenst aantal completies per week (dagelijks = 7)';

-- Hergebruik de generieke updated_at-trigger uit migratie 005
DROP TRIGGER IF EXISTS trigger_coaching_taken_bijgewerkt ON coaching_taken;
CREATE TRIGGER trigger_coaching_taken_bijgewerkt
  BEFORE UPDATE ON coaching_taken
  FOR EACH ROW EXECUTE FUNCTION update_bijgewerkt_op();

-- ─── 2. Completie-logs ──────────────────────────────────────
-- Eén rij per taak per dag (uniek). `gehaald = false` markeert een
-- bewust afgevinkte-uit dag; de klant kan zijn dag terugdraaien.
CREATE TABLE IF NOT EXISTS coaching_taak_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  taak_id       uuid NOT NULL REFERENCES coaching_taken(id) ON DELETE CASCADE,
  klant_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  datum         date NOT NULL DEFAULT current_date,
  gehaald       boolean NOT NULL DEFAULT true,
  notitie       text,
  aangemaakt_op timestamptz DEFAULT now(),
  CONSTRAINT coaching_taak_logs_uniek UNIQUE (taak_id, datum)
);

COMMENT ON TABLE coaching_taak_logs IS 'Dagelijkse completie-registratie per coaching-taak (uniek per taak+datum)';

-- ─── 3. Row Level Security ──────────────────────────────────
ALTER TABLE coaching_taken ENABLE ROW LEVEL SECURITY;

-- Coach beheert zijn eigen taken volledig — schrijven vereist een ACTIEVE
-- coach↔klant-relatie (verdediging in de diepte, ook bij directe REST-calls).
DROP POLICY IF EXISTS coaching_taken_coach ON coaching_taken;
CREATE POLICY coaching_taken_coach ON coaching_taken FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (
    coach_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM coach_klanten ck
      WHERE ck.coach_id = auth.uid()
        AND ck.klant_id = coaching_taken.klant_id
        AND ck.status = 'actief'
    )
  );

-- Klant leest zijn eigen toegewezen taken
DROP POLICY IF EXISTS coaching_taken_klant_lezen ON coaching_taken;
CREATE POLICY coaching_taken_klant_lezen ON coaching_taken FOR SELECT
  USING (klant_id = auth.uid());

ALTER TABLE coaching_taak_logs ENABLE ROW LEVEL SECURITY;

-- Klant beheert zijn eigen completie-logs (lezen + schrijven)
DROP POLICY IF EXISTS coaching_taak_logs_klant ON coaching_taak_logs;
CREATE POLICY coaching_taak_logs_klant ON coaching_taak_logs FOR ALL
  USING (klant_id = auth.uid())
  WITH CHECK (klant_id = auth.uid());

-- Coach leest (alleen-lezen) de logs van zijn eigen taken
DROP POLICY IF EXISTS coaching_taak_logs_coach_lezen ON coaching_taak_logs;
CREATE POLICY coaching_taak_logs_coach_lezen ON coaching_taak_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM coaching_taken t
    WHERE t.id = coaching_taak_logs.taak_id
      AND t.coach_id = auth.uid()
  ));

-- ─── 4. Indexen ─────────────────────────────────────────────
-- Klant-lijst: actieve taken van één klant
CREATE INDEX IF NOT EXISTS idx_coaching_taken_klant_actief
  ON coaching_taken (klant_id, actief);
-- Coach-lijst: taken van één coach voor één klant
CREATE INDEX IF NOT EXISTS idx_coaching_taken_coach
  ON coaching_taken (coach_id, klant_id);
-- Voortgang: logs per taak binnen een periode
CREATE INDEX IF NOT EXISTS idx_coaching_taak_logs_taak_datum
  ON coaching_taak_logs (taak_id, datum);

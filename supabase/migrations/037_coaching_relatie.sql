-- ============================================================
-- MentaForce — Coaching-relatie (1-op-1 coach ↔ klant)
-- ============================================================
-- Persoons-centrische begeleiding, LOS van bedrijf_id/HR.
-- Een coach (Kane) begeleidt individuele klanten. De klant geeft
-- expliciet toestemming (AVG) voordat de coach welzijnsdata inziet.
--
-- Model naar analogie van hr_gesprekken (gescheiden zichtbaarheid),
-- maar dit is een PERSISTENTE toewijzing i.p.v. een losse afspraak.
-- ============================================================

-- ─── 1. Rol 'coach' ─────────────────────────────────────────
-- profiles.rol is een vrije TEXT-kolom zonder CHECK-constraint,
-- dus de waarde 'coach' kan er zonder schemawijziging in. De rol
-- wordt door een admin gezet (of direct in de DB); coaches
-- registreren niet via de zelfstandige signup-flow.

-- ─── 2. Relatietabel ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coach_klanten (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id           uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  klant_id           uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status             text NOT NULL DEFAULT 'actief'
                       CHECK (status IN ('uitgenodigd','actief','gepauzeerd','beeindigd')),
  -- AVG: de klant moet actief toestemmen voordat de coach data inziet
  inzage_toestemming boolean NOT NULL DEFAULT false,
  sinds              date NOT NULL DEFAULT current_date,
  -- privé-notitie van de coach over de klant (nooit zichtbaar voor de klant)
  notitie            text,
  aangemaakt_op      timestamptz DEFAULT now(),
  bijgewerkt_op      timestamptz DEFAULT now(),
  CONSTRAINT coach_klanten_verschillend CHECK (coach_id != klant_id),
  CONSTRAINT coach_klanten_uniek UNIQUE (coach_id, klant_id)
);

COMMENT ON TABLE  coach_klanten IS 'Persoons-centrische 1-op-1 coach↔klant-toewijzing, los van bedrijf_id';
COMMENT ON COLUMN coach_klanten.inzage_toestemming IS 'AVG-opt-in: klant staat coach-inzage in welzijnsdata expliciet toe';
COMMENT ON COLUMN coach_klanten.notitie IS 'Privé-notitie van de coach — nooit zichtbaar voor de klant';

-- Hergebruik de generieke updated_at-trigger uit migratie 005
DROP TRIGGER IF EXISTS trigger_coach_klanten_bijgewerkt ON coach_klanten;
CREATE TRIGGER trigger_coach_klanten_bijgewerkt
  BEFORE UPDATE ON coach_klanten
  FOR EACH ROW EXECUTE FUNCTION update_bijgewerkt_op();

-- ─── 3. RLS-helpers ─────────────────────────────────────────
-- Is deze gebruiker een coach (of admin)?
CREATE OR REPLACE FUNCTION is_coach(uid uuid) RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = uid AND rol IN ('coach','admin'));
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Is `klant` een ACTIEVE, toestemming-gevende klant van de ingelogde coach?
-- Bedoeld voor toekomstige coach-leespolicies op welzijnsdata-tabellen.
CREATE OR REPLACE FUNCTION is_mijn_klant(klant uuid) RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM coach_klanten
    WHERE coach_id = auth.uid()
      AND klant_id = klant
      AND status = 'actief'
      AND inzage_toestemming = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── 4. Row Level Security ──────────────────────────────────
ALTER TABLE coach_klanten ENABLE ROW LEVEL SECURITY;

-- Coach beheert zijn eigen koppelingen volledig
DROP POLICY IF EXISTS coach_klanten_coach ON coach_klanten;
CREATE POLICY coach_klanten_coach ON coach_klanten FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- Klant kan zijn eigen koppeling(en) inzien (om te weten wie zijn coach is)
DROP POLICY IF EXISTS coach_klanten_klant_lezen ON coach_klanten;
CREATE POLICY coach_klanten_klant_lezen ON coach_klanten FOR SELECT
  USING (klant_id = auth.uid());

-- Toestemming geven/intrekken loopt via een server-route (service-role),
-- zodat de klant niet per ongeluk coach_id/status kan manipuleren.

-- ─── 5. Indexen ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_coach_klanten_coach ON coach_klanten (coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_klanten_klant ON coach_klanten (klant_id);
CREATE INDEX IF NOT EXISTS idx_coach_klanten_actief ON coach_klanten (coach_id, status)
  WHERE status = 'actief';

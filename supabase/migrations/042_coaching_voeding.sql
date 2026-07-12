-- ============================================================
-- MentaForce — Coaching-voedingsrichtlijn (coach → klant)
-- ============================================================
-- Additief bovenop de coach↔klant-relatie (037), taken (038) en
-- traject (040). Een menselijke coach (rol 'coach') stelt een
-- persoonlijke voedingsrichtlijn + dagdoelen (calorieën/macro's)
-- op voor een gekoppelde klant. De klant ziet de richtlijn read-only.
--
-- Dit STAAT LOS van de bestaande, per-gebruiker voeding-logging
-- (voeding_logs) en de intake-doelen op profiles (migratie 026):
-- die blijven ongewijzigd. Dit is de coach-laag daarbovenop.
--
-- Zichtbaarheid:
--   • coach beheert alleen zijn eigen richtlijnen (coach_id = auth.uid())
--   • klant leest alleen zijn eigen richtlijn  (klant_id = auth.uid())
--
-- Eén actieve richtlijn per (coach, klant): afgedwongen met een
-- partiële unieke index. De server deactiveert de vorige vóór hij
-- een nieuwe actieve rij invoegt (versiehistorie blijft bewaard).
--
-- Idempotent: CREATE ... IF NOT EXISTS + DROP POLICY IF EXISTS.
-- ============================================================

-- ─── 1. Richtlijn-tabel ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS coaching_voeding_richtlijnen (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  klant_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- Dagdoelen (allemaal optioneel: een richtlijn mag ook puur tekst zijn)
  calorie_doel   int  CHECK (calorie_doel  IS NULL OR (calorie_doel  BETWEEN 800 AND 8000)),
  eiwit_g        int  CHECK (eiwit_g        IS NULL OR (eiwit_g        BETWEEN 0 AND 1000)),
  koolhydraat_g  int  CHECK (koolhydraat_g  IS NULL OR (koolhydraat_g  BETWEEN 0 AND 1500)),
  vet_g          int  CHECK (vet_g          IS NULL OR (vet_g          BETWEEN 0 AND 1000)),
  -- Vrije, door de coach geschreven richtlijn/toelichting (eigen input)
  richtlijn_tekst text,
  -- Dieetvoorkeur — zelfde set als profiles.dieetvoorkeur (026)
  dieetvoorkeur  text CHECK (dieetvoorkeur IN
                    ('geen','vegetarisch','veganistisch','pescotarisch','keto','mediterraan','glutenvrij','lactosevrij')),
  actief         boolean NOT NULL DEFAULT true,
  aangemaakt_op  timestamptz DEFAULT now(),
  bijgewerkt_op  timestamptz DEFAULT now(),
  CONSTRAINT coaching_voeding_verschillend CHECK (coach_id <> klant_id)
);

COMMENT ON TABLE  coaching_voeding_richtlijnen IS 'Persoonlijke voedingsrichtlijn + dagdoelen die een coach voor een gekoppelde klant opstelt';
COMMENT ON COLUMN coaching_voeding_richtlijnen.richtlijn_tekst IS 'Vrije richtlijn/toelichting — eigen input van de coach, geen medische behandeling';
COMMENT ON COLUMN coaching_voeding_richtlijnen.actief IS 'Slechts één actieve richtlijn per coach+klant (partiële unieke index)';

-- Hergebruik de generieke updated_at-trigger uit migratie 004
DROP TRIGGER IF EXISTS trigger_coaching_voeding_bijgewerkt ON coaching_voeding_richtlijnen;
CREATE TRIGGER trigger_coaching_voeding_bijgewerkt
  BEFORE UPDATE ON coaching_voeding_richtlijnen
  FOR EACH ROW EXECUTE FUNCTION update_bijgewerkt_op();

-- ─── 2. Eén actieve richtlijn per (coach, klant) ────────────
-- Partiële unieke index: harde garantie dat er nooit twee actieve
-- richtlijnen naast elkaar bestaan. De server deactiveert de oude
-- vóór het invoegen van een nieuwe.
CREATE UNIQUE INDEX IF NOT EXISTS idx_coaching_voeding_een_actief
  ON coaching_voeding_richtlijnen (coach_id, klant_id)
  WHERE actief;

-- ─── 3. Row Level Security ──────────────────────────────────
ALTER TABLE coaching_voeding_richtlijnen ENABLE ROW LEVEL SECURITY;

-- Coach beheert zijn eigen richtlijnen volledig — schrijven vereist een
-- ACTIEVE coach↔klant-relatie (verdediging in de diepte).
DROP POLICY IF EXISTS coaching_voeding_coach ON coaching_voeding_richtlijnen;
CREATE POLICY coaching_voeding_coach ON coaching_voeding_richtlijnen FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (
    coach_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM coach_klanten ck
      WHERE ck.coach_id = auth.uid()
        AND ck.klant_id = coaching_voeding_richtlijnen.klant_id
        AND ck.status = 'actief'
    )
  );

-- Klant leest zijn eigen toegewezen richtlijn(en)
DROP POLICY IF EXISTS coaching_voeding_klant_lezen ON coaching_voeding_richtlijnen;
CREATE POLICY coaching_voeding_klant_lezen ON coaching_voeding_richtlijnen FOR SELECT
  USING (klant_id = auth.uid());

-- ─── 4. Indexen ─────────────────────────────────────────────
-- Klant-view: eigen actieve richtlijn snel vinden
CREATE INDEX IF NOT EXISTS idx_coaching_voeding_klant_actief
  ON coaching_voeding_richtlijnen (klant_id, actief);
-- Coach-view: richtlijnen van één coach voor één klant (incl. historie)
CREATE INDEX IF NOT EXISTS idx_coaching_voeding_coach_klant
  ON coaching_voeding_richtlijnen (coach_id, klant_id);

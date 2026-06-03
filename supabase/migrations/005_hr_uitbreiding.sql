-- ============================================================
-- MentaForce — HR Uitbreiding Migratie
-- Features: HR Code, Roosters, HR Gesprekken, RLS, Indexes
-- ============================================================

-- ============================================================
-- 1. HR CODE SYSTEEM
-- ============================================================

ALTER TABLE bedrijven ADD COLUMN IF NOT EXISTS hr_code VARCHAR(10) UNIQUE;
ALTER TABLE bedrijven ADD COLUMN IF NOT EXISTS hr_code_actief BOOLEAN DEFAULT true;

CREATE OR REPLACE FUNCTION generate_hr_code() RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code TEXT := '';
  i INT;
  attempts INT := 0;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..6 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::INT, 1);
    END LOOP;
    IF NOT EXISTS (SELECT 1 FROM bedrijven WHERE hr_code = code) THEN
      RETURN code;
    END IF;
    attempts := attempts + 1;
    IF attempts > 100 THEN
      RAISE EXCEPTION 'Kon geen unieke HR code genereren na 100 pogingen';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Genereer codes voor bestaande bedrijven zonder code
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT id FROM bedrijven WHERE hr_code IS NULL LOOP
    UPDATE bedrijven SET hr_code = generate_hr_code() WHERE id = rec.id;
  END LOOP;
END;
$$;

-- Trigger: nieuwe bedrijven krijgen automatisch een HR code
CREATE OR REPLACE FUNCTION set_hr_code_on_insert() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.hr_code IS NULL THEN
    NEW.hr_code := generate_hr_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_hr_code ON bedrijven;
CREATE TRIGGER trigger_set_hr_code
  BEFORE INSERT ON bedrijven
  FOR EACH ROW EXECUTE FUNCTION set_hr_code_on_insert();

-- ============================================================
-- 2. ROOSTERS SYSTEEM
-- ============================================================

CREATE TABLE IF NOT EXISTS roosters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bedrijf_id UUID NOT NULL REFERENCES bedrijven(id) ON DELETE CASCADE,
  naam TEXT NOT NULL,
  week_start DATE NOT NULL,
  aangemaakt_door UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT roosters_week_start_maandag CHECK (EXTRACT(DOW FROM week_start) = 1)
);

COMMENT ON TABLE roosters IS 'Weekroosters per bedrijf — week_start is altijd een maandag';

CREATE TABLE IF NOT EXISTS rooster_diensten (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rooster_id UUID NOT NULL REFERENCES roosters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  datum DATE NOT NULL,
  start_tijd TIME NOT NULL,
  eind_tijd TIME NOT NULL,
  notitie TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT rooster_diensten_tijden CHECK (eind_tijd > start_tijd)
);

-- ============================================================
-- 3. HR GESPREKKEN SYSTEEM
-- ============================================================

CREATE TABLE IF NOT EXISTS hr_gesprekken (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bedrijf_id UUID NOT NULL REFERENCES bedrijven(id) ON DELETE CASCADE,
  hr_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  medewerker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  datum DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('functionering','beoordeling','welzijn','onboarding','overig')),
  onderwerp TEXT NOT NULL,
  notities_intern TEXT,
  samenvatting_medewerker TEXT,
  actiepunten JSONB DEFAULT '[]'::jsonb,
  follow_up_datum DATE,
  status TEXT NOT NULL DEFAULT 'gepland' CHECK (status IN ('gepland','afgerond','geannuleerd')),
  aangemaakt_op TIMESTAMPTZ DEFAULT now(),
  bijgewerkt_op TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT hr_gesprekken_andere_users CHECK (hr_user_id != medewerker_id)
);

COMMENT ON COLUMN hr_gesprekken.notities_intern IS 'Alleen zichtbaar voor HR en admins';
COMMENT ON COLUMN hr_gesprekken.samenvatting_medewerker IS 'Zichtbaar voor de betreffende medewerker';

-- Auto-update bijgewerkt_op bij elke wijziging
CREATE OR REPLACE FUNCTION update_bijgewerkt_op() RETURNS TRIGGER AS $$
BEGIN
  NEW.bijgewerkt_op := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_hr_gesprekken_bijgewerkt ON hr_gesprekken;
CREATE TRIGGER trigger_hr_gesprekken_bijgewerkt
  BEFORE UPDATE ON hr_gesprekken
  FOR EACH ROW EXECUTE FUNCTION update_bijgewerkt_op();

-- View voor medewerkers: notities_intern altijd verborgen
CREATE OR REPLACE VIEW hr_gesprekken_medewerker_view AS
  SELECT id, bedrijf_id, hr_user_id, medewerker_id, datum, type, onderwerp,
         samenvatting_medewerker, actiepunten, follow_up_datum, status,
         aangemaakt_op, bijgewerkt_op
  FROM hr_gesprekken
  WHERE medewerker_id = auth.uid();

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

-- Helper functies
CREATE OR REPLACE FUNCTION is_hr_or_admin(uid UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = uid AND rol IN ('hr', 'admin'));
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION mijn_bedrijf_id() RETURNS UUID AS $$
  SELECT bedrijf_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ---- ROOSTERS ----
ALTER TABLE roosters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS roosters_lezen ON roosters;
CREATE POLICY roosters_lezen ON roosters FOR SELECT
  USING (bedrijf_id = mijn_bedrijf_id());

DROP POLICY IF EXISTS roosters_schrijven ON roosters;
CREATE POLICY roosters_schrijven ON roosters FOR ALL
  USING (bedrijf_id = mijn_bedrijf_id() AND is_hr_or_admin(auth.uid()))
  WITH CHECK (bedrijf_id = mijn_bedrijf_id() AND is_hr_or_admin(auth.uid()));

-- ---- ROOSTER_DIENSTEN ----
ALTER TABLE rooster_diensten ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rooster_diensten_lezen ON rooster_diensten;
CREATE POLICY rooster_diensten_lezen ON rooster_diensten FOR SELECT
  USING (
    user_id = auth.uid()
    OR (is_hr_or_admin(auth.uid()) AND EXISTS (
      SELECT 1 FROM roosters r WHERE r.id = rooster_id AND r.bedrijf_id = mijn_bedrijf_id()
    ))
  );

DROP POLICY IF EXISTS rooster_diensten_schrijven ON rooster_diensten;
CREATE POLICY rooster_diensten_schrijven ON rooster_diensten FOR ALL
  USING (is_hr_or_admin(auth.uid()) AND EXISTS (
    SELECT 1 FROM roosters r WHERE r.id = rooster_id AND r.bedrijf_id = mijn_bedrijf_id()
  ))
  WITH CHECK (is_hr_or_admin(auth.uid()) AND EXISTS (
    SELECT 1 FROM roosters r WHERE r.id = rooster_id AND r.bedrijf_id = mijn_bedrijf_id()
  ));

-- ---- HR_GESPREKKEN ----
ALTER TABLE hr_gesprekken ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS hr_gesprekken_hr ON hr_gesprekken;
CREATE POLICY hr_gesprekken_hr ON hr_gesprekken FOR ALL
  USING (bedrijf_id = mijn_bedrijf_id() AND is_hr_or_admin(auth.uid()))
  WITH CHECK (bedrijf_id = mijn_bedrijf_id() AND is_hr_or_admin(auth.uid()));

DROP POLICY IF EXISTS hr_gesprekken_medewerker ON hr_gesprekken;
CREATE POLICY hr_gesprekken_medewerker ON hr_gesprekken FOR SELECT
  USING (medewerker_id = auth.uid());

-- ============================================================
-- 5. PERFORMANCE INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_bedrijven_hr_code ON bedrijven (hr_code) WHERE hr_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_roosters_bedrijf_week ON roosters (bedrijf_id, week_start);
CREATE INDEX IF NOT EXISTS idx_rooster_diensten_user_datum ON rooster_diensten (user_id, datum);
CREATE INDEX IF NOT EXISTS idx_rooster_diensten_rooster ON rooster_diensten (rooster_id);
CREATE INDEX IF NOT EXISTS idx_hr_gesprekken_bedrijf ON hr_gesprekken (bedrijf_id);
CREATE INDEX IF NOT EXISTS idx_hr_gesprekken_medewerker ON hr_gesprekken (medewerker_id);
CREATE INDEX IF NOT EXISTS idx_hr_gesprekken_datum ON hr_gesprekken (datum);
CREATE INDEX IF NOT EXISTS idx_hr_gesprekken_status ON hr_gesprekken (status);
CREATE INDEX IF NOT EXISTS idx_hr_gesprekken_followup ON hr_gesprekken (follow_up_datum)
  WHERE follow_up_datum IS NOT NULL AND status = 'gepland';

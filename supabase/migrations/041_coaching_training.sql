-- ============================================================
-- MentaForce — Coaching-training (coach wijst trainingsschema toe aan klant)
-- ============================================================
-- STAP 4 bovenop de coach↔klant-relatie (037) en coaching-taken (038).
--
-- ADDITIEF op de bestaande sport/fitness-feature (migratie 010/011): een coach
-- stelt een `fitness_schemas`-rij samen voor een gekoppelde klant (user_id =
-- klant). De klant volgt het schema in de BESTAANDE /sport-UI, die het actieve
-- schema van de ingelogde gebruiker laadt (maybeSingle op user_id + actief) —
-- ongeacht wie het aanmaakte. Er verandert NIETS aan bestaande kolommen of
-- policies; deze migratie voegt alleen toe.
-- ============================================================

-- ─── 1. Herkomst-kolom ──────────────────────────────────────
-- Registreert welke coach dit schema toewees. NULL = door de gebruiker zélf
-- gegenereerd (het bestaande gedrag). ON DELETE SET NULL zodat het schema van
-- de klant blijft bestaan als het coach-profiel ooit verdwijnt.
ALTER TABLE fitness_schemas
  ADD COLUMN IF NOT EXISTS toegewezen_door uuid REFERENCES profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN fitness_schemas.toegewezen_door IS
  'Coach die dit schema toewees (NULL = door de gebruiker zelf gegenereerd)';

-- ─── 2. Aanvullende RLS-policies (coach-toegang) ────────────
-- Deze staan NAAST de bestaande owner-policies uit migratie 010. RLS-policies
-- zijn permissief (OR), dus dit breidt toegang uit zonder de eigenaar-policies
-- te raken. De server-routes gebruiken de service-role (bypass RLS); deze
-- policies zijn defense-in-depth mocht een coach ooit met zijn eigen JWT lezen
-- of schrijven. Voorwaarde overal: een ACTIEVE coach_klanten-relatie.

-- Coach mag een schema INSERTEN voor een klant met een actieve relatie.
DROP POLICY IF EXISTS fitness_schemas_coach_insert ON fitness_schemas;
CREATE POLICY fitness_schemas_coach_insert ON fitness_schemas FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM coach_klanten ck
    WHERE ck.coach_id = auth.uid()
      AND ck.klant_id = fitness_schemas.user_id
      AND ck.status = 'actief'
  ));

-- Coach mag de schema's van zijn actieve klanten LEZEN.
DROP POLICY IF EXISTS fitness_schemas_coach_select ON fitness_schemas;
CREATE POLICY fitness_schemas_coach_select ON fitness_schemas FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM coach_klanten ck
    WHERE ck.coach_id = auth.uid()
      AND ck.klant_id = fitness_schemas.user_id
      AND ck.status = 'actief'
  ));

-- Coach mag de training_logs van zijn actieve klanten LEZEN.
DROP POLICY IF EXISTS training_logs_coach_select ON training_logs;
CREATE POLICY training_logs_coach_select ON training_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM coach_klanten ck
    WHERE ck.coach_id = auth.uid()
      AND ck.klant_id = training_logs.user_id
      AND ck.status = 'actief'
  ));

-- Coach mag de oefening_logs van zijn actieve klanten LEZEN.
DROP POLICY IF EXISTS oefening_logs_coach_select ON oefening_logs;
CREATE POLICY oefening_logs_coach_select ON oefening_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM coach_klanten ck
    WHERE ck.coach_id = auth.uid()
      AND ck.klant_id = oefening_logs.user_id
      AND ck.status = 'actief'
  ));

-- ─── 3. Index ───────────────────────────────────────────────
-- (fitness_schemas(user_id, actief) bestaat al als idx_fitness_schemas_user_actief
--  uit migratie 010 — de sport-UI leunt daarop. Niet opnieuw aangemaakt.)

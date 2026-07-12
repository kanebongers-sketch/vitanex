-- ============================================================
-- MentaForce — Coaching-content (coach levert mindset/stress aan klant)
-- ============================================================
-- Bovenop de coach↔klant-relatie uit migratie 037. Naar analogie van
-- het protocollen-patroon (auteur → publiceren → lezer), maar dan
-- persoons-centrisch: coach → klant i.p.v. HR → bedrijf.
--
-- Een menselijke coach (rol 'coach') schrijft mindset- of stress-lessen
-- en -opdrachten en levert die aan één gekoppelde klant OF aan al zijn
-- klanten tegelijk. De klant leest de gepubliceerde content.
--
-- Zichtbaarheid:
--   * coach  → beheert alleen zijn eigen content (coach_id = auth.uid()).
--   * klant  → leest GEPUBLICEERDE content die voor hem bedoeld is:
--              persoonlijk (klant_id = auth.uid()) OF algemeen
--              (klant_id IS NULL) van een coach met een ACTIEVE koppeling.
--
-- Eerlijkheid: `inhoud` is de eigen tekst van de coach; er wordt niets
-- automatisch gegenereerd of geclaimd.
-- ============================================================

-- ─── 1. Content-tabel ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS coaching_content (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- NULL = voor ALLE (actieve) klanten van deze coach;
  -- niet-NULL = voor één specifieke klant.
  klant_id      uuid REFERENCES profiles(id) ON DELETE CASCADE,
  titel         text NOT NULL,
  inhoud        text NOT NULL,
  pijler        text NOT NULL DEFAULT 'mind'
                  CHECK (pijler IN ('body','mind','performance')),
  type          text NOT NULL DEFAULT 'artikel'
                  CHECK (type IN ('artikel','opdracht','audio','video')),
  media_url     text,
  gepubliceerd  boolean NOT NULL DEFAULT false,
  aangemaakt_op timestamptz DEFAULT now(),
  bijgewerkt_op timestamptz DEFAULT now()
);

COMMENT ON TABLE  coaching_content IS 'Mindset-/stress-lessen en -opdrachten die een coach aan (een) gekoppelde klant(en) levert';
COMMENT ON COLUMN coaching_content.klant_id IS 'NULL = voor alle klanten van de coach; niet-NULL = één specifieke klant';
COMMENT ON COLUMN coaching_content.type IS 'Vorm van de content: artikel | opdracht | audio | video';
COMMENT ON COLUMN coaching_content.media_url IS 'Optionele externe link (bv. audio/video) — hoort bij de content';

-- Hergebruik de generieke updated_at-trigger uit migratie 005
DROP TRIGGER IF EXISTS trigger_coaching_content_bijgewerkt ON coaching_content;
CREATE TRIGGER trigger_coaching_content_bijgewerkt
  BEFORE UPDATE ON coaching_content
  FOR EACH ROW EXECUTE FUNCTION update_bijgewerkt_op();

-- ─── 2. Row Level Security ──────────────────────────────────
ALTER TABLE coaching_content ENABLE ROW LEVEL SECURITY;

-- Coach beheert zijn eigen content volledig (lezen incl. concepten + schrijven).
-- Schrijven vereist óf broadcast (klant_id NULL) óf een ACTIEVE relatie met de
-- betreffende klant — voorkomt content injecteren bij willekeurige klant-id's.
DROP POLICY IF EXISTS coaching_content_coach ON coaching_content;
CREATE POLICY coaching_content_coach ON coaching_content FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (
    coach_id = auth.uid()
    AND (
      klant_id IS NULL
      OR EXISTS (
        SELECT 1 FROM coach_klanten ck
        WHERE ck.coach_id = auth.uid()
          AND ck.klant_id = coaching_content.klant_id
          AND ck.status = 'actief'
      )
    )
  );

-- Klant leest gepubliceerde content die voor hem bedoeld is:
--   * persoonlijk (klant_id = auth.uid()), OF
--   * algemeen (klant_id IS NULL) van een coach met een actieve koppeling.
DROP POLICY IF EXISTS coaching_content_klant_lezen ON coaching_content;
CREATE POLICY coaching_content_klant_lezen ON coaching_content FOR SELECT
  USING (
    gepubliceerd = true
    AND (
      klant_id = auth.uid()
      OR (
        klant_id IS NULL
        AND EXISTS (
          SELECT 1 FROM coach_klanten ck
          WHERE ck.coach_id = coaching_content.coach_id
            AND ck.klant_id = auth.uid()
            AND ck.status = 'actief'
        )
      )
    )
  );

-- ─── 3. Indexen ─────────────────────────────────────────────
-- Coach-lijst: eigen content, gefilterd op publicatiestatus
CREATE INDEX IF NOT EXISTS idx_coaching_content_coach_gepubliceerd
  ON coaching_content (coach_id, gepubliceerd);
-- Klant-lijst: persoonlijke content per klant
CREATE INDEX IF NOT EXISTS idx_coaching_content_klant
  ON coaching_content (klant_id);

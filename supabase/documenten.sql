-- =========================================================
-- Documenten & Dossier systeem — AVG-conform
-- Run in Supabase SQL Editor
-- =========================================================

CREATE TABLE IF NOT EXISTS documenten (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bedrijf_id      UUID        NOT NULL,
  uploader_id     UUID        NOT NULL REFERENCES auth.users(id),
  uploader_rol    TEXT        NOT NULL DEFAULT 'medewerker',
  categorie       TEXT        NOT NULL DEFAULT 'overig',
  bestandsnaam    TEXT        NOT NULL,
  opslag_pad      TEXT        NOT NULL UNIQUE,
  bestandsgrootte INTEGER,
  mime_type       TEXT,
  beschrijving    TEXT,
  intern          BOOLEAN     NOT NULL DEFAULT FALSE,
  aangemaakt_op   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE documenten ENABLE ROW LEVEL SECURITY;

-- Werknemers: eigen niet-interne documenten lezen
CREATE POLICY "docs_medewerker_lezen" ON documenten
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND intern = FALSE);

-- Werknemers: eigen document uploaden (nooit intern)
CREATE POLICY "docs_medewerker_uploaden" ON documenten
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND uploader_id = auth.uid() AND intern = FALSE);

-- Werknemers: eigen uploads verwijderen
CREATE POLICY "docs_medewerker_verwijderen" ON documenten
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND uploader_id = auth.uid());

-- =========================================================
-- Storage bucket: maak aan in Supabase Dashboard
-- Storage > New bucket > naam: "documenten" > Private (uit)
-- =========================================================

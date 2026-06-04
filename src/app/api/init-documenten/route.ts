import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

const PROJECT_REF = process.env.NEXT_PUBLIC_SUPABASE_URL
  ?.replace('https://', '')
  .replace('.supabase.co', '') ?? ''

const SQL = `
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

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'documenten' AND policyname = 'docs_medewerker_lezen'
  ) THEN
    CREATE POLICY "docs_medewerker_lezen" ON documenten
      FOR SELECT TO authenticated
      USING (user_id = auth.uid() AND intern = FALSE);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'documenten' AND policyname = 'docs_medewerker_uploaden'
  ) THEN
    CREATE POLICY "docs_medewerker_uploaden" ON documenten
      FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid() AND uploader_id = auth.uid() AND intern = FALSE);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'documenten' AND policyname = 'docs_medewerker_verwijderen'
  ) THEN
    CREATE POLICY "docs_medewerker_verwijderen" ON documenten
      FOR DELETE TO authenticated
      USING (user_id = auth.uid() AND uploader_id = auth.uid());
  END IF;
END $$;
`

export async function GET(req: NextRequest) {
  // Beveilig met een echte interne API-key — gebruik nooit een afgeleid deel van een secret
  const token = req.nextUrl.searchParams.get('token')
  if (!token || token !== process.env.INTERNAL_API_KEY) {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
  }

  const mgmtToken = process.env.SUPABASE_MANAGEMENT_TOKEN
  if (!mgmtToken) {
    return NextResponse.json({
      error: 'SUPABASE_MANAGEMENT_TOKEN ontbreekt in .env.local',
      instructie: 'Ga naar https://supabase.com/dashboard/account/tokens en maak een Access Token aan. Voeg toe aan .env.local: SUPABASE_MANAGEMENT_TOKEN=jouw_token',
    }, { status: 500 })
  }

  try {
    // Stap 1: Maak storage bucket aan
    const admin = createAdminClient()
    const { error: bucketErr } = await admin.storage.createBucket('documenten', { public: false })
    const bucketResultaat = bucketErr?.message?.includes('already exists')
      ? 'Bucket bestond al ✓'
      : bucketErr
        ? `Bucket fout: ${bucketErr.message}`
        : 'Bucket aangemaakt ✓'

    // Stap 2: Maak tabel aan via Management API
    const sqlRes = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mgmtToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: SQL }),
      }
    )

    if (!sqlRes.ok) {
      const body = await sqlRes.text()
      return NextResponse.json({
        bucketResultaat,
        sqlFout: body,
        tip: 'Controleer of je Management Token de juiste rechten heeft (lees: https://supabase.com/docs/reference/api/introduction)',
      }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      bucketResultaat,
      tabel: 'documenten tabel aangemaakt (of bestond al) ✓',
      rls: 'RLS policies aangemaakt ✓',
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

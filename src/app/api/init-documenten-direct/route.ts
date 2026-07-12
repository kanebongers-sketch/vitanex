import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/supabase-admin'

const PROJECT_REF = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '')
  .replace('https://', '')
  .replace('.supabase.co', '')

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
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='documenten' AND policyname='docs_medewerker_lezen') THEN
    EXECUTE 'CREATE POLICY docs_medewerker_lezen ON documenten FOR SELECT TO authenticated USING (user_id = auth.uid() AND intern = FALSE)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='documenten' AND policyname='docs_medewerker_uploaden') THEN
    EXECUTE 'CREATE POLICY docs_medewerker_uploaden ON documenten FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND uploader_id = auth.uid() AND intern = FALSE)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='documenten' AND policyname='docs_medewerker_verwijderen') THEN
    EXECUTE 'CREATE POLICY docs_medewerker_verwijderen ON documenten FOR DELETE TO authenticated USING (user_id = auth.uid() AND uploader_id = auth.uid())';
  END IF;
END $$;
`

export async function POST(req: NextRequest) {
  try {
    // Verifieer dat het een admin is
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

    const admin = createAdminClient()
    const { data: { user } } = await admin.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })

    const { data: profiel } = await admin.from('profiles').select('rol').eq('id', user.id).single()
    if (profiel?.rol !== 'admin') return NextResponse.json({ error: 'Alleen admins mogen dit uitvoeren' }, { status: 403 })

    const { mgmtToken } = await req.json() as { mgmtToken: string }
    if (!mgmtToken?.trim()) return NextResponse.json({ error: 'Management token ontbreekt' }, { status: 400 })

    // Stap 1: Storage bucket aanmaken
    const { error: bucketErr } = await admin.storage.createBucket('documenten', { public: false })
    const bucketResultaat = bucketErr?.message?.includes('already exists')
      ? 'Storage bucket bestond al ✓'
      : bucketErr
        ? `Bucket fout: ${bucketErr.message}`
        : 'Storage bucket aangemaakt ✓'

    // Stap 2: Tabel aanmaken via Supabase Management API
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
        error: `SQL mislukt: ${body}`,
        tip: 'Controleer of je token geldig is en de juiste rechten heeft.',
        bucketResultaat,
      }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      bucketResultaat,
      tabel: 'documenten tabel aangemaakt ✓',
      rls: 'RLS policies ingesteld ✓',
    })
  } catch (err) {
    console.error('[init-documenten-direct]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

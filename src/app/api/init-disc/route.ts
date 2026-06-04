import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(_req: NextRequest) {
  const admin = createAdminClient()
  try {
    await admin.rpc('exec_sql', {
      sql: 'ALTER TABLE documenten ADD COLUMN IF NOT EXISTS gedeeld_met_hr BOOLEAN NOT NULL DEFAULT FALSE;'
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    void err
    // Column may already exist, that is fine
    return NextResponse.json({ ok: true, note: "column may already exist" })
  }
}
// GET /api/v1/vandaag — de Vandaag-kaart van de ingelogde gebruiker, plus wat
// hij vandaag al met de acties deed. Alles via de eigen sessie (RLS); de kaart
// zelf komt uit de pure regelbibliotheek in src/lib/vandaag.

import { NextResponse, type NextRequest } from 'next/server'
import { gebruikerSessie } from '@/lib/supabase/gebruiker'
import { haalFeiten } from '@/lib/vandaag/ophalen'
import { maakKaart } from '@/lib/vandaag/regels'
import { maakRekening } from '@/lib/vandaag/rekening'
import { huidigeTaalset } from '@/lib/i18n/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const GEEN_CACHE = { 'Cache-Control': 'private, no-store', Vary: 'Authorization' } as const

export async function GET(req: NextRequest) {
  const sessie = await gebruikerSessie(req)
  if (!sessie) return NextResponse.json({ fout: 'Niet ingelogd.' }, { status: 401 })

  try {
    const [feiten, ts] = await Promise.all([haalFeiten(sessie.db, sessie.user.id), huidigeTaalset()])
    const kaart = maakKaart(feiten, ts)
    const [{ data }, sync] = await Promise.all([
      sessie.db.from('vandaag_acties').select('actie, keuze').eq('user_id', sessie.user.id).eq('datum', kaart.datum),
      sessie.db.from('health_sync_status').select('bron, laatste_sync').eq('user_id', sessie.user.id)
        .not('laatste_sync', 'is', null).order('laatste_sync', { ascending: false }).limit(1),
    ])
    const laatsteSync = (sync.data?.[0] as { bron: string; laatste_sync: string } | undefined) ?? null
    const gekozen = Object.fromEntries(
      (Array.isArray(data) ? data : []).map((r: { actie: string; keuze: string }) => [r.actie, r.keuze]),
    )
    return NextResponse.json(
      { kaart, gekozen, rekening: maakRekening(feiten, ts), bijgewerkt: laatsteSync ? { bron: laatsteSync.bron, tijd: laatsteSync.laatste_sync } : null },
      { headers: GEEN_CACHE },
    )
  } catch (fout) {
    console.error('[v1/vandaag] kaart maken mislukt', fout)
    return NextResponse.json({ fout: 'Je kaart kon niet worden gemaakt. Probeer het zo opnieuw.' }, { status: 502 })
  }
}

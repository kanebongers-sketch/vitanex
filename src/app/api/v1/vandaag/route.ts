// GET /api/v1/vandaag — de Vandaag-kaart van de ingelogde gebruiker, plus wat
// hij vandaag al met de acties deed. Alles via de eigen sessie (RLS); de kaart
// zelf komt uit de pure regelbibliotheek in src/lib/vandaag.

import { NextResponse, type NextRequest } from 'next/server'
import { gebruikerSessie } from '@/lib/supabase/gebruiker'
import { haalFeiten } from '@/lib/vandaag/ophalen'
import { maakKaart } from '@/lib/vandaag/regels'
import { maakRekening } from '@/lib/vandaag/rekening'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const GEEN_CACHE = { 'Cache-Control': 'private, no-store', Vary: 'Authorization' } as const

export async function GET(req: NextRequest) {
  const sessie = await gebruikerSessie(req)
  if (!sessie) return NextResponse.json({ fout: 'Niet ingelogd.' }, { status: 401 })

  try {
    const feiten = await haalFeiten(sessie.db, sessie.user.id)
    const kaart = maakKaart(feiten)
    const { data } = await sessie.db
      .from('vandaag_acties')
      .select('actie, keuze')
      .eq('user_id', sessie.user.id)
      .eq('datum', kaart.datum)
    const gekozen = Object.fromEntries(
      (Array.isArray(data) ? data : []).map((r: { actie: string; keuze: string }) => [r.actie, r.keuze]),
    )
    return NextResponse.json({ kaart, gekozen, rekening: maakRekening(feiten) }, { headers: GEEN_CACHE })
  } catch (fout) {
    console.error('[v1/vandaag] kaart maken mislukt', fout)
    return NextResponse.json({ fout: 'Je kaart kon niet worden gemaakt. Probeer het zo opnieuw.' }, { status: 502 })
  }
}

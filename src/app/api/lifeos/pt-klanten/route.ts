// GET /api/lifeos/pt-klanten — de wekelijkse PT-sessies per klant.
//
// Voor elke PT-klant (CRM-groep pt_klant): hoeveel sessies zijn er deze
// kalenderweek (ma–zo) gepland in je persoonlijke agenda, en hoeveel horen er
// (1 of 2)? Zo staat zwart-op-wit wie je nog moet inplannen — niemand vergeten.
// Op vakantie? Dan telt de klant deze week niet mee.
//
// Detectie leest LIVE uit Google (de gekozen/persoonlijke agenda, waar je eigen
// klanten in staan), zodat een net-gemaakte sessie meteen meetelt.
//
// Auth: de founder-gate uit `@/lib/lifeos/admin`.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { haalPersonen } from '@/lib/lifeos/crm/opslag'
import { geldigToken, leesGekozenKalender } from '@/lib/lifeos/agenda/koppeling'
import { haalEvents } from '@/lib/lifeos/agenda/google'
import { bepaalWeekStatus, type PtEvent, type PtKlantenAntwoord } from '@/lib/lifeos/pt-klant/pt-klant'
import { bepaalAfhaak } from '@/lib/lifeos/pt-klant/afhaak'
import { AFHAAK_VENSTER_DAGEN } from '@/lib/lifeos/pt-klant/afhaak-ophalen'
import { bepaalStatusHints, ptKlantenUit } from '@/lib/lifeos/pt-klant/klantstatus'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CACHE_HEADERS = {
  'Cache-Control': 'private, no-store',
  Vary: 'Authorization',
} as const

/** Maandag 00:00 van de week waarin `nu` valt (lokale tijd). */
function maandagVan(nu: Date): Date {
  const maandag = new Date(nu)
  maandag.setHours(0, 0, 0, 0)
  const offset = (nu.getDay() + 6) % 7 // 0=zondag → 6 dagen terug; 1=maandag → 0
  maandag.setDate(maandag.getDate() - offset)
  return maandag
}

export async function GET(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const personen = await haalPersonen(toegang.admin, toegang.userId, 'pt_klant')
  if (!personen.ok) {
    return NextResponse.json({ fout: 'Kon je PT-klanten niet lezen.' }, { status: 502 })
  }

  const token = await geldigToken(toegang.admin, toegang.userId)
  if (token.staat === 'niet_gekoppeld') {
    const antwoord: PtKlantenAntwoord = { gekoppeld: false }
    return NextResponse.json(antwoord, { headers: CACHE_HEADERS })
  }
  if (token.staat === 'fout') {
    return NextResponse.json({ fout: 'Kon je agenda niet lezen.' }, { status: 502 })
  }

  const kalenderId = await leesGekozenKalender(toegang.admin, toegang.userId)
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000
  const nu = new Date()
  const weekVan = maandagVan(nu)
  // Lees vorige, huidige én komende week: een 2-wekelijks abonnement kijkt breed
  // (zie bepaalWeekStatus), dus een klant die volgende week geboekt staat moet ook
  // meegeteld worden — anders wordt hij onterecht als "moet nog ingepland" geflagd.
  // Breed terug (8 weken) zodat hetzelfde venster óók het afhaak-signaal draagt —
  // één Google-call voor beide. De weekstatus filtert zelf per klant op zijn eigen
  // cadans-venster, dus de extra historie verandert daar niets aan.
  const leesVan = new Date(Math.min(weekVan.getTime() - WEEK_MS, nu.getTime() - AFHAAK_VENSTER_DAGEN * 24 * 60 * 60 * 1000))
  const leesTot = new Date(weekVan.getTime() + 2 * WEEK_MS)

  const events = await haalEvents(token.toegangstoken, leesVan, leesTot, kalenderId)
  if (events.staat === 'verlopen') {
    const antwoord: PtKlantenAntwoord = { gekoppeld: false }
    return NextResponse.json(antwoord, { headers: CACHE_HEADERS })
  }
  if (events.staat === 'fout') {
    return NextResponse.json({ fout: 'Kon je agenda niet lezen.' }, { status: 502 })
  }

  const vandaagKey = `${nu.getFullYear()}-${String(nu.getMonth() + 1).padStart(2, '0')}-${String(nu.getDate()).padStart(2, '0')}`

  const klanten = ptKlantenUit(personen.waarde)
  const ptEvents: PtEvent[] = events.events.map((e) => ({ titel: e.titel, startOp: e.startOp.toISOString() }))

  const antwoord: PtKlantenAntwoord = {
    gekoppeld: true,
    klanten: bepaalWeekStatus(klanten, ptEvents, weekVan.toISOString(), vandaagKey),
    afhaak: bepaalAfhaak(klanten, ptEvents, nu),
    statusHints: bepaalStatusHints(personen.waarde, ptEvents, nu),
  }
  return NextResponse.json(antwoord, { headers: CACHE_HEADERS })
}

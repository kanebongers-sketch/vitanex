// GET /api/lifeos/agenda/categorieen — je komende afspraken, elk in een categorie.
//
// Voor de komende twee weken uit je persoonlijke agenda: elke afspraak krijgt een
// bak op basis van de naam-koppeling (PT-klant/PT-team/Management/Team Budel), of
// "Overig" als er niets eenduidig matcht. Zo kun je in de app per categorie kijken
// en "Overig" wegfilteren.
//
// Leest LIVE uit de gekozen (persoonlijke) agenda, net als /pt-klanten, zodat een
// net-gemaakte afspraak meteen in de juiste bak staat.
//
// Auth: de founder-gate uit `@/lib/lifeos/admin`.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { haalPersonen } from '@/lib/lifeos/crm/opslag'
import { geldigToken, leesGekozenKalender } from '@/lib/lifeos/agenda/koppeling'
import { haalEvents } from '@/lib/lifeos/agenda/google'
import { categoriseerAfspraak, type CategorieAntwoord, type CategorieEventJson } from '@/lib/lifeos/agenda/categorie'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CACHE_HEADERS = {
  'Cache-Control': 'private, no-store',
  Vary: 'Authorization',
} as const

/** Komende twee weken: ver genoeg om te plannen, kort genoeg om overzicht te houden. */
const DAGEN_VOORUIT = 14

export async function GET(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const personen = await haalPersonen(toegang.admin, toegang.userId)
  if (!personen.ok) {
    return NextResponse.json({ fout: 'Kon je mensen niet lezen.' }, { status: 502 })
  }

  const token = await geldigToken(toegang.admin, toegang.userId)
  if (token.staat === 'niet_gekoppeld') {
    const antwoord: CategorieAntwoord = { gekoppeld: false }
    return NextResponse.json(antwoord, { headers: CACHE_HEADERS })
  }
  if (token.staat === 'fout') {
    return NextResponse.json({ fout: 'Kon je agenda niet lezen.' }, { status: 502 })
  }

  const kalenderId = await leesGekozenKalender(toegang.admin, toegang.userId)

  const van = new Date()
  const tot = new Date(van.getTime() + DAGEN_VOORUIT * 24 * 60 * 60 * 1000)

  const gelezen = await haalEvents(token.toegangstoken, van, tot, kalenderId)
  if (gelezen.staat === 'verlopen') {
    const antwoord: CategorieAntwoord = { gekoppeld: false }
    return NextResponse.json(antwoord, { headers: CACHE_HEADERS })
  }
  if (gelezen.staat === 'fout') {
    return NextResponse.json({ fout: 'Kon je agenda niet lezen.' }, { status: 502 })
  }

  const events: CategorieEventJson[] = gelezen.events.map((e) => ({
    id: e.externId,
    titel: e.titel,
    startOp: e.startOp.toISOString(),
    eindOp: e.eindOp ? e.eindOp.toISOString() : null,
    heleDag: e.heleDag,
    categorie: categoriseerAfspraak(e.titel, personen.waarde),
  }))

  const antwoord: CategorieAntwoord = { gekoppeld: true, events }
  return NextResponse.json(antwoord, { headers: CACHE_HEADERS })
}

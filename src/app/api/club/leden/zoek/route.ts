import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, vereisClubToegang } from '@/lib/club/toegang'
import { kiesUit } from '@/lib/club/kern/vestigingen'
import { moduleAan } from '@/lib/club/kern/organisatie'
import { LID_STATUS_LABEL, volledigeNaam, zoekLeden } from '@/lib/club/kern/lid'
import { ZOEK_LEDEN_MAX, ZOEK_LEDEN_MIN } from '@/components/club/shell/zoeken'

// GET /api/club/leden/zoek?v=<vestiging>&q=<zoekterm>
// Een lid vinden vanuit het zoekveld in de balk (Ctrl K of het vergrootglas):
// naam, lidnummer, e-mail of telefoon, binnen de gekozen vestiging. Valt onder
// het recht Leden (zie magApi): wie Leden niet mag, krijgt een 404.

// Best-effort rem per sessie (in het geheugen van deze instantie): 90 zoekopdrachten per minuut.
const VENSTER_MS = 60_000
const MAX_PER_VENSTER = 90
const tellers = new Map<string, { tot: number; n: number }>()

function teVeel(sleutel: string): boolean {
  const nu = Date.now()
  if (tellers.size > 2000) tellers.clear()
  const t = tellers.get(sleutel)
  if (!t || t.tot <= nu) {
    tellers.set(sleutel, { tot: nu + VENSTER_MS, n: 1 })
    return false
  }
  t.n += 1
  return t.n > MAX_PER_VENSTER
}

export async function GET(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  if (!moduleAan(t.organisatie, 'leden')) return clubFout('Niet gevonden.', 404)
  if (teVeel(`${t.userId}|${t.naam}`)) return clubFout('Even rustig aan. Probeer het over een minuut opnieuw.', 429)
  const zoek = req.nextUrl.searchParams
  const q = (zoek.get('q') ?? '').slice(0, 60)
  if (q.trim().length < ZOEK_LEDEN_MIN) return clubJson({ leden: [] })
  const vestiging = kiesUit(t.vestigingen, zoek.get('v'))
  if (!vestiging) return clubFout('Onbekende vestiging.', 400)
  const leden = await zoekLeden(t.admin, t.userId, vestiging, q, ZOEK_LEDEN_MAX)
  if (!leden) return clubFout('Zoeken is niet gelukt. Probeer het opnieuw.', 500)
  return clubJson({
    leden: leden.map((l) => ({ id: l.id, naam: volledigeNaam(l), lidnummer: l.lidnummer, status: LID_STATUS_LABEL[l.status] })),
  })
}

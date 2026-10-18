import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang, type ClubToegang } from '@/lib/club/toegang'
import { hoortBij, isVestigingSlug, naamVan } from '@/lib/club/kern/vestigingen'
import { volledigeNaam } from '@/lib/club/kern/lid'
import { qrCheckinAan } from '@/lib/club/kern/org-instellingen'
import { checkIn, type CheckinUitslag } from '@/lib/club/checkin/data'
import { leesCheckinInvoer, leesQrCheckinInvoer, type CheckinBron } from '@/lib/club/checkin/regels'
import { checkinGeheim, CODE_FOUT, controleerCheckinCode } from '@/lib/club/checkin/qr-code'
import type { QrCheckinAntwoord } from '@/lib/club/checkin/types'

// POST /api/club/checkin  { lidId, vestiging, bron, toch? }  of  { qr, vestiging, toch? }
// Checkt een lid in aan de balie of het kioskscherm. Met { qr }: de wisselende
// code uit de ledenapp, eerst gecontroleerd (handtekening, deze sportschool,
// niet verlopen), daarna precies dezelfde regels als zoeken aan de balie.
// Niet actief of al binnen 30 minuten ingecheckt: geen nieuwe rij, wel een
// duidelijk antwoord voor het scherm. Past het niet bij het lidmaatschap
// (vestiging of daluren), dan eerst een waarschuwing; met toch = true checkt de
// balie toch in en dat wordt gelogd.

async function logIngecheckt(t: ClubToegang, uitslag: Extract<CheckinUitslag, { ok: true }>, bron: CheckinBron, vestiging: string) {
  if (uitslag.antwoord.soort !== 'ingecheckt') return
  const les = uitslag.antwoord.les ? `, aanwezig bij ${uitslag.antwoord.les.naam}` : ''
  await logActie(t, 'Ingecheckt', `${volledigeNaam(uitslag.lid)} (${bron})${les}`, vestiging)
  if (uitslag.ondanks) await logActie(t, 'Ingecheckt ondanks lidmaatschap', `${volledigeNaam(uitslag.lid)}: ${uitslag.ondanks}`, vestiging)
}

async function metQr(t: ClubToegang, body: unknown): Promise<NextResponse> {
  const invoer = leesQrCheckinInvoer(body)
  if (!invoer || !isVestigingSlug(invoer.vestiging)) return clubFout('Ongeldig verzoek.', 400)
  if (!hoortBij(t.vestigingen, invoer.vestiging)) return clubFout('Onbekende vestiging.', 400)
  if (!qrCheckinAan(t.organisatie.instellingen.checkin)) return clubFout('Inchecken met de QR-code staat uit bij deze sportschool.', 400)
  const geheim = checkinGeheim()
  if (!geheim) {
    console.error('[club/checkin] CLUB_CHECKIN_SECRET ontbreekt of is te kort')
    return clubFout('Inchecken met de QR-code is nog niet ingesteld. Zoek het lid op naam.', 503)
  }
  const nu = new Date()
  const controle = controleerCheckinCode(invoer.qr, t.userId, geheim, nu)
  if (!controle.ok) return clubFout(CODE_FOUT[controle.reden], 400)
  const uitslag = await checkIn(t.admin, t.userId, { lidId: controle.lidId, vestiging: invoer.vestiging, bron: 'qr', toch: invoer.toch }, nu, t.vestigingen)
  if (!uitslag.ok) return clubFout(uitslag.fout, uitslag.status)
  await logIngecheckt(t, uitslag, 'qr', invoer.vestiging)
  const { lid } = uitslag
  const antwoord: QrCheckinAntwoord = {
    ...uitslag.antwoord,
    lid: { id: lid.id, naam: volledigeNaam(lid), voornaam: lid.voornaam, andereVestiging: lid.vestiging !== invoer.vestiging, vestigingLabel: naamVan(t.vestigingen, lid.vestiging) },
  }
  return clubJson(antwoord)
}

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const body: unknown = await req.json().catch(() => null)
  if (typeof body === 'object' && body !== null && 'qr' in body) return metQr(t, body)
  const invoer = leesCheckinInvoer(body)
  if (!invoer || !isVestigingSlug(invoer.vestiging)) return clubFout('Ongeldig verzoek.', 400)
  if (!hoortBij(t.vestigingen, invoer.vestiging)) return clubFout('Onbekende vestiging.', 400)
  const uitslag = await checkIn(t.admin, t.userId, { lidId: invoer.lidId, vestiging: invoer.vestiging, bron: invoer.bron, toch: invoer.toch }, new Date(), t.vestigingen)
  if (!uitslag.ok) return clubFout(uitslag.fout, uitslag.status)
  await logIngecheckt(t, uitslag, invoer.bron, invoer.vestiging)
  return clubJson(uitslag.antwoord)
}

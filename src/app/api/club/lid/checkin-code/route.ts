// GET /api/club/lid/checkin-code
// De actuele check-in QR-code van het ingelogde lid (wisselt elke 30 seconden).
// Het lid komt uit de sessie (in de voorvertoning van Kane uit ?voor=), nooit
// uit de vraag. Geeft het plaatje, de naam en hoe lang de code nog staat.
// Zonder CLUB_CHECKIN_SECRET, of als de sportschool alleen aan de balie
// incheckt: geen code, wel een nette melding.

import { NextResponse, type NextRequest } from 'next/server'
import { clubJson } from '@/lib/club/toegang'
import { volledigeNaam } from '@/lib/club/kern/lid'
import { qrCheckinAan } from '@/lib/club/kern/org-instellingen'
import { vereisLidToegang } from '@/lib/club/ledenlogin/toegang'
import { checkinGeheim, maakCheckinCode, QR_VAK_SEC } from '@/lib/club/checkin/qr-code'
import { qrDataUrl } from '@/lib/club/checkin/qr-beeld'
import type { CheckinCodeAntwoord } from '@/lib/club/checkin/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function uit(melding: string): NextResponse {
  const antwoord: CheckinCodeAntwoord = { soort: 'uit', melding }
  return clubJson(antwoord)
}

export async function GET(req: NextRequest) {
  const l = await vereisLidToegang(req)
  if (l instanceof NextResponse) return l
  const { organisatie, lid } = l
  if (!organisatie.instellingen.ledenapp.qr || !qrCheckinAan(organisatie.instellingen.checkin)) {
    return uit('Inchecken gaat bij deze sportschool aan de balie.')
  }
  const geheim = checkinGeheim()
  if (!geheim) {
    console.error('[club/checkin] CLUB_CHECKIN_SECRET ontbreekt of is te kort')
    return uit('Inchecken met de app is nog niet klaar. Meld je bij de balie.')
  }
  const nu = new Date()
  const code = maakCheckinCode(lid.id, organisatie.id, geheim, nu)
  const beeld = await qrDataUrl(code.code)
  if (!beeld) return uit('De code kon niet worden gemaakt. Meld je bij de balie.')
  const antwoord: CheckinCodeAntwoord = {
    soort: 'code',
    beeld,
    naam: volledigeNaam(lid),
    vakSec: QR_VAK_SEC,
    // Relatief, zodat een verkeerd ingestelde klok op de telefoon niet uitmaakt.
    vernieuwOverMs: Math.max(1000, code.vernieuwOp.getTime() - nu.getTime()),
  }
  return clubJson(antwoord)
}

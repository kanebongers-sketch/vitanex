// GET /api/club/lid/health: het overzicht voor de pagina Koppelingen in de
// ledenapp: de bronnen met hun status, de koppelingen van het lid, de
// toestemming (met de tekst en versie) en de laatste metingen.
// Het lid komt altijd uit de sessie. Met CLUB_HEALTH_ACTIEF uit: 404.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson } from '@/lib/club/toegang'
import { vereisLidHealth } from '@/lib/club/health/server'
import { haalKoppelingenPubliek, haalMetingen, haalToestemming } from '@/lib/club/health/opslag'
import { providerKaarten, VIA_TELEFOON } from '@/lib/club/health/providers'
import { TOESTEMMING_TEKST, TOESTEMMING_VERSIE } from '@/lib/club/health/toestemming'
import { laatstePerSoort } from '@/lib/club/health/metingen'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const l = await vereisLidHealth(req)
  if (l instanceof NextResponse) return l
  const [koppelingen, toestemming, metingen] = await Promise.all([
    haalKoppelingenPubliek(l.admin, l.userId, l.lid.id),
    haalToestemming(l.admin, l.userId, l.lid.id),
    haalMetingen(l.admin, l.userId, l.lid.id, { limiet: 300 }),
  ])
  if (!koppelingen || !toestemming || !metingen) return clubFout('Je koppelingen konden niet worden geladen. Probeer het straks opnieuw.', 500)
  return clubJson({
    providers: providerKaarten(),
    viaTelefoon: VIA_TELEFOON,
    koppelingen,
    toestemming,
    tekst: { versie: TOESTEMMING_VERSIE, regels: TOESTEMMING_TEKST },
    laatste: laatstePerSoort(metingen),
    recent: metingen.slice(0, 30),
    voorvertoning: l.voorvertoning,
  })
}

// GET /api/lifeos/notities/[id]/backlinks — welke notities verwijzen hiernaar?
//
// De vraag waarvoor dit hele kennissysteem bestaat: "waar had ik het hier eerder
// over?". Zoeken (090) vindt de wóórden terug; dit vindt het VERBAND terug — ook
// als je het toen anders formuleerde.
//
// Founder-only: net als elke LifeOS-route staat `vereisLifeosToegang` ervoor.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { haalBacklinks } from '@/lib/lifeos/notities/kennis'

// Geen max-age: je notities veranderen terwijl je kijkt. `Vary` staat er voor de
// zekerheid alsnog — een antwoord van de ene sessie mag nooit bij een andere
// terechtkomen. Zelfde afweging als in de notities-route zelf.
const CACHE_HEADERS = {
  'Cache-Control': 'private, no-store',
  Vary: 'Authorization',
} as const

interface Context {
  // Next 16: params is een Promise. Zie node_modules/next/dist/docs →
  // 01-app/03-api-reference/03-file-conventions/route.md
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, ctx: Context) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const { id } = await ctx.params
  const uitkomst = await haalBacklinks(toegang.admin, toegang.userId, id)

  if (!uitkomst.ok) {
    // Leeg ≠ fout: "niemand verwijst hiernaar" is een geldig antwoord en komt
    // hieronder als `[]`. Dit is de storing, en die zegt dat ook.
    return NextResponse.json({ fout: 'Kon de verwijzingen niet ophalen.' }, { status: 502 })
  }

  return NextResponse.json({ notities: uitkomst.waarde }, { headers: CACHE_HEADERS })
}

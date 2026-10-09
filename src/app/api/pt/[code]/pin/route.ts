// POST /api/pt/[code]/pin — de PT'er kiest een pincode (6 cijfers).
// Die werkt pas als Kane 'm in het dashboard goedkeurt; tot dan "wacht". Een pin
// die al gekozen is, kan hier niet overschreven worden (alleen Kane kan resetten).
// Antwoord: { staat: 'wacht', controle } — de controlecode die Kane bij het goedkeuren navraagt.

import { NextResponse, type NextRequest } from 'next/server'
import { kiesPin } from '@/lib/lifeos/leads/links'
import { GEEN_CACHE, eisZelfdeOorsprong, foutAntwoord, ipVan, leesPin, linkVoor } from '@/lib/lifeos/leads/toegang'
import { isRateLimited } from '@/lib/utils/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Een pin kiezen gebeurt één keer; meer dan dit per IP is geen mens. */
const IP_MAX = 10
const IP_VENSTER_MS = 15 * 60_000

interface Context {
  params: Promise<{ code: string }>
}

export async function POST(req: NextRequest, ctx: Context) {
  const vreemd = eisZelfdeOorsprong(req)
  if (vreemd) return vreemd
  if (isRateLimited(`pt-pin:${ipVan(req)}`, IP_MAX, IP_VENSTER_MS)) {
    return foutAntwoord('Te veel pogingen vanaf dit netwerk. Probeer het over een kwartier opnieuw.', 429)
  }
  const { code } = await ctx.params
  const r = await linkVoor(code)
  if (r instanceof NextResponse) return r
  const pin = leesPin(await req.json().catch(() => null))
  if (!pin) return foutAntwoord('Kies een pincode van precies 6 cijfers.', 400)

  const uit = await kiesPin(r.admin, r.link, pin, new Date())
  if (uit.staat === 'db') return foutAntwoord('Opslaan mislukt. Probeer het opnieuw.', 502)
  if (uit.staat === 'geen_pincode') return foutAntwoord('Deze pagina heeft geen pincode. Log in met je hoofdaccount.', 403)
  if (uit.staat === 'al_gekozen') return foutAntwoord('Voor deze pagina is al een pincode gekozen. Vraag Kane om hem te resetten als dat niet klopt.', 409)
  // De controlecode gaat alleen naar wie de pin net koos — nooit bij een later bezoek.
  return NextResponse.json({ staat: 'wacht', controle: uit.controle }, { headers: GEEN_CACHE })
}

// POST /api/pt/[code]/pin — de PT'er kiest een pincode (6 cijfers).
// Die werkt pas als Kane 'm in het dashboard goedkeurt; tot dan "wacht". Een pin
// die al gekozen is, kan hier niet overschreven worden (alleen Kane kan resetten).

import { NextResponse, type NextRequest } from 'next/server'
import { kiesPin } from '@/lib/lifeos/leads/links'
import { GEEN_CACHE, foutAntwoord, leesPin, linkVoor } from '@/lib/lifeos/leads/toegang'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Context {
  params: Promise<{ code: string }>
}

export async function POST(req: NextRequest, ctx: Context) {
  const { code } = await ctx.params
  const r = await linkVoor(code)
  if (r instanceof NextResponse) return r
  const pin = leesPin(await req.json().catch(() => null))
  if (!pin) return foutAntwoord('Kies een pincode van precies 6 cijfers.', 400)

  const uit = await kiesPin(r.admin, r.link, pin, new Date())
  if (uit === 'db') return foutAntwoord('Opslaan mislukt. Probeer het opnieuw.', 502)
  if (uit === 'al_gekozen') return foutAntwoord('Voor deze pagina is al een pincode gekozen. Vraag Kane om hem te resetten als dat niet klopt.', 409)
  return NextResponse.json({ staat: 'wacht' }, { headers: GEEN_CACHE })
}

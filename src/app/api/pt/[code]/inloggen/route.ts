// POST /api/pt/[code]/inloggen — pincode invullen; goed → sessiecookie (httpOnly)
// voor dit toestel. Na 5 foute pogingen is de pagina een tijd dicht (elke keer
// langer); na 6 blokkades helemaal, tot Kane de pincode reset. Daarnaast een rem
// per IP, zodat één aanvaller niet alle links tegelijk kan afgaan.

import { NextResponse, type NextRequest } from 'next/server'
import { logIn } from '@/lib/lifeos/leads/links'
import { sessieCookieNaam } from '@/lib/lifeos/leads/pin'
import { GEEN_CACHE, eisZelfdeOorsprong, foutAntwoord, ipVan, leesPin, linkVoor } from '@/lib/lifeos/leads/toegang'
import { isRateLimited } from '@/lib/utils/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Per IP: ruim boven wat een mens tikt, ver onder wat bruteforce nodig heeft. */
const IP_MAX = 20
const IP_VENSTER_MS = 15 * 60_000

const TIJD = new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Amsterdam' })

interface Context {
  params: Promise<{ code: string }>
}

export async function POST(req: NextRequest, ctx: Context) {
  const vreemd = eisZelfdeOorsprong(req)
  if (vreemd) return vreemd
  if (isRateLimited(`pt-inloggen:${ipVan(req)}`, IP_MAX, IP_VENSTER_MS)) {
    return foutAntwoord('Te veel inlogpogingen vanaf dit netwerk. Probeer het over een kwartier opnieuw.', 429)
  }
  const { code } = await ctx.params
  const r = await linkVoor(code)
  if (r instanceof NextResponse) return r
  const pin = leesPin(await req.json().catch(() => null))
  if (!pin) return foutAntwoord('Vul je pincode van 6 cijfers in.', 400)

  const uit = await logIn(r.admin, r.link, pin, new Date())
  switch (uit.staat) {
    case 'ok': {
      const res = NextResponse.json({ staat: 'ok' }, { headers: GEEN_CACHE })
      // Path blijft '/': de API leeft op /api/pt/<code>/…, dus een cookie op
      // /<code> zou daar niet meegaan. De naam is per link, dus er botst niets.
      res.cookies.set(sessieCookieNaam(r.link.code), uit.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires: uit.verlooptOp,
      })
      return res
    }
    case 'fout':
      return foutAntwoord(`Pincode klopt niet. Nog ${uit.over} poging${uit.over === 1 ? '' : 'en'}.`, 401)
    case 'geblokkeerd':
      return foutAntwoord(`Te vaak een foute pincode. Probeer het na ${TIJD.format(new Date(uit.totOp))} opnieuw.`, 429)
    case 'gesloten':
      return foutAntwoord('Te vaak een foute pincode: deze pagina is dicht. Vraag Kane om je pincode te resetten.', 429)
    case 'niet_actief':
      return foutAntwoord('Je pincode is nog niet goedgekeurd.', 403)
    case 'geen_pincode':
      return foutAntwoord('Deze pagina heeft geen pincode. Log in met je hoofdaccount.', 403)
    default:
      return foutAntwoord('Inloggen mislukt. Probeer het opnieuw.', 502)
  }
}

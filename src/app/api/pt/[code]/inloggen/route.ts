// POST /api/pt/[code]/inloggen — pincode invullen; goed → sessiecookie (httpOnly)
// voor dit toestel. Na 5 foute pogingen is de pagina 15 minuten dicht.

import { NextResponse, type NextRequest } from 'next/server'
import { logIn } from '@/lib/lifeos/leads/links'
import { sessieCookieNaam } from '@/lib/lifeos/leads/pin'
import { GEEN_CACHE, foutAntwoord, leesPin, linkVoor } from '@/lib/lifeos/leads/toegang'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TIJD = new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Amsterdam' })

interface Context {
  params: Promise<{ code: string }>
}

export async function POST(req: NextRequest, ctx: Context) {
  const { code } = await ctx.params
  const r = await linkVoor(code)
  if (r instanceof NextResponse) return r
  const pin = leesPin(await req.json().catch(() => null))
  if (!pin) return foutAntwoord('Vul je pincode van 6 cijfers in.', 400)

  const uit = await logIn(r.admin, r.link, pin, new Date())
  switch (uit.staat) {
    case 'ok': {
      const res = NextResponse.json({ staat: 'ok' }, { headers: GEEN_CACHE })
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
    case 'niet_actief':
      return foutAntwoord('Je pincode is nog niet goedgekeurd.', 403)
    default:
      return foutAntwoord('Inloggen mislukt. Probeer het opnieuw.', 502)
  }
}

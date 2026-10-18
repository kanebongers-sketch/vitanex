// GET  /api/club-afmelden/<token>: een kleine pagina met de keuze (geen
//      afmelding bij alleen openen, zodat virusscanners in mail niets uitzetten).
// POST /api/club-afmelden/<token>: afmelden. Met het formulier kiest het lid
//      herinneringen of alle mails; de een-klik-afmelding van mailapps
//      (List-Unsubscribe=One-Click, RFC 8058) zet herinneringen per mail uit.
// Openbaar: het token (192 bits willekeur) is de enige sleutel. Staat bewust
// niet onder /api/club/, want daar vraagt alles een beheerder-sessie.

import type { NextRequest } from 'next/server'
import { createLifeosAdminClient } from '@/lib/lifeos/admin'
import { escape } from '@/lib/club/meldingen/mail-html'
import { haalAfmeldStand, meldAf, type AfmeldKeuze } from '@/lib/club/meldingen/afmelden'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Context {
  params: Promise<{ token: string }>
}

function pagina(titel: string, inhoud: string, status = 200): Response {
  const html = `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escape(titel)}</title></head>
<body style="margin:0;background:#0A0B09;color:#fff;font-family:Roboto,Helvetica,Arial,sans-serif;line-height:1.6">
<main style="max-width:480px;margin:0 auto;padding:56px 20px">
<h1 style="font-size:28px;line-height:1.1;text-transform:uppercase;letter-spacing:.04em;margin:0 0 16px">${escape(titel)}</h1>
${inhoud}
</main></body></html>`
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } })
}

const KNOP = 'display:block;width:100%;margin:0 0 12px;padding:14px 18px;border-radius:999px;font:inherit;font-weight:700;cursor:pointer'

function onbekend(): Response {
  return pagina('Link werkt niet', '<p style="color:#c9c9c4">Deze afmeldlink bestaat niet (meer). Neem contact op met je sportschool als je geen mails meer wilt.</p>', 404)
}

export async function GET(_req: NextRequest, ctx: Context): Promise<Response> {
  const { token } = await ctx.params
  const stand = await haalAfmeldStand(createLifeosAdminClient(), token)
  if (!stand) return onbekend()
  const naam = escape(stand.sportschool)
  if (!stand.mails) return pagina('Je bent afgemeld', `<p style="color:#c9c9c4">Je krijgt geen mails meer van ${naam}. Meldingen in de app blijven gewoon zichtbaar.</p>`)
  const herinneringKnop = stand.herinneringenPerMail
    ? `<button name="wat" value="herinneringen" style="${KNOP};border:0;background:#B58E5C;color:#0A0B09">Geen herinneringen meer per mail</button>`
    : '<p style="color:#c9c9c4">Herinneringen per mail staan al uit.</p>'
  return pagina(
    'Mails van je sportschool',
    `<p style="color:#c9c9c4">Kies wat je niet meer per mail wilt krijgen van ${naam}. Meldingen in de app blijven gewoon zichtbaar.</p>
<form method="post" style="margin-top:28px">${herinneringKnop}<button name="wat" value="alles" style="${KNOP};border:1px solid #3a3a36;background:transparent;color:#fff">Helemaal geen mails meer</button></form>`,
  )
}

async function leesKeuze(req: NextRequest): Promise<AfmeldKeuze> {
  const form = await req.formData().catch(() => null)
  return form?.get('wat') === 'alles' ? 'alles' : 'herinneringen'
}

export async function POST(req: NextRequest, ctx: Context): Promise<Response> {
  const { token } = await ctx.params
  const keuze = await leesKeuze(req)
  const admin = createLifeosAdminClient()
  const stand = await haalAfmeldStand(admin, token)
  if (!stand) return onbekend()
  if (!(await meldAf(admin, token, keuze))) return pagina('Dat lukte niet', '<p style="color:#c9c9c4">Afmelden lukte nu niet. Probeer het later opnieuw.</p>', 500)
  const wat = keuze === 'alles' ? 'geen mails meer' : 'geen herinneringen meer per mail'
  return pagina('Je bent afgemeld', `<p style="color:#c9c9c4">Je krijgt ${wat} van ${escape(stand.sportschool)}. Meldingen in de app blijven gewoon zichtbaar.</p>`)
}

import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'
import { renderEmail, escapeHtml, EMAIL_KLEUREN } from '@/lib/utils/email-template'
import { valideerContactPayload, ONDERWERP_LABELS } from '@/lib/utils/contact-validatie'

const CONTACT_EMAIL = 'info@mentaforce.nl'

// Best-effort rate limiting per IP (in-memory, per server-instance): het endpoint
// is publiek en verstuurt e-mail, dus zonder limiet is het een spam-/kostenvector.
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_VENSTER_MS = 10 * 60 * 1000
const verzoekLog = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const nu = Date.now()
  const recent = (verzoekLog.get(ip) ?? []).filter((t) => nu - t < RATE_LIMIT_VENSTER_MS)
  if (recent.length >= RATE_LIMIT_MAX) {
    verzoekLog.set(ip, recent)
    return true
  }
  verzoekLog.set(ip, [...recent, nu])
  if (verzoekLog.size > 10_000) verzoekLog.clear()
  return false
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'onbekend'
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Te veel berichten in korte tijd. Probeer het later opnieuw.' },
        { status: 429 },
      )
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Ongeldige aanvraag.' }, { status: 400 })
    }

    const resultaat = valideerContactPayload(body)
    if ('fout' in resultaat) {
      return NextResponse.json({ error: resultaat.fout }, { status: 400 })
    }
    const { onderwerp, naam, email, organisatie, teamgrootte, bericht } = resultaat.data
    const onderwerpLabel = ONDERWERP_LABELS[onderwerp] ?? 'Contactformulier'

    const regels: [string, string][] = [
      ['Onderwerp', onderwerpLabel],
      ['Naam', naam],
      ['E-mail', email],
      ['Organisatie', organisatie || '—'],
      ['Teamgrootte', teamgrootte || '—'],
    ]
    const regelsHtml = regels
      .map(([label, waarde]) => `
        <p style="margin:0 0 6px; font-size:14px; color:${EMAIL_KLEUREN.inkDim};">
          <strong style="color:${EMAIL_KLEUREN.ink};">${label}:</strong> ${escapeHtml(waarde)}
        </p>`)
      .join('')

    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: 'MentaForce <onboarding@resend.dev>',
      to: CONTACT_EMAIL,
      replyTo: email,
      subject: `Contactformulier — ${onderwerpLabel} (${naam})`,
      html: renderEmail({
        inhoudHtml: `
          <h2 style="margin:0 0 16px; font-size:20px; font-weight:600; color:${EMAIL_KLEUREN.ink};">
            Nieuw bericht via het contactformulier
          </h2>
          ${regelsHtml}
          <div style="margin-top:20px; padding:16px 20px; border-left:3px solid ${EMAIL_KLEUREN.cyan};
                      background:${EMAIL_KLEUREN.navyDeep}; border-radius:4px;
                      color:${EMAIL_KLEUREN.inkDim}; font-size:14px; line-height:1.7; white-space:pre-line;">
            ${escapeHtml(bericht)}
          </div>`,
      }),
    })

    if (error) {
      console.error('[contact] Resend-fout', error)
      return NextResponse.json(
        { error: 'Je bericht kon niet worden verstuurd. Probeer het later opnieuw.' },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[contact]', err)
    return NextResponse.json(
      { error: 'Je bericht kon niet worden verstuurd. Probeer het later opnieuw.' },
      { status: 500 },
    )
  }
}

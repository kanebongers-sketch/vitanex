import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'
import { renderEmail, renderEmailKnop, escapeHtml, EMAIL_KLEUREN } from '@/lib/utils/email-template'

export async function POST(request: NextRequest) {
  try {
  // Controleer de interne API-key — dit endpoint mag alleen vanuit server-side code worden aangeroepen
  const internalKey = request.headers.get('x-internal-key')
  if (!internalKey || internalKey !== process.env.INTERNAL_API_KEY) {
    return NextResponse.json({ error: 'Niet geautoriseerd.' }, { status: 401 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const body = await request.json()
  const { naam, email } = body as { naam?: string; email?: string }
  if (!email) return NextResponse.json({ error: 'email vereist' }, { status: 400 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const { error } = await resend.emails.send({
    from: 'MentaForce <onboarding@resend.dev>',
    to: email,
    subject: `Welkom bij MentaForce, ${naam || 'daar'}!`,
    html: renderEmail({
      inhoudHtml: `
        <h2 style="font-size:22px; font-weight:600; color:${EMAIL_KLEUREN.ink}; margin:0 0 8px;">
          Welkom, ${naam ? escapeHtml(naam) : 'daar'} 👋
        </h2>
        <p style="color:${EMAIL_KLEUREN.inkDim}; line-height:1.6; margin:0;">
          Je account is aangemaakt en je kunt nu aan de slag. Doe elke week een snelle check-in
          om je vitaliteit bij te houden — het duurt maar 2 minuten.
        </p>

        ${renderEmailKnop({ label: 'Doe je eerste check-in', url: `${appUrl}/checkin` })}

        <div style="margin-top:32px; padding-top:24px; border-top:1px solid ${EMAIL_KLEUREN.line};">
          <p style="color:${EMAIL_KLEUREN.inkFaint}; font-size:12px; margin:0 0 4px;">In de app volg je jouw vitaliteitstrend:</p>
          <a href="${appUrl}/home" style="color:${EMAIL_KLEUREN.cyan}; font-size:12px;">${appUrl}/home</a>
        </div>
      `,
    }),
  })

  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[welkom]', err)
    return NextResponse.json({ error: 'Welkomstmail kon niet worden verstuurd.' }, { status: 500 })
  }
}

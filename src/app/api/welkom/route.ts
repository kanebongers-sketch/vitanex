import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

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
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:28px;">
          <div style="width:32px; height:32px; background:#1D9E75; border-radius:8px; display:flex; align-items:center; justify-content:center;">
            <span style="color:white; font-size:14px; font-weight:600;">M</span>
          </div>
          <span style="font-size:16px; font-weight:600; color:#111;">MentaForce</span>
        </div>

        <h2 style="font-size:22px; font-weight:500; color:#111; margin:0 0 8px;">
          Welkom, ${naam || 'daar'} 👋
        </h2>
        <p style="color:#666; line-height:1.6; margin:0 0 24px;">
          Je account is aangemaakt en je kunt nu aan de slag. Doe elke week een snelle check-in
          om je vitaliteit bij te houden — het duurt maar 2 minuten.
        </p>

        <a href="${appUrl}/checkin"
           style="display:inline-block; background:#1D9E75; color:#fff; padding:13px 26px;
                  border-radius:12px; text-decoration:none; font-size:14px; font-weight:500;">
          Doe je eerste check-in
        </a>

        <div style="margin-top:32px; padding-top:24px; border-top:1px solid #f0f0f0;">
          <p style="color:#999; font-size:12px; margin:0 0 4px;">Via je portaal kun je jouw vitaliteitstrend volgen:</p>
          <a href="${appUrl}/portaal" style="color:#1D9E75; font-size:12px;">${appUrl}/portaal</a>
        </div>

        <p style="color:#ccc; font-size:11px; margin-top:32px;">MentaForce · Vitaliteit op de werkplek</p>
      </div>
    `,
  })

  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[welkom]', err)
    return NextResponse.json({ error: 'Welkomstmail kon niet worden verstuurd.' }, { status: 500 })
  }
}

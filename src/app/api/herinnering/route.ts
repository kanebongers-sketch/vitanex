import { Resend } from 'resend'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { email, naam } = await request.json()

  const { error } = await resend.emails.send({
    from: 'Vitanex <onboarding@resend.dev>',
    to: email,
    subject: 'Jouw wekelijkse check-in staat klaar',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="font-size: 20px; font-weight: 500; color: #111;">Hey ${naam || 'daar'} 👋</h2>
        <p style="color: #666; line-height: 1.6;">Je wekelijkse vitaliteits check-in staat klaar. Het duurt maar 2 minuten.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/checkin"
           style="display: inline-block; margin-top: 16px; background: #111; color: #fff; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-size: 14px;">
          Check-in doen
        </a>
        <p style="color: #aaa; font-size: 12px; margin-top: 32px;">Vitanex · Vitaliteit op de werkplek</p>
      </div>
    `,
  })

  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ success: true })
}
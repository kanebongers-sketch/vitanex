import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { profielId } = await request.json()
  if (!profielId) return NextResponse.json({ error: 'profielId vereist' }, { status: 400 })

  const admin = createAdminClient()

  const { data: profiel } = await admin
    .from('profiles')
    .select('naam, bedrijf_id')
    .eq('id', profielId)
    .single()

  if (!profiel) return NextResponse.json({ error: 'Profiel niet gevonden' }, { status: 404 })

  const { data: { user }, error: userError } = await admin.auth.admin.getUserById(profielId)
  if (userError || !user?.email) return NextResponse.json({ error: 'E-mailadres niet gevonden' }, { status: 404 })

  const { error } = await resend.emails.send({
    from: 'Vitanex <onboarding@resend.dev>',
    to: user.email,
    subject: 'Jouw wekelijkse check-in staat klaar',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="font-size: 20px; font-weight: 500; color: #111;">Hey ${profiel.naam || 'daar'} 👋</h2>
        <p style="color: #666; line-height: 1.6;">Je wekelijkse vitaliteits check-in staat klaar. Het duurt maar 2 minuten.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/checkin"
           style="display: inline-block; margin-top: 16px; background: #1D9E75; color: #fff; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-size: 14px;">
          Check-in doen
        </a>
        <p style="color: #aaa; font-size: 12px; margin-top: 32px;">Vitanex · Vitaliteit op de werkplek</p>
      </div>
    `,
  })

  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ success: true, email: user.email })
}

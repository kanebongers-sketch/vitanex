import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { renderEmail, escapeHtml, EMAIL_KLEUREN } from '@/lib/utils/email-template'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })
    }

    // Haal de naam op via de admin client; gebruik altijd user.email van de JWT
    const admin = createAdminClient()
    const { data: profiel } = await admin
      .from('profiles')
      .select('naam')
      .eq('id', user.id)
      .single()

    const naam = profiel?.naam ?? ''
    const email = user.email
    if (!email) return NextResponse.json({ error: 'Geen e-mailadres bekend.' }, { status: 400 })

    const resend = new Resend(process.env.RESEND_API_KEY)

    const { error } = await resend.emails.send({
      from: 'MentaForce <onboarding@resend.dev>',
      to: email,
      subject: 'Jouw wekelijkse check-in staat klaar',
      html: renderEmail({
        inhoudHtml: `
          <h2 style="font-size:20px; font-weight:600; color:${EMAIL_KLEUREN.ink}; margin:0 0 8px;">Hey ${naam ? escapeHtml(naam) : 'daar'} 👋</h2>
          <p style="color:${EMAIL_KLEUREN.inkDim}; line-height:1.6; margin:0;">Je wekelijkse vitaliteits check-in staat klaar. Het duurt maar 2 minuten.</p>
        `,
        knop: { label: 'Check-in doen', url: `${process.env.NEXT_PUBLIC_APP_URL}/checkin` },
      }),
    })

    if (error) return NextResponse.json({ error }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[herinnering]', err)
    return NextResponse.json({ error: 'Herinnering kon niet worden verstuurd.' }, { status: 500 })
  }
}
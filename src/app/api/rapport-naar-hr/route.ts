import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const { sessie_id, rapport_tekst } = await req.json()
    if (!sessie_id || !rapport_tekst) {
      return NextResponse.json({ error: 'sessie_id en rapport_tekst verplicht' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: sessie } = await admin
      .from('checkin_sessies')
      .select('user_id, bedrijf_id, week_start')
      .eq('id', sessie_id)
      .single()

    if (!sessie) return NextResponse.json({ error: 'Sessie niet gevonden' }, { status: 404 })

    // Get sender name
    const { data: profiel } = await admin
      .from('profiles')
      .select('naam')
      .eq('id', sessie.user_id)
      .single()

    const naam = profiel?.naam ?? 'Een medewerker'

    // Find HR accounts for this company
    const { data: hrProfielen } = await admin
      .from('profiles')
      .select('id')
      .eq('bedrijf_id', sessie.bedrijf_id)
      .eq('rol', 'hr')

    if (!hrProfielen?.length) {
      return NextResponse.json({ error: 'Geen HR-contactpersoon gevonden' }, { status: 404 })
    }

    // Get HR emails via admin auth
    const { data: allUsers } = await admin.auth.admin.listUsers({ perPage: 1000 })
    const hrIds = new Set(hrProfielen.map((h: { id: string }) => h.id))
    const hrEmails = allUsers.users
      .filter(u => hrIds.has(u.id) && u.email)
      .map(u => u.email as string)

    if (!hrEmails.length) {
      return NextResponse.json({ error: 'Geen HR e-mailadres gevonden' }, { status: 404 })
    }

    const weekLabel = new Date(sessie.week_start).toLocaleDateString('nl-BE', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })

    // Convert plain text rapport to basic HTML
    const rapportHtml = rapport_tekst
      .split('\n\n')
      .map((p: string) => `<p style="margin: 0 0 12px;">${p.replace(/\n/g, '<br/>')}</p>`)
      .join('')

    const resend = new Resend(process.env.RESEND_API_KEY)

    await resend.emails.send({
      from: 'MentaForce <onboarding@resend.dev>',
      to: hrEmails,
      subject: `${naam} deelt zijn/haar welzijnsrapport — week van ${weekLabel}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
          <div style="background: #1D9E75; color: white; padding: 20px 24px; border-radius: 12px 12px 0 0;">
            <h2 style="margin: 0; font-size: 18px; font-weight: 600;">Persoonlijk welzijnsrapport ontvangen</h2>
            <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.85;">Week van ${weekLabel}</p>
          </div>
          <div style="background: white; border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
            <p style="color: #6b7280; font-size: 13px; margin-top: 0;">
              <strong style="color: #111;">${naam}</strong> heeft zijn/haar persoonlijk welzijnsrapport met jou gedeeld via MentaForce.
            </p>
            <div style="background: #F9FAFB; border-left: 3px solid #1D9E75; padding: 16px 20px; border-radius: 4px; color: #374151; font-size: 14px; line-height: 1.75;">
              ${rapportHtml}
            </div>
            <p style="color: #9ca3af; font-size: 11px; margin-top: 20px; margin-bottom: 0; line-height: 1.5;">
              Dit rapport is gegenereerd door MentaForce op basis van de wekelijkse check-in van de medewerker. Behandel de inhoud vertrouwelijk.
            </p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[rapport-naar-hr]', err)
    return NextResponse.json({ error: 'Rapport kon niet worden verstuurd.' }, { status: 500 })
  }
}

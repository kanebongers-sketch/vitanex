import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { renderEmail, escapeHtml, EMAIL_KLEUREN } from '@/lib/utils/email-template'

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })
    }

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

    // Verifieer dat de ingelogde gebruiker de eigenaar is van deze sessie
    if (sessie.user_id !== user.id) {
      return NextResponse.json({ error: 'Geen toegang tot deze sessie.' }, { status: 403 })
    }

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

    // Platte rapporttekst veilig (ge-escaped) omzetten naar eenvoudige HTML
    const rapportHtml = String(rapport_tekst)
      .split('\n\n')
      .map((p: string) => `<p style="margin: 0 0 12px;">${escapeHtml(p).replace(/\n/g, '<br/>')}</p>`)
      .join('')

    const resend = new Resend(process.env.RESEND_API_KEY)

    await resend.emails.send({
      from: 'MentaForce <onboarding@resend.dev>',
      to: hrEmails,
      subject: `${naam} deelt zijn/haar welzijnsrapport — week van ${weekLabel}`,
      html: renderEmail({
        maxBreedte: 600,
        inhoudHtml: `
          <h2 style="margin:0; font-size:18px; font-weight:600; color:${EMAIL_KLEUREN.ink};">Persoonlijk welzijnsrapport ontvangen</h2>
          <p style="margin:6px 0 0; font-size:13px; color:${EMAIL_KLEUREN.inkDim};">Week van ${weekLabel}</p>
          <p style="color:${EMAIL_KLEUREN.inkDim}; font-size:13px; margin:20px 0 16px;">
            <strong style="color:${EMAIL_KLEUREN.ink};">${escapeHtml(naam)}</strong> heeft zijn/haar persoonlijk welzijnsrapport met jou gedeeld via MentaForce.
          </p>
          <div style="background:${EMAIL_KLEUREN.navyDeep}; border-left:3px solid ${EMAIL_KLEUREN.cyan}; padding:16px 20px; border-radius:4px; color:${EMAIL_KLEUREN.inkDim}; font-size:14px; line-height:1.75;">
            ${rapportHtml}
          </div>
          <p style="color:${EMAIL_KLEUREN.inkFaint}; font-size:11px; margin-top:20px; margin-bottom:0; line-height:1.5;">
            Dit rapport is gegenereerd door MentaForce op basis van de wekelijkse check-in van de medewerker. Behandel de inhoud vertrouwelijk.
          </p>
        `,
      }),
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[rapport-naar-hr]', err)
    return NextResponse.json({ error: 'Rapport kon niet worden verstuurd.' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { isCoach } from '@/lib/coaching/server'
import { maakUitnodiging, lijstUitnodigingen } from '@/lib/coaching/uitnodiging-server'
import { renderEmail, escapeHtml, EMAIL_KLEUREN } from '@/lib/utils/email-template'

// GET  /api/coaching/uitnodigingen            → lijst van uitnodigingen (coach)
// POST /api/coaching/uitnodigingen {email,naam?} → maak uitnodiging + verstuur e-mail

/** Leidt de publieke origin af: env eerst (zoals de bestaande mailroutes), dan headers. */
function bepaalOrigin(req: NextRequest): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL
  if (envUrl && envUrl !== 'undefined') return envUrl.replace(/\/+$/, '')
  const origin = req.headers.get('origin')
  if (origin) return origin.replace(/\/+$/, '')
  const proto = req.headers.get('x-forwarded-proto') ?? 'https'
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  if (host) return `${proto}://${host}`
  return 'http://localhost:3000'
}

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()
  if (!(await isCoach(admin, user.id))) {
    return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 })
  }

  const uitnodigingen = await lijstUitnodigingen(admin, user.id)
  return NextResponse.json({ uitnodigingen })
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()
  if (!(await isCoach(admin, user.id))) {
    return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 })
  }

  let body: { email?: string; naam?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON.' }, { status: 400 })
  }

  const resultaat = await maakUitnodiging(admin, user.id, body.email ?? '', body.naam)
  if (!resultaat.ok) {
    return NextResponse.json({ error: resultaat.fout }, { status: resultaat.status })
  }

  // Naam van de coach voor een persoonlijke, eerlijke uitnodigingstekst.
  const { data: coachProfiel } = await admin
    .from('profiles')
    .select('naam')
    .eq('id', user.id)
    .maybeSingle()
  const coachNaam = coachProfiel?.naam?.trim() || 'Je coach'

  const link = `${bepaalOrigin(req)}/coaching/welkom?token=${encodeURIComponent(resultaat.token)}`
  const aanhef = resultaat.naam ? `Hoi ${escapeHtml(resultaat.naam)},` : 'Hoi,'

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: 'MentaForce <onboarding@resend.dev>',
      to: resultaat.email,
      subject: `${coachNaam} nodigt je uit voor persoonlijke coaching`,
      html: renderEmail({
        inhoudHtml: `
          <h2 style="font-size:20px; font-weight:600; color:${EMAIL_KLEUREN.ink}; margin:0 0 12px;">
            ${aanhef}
          </h2>
          <p style="color:${EMAIL_KLEUREN.inkDim}; line-height:1.65; margin:0 0 14px;">
            <strong style="color:${EMAIL_KLEUREN.ink};">${escapeHtml(coachNaam)}</strong> begeleidt je persoonlijk via MentaForce
            en nodigt je uit om te koppelen. Zo houd je samen je energie, slaap, stress, stemming,
            beweging en voeding in beeld.
          </p>
          <p style="color:${EMAIL_KLEUREN.inkDim}; line-height:1.65; margin:0;">
            Klik op de knop om je account aan te maken of in te loggen. Je bepaalt daarna zelf welke
            gegevens je met je coach deelt — die keuze kun je altijd aanpassen.
          </p>
        `,
        knop: { label: 'Uitnodiging bekijken', url: link },
      }),
    })

    if (error) {
      return NextResponse.json({ error: 'Uitnodiging opgeslagen, maar de e-mail kon niet worden verstuurd.' }, { status: 502 })
    }
  } catch {
    return NextResponse.json({ error: 'Uitnodiging opgeslagen, maar de e-mail kon niet worden verstuurd.' }, { status: 502 })
  }

  return NextResponse.json({ succes: true, email: resultaat.email })
}

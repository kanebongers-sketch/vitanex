import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL   = Deno.env.get('SUPABASE_URL')!
const SUPABASE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const FROM_EMAIL     = 'MentaForce <noreply@mentaforce.nl>'
const APP_URL        = 'https://mentaforce.nl'
const SEVEN_DAYS_MS  = 7 * 24 * 60 * 60 * 1000

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const supabase  = createClient(SUPABASE_URL, SUPABASE_KEY)
  const cutoffTs  = new Date(new Date().getTime() - SEVEN_DAYS_MS).toISOString()

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, naam, rol')
    .in('rol', ['medewerker', 'employee', 'user', 'zelfstandige'])

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  if (!profiles?.length) return new Response(JSON.stringify({ sent: 0 }), { status: 200 })

  let sent = 0
  const errors: string[] = []

  for (const profile of profiles) {
    // Skip als ze al ingecheckt hebben afgelopen 7 dagen
    const { data: sessie } = await supabase
      .from('checkin_sessies')
      .select('id')
      .eq('user_id', profile.id)
      .gte('aangemaakt_op', cutoffTs)
      .limit(1)
      .maybeSingle()

    if (sessie) continue

    // Haal e-mailadres op via auth admin
    const { data: authData } = await supabase.auth.admin.getUserById(profile.id)
    if (!authData?.user?.email) continue

    const email = authData.user.email
    const naam  = (profile.naam ?? '').split(' ')[0] || 'daar'

    // Dry-run als geen API key
    if (!RESEND_API_KEY) {
      console.log('[DRY RUN] Would send reminder to:', email)
      sent++
      continue
    }

    const html =
      '<div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">' +
      '<h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 8px">Hey ' + naam + ' 👋</h1>' +
      '<p style="font-size:15px;color:#374151;line-height:1.6;margin-bottom:28px">' +
        'Je wekelijkse check-in staat klaar. In <strong>3 minuten</strong> weet je hoe je er echt voor staat — ' +
        'slaap, stress, energie en meer. Je AI-rapport staat daarna meteen klaar.' +
      '</p>' +
      '<a href="' + APP_URL + '/checkin" ' +
        'style="display:block;text-align:center;background:#1D9E75;color:white;border-radius:12px;' +
        'padding:14px 28px;font-size:15px;font-weight:600;text-decoration:none;margin-bottom:24px">' +
        'Check-in invullen →' +
      '</a>' +
      '<p style="font-size:12px;color:#9CA3AF;text-align:center">AVG-conform · Anoniem · Veilig versleuteld</p>' +
      '</div>'

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + RESEND_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to:   email,
        subject: 'Vergeet je check-in niet, ' + naam,
        html,
      }),
    })

    if (res.ok) {
      sent++
    } else {
      errors.push(email + ': ' + await res.text())
      console.error('Failed to send to', email)
    }
  }

  return new Response(JSON.stringify({ sent, errors }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})

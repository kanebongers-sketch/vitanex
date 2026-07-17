// POST /api/koppelingen/ontkoppel
// Body:    { provider: "google_fit" }
// Headers: Authorization: Bearer <supabase-jwt>
//
// Verbreekt een koppeling: verwijdert de tokenrij van de ingelogde gebruiker.
//
// Vervangt deze client-side delete uit /koppelingen:
//
//   await supabase.from('wearable_tokens').delete()
//     .eq('user_id', userId).eq('provider', provider)
//   toast({ title: 'Koppeling verwijderd', variant: 'success' })
//
// Die was stil kapot. wearable_tokens had (003_wearable_tokens.sql) alleen een
// SELECT-policy voor de eigenaar en een FOR ALL-policy voor admins — géén
// DELETE-policy voor gewone gebruikers. RLS weigerde de delete dus, de fout
// werd niet gecheckt, en de toast meldde onvoorwaardelijk succes. Iedereen die
// geen admin was dacht ontkoppeld te zijn terwijl het token bleef staan.
//
// Dat is precies het soort belofte dat een product niet mag breken: iemand
// verbreekt de koppeling met zijn Google-account en gelooft dat het weg is.
//
// Nu: service-role verwijdert (RLS is na 046 volledig dicht voor de client) en
// het antwoord vertelt de waarheid.

import { NextResponse, type NextRequest } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { leesProvider } from '@/lib/koppelingen/providers'

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return NextResponse.json({ fout: 'Niet ingelogd.' }, { status: 401 })
  }

  const body: unknown = await req.json().catch(() => null)
  const provider = leesProvider((body as { provider?: unknown } | null)?.provider)
  if (!provider) {
    return NextResponse.json({ fout: 'Onbekende koppeling.' }, { status: 400 })
  }

  let admin
  try {
    admin = createAdminClient()
  } catch (fout) {
    const melding = fout instanceof Error ? fout.message : 'Configuratie ontbreekt.'
    console.error('[koppelingen/ontkoppel] configuratiefout:', melding)
    return NextResponse.json({ fout: 'Koppelingen zijn tijdelijk niet beschikbaar.' }, { status: 503 })
  }

  // `user_id` uit de sessie, niet uit de body: je ontkoppelt alleen jezelf.
  const { error } = await admin
    .from('wearable_tokens')
    .delete()
    .eq('user_id', user.id)
    .eq('provider', provider)

  if (error) {
    console.error('[koppelingen/ontkoppel] verwijderen mislukt:', error.message)
    return NextResponse.json({ fout: 'Ontkoppelen mislukt. Probeer opnieuw.' }, { status: 502 })
  }

  // Geen rij gevonden is geen fout: de uitkomst die de gebruiker wilde (er is
  // geen koppeling meer) klopt dan al. Idempotent.
  return NextResponse.json({ succes: true })
}

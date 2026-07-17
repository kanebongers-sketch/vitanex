// GET /api/koppelingen/status
// Headers: Authorization: Bearer <supabase-jwt>
//
// Geeft per provider terug óf er een koppeling is. Meer niet.
//
// Vervangt deze client-side query uit /koppelingen:
//
//   supabase.from('wearable_tokens').select('access_token')...
//     .then(({ data }) => { if (data?.access_token) setFitVerbonden(true) })
//
// Dat trok een OAuth-token de browser in om er een booleaan van te maken. De
// waarde werd nergens voor gebruikt — maar hij stond wel in het geheugen van
// elke tab, bereikbaar voor elk script op de pagina. Eén XSS en iemands Google
// Fit / Calendar / Fitbit lag open, permanent (refresh-tokens verlopen niet
// vanzelf). Zie migratie 046, die de SELECT-policy dichtzet.
//
// Deze route leest de tokens wél, maar geeft ze nooit terug: alleen booleans
// verlaten de server.

import { NextResponse, type NextRequest } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { PROVIDERS, type Provider } from '@/lib/koppelingen/providers'

export type KoppelStatus = Record<Provider, boolean>

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return NextResponse.json({ fout: 'Niet ingelogd.' }, { status: 401 })
  }

  let admin
  try {
    admin = createAdminClient()
  } catch (fout) {
    const melding = fout instanceof Error ? fout.message : 'Configuratie ontbreekt.'
    console.error('[koppelingen/status] configuratiefout:', melding)
    return NextResponse.json({ fout: 'Koppelingen zijn tijdelijk niet beschikbaar.' }, { status: 503 })
  }

  // Alleen `provider` selecteren: het token hoeft de server niet eens uit de
  // database te halen om deze vraag te beantwoorden.
  const { data, error } = await admin
    .from('wearable_tokens')
    .select('provider')
    .eq('user_id', user.id)

  if (error) {
    console.error('[koppelingen/status] lezen mislukt:', error.message)
    return NextResponse.json({ fout: 'Ophalen mislukt.' }, { status: 502 })
  }

  const gekoppeld = new Set((data ?? []).map((rij) => rij.provider))
  const status = Object.fromEntries(
    PROVIDERS.map((p) => [p, gekoppeld.has(p)]),
  ) as KoppelStatus

  return NextResponse.json(status)
}

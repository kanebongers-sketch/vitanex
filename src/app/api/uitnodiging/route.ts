// GET /api/uitnodiging?token=<hex> — kijkt een uitnodiging na vóór registratie.
//
// Deze route is bewust publiek: wie een uitnodiging opent hééft nog geen account.
// Vroeger deed de pagina deze lookup client-side, wat een `select using (true)`
// op uitnodiging_tokens vereiste — en daarmee mocht iedereen met de anon-key de
// hele tabel dumpen. Zie migratie 045.
//
// Het token zelf is de sleutel: 24 random bytes hex (002_ontbrekende_tabellen.sql
// :319). Raden kan niet, dus een publieke lookup op een volledig token is veilig
// zolang je (a) niets teruggeeft wat de client niet nodig heeft en (b) geen
// verschil maakt tussen "bestaat niet" en "al gebruikt" — dat laatste zou een
// oracle zijn waarmee je geldige tokens kunt aftasten.
//
// Geeft alleen `email` terug. `bedrijf_id` blijft expliciet server-side: de
// client mag niet meebepalen bij welk bedrijf iemand belandt (zie ./accepteer).

import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/supabase-admin'

// 24 bytes hex = 48 tekens. Scheelt een database-hit op onzin-invoer.
const TOKEN_PATROON = /^[0-9a-f]{48}$/

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token || !TOKEN_PATROON.test(token)) {
    return NextResponse.json({ fout: 'Ongeldige uitnodiging.' }, { status: 404 })
  }

  let admin
  try {
    admin = createAdminClient()
  } catch (fout) {
    const melding = fout instanceof Error ? fout.message : 'Configuratie ontbreekt.'
    console.error('[uitnodiging] configuratiefout:', melding)
    return NextResponse.json({ fout: 'Uitnodigingen zijn tijdelijk niet beschikbaar.' }, { status: 503 })
  }

  const { data, error } = await admin
    .from('uitnodiging_tokens')
    .select('email, gebruikt')
    .eq('token', token)
    .maybeSingle()

  if (error) {
    console.error('[uitnodiging] lookup mislukt:', error.message)
    return NextResponse.json({ fout: 'Opzoeken mislukt.' }, { status: 502 })
  }

  // Eén antwoord voor "bestaat niet" én "al gebruikt": geen oracle.
  if (!data || data.gebruikt) {
    return NextResponse.json({ fout: 'Ongeldige uitnodiging.' }, { status: 404 })
  }

  return NextResponse.json({ email: data.email })
}

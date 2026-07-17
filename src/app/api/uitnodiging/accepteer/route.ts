// POST /api/uitnodiging/accepteer
// Body:    { token: "<hex>", naam: "Jane" }
// Headers: Authorization: Bearer <supabase-jwt>
//
// Voltooit een uitnodiging: koppelt de zojuist geregistreerde gebruiker aan het
// bedrijf uit het token en markeert het token als gebruikt. Spiegelt bewust
// /api/hr-code/koppel — dezelfde vorm, hetzelfde auth-patroon.
//
// Vervangt twee client-side calls uit de uitnodigingspagina:
//
//   supabase.from('profiles').upsert({ ..., bedrijf_id: tokenData.bedrijf_id })
//   supabase.from('uitnodiging_tokens').update({ gebruikt: true })
//
// Waarom dat weg moest: `bedrijf_id` kwam uit client-state en was dus door de
// client te kiezen, en het markeren vereiste een publieke UPDATE-policy waarmee
// anon élke uitnodiging kon herschrijven. Zie migratie 045.
//
// De binding die het dichtzet: het token is pas geldig als het e-mailadres in de
// uitnodiging exact het geverifieerde adres van de sessie is. Een token dat je
// van iemand anders onderschept levert dus niets op — je komt er niet mee binnen
// bij een bedrijf waar je niet voor uitgenodigd bent.

import { NextResponse, type NextRequest } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'

const TOKEN_PATROON = /^[0-9a-f]{48}$/
const NAAM_MAX = 80

/**
 * Hoort deze uitnodiging bij deze sessie?
 *
 * Dit is de check die de hele route draagt: auth bewijst wie je bént, dit
 * bewijst dat de uitnodiging aan jóu gericht was. Zonder deze regel geeft een
 * onderschept token toegang tot het bedrijf waarvoor het bedoeld was.
 *
 * Vergelijking is genormaliseerd (trim + lowercase) omdat het adres in de
 * uitnodiging met de hand door HR is ingetypt, terwijl het adres in de sessie
 * van Supabase komt. "Jan@Bedrijf.nl " en "jan@bedrijf.nl" zijn dezelfde
 * persoon; strikt vergelijken zou legitieme mensen buitensluiten.
 */
export function uitnodigingHoortBij(tokenEmail: string, sessieEmail: string): boolean {
  const links = tokenEmail.trim().toLowerCase()
  const rechts = sessieEmail.trim().toLowerCase()
  // Lege invoer nooit als match laten gelden — dat zou de gate openzetten.
  if (!links || !rechts) return false
  return links === rechts
}

export async function POST(req: NextRequest) {
  // ── 1. Auth ──────────────────────────────────────────────────────────────
  const user = await getAuthenticatedUser(req)
  if (!user?.email) {
    return NextResponse.json({ fout: 'Niet ingelogd.' }, { status: 401 })
  }

  // ── 2. Body ──────────────────────────────────────────────────────────────
  const body: unknown = await req.json().catch(() => null)
  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ fout: 'Ongeldige JSON body.' }, { status: 400 })
  }

  const { token, naam } = body as { token?: unknown; naam?: unknown }

  if (typeof token !== 'string' || !TOKEN_PATROON.test(token)) {
    return NextResponse.json({ fout: 'Ongeldige uitnodiging.' }, { status: 404 })
  }

  const schoneNaam = typeof naam === 'string' ? naam.trim() : ''
  if (!schoneNaam || schoneNaam.length > NAAM_MAX) {
    return NextResponse.json({ fout: 'Vul je naam in.' }, { status: 400 })
  }

  // ── 3. Token ophalen (service-role: RLS staat lezen niet meer toe) ────────
  let admin
  try {
    admin = createAdminClient()
  } catch (fout) {
    const melding = fout instanceof Error ? fout.message : 'Configuratie ontbreekt.'
    console.error('[uitnodiging/accepteer] configuratiefout:', melding)
    return NextResponse.json({ fout: 'Uitnodigingen zijn tijdelijk niet beschikbaar.' }, { status: 503 })
  }

  const { data: uitnodiging, error: leesFout } = await admin
    .from('uitnodiging_tokens')
    .select('email, bedrijf_id, gebruikt')
    .eq('token', token)
    .maybeSingle()

  if (leesFout) {
    console.error('[uitnodiging/accepteer] lookup mislukt:', leesFout.message)
    return NextResponse.json({ fout: 'Opzoeken mislukt.' }, { status: 502 })
  }

  if (!uitnodiging || uitnodiging.gebruikt) {
    return NextResponse.json({ fout: 'Ongeldige uitnodiging.' }, { status: 404 })
  }

  // ── 4. De binding: token hoort bij díé gebruiker ──────────────────────────
  // Zonder deze check zou elk onderschept token toegang geven tot het bedrijf
  // waarvoor het bedoeld was. Auth bewijst wie je bent; dit bewijst dat de
  // uitnodiging aan jou gericht was.
  if (!uitnodigingHoortBij(uitnodiging.email, user.email)) {
    return NextResponse.json(
      { fout: 'Deze uitnodiging is voor een ander e-mailadres.' },
      { status: 403 },
    )
  }

  // ── 5. Profiel koppelen ───────────────────────────────────────────────────
  // bedrijf_id komt uit het token, niet uit de request. Rol staat vast op
  // 'medewerker': een uitnodiging levert nooit een bevoorrechte rol op.
  const { error: profielFout } = await admin
    .from('profiles')
    .upsert({
      id: user.id,
      naam: schoneNaam,
      bedrijf_id: uitnodiging.bedrijf_id,
      rol: 'medewerker',
    })

  if (profielFout) {
    console.error('[uitnodiging/accepteer] profiel mislukt:', profielFout.message)
    return NextResponse.json({ fout: 'Koppeling mislukt. Probeer opnieuw.' }, { status: 500 })
  }

  // ── 6. Token verbranden ───────────────────────────────────────────────────
  // `eq('gebruikt', false)` maakt dit een compare-and-swap. Twee tabbladen van
  // dezelfde persoon leveren dan één winnaar; de verliezer heeft in stap 5 al
  // hetzelfde profiel geschreven, dus de uitkomst is identiek. Een ánder kan
  // hier per stap 4 sowieso niet komen.
  const { error: markeerFout } = await admin
    .from('uitnodiging_tokens')
    .update({ gebruikt: true })
    .eq('token', token)
    .eq('gebruikt', false)

  if (markeerFout) {
    // Het profiel staat al goed — dit niet als harde fout terugkoppelen. Een
    // token dat blijft hangen is hooguit een HR-opruimklusje, geen blokkade.
    console.error('[uitnodiging/accepteer] markeren mislukt:', markeerFout.message)
  }

  return NextResponse.json({ succes: true, bedrijf_id: uitnodiging.bedrijf_id })
}

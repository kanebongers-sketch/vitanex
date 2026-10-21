import type { NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { handtekeningKlopt } from '@/lib/aiyourgym/stripe-handtekening'
import { adminOfNull, aygFout, aygJson } from '@/lib/aiyourgym/api'
import { meldFout } from '@/lib/club/betrouwbaarheid/melden'
import { betalenActief, clubWebhookGeheim } from '@/lib/club/betalen/config'
import { leesClubEvent } from '@/lib/club/betalen/stripe-event'
import { verwerkClubEvent, type VerwerkOpslag } from '@/lib/club/betalen/verwerk'
import { claimEvent, geefEventVrij, rondVerkoopAf, sluitOpenVerkoop, verwerkTerugbetaling, werkAccountStandBij } from '@/lib/club/betalen/opslag'

// POST /api/club-betalen/stripe
// Het Connect-webhook-endpoint voor betalen in de ledenapp (buiten /api/club:
// Stripe heeft geen sessie). Alleen Stripe: de handtekening
// (CLUB_STRIPE_WEBHOOK_SECRET) over de ruwe body is het slot. Elk event telt
// precies een keer (club_betalen_stripe_events). Zonder instellingen of met
// CLUB_BETALEN_ACTIEF uit: een nette 503, er gaat niets kapot.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BYTES = 512 * 1024
const ROUTE = '/api/club-betalen/stripe'

function opslag(admin: SupabaseClient): VerwerkOpslag {
  return {
    claimEvent: (id, type) => claimEvent(admin, id, type),
    geefEventVrij: (id) => geefEventVrij(admin, id),
    rondVerkoopAf: (a) => rondVerkoopAf(admin, a),
    sluitOpenVerkoop: (sessie, account, status) => sluitOpenVerkoop(admin, sessie, account, status),
    verwerkTerugbetaling: (intent, account, terug) => verwerkTerugbetaling(admin, intent, account, terug),
    werkAccountStandBij: (stand) => werkAccountStandBij(admin, stand),
    meld: (wat) => meldFout({ fout: wat, route: ROUTE, methode: 'POST', soort: 'handmatig' }, admin),
  }
}

export async function POST(req: NextRequest) {
  const geheim = clubWebhookGeheim()
  const admin = adminOfNull()
  if (!betalenActief() || !geheim || !admin) return aygFout('Niet ingesteld.', 503)

  const lengte = Number(req.headers.get('content-length') ?? NaN)
  if (Number.isFinite(lengte) && lengte > MAX_BYTES) return aygFout('Te groot.', 413)
  const payload = await req.text().catch(() => '')
  if (!payload || payload.length > MAX_BYTES) return aygFout('Ongeldig.', 400)
  if (!handtekeningKlopt(payload, req.headers.get('stripe-signature'), geheim, Math.floor(Date.now() / 1000))) return aygFout('Ongeldige handtekening.', 400)

  let json: unknown
  try {
    json = JSON.parse(payload)
  } catch {
    return aygFout('Ongeldig.', 400)
  }
  const event = leesClubEvent(json)
  if (!event) return aygFout('Ongeldig.', 400)

  const uitkomst = await verwerkClubEvent(event, opslag(admin))
  if (uitkomst === 'fout') {
    await meldFout({ fout: `Club-betaalevent (${event.soort}) niet verwerkt`, route: ROUTE, methode: 'POST', soort: 'handmatig' }, admin)
    return aygFout('Verwerking mislukt.', 500)
  }
  return aygJson({ ontvangen: true })
}

import { after, type NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { handtekeningKlopt } from '@/lib/aiyourgym/stripe-handtekening'
import { adminOfNull, aygFout, aygJson } from '@/lib/aiyourgym/api'
import { meldFout } from '@/lib/club/betrouwbaarheid/melden'
import { betalenActief, clubStripeSleutel, clubWebhookGeheim, lidgeldActief, sleutelIsLive } from '@/lib/club/betalen/config'
import { kiesKanaal, leesInboxEvent } from '@/lib/club/betalen/inbox/event'
import { supabaseInbox } from '@/lib/club/betalen/inbox/opslag-supabase'
import { werkInboxAf } from '@/lib/club/betalen/inbox/verwerk'
import { echteStripe } from '@/lib/club/betalen/outbox/stripe-client'
import { leesClubEvent } from '@/lib/club/betalen/stripe-event'
import { verwerkClubEvent, type VerwerkOpslag } from '@/lib/club/betalen/verwerk'
import { claimEvent, geefEventVrij, rondVerkoopAf, sluitOpenVerkoop, verwerkTerugbetaling, werkAccountStandBij } from '@/lib/club/betalen/opslag'

// POST /api/club-betalen/stripe
// Het Connect-webhook-endpoint voor betalen in de ledenapp (buiten /api/club:
// Stripe heeft geen sessie). Alleen Stripe: de handtekening
// (CLUB_STRIPE_WEBHOOK_SECRET) over de ruwe body is het slot. Elk event telt
// precies een keer (club_betalen_stripe_events). Zonder instellingen of met
// CLUB_BETALEN_ACTIEF uit: een nette 503, er gaat niets kapot.
//
// Lidgeld (alleen met CLUB_LIDGELD_ACTIEF=1): nieuwe soorten events gaan naar
// de inbox. We bewaren alleen een rij 'ontvangen' (ids, geen payload), geven
// meteen 200 en verwerken daarna (after); de cron club-inbox haalt in wat
// blijft liggen. Zonder de schakelaar werkt alles precies zoals voorheen.

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

/** De ruwe body lezen en stoppen zodra hij te groot wordt (ook zonder content-length). */
async function leesBegrensd(req: NextRequest): Promise<string | 'te_groot' | null> {
  if (!req.body) return null
  const lezer = req.body.getReader()
  const stukken: Uint8Array[] = []
  let totaal = 0
  try {
    for (;;) {
      const { done, value } = await lezer.read()
      if (done) break
      totaal += value.byteLength
      if (totaal > MAX_BYTES) {
        await lezer.cancel().catch(() => undefined)
        return 'te_groot'
      }
      stukken.push(value)
    }
  } catch {
    return null
  }
  return Buffer.concat(stukken).toString('utf8')
}

export async function POST(req: NextRequest) {
  const geheim = clubWebhookGeheim()
  const admin = adminOfNull()
  if (!betalenActief() || !geheim || !admin) return aygFout('Niet ingesteld.', 503)

  const lengte = Number(req.headers.get('content-length') ?? NaN)
  if (Number.isFinite(lengte) && lengte > MAX_BYTES) return aygFout('Te groot.', 413)
  const payload = await leesBegrensd(req)
  if (payload === 'te_groot') return aygFout('Te groot.', 413)
  if (!payload) return aygFout('Ongeldig.', 400)
  if (!handtekeningKlopt(payload, req.headers.get('stripe-signature'), geheim, Math.floor(Date.now() / 1000))) return aygFout('Ongeldige handtekening.', 400)

  let json: unknown
  try {
    json = JSON.parse(payload)
  } catch {
    return aygFout('Ongeldig.', 400)
  }
  if (kiesKanaal(json, lidgeldActief()) === 'inbox') return naarInbox(json, admin)

  const event = leesClubEvent(json)
  if (!event) return aygFout('Ongeldig.', 400)

  const uitkomst = await verwerkClubEvent(event, opslag(admin))
  if (uitkomst === 'fout') {
    await meldFout({ fout: `Club-betaalevent (${event.soort}) niet verwerkt`, route: ROUTE, methode: 'POST', soort: 'handmatig' }, admin)
    return aygFout('Verwerking mislukt.', 500)
  }
  return aygJson({ ontvangen: true })
}

async function naarInbox(json: unknown, admin: SupabaseClient) {
  const sleutel = clubStripeSleutel()
  if (!sleutel) return aygFout('Niet ingesteld.', 503)
  const e = leesInboxEvent(json)
  if (!e) return aygFout('Ongeldig.', 400)
  const live = sleutelIsLive(sleutel)
  // Een endpoint krijgt test en live; alleen de modus van onze sleutel telt.
  if (e.livemode !== live) return aygJson({ ontvangen: true })
  const inbox = supabaseInbox(admin, live)
  const bewaard = await inbox.bewaar(e)
  if (bewaard === 'fout') return aygFout('Opslaan mislukt.', 500)
  if (bewaard === 'nieuw') {
    after(async () => {
      try {
        await werkInboxAf({ opslag: inbox, stripe: echteStripe(sleutel), liveVerwacht: live, nu: () => new Date() }, { max: 1, eventId: e.eventId })
      } catch (err) {
        // De rij blijft staan; de cron club-inbox pakt hem op.
        console.error('[club/betalen] inbox direct verwerken mislukt', err instanceof Error ? err.name : 'onbekend')
      }
    })
  }
  return aygJson({ ontvangen: true })
}

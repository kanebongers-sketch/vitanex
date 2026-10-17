import type { NextRequest } from 'next/server'
import { webhookGeheim } from '@/lib/aiyourgym/config'
import { handtekeningKlopt } from '@/lib/aiyourgym/stripe-handtekening'
import { leesEvent } from '@/lib/aiyourgym/stripe-event'
import { verwerkEvent } from '@/lib/aiyourgym/verwerk'
import { standaardDeps } from '@/lib/aiyourgym/welkom-mail'
import { adminOfNull, aygFout, aygJson } from '@/lib/aiyourgym/api'

// POST /api/aiyourgym/stripe/webhook
// Alleen Stripe: de handtekening (AIYOURGYM_STRIPE_WEBHOOK_SECRET) over de ruwe
// body is het slot. Elk event telt precies een keer (ayg_stripe_events).
// checkout.session.completed richt de sportschool in; customer.subscription.*
// en invoice.payment_failed werken de status bij. Bij een fout een 500, zodat
// Stripe het later opnieuw probeert.

export const dynamic = 'force-dynamic'

/** Ruim boven elk Stripe-event; groter lezen we niet. */
const MAX_BYTES = 512 * 1024

export async function POST(req: NextRequest) {
  const geheim = webhookGeheim()
  const admin = adminOfNull()
  if (!geheim || !admin) return aygFout('Niet ingesteld.', 503)

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
  const event = leesEvent(json)
  if (!event) return aygFout('Ongeldig.', 400)

  const uitkomst = await verwerkEvent(admin, event, standaardDeps())
  if (uitkomst === 'fout') return aygFout('Verwerking mislukt.', 500)
  return aygJson({ ontvangen: true })
}

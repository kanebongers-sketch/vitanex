// ─── LifeOS binnen MentaForce — WhatsApp-webhook (Vita onderweg, óók op WhatsApp) ─
// De publieke ingang waar Meta's WhatsApp Cloud API elk inkomend bericht of elke
// spraakmemo naartoe pusht. Spiegelt de Telegram-webhook: dezelfde keten, ander
// kanaal.
//
//   GET  — Meta's webhook-verificatie (hub.challenge terug bij het juiste token).
//   POST — verifieer handtekening → lees bericht → allowlist → snelheidslimiet →
//          (spraak: download + transcribeer) → intentie → actie → uitvoeren →
//          antwoord terug via de Cloud API.
//
// ─── GEEN SESSIE, DUS GEEN FOUNDER-GATE ─────────────────────────────────────
// Net als de Telegram-webhook gebruikt deze GEEN `vereisLifeosToegang`: Meta pusht
// server-to-server, er is geen ingelogde sessie. De beveiliging is drieledig:
//   1. de X-Hub-Signature-256 (HMAC met de app-secret) — bewijst "van Meta";
//   2. de afzender-allowlist (bewijst "van Kane") — FAIL-CLOSED, zie `toegang.ts`;
//   3. een snelheidslimiet per afzender (begrenst de schade als 1 en 2 ooit lekken).
// De schrijf naar het LifeOS-project loopt via de gedeelde service-role-adapter
// (`maakOpslag`) op de vaste `lifeosUserId()` — single-tenant, zonder sessie-gate.

import { NextResponse, type NextRequest } from 'next/server'
import { geheimGelijk } from '@/lib/lifeos/auth/geheim'
import { leesWhatsAppBericht, type WhatsAppBericht } from '@/lib/lifeos/whatsapp/update'
import { beoordeelAfzender } from '@/lib/lifeos/whatsapp/toegang'
import { handtekeningGeldig } from '@/lib/lifeos/whatsapp/handtekening'
import { maakWhatsAppClient, type WhatsAppClient } from '@/lib/lifeos/whatsapp/client'
import { bepaalActie, antwoordTekst } from '@/lib/lifeos/telegram/antwoord'
import { bepaalIntentie, type IntentieModel } from '@/lib/lifeos/intentie/intentie'
import { maakAnthropicModel } from '@/lib/lifeos/intentie/intentie-model'
import { voerUit, type UitvoerDeps } from '@/lib/lifeos/telegram/uitvoeren'
import { maakWhisperTranscriber, type Transcriber } from '@/lib/lifeos/telegram/transcribe'
import { webhookLimiet } from '@/lib/lifeos/telegram/limiet'
import { maakOpslag } from '@/lib/lifeos/capture/opslag-adapter'
import { lifeosUserId } from '@/lib/lifeos/admin'

// node:crypto (handtekening), FormData en Buffer zijn Node-API's — Node-runtime.
export const runtime = 'nodejs'
// Een webhook mag nooit gecachet of geprerenderd worden.
export const dynamic = 'force-dynamic'

/** Meta zet zijn HMAC-handtekening van de rauwe body in deze header. */
const HANDTEKENING_HEADER = 'x-hub-signature-256'

// ─── GET: de webhook-verificatie ────────────────────────────────────────────
// Bij het instellen stuurt Meta één GET met ?hub.mode=subscribe&hub.verify_token=
// …&hub.challenge=…. Klopt het verify-token (in constante tijd), dan echoën we de
// challenge als PLATTE TEKST met 200 — anders 403. Zo bewijst onze server dat hij
// het gedeelde token kent, precies zoals Meta het vereist.
export async function GET(req: NextRequest): Promise<NextResponse> {
  const params = req.nextUrl.searchParams
  const mode = params.get('hub.mode')
  const token = params.get('hub.verify_token')
  const challenge = params.get('hub.challenge')

  const tokenGoed = geheimGelijk(process.env.LIFEOS_WHATSAPP_VERIFY_TOKEN ?? '', token)
  if (mode === 'subscribe' && tokenGoed && challenge !== null) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  }
  return new NextResponse(null, { status: 403 })
}

// ─── POST: een inkomend bericht ─────────────────────────────────────────────

/**
 * Altijd snel 200 na een geldige handtekening — óók bij een verwerkingsfout. Bij
 * een niet-2xx blijft Meta het bericht herhalen; dat willen we niet. De fout is dan
 * al server-side gelogd en, waar mogelijk, aan de gebruiker teruggemeld.
 */
function ack(): NextResponse {
  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Lees de RAUWE body één keer: de handtekening is berekend over precies deze
  //    bytes, dus we mogen 'm niet eerst als JSON parsen.
  const rauw = await req.text()

  if (!handtekeningGeldig(rauw, req.headers.get(HANDTEKENING_HEADER), process.env.LIFEOS_WHATSAPP_APP_SECRET)) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  // 2. Parse de payload. Onleesbare JSON of geen bruikbaar bericht (bv. een
  //    status-callback: bezorgd/gelezen) → netjes acken, niets doen.
  let payload: unknown
  try {
    payload = JSON.parse(rauw)
  } catch {
    return ack()
  }
  const bericht = leesWhatsAppBericht(payload)
  if (!bericht) return ack()

  // 2b. Alleen jouw eigen nummer mag de bot bedienen. Een vreemde krijgt geen
  //     antwoord en er wordt niets aangemaakt — stil acken. Wél server-side het
  //     nummer loggen, zodat je je eigen `from` kunt vinden voor de allowlist.
  const besluit = beoordeelAfzender(bericht.from, process.env.LIFEOS_WHATSAPP_ALLOWED_FROM)
  if (besluit.soort === 'geweigerd') {
    console.warn(
      `[lifeos/whatsapp] bericht van niet-toegestaan nummer genegeerd — from: ${bericht.from}. Zet dit nummer in LIFEOS_WHATSAPP_ALLOWED_FROM om de bot te activeren.`,
    )
    return ack()
  }

  // 2c. Snelheidslimiet vóór élke dure stap (Groq + Claude). Ná de allowlist, zodat
  //     de teller in normaal bedrijf alleen jouw eigen nummer bevat.
  const ruimte = webhookLimiet.toets(bericht.from, Date.now())
  if (ruimte.soort === 'te_snel') return ack()

  // 3. Verwerk. Elke fout wordt gelogd; Meta krijgt hoe dan ook een 200.
  try {
    await verwerkBericht(bericht, {
      userId: lifeosUserId(),
      client: maakWhatsAppClient(),
      transcriber: maakWhisperTranscriber(),
      model: maakAnthropicModel(),
    })
  } catch (fout) {
    console.error('[lifeos/whatsapp] verwerken mislukt', fout)
  }
  return ack()
}

/** Alles wat `verwerkBericht` nodig heeft — injecteerbaar, dus zonder netwerk testbaar. */
export interface VerwerkDeps {
  userId: string
  client: WhatsAppClient
  transcriber: Transcriber
  model: IntentieModel
  /** Voor deterministische tests; standaard "nu". */
  nu?: Date
  /** De opslaglaag voor `voerUit`; standaard de echte (lazy gebouwd). */
  opslag?: UitvoerDeps
}

/**
 * De hele keten voor één bericht. Bij een fout in de pijplijn laten we de gebruiker
 * niet in het ongewisse: een korte, eerlijke melding terug.
 */
export async function verwerkBericht(bericht: WhatsAppBericht, deps: VerwerkDeps): Promise<void> {
  const { client } = deps
  try {
    const tekst = await haalTekst(bericht, client, deps.transcriber)
    if (tekst === null) return // een speciaal geval is al beantwoord door haalTekst

    const nu = deps.nu ?? new Date()
    const intentie = await bepaalIntentie(tekst, deps.model, nu)
    const actie = bepaalActie(intentie)
    const { gelukt } = await voerUit(deps.userId, intentie, actie, deps.opslag ?? maakOpslag(), nu)
    await client.stuurBericht(bericht.from, antwoordTekst(intentie, actie, gelukt))
  } catch (fout) {
    console.error('[lifeos/whatsapp] pijplijn mislukt', fout)
    await client
      .stuurBericht(bericht.from, 'Er ging iets mis bij het verwerken van je bericht. Probeer het zo nog eens.')
      .catch(() => {})
  }
}

/**
 * Haalt de te classificeren tekst uit het bericht.
 *
 * Geeft `null` als er niets te classificeren valt (genegeerd type): dan is de
 * gebruiker hier al netjes geantwoord.
 */
async function haalTekst(
  bericht: WhatsAppBericht,
  client: WhatsAppClient,
  transcriber: Transcriber,
): Promise<string | null> {
  if (bericht.soort === 'genegeerd') {
    await client.stuurBericht(
      bericht.from,
      "Ik verwerk alleen tekstberichten en spraakmemo's. Stuur je idee als tekst of als spraak.",
    )
    return null
  }

  if (bericht.soort === 'tekst') {
    return bericht.tekst
  }

  // Spraak: download de media en transcribeer (Groq/Whisper — zie transcribe.ts).
  const bestand = await client.haalMedia(bericht.mediaId)
  return transcriber.transcribeer(bestand)
}

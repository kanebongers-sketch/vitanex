// ─── LifeOS binnen MentaForce — WhatsApp via Twilio (webhook) ───────────────
// De publieke ingang waar Twilio elk inkomend WhatsApp-bericht naartoe pusht,
// als `application/x-www-form-urlencoded`. Zelfde keten als de Telegram-bot en de
// Meta-WhatsApp-webhook — ander transport.
//
// Waarom Twilio náást Meta: de Meta Cloud API vereist een Meta Business Portfolio;
// kan/wil je dat niet, dan is Twilio de weg zonder Meta-account. Het "brein"
// (intentie → uitvoeren, Groq-transcriptie) is gedeeld; alleen de rand verschilt.
//
// ─── GEEN SESSIE, DUS GEEN FOUNDER-GATE ─────────────────────────────────────
// Twilio pusht server-to-server. De beveiliging is drieledig:
//   1. de X-Twilio-Signature (HMAC-SHA1 met de Auth Token) — bewijst "van Twilio";
//   2. de afzender-allowlist (bewijst "van Kane") — FAIL-CLOSED;
//   3. een snelheidslimiet per afzender.
//
// ─── ANTWOORDEN MET TwiML ───────────────────────────────────────────────────
// We antwoorden synchroon met TwiML (XML) in de webhook-response — dan is er geen
// uitgaande REST-call en geen extra "from"-nummer/credential nodig om te sturen.
// De pijplijn (Groq + Claude) rondt ruim binnen Twilio's venster af.

import { NextResponse, type NextRequest } from 'next/server'
import { leesTwilioBericht, type TwilioBericht } from '@/lib/lifeos/whatsapp/twilio/update'
import { handtekeningGeldig } from '@/lib/lifeos/whatsapp/twilio/handtekening'
import { bouwTwimlAntwoord, bouwLeegTwiml } from '@/lib/lifeos/whatsapp/twilio/twiml'
import { maakTwilioClient, type TwilioClient } from '@/lib/lifeos/whatsapp/twilio/client'
import { beoordeelAfzender } from '@/lib/lifeos/whatsapp/toegang'
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
export const dynamic = 'force-dynamic'

/** Twilio zet zijn HMAC-handtekening in deze header. */
const HANDTEKENING_HEADER = 'x-twilio-signature'

/**
 * De EXACTE webhook-URL waarover Twilio de handtekening berekent — de bij Twilio
 * geconfigureerde URL, niet `req.url` (die achter Render's proxy anders is). Uit
 * `APP_URL` zodat 'm één plek heeft. Moet exact matchen met wat je in de Twilio-
 * console invult.
 */
function webhookUrl(): string {
  const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? ''
  return `${appUrl.replace(/\/+$/, '')}/api/lifeos/whatsapp/twilio/webhook`
}

/** Een TwiML-response met de juiste content-type (Twilio verwacht text/xml). */
function twiml(body: string): NextResponse {
  return new NextResponse(body, {
    status: 200,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Lees de RAUWE form-body één keer en parse 'm naar params: de handtekening
  //    is over precies deze parameters berekend.
  const rauw = await req.text()
  const params = new URLSearchParams(rauw)

  if (
    !handtekeningGeldig(
      webhookUrl(),
      params,
      req.headers.get(HANDTEKENING_HEADER),
      process.env.TWILIO_AUTH_TOKEN,
    )
  ) {
    return new NextResponse(null, { status: 403 })
  }

  // 2. Narrow het bericht. Niets bruikbaars → een leeg TwiML (200), geen actie.
  const bericht = leesTwilioBericht(params)
  if (!bericht) return twiml(bouwLeegTwiml())

  // 2b. Alleen jouw eigen nummer mag de bot bedienen (FAIL-CLOSED). Een vreemde
  //     krijgt geen antwoord; wél server-side loggen zodat je je `from` vindt.
  const besluit = beoordeelAfzender(bericht.from, process.env.LIFEOS_WHATSAPP_ALLOWED_FROM)
  if (besluit.soort === 'geweigerd') {
    console.warn(
      `[lifeos/whatsapp-twilio] bericht van niet-toegestaan nummer genegeerd — from: ${bericht.from}. Zet dit nummer (alleen cijfers) in LIFEOS_WHATSAPP_ALLOWED_FROM.`,
    )
    return twiml(bouwLeegTwiml())
  }

  // 2c. Snelheidslimiet vóór de dure stappen (Groq + Claude). Ná de allowlist.
  const ruimte = webhookLimiet.toets(bericht.from, Date.now())
  if (ruimte.soort === 'te_snel') return twiml(bouwLeegTwiml())

  // 3. Verwerk en antwoord in TwiML. `verwerkBericht` geeft altijd een tekst terug
  //    (ook bij een fout), zodat de gebruiker nooit in het ongewisse blijft.
  const antwoord = await verwerkBericht(bericht, {
    userId: lifeosUserId(),
    client: maakTwilioClient(),
    transcriber: maakWhisperTranscriber(),
    model: maakAnthropicModel(),
  })
  return twiml(bouwTwimlAntwoord(antwoord))
}

/** Alles wat `verwerkBericht` nodig heeft — injecteerbaar, dus zonder netwerk testbaar. */
export interface VerwerkDeps {
  userId: string
  client: TwilioClient
  transcriber: Transcriber
  model: IntentieModel
  /** Voor deterministische tests; standaard "nu". */
  nu?: Date
  /** De opslaglaag voor `voerUit`; standaard de echte (lazy gebouwd). */
  opslag?: UitvoerDeps
}

/**
 * De hele keten voor één bericht → de antwoordtekst (voor in de TwiML). Geeft
 * ALTIJD een string terug: een genegeerd type krijgt uitleg, een fout een eerlijke
 * melding — nooit stilte.
 */
export async function verwerkBericht(bericht: TwilioBericht, deps: VerwerkDeps): Promise<string> {
  try {
    if (bericht.soort === 'genegeerd') {
      return "Ik verwerk alleen tekstberichten en spraakmemo's. Stuur je idee als tekst of als spraak."
    }

    const tekst =
      bericht.soort === 'tekst'
        ? bericht.tekst
        : await deps.transcriber.transcribeer(await deps.client.haalMedia(bericht.mediaUrl))

    const nu = deps.nu ?? new Date()
    const intentie = await bepaalIntentie(tekst, deps.model, nu)
    const actie = bepaalActie(intentie)
    const { gelukt } = await voerUit(deps.userId, intentie, actie, deps.opslag ?? maakOpslag(), nu)
    return antwoordTekst(intentie, actie, gelukt)
  } catch (fout) {
    console.error('[lifeos/whatsapp-twilio] pijplijn mislukt', fout)
    return 'Er ging iets mis bij het verwerken van je bericht. Probeer het zo nog eens.'
  }
}

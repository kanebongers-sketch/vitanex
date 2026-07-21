// ─── LifeOS binnen MentaForce — Telegram-webhook (functie 4: Vita onderweg) ──
// De publieke ingang waar Telegram elke inkomende spraakmemo of tekst naartoe
// pusht. De hele keten in één plek bedraad:
//
//   verifieer secret → lees bericht → (spraak: download + transcribeer) →
//   bepaal intentie → bepaal actie → voer uit → antwoord terug naar Telegram.
//
// Dit bestand is de COMPOSITIE-PLEK: het knoopt de echte implementaties aan de
// zuivere, injecteerbare logica (`voerUit`, `bepaalIntentie`, `Transcriber`,
// `TelegramBot`). De losse stukken zijn elk zonder netwerk te testen; hier komen
// ze samen.
//
// ─── GEEN SESSIE, DUS GEEN FOUNDER-GATE ─────────────────────────────────────
// Anders dan élke andere LifeOS-route gebruikt deze GEEN `vereisLifeosToegang`:
// Telegram pusht server-to-server, er is geen ingelogde MentaForce-sessie om
// tegen te gate'n. De beveiliging is daarom drieledig en blijft dat exact:
//   1. het gedeelde secret, in CONSTANTE tijd vergeleken (bewijst "van Telegram");
//   2. de chat-id-allowlist (bewijst "van jou") — FAIL-CLOSED, zie `toegang.ts`;
//   3. een snelheidslimiet per chat (begrenst de schade als 1 en 2 ooit lekken).
// De schrijf naar het LifeOS-project loopt via de service-role-client
// (`createLifeosAdminClient`) op de vaste `lifeosUserId()` — single-tenant, precies
// zoals de andere LifeOS-opslag, alleen zonder de sessie-gate ervoor.

import { NextResponse, type NextRequest } from 'next/server'
import { geheimGelijk } from '@/lib/lifeos/auth/geheim'

import { leesTelegramBericht, spraakTeLang, MAX_SPRAAK_SECONDEN, type TelegramBericht } from '@/lib/lifeos/telegram/update'
import { bepaalActie, antwoordTekst } from '@/lib/lifeos/telegram/antwoord'
import { bepaalIntentie, type IntentieModel } from '@/lib/lifeos/intentie/intentie'
import { maakAnthropicModel } from '@/lib/lifeos/intentie/intentie-model'
import { voerUit, type UitvoerDeps } from '@/lib/lifeos/telegram/uitvoeren'
import { maakTelegramBot, type TelegramBot } from '@/lib/lifeos/telegram/bot'
import { maakWhisperTranscriber, type Transcriber } from '@/lib/lifeos/telegram/transcribe'
import { beoordeelChatId, leerModusAntwoord } from '@/lib/lifeos/telegram/toegang'
import { webhookLimiet, waarschuwLimiet, teSnelAntwoord } from '@/lib/lifeos/telegram/limiet'
import { lifeosUserId } from '@/lib/lifeos/admin'
import { maakOpslag } from '@/lib/lifeos/capture/opslag-adapter'

// node:crypto, FormData en Buffer zijn Node-API's — dwing de Node-runtime af.
export const runtime = 'nodejs'
// Een webhook mag nooit gecachet of geprerenderd worden.
export const dynamic = 'force-dynamic'

/** Telegram zet het geheim dat wij bij setWebhook meegaven in deze header. */
const SECRET_HEADER = 'x-telegram-bot-api-secret-token'

/**
 * De ENIGE beveiliging van deze publieke route (naast de allowlist): het secret
 * dat alleen Telegram en wij kennen. Geen geconfigureerd secret → niemand komt
 * binnen (fail-closed; die keuze zit in `geheimGelijk`).
 *
 * De constant-tijd-vergelijking stond hier als eigen kopie. Ze is verhuisd naar
 * `@/lib/lifeos/auth/geheim` omdat de cron-briefing exact hetzelfde probleem
 * heeft — publieke route, geen sessie, geheim in een header — en daar een kale
 * `===` gebruikte. Twee sloten die hetzelfde horen te doen, horen hetzelfde slot
 * te zijn.
 */
function secretGeldig(req: NextRequest): boolean {
  return geheimGelijk(
    process.env.LIFEOS_TELEGRAM_WEBHOOK_SECRET ?? '',
    req.headers.get(SECRET_HEADER),
  )
}

/**
 * Defense-in-depth naast het secret. Het secret bewijst dat een request van
 * Telegram komt — niet dat JIJ de afzender bent: wie de bot-naam kent, kan hem
 * ook aanschrijven en taken/afspraken in jouw LifeOS laten maken.
 *
 * De beslissing zelf is puur en staat in `telegram/toegang.ts`; hier lezen we
 * alleen de env-waarde. FAIL-CLOSED: geen allowlist → niets komt binnen. De
 * afweging (en de `leer-modus`-escape uit het kip-ei) staat daar uitgelegd.
 */
function beoordeelChat(chatId: number) {
  return beoordeelChatId(chatId, process.env.LIFEOS_TELEGRAM_ALLOWED_CHAT_ID)
}

/**
 * Altijd 200 na een geldige secret — óók bij een verwerkingsfout. Bij een niet-200
 * blijft Telegram het bericht herhalen; dat willen we niet. De fout is dan al
 * server-side gelogd en, waar mogelijk, aan de gebruiker teruggemeld.
 */
function ack(): NextResponse {
  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Verifieer eerst. Mismatch of ontbrekend secret → 401, en verder niets.
  if (!secretGeldig(req)) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  // 2. Lees de update. Onleesbare JSON of geen bruikbaar bericht: netjes acken.
  let update: unknown
  try {
    update = await req.json()
  } catch {
    return ack()
  }
  const bericht = leesTelegramBericht(update)
  if (!bericht) return ack()

  // 2b. Alleen jouw eigen chat mag hem bedienen. Een vreemde krijgt geen antwoord
  // en er wordt niets aangemaakt — stil acken, zodat we het bestaan van de bot
  // niet bevestigen en Telegram niet gaat herhalen.
  const besluit = beoordeelChat(bericht.chatId)
  if (besluit.soort === 'geweigerd') {
    // Stil naar de afzender toe (we bevestigen het bestaan van de bot niet), maar
    // WÉL server-side loggen: dit is hoe je je eigen chat-id vindt om op de
    // allowlist te zetten (`LIFEOS_TELEGRAM_ALLOWED_CHAT_ID`). Alleen het chat-id,
    // niets uit het bericht — dat lekt niets nieuws en staat enkel in je eigen log.
    console.warn(
      `[lifeos/telegram] bericht van niet-toegestane chat genegeerd — chat-id: ${bericht.chatId}. Zet dit id in LIFEOS_TELEGRAM_ALLOWED_CHAT_ID om de bot te activeren.`,
    )
    return ack()
  }

  // 2c. Snelheidslimiet vóór élke dure stap (Whisper + Claude) én vóór het
  // leer-modus-antwoord: ook een terugmelding is een Telegram-call die je niet
  // ongelimiteerd wilt kunnen uitlokken. De limiet staat ná de allowlist, zodat
  // de teller in normaal bedrijf alleen jouw eigen chat-id's kan bevatten.
  const nu = Date.now()
  const sleutel = String(bericht.chatId)
  const ruimte = webhookLimiet.toets(sleutel, nu)
  if (ruimte.soort === 'te_snel') {
    // Wél zeggen dat we niets doen (fout ≠ stil), maar hooguit één keer per
    // venster: anders lokt wie blijft pompen 80 "even rustig"-berichten uit en is
    // de rem zelf de versterker geworden. Zie `waarschuwLimiet`.
    if (waarschuwLimiet.toets(sleutel, nu).soort === 'ruimte') {
      await stuurStil(bericht.chatId, teSnelAntwoord(ruimte.opnieuwOverSeconden))
    }
    return ack()
  }

  // 2d. Leer-modus: alleen het chat-id terugmelden. Geen model, geen Whisper,
  // geen enkele schrijf — zie `toegang.ts` voor waarom dat strikt moet.
  if (besluit.soort === 'leer_modus') {
    await stuurStil(bericht.chatId, leerModusAntwoord(bericht.chatId))
    return ack()
  }

  // 3. Verwerk. Elke fout wordt gelogd; Telegram krijgt hoe dan ook een 200.
  try {
    await verwerkBericht(bericht, {
      userId: lifeosUserId(),
      bot: maakTelegramBot(),
      transcriber: maakWhisperTranscriber(),
      model: maakAnthropicModel(),
    })
  } catch (fout) {
    console.error('[lifeos/telegram] verwerken mislukt', fout)
  }
  return ack()
}

/**
 * Een los bericht sturen zonder de rest te laten omvallen.
 *
 * `maakTelegramBot()` gooit als de bot-token ontbreekt, en dit zijn de twee
 * plekken (limiet, leer-modus) waar dat de enige actie is. De fout wordt gelogd
 * — niet stil ingeslikt — maar Telegram krijgt hoe dan ook zijn 200, anders
 * herhaalt hij hetzelfde bericht en tikt de limiet nog een keer aan.
 */
async function stuurStil(chatId: number, tekst: string): Promise<void> {
  try {
    await maakTelegramBot().stuurBericht(chatId, tekst)
  } catch (fout) {
    console.error('[lifeos/telegram] terugmelden mislukt', fout)
  }
}

/** Alles wat `verwerkBericht` nodig heeft — injecteerbaar, dus zonder netwerk testbaar. */
export interface VerwerkDeps {
  userId: string
  bot: TelegramBot
  transcriber: Transcriber
  model: IntentieModel
  /** Voor deterministische tests; standaard "nu". */
  nu?: Date
  /** De opslaglaag voor `voerUit`; standaard de echte (lazy gebouwd). */
  opslag?: UitvoerDeps
}

/**
 * De hele keten voor één bericht. Bij een fout in de pijplijn laten we de
 * gebruiker niet in het ongewisse: een korte, eerlijke melding terug.
 */
export async function verwerkBericht(bericht: TelegramBericht, deps: VerwerkDeps): Promise<void> {
  const { bot } = deps
  try {
    const tekst = await haalTekst(bericht, bot, deps.transcriber)
    if (tekst === null) return // een speciaal geval is al beantwoord door haalTekst

    const nu = deps.nu ?? new Date()
    const intentie = await bepaalIntentie(tekst, deps.model, nu)
    const actie = bepaalActie(intentie)
    const { gelukt } = await voerUit(deps.userId, intentie, actie, deps.opslag ?? maakOpslag(), nu)
    await bot.stuurBericht(bericht.chatId, antwoordTekst(intentie, actie, gelukt))
  } catch (fout) {
    console.error('[lifeos/telegram] pijplijn mislukt', fout)
    // Beste inspanning; als zelfs dit faalt, is er niets meer te doen dan loggen.
    await bot
      .stuurBericht(bericht.chatId, 'Er ging iets mis bij het verwerken van je bericht. Probeer het zo nog eens.')
      .catch(() => {})
  }
}

/**
 * Haalt de te classificeren tekst uit het bericht.
 *
 * Geeft `null` als er niets te classificeren valt (genegeerd type, of een te lange
 * spraakmemo): in die gevallen is de gebruiker hier al netjes geantwoord.
 */
async function haalTekst(
  bericht: TelegramBericht,
  bot: TelegramBot,
  transcriber: Transcriber,
): Promise<string | null> {
  if (bericht.soort === 'genegeerd') {
    await bot.stuurBericht(
      bericht.chatId,
      "Ik verwerk alleen tekstberichten en spraakmemo's. Stuur je idee als tekst of als spraak.",
    )
    return null
  }

  if (bericht.soort === 'tekst') {
    return bericht.tekst
  }

  // Spraak.
  if (spraakTeLang(bericht)) {
    const maxMin = Math.round(MAX_SPRAAK_SECONDEN / 60)
    await bot.stuurBericht(bericht.chatId, `Die spraakmemo is te lang (max ${maxMin} min). Splits hem even op.`)
    return null
  }
  if (!bericht.voiceFileId) return null // defensief; 'spraak' hoort altijd een file_id te hebben

  const bestand = await bot.haalBestand(bericht.voiceFileId)
  return transcriber.transcribeer(bestand)
}

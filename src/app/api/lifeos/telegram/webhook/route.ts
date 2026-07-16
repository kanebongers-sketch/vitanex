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
// tegen te gate'n. De beveiliging is daarom tweeledig en blijft dat exact:
//   1. het gedeelde secret, in CONSTANTE tijd vergeleken (bewijst "van Telegram");
//   2. de chat-id-allowlist (bewijst "van jou").
// De schrijf naar het LifeOS-project loopt via de service-role-client
// (`createLifeosAdminClient`) op de vaste `lifeosUserId()` — single-tenant, precies
// zoals de andere LifeOS-opslag, alleen zonder de sessie-gate ervoor.

import { NextResponse, type NextRequest } from 'next/server'
import { createHash, timingSafeEqual } from 'node:crypto'

import { leesTelegramBericht, spraakTeLang, MAX_SPRAAK_SECONDEN, type TelegramBericht } from '@/lib/lifeos/telegram/update'
import { bepaalActie, antwoordTekst } from '@/lib/lifeos/telegram/antwoord'
import { bepaalIntentie, type IntentieModel } from '@/lib/lifeos/intentie/intentie'
import { maakAnthropicModel } from '@/lib/lifeos/intentie/intentie-model'
import { voerUit, type UitvoerDeps } from '@/lib/lifeos/telegram/uitvoeren'
import { maakTelegramBot, type TelegramBot } from '@/lib/lifeos/telegram/bot'
import { maakWhisperTranscriber, type Transcriber } from '@/lib/lifeos/telegram/transcribe'
import { createLifeosAdminClient, lifeosUserId } from '@/lib/lifeos/admin'
import { maakTaak as maakTaakInDb } from '@/lib/lifeos/taken/opslag'
import { maakNotitie as maakNotitieInDb } from '@/lib/lifeos/notities/opslag'
import { maakAgendaEvent } from '@/lib/lifeos/agenda/schrijven'

// node:crypto, FormData en Buffer zijn Node-API's — dwing de Node-runtime af.
export const runtime = 'nodejs'
// Een webhook mag nooit gecachet of geprerenderd worden.
export const dynamic = 'force-dynamic'

/** Telegram zet het geheim dat wij bij setWebhook meegaven in deze header. */
const SECRET_HEADER = 'x-telegram-bot-api-secret-token'

/**
 * De échte databaseschrijf-operaties voor `voerUit`. `voerUit` blijft puur en
 * injecteerbaar; hier krijgt hij de echte opslaglaag op het LifeOS-project.
 *
 * ÉÉN service-role-client, gedeeld door de drie schrijf-adapters. Bewust een
 * factory (geen module-const): `createLifeosAdminClient()` leest de LifeOS-env en
 * gooit als die ontbreekt. Door 'm pas hier — ná de secret- en allowlist-gate — te
 * bouwen, heeft een import van deze route (bv. in de tests) geen LifeOS-env nodig
 * en bouwt de 401-tak nooit een client.
 *
 * De MentaForce-opslagfuncties nemen `admin` als EERSTE parameter (anders dan de
 * standalone); de adapters geven de gedeelde client door en houden zo het
 * `UitvoerDeps`-contract `(userId, nieuw)` intact.
 *
 * `maakAgendaEvent` GOOIT bij mislukking (`AgendaSchrijfFout`) en geeft anders het
 * event terug — een andere vorm dan `maakTaak`/`maakNotitie`, die een `Uitkomst`
 * teruggeven. De agenda-adapter maakt er één contract van: gelukt=true/false. De
 * fout wordt server-side gelogd (fout ≠ stil) en niet als een leeg succes verstopt.
 * Er wordt bewust alleen de fout gelogd — nooit de intentie-inhoud of de tokens.
 */
function maakOpslag(): UitvoerDeps {
  const admin = createLifeosAdminClient()
  return {
    maakTaak: (userId, nieuw) => maakTaakInDb(admin, userId, nieuw),
    maakNotitie: (userId, nieuw) => maakNotitieInDb(admin, userId, nieuw),
    maakAgenda: async (userId, invoer) => {
      try {
        await maakAgendaEvent(admin, userId, invoer)
        return { ok: true }
      } catch (fout) {
        console.error('[lifeos/telegram] agenda-afspraak aanmaken mislukt', fout)
        return { ok: false }
      }
    },
  }
}

/**
 * Constant-tijd vergelijking van twee geheimen.
 *
 * We hashen eerst naar 32 vaste bytes en vergelijken die met `timingSafeEqual`.
 * Zo lekt de vergelijking niet de lengte van het geheim (die eis stelt
 * `timingSafeEqual` zelf: even lange buffers) en blijft ze constant-tijd.
 */
function veiligGelijk(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest()
  const hb = createHash('sha256').update(b).digest()
  return timingSafeEqual(ha, hb)
}

/**
 * De ENIGE beveiliging van deze publieke route (naast de allowlist): het secret
 * dat alleen Telegram en wij kennen. Geen geconfigureerd secret → niemand komt
 * binnen (fail-closed).
 */
function secretGeldig(req: NextRequest): boolean {
  const verwacht = process.env.LIFEOS_TELEGRAM_WEBHOOK_SECRET
  if (!verwacht) return false
  const gegeven = req.headers.get(SECRET_HEADER)
  if (!gegeven) return false
  return veiligGelijk(gegeven, verwacht)
}

/**
 * Defense-in-depth naast het secret. Het secret bewijst dat een request van
 * Telegram komt — niet dat JIJ de afzender bent: wie de bot-naam kent, kan hem
 * ook aanschrijven en taken/afspraken in jouw LifeOS laten maken.
 *
 * `LIFEOS_TELEGRAM_ALLOWED_CHAT_ID` (komma-gescheiden) sluit dat af tot jouw eigen
 * chat(s). Bewust NIET fail-closed: niet gezet → het secret blijft de enige
 * gate. Anders is het een kip-ei — je chat-id ken je pas ná je eerste bericht.
 */
export function chatIdToegestaan(chatId: number): boolean {
  const ruw = process.env.LIFEOS_TELEGRAM_ALLOWED_CHAT_ID
  if (!ruw || ruw.trim().length === 0) return true // geen allowlist → secret is de gate
  const toegestaan = ruw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
  return toegestaan.includes(String(chatId))
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

  // 2b. Alleen jouw eigen chat mag hem bedienen (als er een allowlist staat). Een
  // vreemde krijgt geen antwoord en er wordt niets aangemaakt — stil acken, zodat
  // we het bestaan van de bot niet bevestigen en Telegram niet gaat herhalen.
  if (!chatIdToegestaan(bericht.chatId)) return ack()

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

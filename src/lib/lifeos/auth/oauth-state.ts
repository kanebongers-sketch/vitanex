// ─── LifeOS — OAuth state ───────────────────────────────────────────────────
// CSRF-bescherming voor de koppelingen (Whoop, Oura, Garmin, Samsung, agenda,
// mail). De `state`-parameter reist mee naar de provider en komt terug in de
// callback; wij ondertekenen hem zodat we bij terugkomst weten dat hij van ons
// komt en bij wélke dienst hij hoort.
//
// Zonder dit kan iemand je een callback-URL laten openen en jouw LifeOS aan
// zíjn Whoop-account koppelen (of andersom). De handtekening maakt dat
// onmogelijk: je kunt geen geldige state maken zonder het geheim.
//
// GEPORT UIT MENTAFORCE, met twee bewuste wijzigingen:
//
//  1. Geen `uid` in de payload. LifeOS is single-tenant — er ís maar één
//     gebruiker, dus een user-binding in de state voegt niets toe. In plaats
//     daarvan binden we de `dienst`, zodat een state voor Whoop niet als state
//     voor Oura hergebruikt kan worden.
//
//  2. Geen terugval op SUPABASE_SERVICE_ROLE_KEY als geheim. MentaForce doet dat
//     wel. Sleutelscheiding: de service-role key is de machtigste sleutel in het
//     systeem, en die ook als HMAC-sleutel inzetten koppelt twee risico's die
//     los horen te staan. OAUTH_STATE_SECRET is hier verplicht.
//
// EERLIJK OVER WAT DIT NIET DOET:
// De nonce wordt niet server-side bewaard, dus dezelfde state is binnen zijn TTL
// technisch herbruikbaar. Dat is hier geen gat — een aanvaller kan zonder het
// geheim überhaupt geen state produceren die wij accepteren — maar noem het geen
// replay-bescherming, want dat is het niet.

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

/**
 * De diensten die LifeOS kan koppelen.
 *
 * Deze lijst moet gelijk blijven aan de check-constraint `koppelingen_dienst_geldig`
 * in `supabase/migrations/001_fundament.sql`. Voeg je er een toe, doe het op
 * beide plekken — anders slaagt de OAuth-flow en faalt pas het opslaan.
 */
export const DIENSTEN = [
  'whoop',
  'oura',
  'garmin',
  'samsung',
  'google_calendar',
  'gmail',
  'outlook',
] as const

export type Dienst = (typeof DIENSTEN)[number]

/** Narrowing op de systeemgrens: een callback-parameter is niet te vertrouwen. */
export function isDienst(waarde: unknown): waarde is Dienst {
  return typeof waarde === 'string' && (DIENSTEN as readonly string[]).includes(waarde)
}

/**
 * Levensduur van een state.
 *
 * 10 minuten is ruim genoeg voor een OAuth-scherm inclusief inloggen en 2FA, en
 * kort genoeg dat een state die ergens in een logregel of browsergeschiedenis
 * blijft hangen snel waardeloos is.
 */
const STATE_TTL_MS = 10 * 60 * 1000

function geheim(): string {
  const s = process.env.OAUTH_STATE_SECRET
  if (!s) {
    throw new Error(
      'OAUTH_STATE_SECRET ontbreekt. Genereer er een met: ' +
        'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    )
  }
  return s
}

function teken(payload: string): string {
  return createHmac('sha256', geheim()).update(payload).digest('base64url')
}

/** De vorm die we ondertekenen. Kort gehouden: dit reist door een URL. */
interface StatePayload {
  /** Nonce — maakt elke state uniek en onvoorspelbaar. */
  n: string
  /** Dienst waar deze state bij hoort. */
  d: Dienst
  /** Vervalt op (ms sinds epoch). */
  exp: number
}

/**
 * Maakt een ondertekende state voor deze dienst, 10 minuten geldig.
 * Geef het resultaat door als `state`-queryparameter in de authorize-URL.
 */
export function maakState(dienst: Dienst): string {
  const inhoud: StatePayload = {
    n: randomBytes(16).toString('base64url'),
    d: dienst,
    exp: Date.now() + STATE_TTL_MS,
  }
  const payload = Buffer.from(JSON.stringify(inhoud)).toString('base64url')
  return `${payload}.${teken(payload)}`
}

/**
 * Vergelijkt twee handtekeningen in constante tijd.
 *
 * Nooit `===` op een MAC: dat stopt bij het eerste verschillende teken, en dat
 * tijdsverschil is genoeg om een geldige handtekening byte voor byte te raden.
 *
 * De lengte lekt wel — die is bij een vaste HMAC-uitvoer publiek en dus
 * onbelangrijk. `timingSafeEqual` gooit op ongelijke lengte, vandaar de check
 * vooraf.
 */
function gelijkInConstanteTijd(verwacht: string, ontvangen: string): boolean {
  const a = Buffer.from(verwacht)
  const b = Buffer.from(ontvangen)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

/**
 * Verifieert een state uit een OAuth-callback.
 *
 * Geeft `{ dienst }` als de state door ons is ondertekend en nog geldig is,
 * anders `null`. Ongeldig, gemanipuleerd, verlopen of onleesbaar → allemaal
 * `null`; de aanroeper hoeft het verschil niet te weten en een aanvaller al
 * helemaal niet.
 */
export function leesState(state: string | null | undefined): { dienst: Dienst } | null {
  if (!state) return null

  const delen = state.split('.')
  if (delen.length !== 2) return null

  const [payload, handtekening] = delen
  if (!payload || !handtekening) return null

  // Handtekening eerst. Pas als die klopt is de payload iets waar we JSON van
  // proberen te maken.
  if (!gelijkInConstanteTijd(teken(payload), handtekening)) return null

  try {
    const ruw: unknown = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (typeof ruw !== 'object' || ruw === null) return null

    const { d, exp } = ruw as Partial<StatePayload>
    if (!isDienst(d)) return null
    if (typeof exp !== 'number' || !Number.isFinite(exp) || Date.now() > exp) return null

    return { dienst: d }
  } catch {
    return null
  }
}

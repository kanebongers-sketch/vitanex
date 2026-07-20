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
 * De uitkomst van een state-beoordeling. Drie gevallen, bewust gescheiden:
 *
 *  - `geldig`   — door ons ondertekend, juiste vorm, nog binnen de TTL.
 *  - `verlopen` — door ons ondertekend en verder in orde (bekende dienst),
 *                 maar de TTL is voorbij. Dit is géén aanval: alleen wie het
 *                 geheim heeft kan een geldige handtekening maken, dus dit is
 *                 aantoonbaar een flow die wíj startten — de gebruiker was
 *                 gewoon te traag. De aanroeper mag hem netjes terugsturen.
 *  - `ongeldig` — ontbrekend, gemanipuleerd, onleesbaar of met een onbekende
 *                 dienst. Niet van ons; dit is het CSRF-geval. Hard weigeren.
 *
 * `dienst` zit alleen op de eerste twee: bij `ongeldig` ís er geen te
 * vertrouwen dienst (de handtekening klopte niet, of de dienst is onbekend).
 */
export type StateBeoordeling =
  | { staat: 'geldig'; dienst: Dienst }
  | { staat: 'verlopen'; dienst: Dienst }
  | { staat: 'ongeldig' }

/**
 * Beoordeelt een state uit een OAuth-callback en houdt "verlopen" apart van
 * "ongeldig". Zie `StateBeoordeling` voor waarom dat onderscheid ertoe doet:
 * een verlopen-maar-door-ons-ondertekende state is een trage gebruiker, geen
 * aanvaller, en verdient een nette terugkeer i.p.v. een harde 400.
 */
export function beoordeelState(state: string | null | undefined): StateBeoordeling {
  if (!state) return { staat: 'ongeldig' }

  const delen = state.split('.')
  if (delen.length !== 2) return { staat: 'ongeldig' }

  const [payload, handtekening] = delen
  if (!payload || !handtekening) return { staat: 'ongeldig' }

  // Handtekening eerst. Pas als die klopt is de payload iets waar we JSON van
  // proberen te maken — en pas dan mag "verlopen" überhaupt in beeld komen: een
  // vervaltijd uit een niet-geverifieerde payload zegt niets.
  if (!gelijkInConstanteTijd(teken(payload), handtekening)) return { staat: 'ongeldig' }

  try {
    const ruw: unknown = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (typeof ruw !== 'object' || ruw === null) return { staat: 'ongeldig' }

    const { d, exp } = ruw as Partial<StatePayload>
    if (!isDienst(d)) return { staat: 'ongeldig' }
    if (typeof exp !== 'number' || !Number.isFinite(exp)) return { staat: 'ongeldig' }

    // Handtekening klopt en de vorm is in orde. Alleen de tijd bepaalt nu nog of
    // hij geldig of verlopen is — beide zijn aantoonbaar van ons.
    if (Date.now() > exp) return { staat: 'verlopen', dienst: d }

    return { staat: 'geldig', dienst: d }
  } catch {
    return { staat: 'ongeldig' }
  }
}

/**
 * Verifieert een state uit een OAuth-callback.
 *
 * Geeft `{ dienst }` als de state door ons is ondertekend en nog geldig is,
 * anders `null`. Ongeldig, gemanipuleerd, verlopen of onleesbaar → allemaal
 * `null`; de meeste aanroepers hoeven het verschil niet te weten en een
 * aanvaller al helemaal niet. Wie "verlopen" wél apart wil behandelen (om een
 * trage gebruiker netjes terug te sturen) gebruikt `beoordeelState`.
 */
export function leesState(state: string | null | undefined): { dienst: Dienst } | null {
  const oordeel = beoordeelState(state)
  return oordeel.staat === 'geldig' ? { dienst: oordeel.dienst } : null
}

// ─── LifeOS — een concept-mail opbouwen (RFC 2822 → base64url) ──────────────
// Gmail's drafts.create wil geen velden maar een hele mail: `message.raw` is de
// volledige RFC 2822-tekst, base64url-gecodeerd. Dit bestand bouwt die tekst.
//
// Puur en zonder netwerk testbaar — daarom apart van `gmail-acties.ts`. Het is
// ook precies het stuk waar je tests op wilt, want hier zit het scherpe randje:
//
// ─── HEADER-INJECTIE ────────────────────────────────────────────────────────
// Een mail-header eindigt op CRLF. Wie een regeleinde in het onderwerp of het
// adres krijgt, schrijft dus een NIEUWE header — of, na een lege regel, de body.
// In de praktijk: een onderwerp als
//     Hoi<CRLF>Bcc: aanvaller@example.com
// maakt van een concept aan één persoon stilletjes een concept met een blinde
// kopie. En het onderwerp komt hier uit een mail van een derde (de triage) of uit
// een taalmodel — twee bronnen die je per definitie niet vertrouwt.
//
// Daarom: `veiligeHeaderwaarde` haalt regeleinden weg. Niet escapen, niet
// weigeren — vervangen. Een onderwerp met een enter erin is geen aanval om over
// te melden, het is ruis; en een concept dat faalt op een regeleinde is een
// concept dat Kane niet krijgt. De body mag wél regeleinden bevatten: die staat
// ná de lege regel en kan per definitie geen header meer worden.

/**
 * Regeleinde tussen headers, opgebouwd uit tekencodes.
 *
 * Waarom niet gewoon een escape in een string-literal: dit bestand gaat OVER
 * control-tekens, en een bron waarin die als échte bytes staan is een bron waarin
 * je ze niet ziet — niet in een editor, niet in een diff, niet in een review. De
 * codes zijn expliciet en overleven elke tool die tekst aanraakt.
 */
const CRLF = String.fromCharCode(13, 10)

/**
 * Tekens die een header kunnen breken: CR (13), LF (10) en NUL (0).
 *
 * Ook een LÓSSE CR of LF telt (niet alleen de combinatie CRLF): sommige parsers
 * zijn coulant en lezen een kale LF ook als regeleinde — de strengste lezing
 * wint. NUL staat erbij omdat een C-achtige parser daar de string kan afkappen,
 * en wat er ná die afkapping staat is dan van iemand anders.
 */
const HEADER_BREKERS = String.fromCharCode(13, 10, 0)

/** Niet-globaal: een /g-regex draagt `lastIndex` mee, en `.test()` gaat dan om en om. */
const BREEKT_HEADER = new RegExp(`[${HEADER_BREKERS}]`)
const BREEKT_HEADER_OVERAL = new RegExp(`[${HEADER_BREKERS}]`, 'g')

export const MAX_ONDERWERP_LENGTE = 998
export const MAX_BODY_LENGTE = 25_000

/** Wat er in een concept gaat. `aan` mag leeg zijn: een concept zonder ontvanger mag. */
export interface ConceptInvoer {
  aan: string | null
  onderwerp: string
  body: string
  /**
   * De Gmail-thread waar dit concept bij hoort. Meegeven = het concept hangt
   * onder het gesprek in plaats van los in je concepten te zweven.
   */
  threadId?: string
  /**
   * De `Message-ID` van de mail waarop dit een antwoord is. Zonder dit koppelt
   * geen enkele mailclient het antwoord aan het origineel — dan is het een losse
   * mail die toevallig `Re:` heet.
   */
  inReplyTo?: string
}

/**
 * Maakt een waarde veilig voor een header: regeleinden eruit, witruimte inklappen.
 *
 * Vervangen door een spatie en niet gewoon weghalen: "Hoi<CRLF>Bcc: x" wordt dan
 * "Hoi Bcc: x" en niet "HoiBcc: x" — de tekst blijft leesbaar, en de header
 * blijft één header.
 */
export function veiligeHeaderwaarde(ruw: string): string {
  return ruw.replace(BREEKT_HEADER_OVERAL, ' ').replace(/\s+/g, ' ').trim()
}

/** Bevat deze tekst iets dat een header zou kunnen breken? Voor de validatie én de tests. */
export function heeftHeaderInjectie(ruw: string): boolean {
  return BREEKT_HEADER.test(ruw)
}

function base64(tekst: string): string {
  return Buffer.from(tekst, 'utf8').toString('base64')
}

/**
 * Codeert een header met RFC 2047 als er niet-ASCII in zit.
 *
 * "Voorstel: €500" of een afzender met een ë loopt anders stuk of komt als
 * mojibake aan. Bij pure ASCII laten we 'm met rust — een encoded-word is
 * onleesbaar in de ruwe bron, en dat wil je alleen als het moet.
 */
function headerWaarde(ruw: string): string {
  const schoon = veiligeHeaderwaarde(ruw)
  // Spatie t/m tilde = het printbare ASCII-bereik.
  if (/^[ -~]*$/.test(schoon)) return schoon
  return `=?UTF-8?B?${base64(schoon)}?=`
}

/**
 * Bouwt de ruwe RFC 2822-mail en codeert 'm zoals Gmail 'm wil.
 *
 * base64url (`-` en `_`, geen `=`-padding): dat is wat `drafts.create` verwacht
 * voor `message.raw` — gewone base64 met `+` en `/` wordt geweigerd.
 *
 * De body gaat als base64 met `Content-Transfer-Encoding: base64` de deur uit.
 * Dat is niet voor de sier: een ruwe UTF-8-body met lange regels of een losse
 * punt aan het begin van een regel gaat onderweg stuk (regellengte-limieten,
 * dot-stuffing). base64 maakt dat een non-issue en houdt emoji en accenten heel.
 */
export function bouwConceptBericht(invoer: ConceptInvoer): string {
  const headers: string[] = []

  if (invoer.aan) headers.push(`To: ${headerWaarde(invoer.aan)}`)
  headers.push(`Subject: ${headerWaarde(invoer.onderwerp)}`)

  if (invoer.inReplyTo) {
    const id = veiligeHeaderwaarde(invoer.inReplyTo)
    headers.push(`In-Reply-To: ${id}`)
    // References draagt de hele keten; met alleen het directe origineel is dat
    // hier één id. Zonder deze header hangen sommige clients het antwoord alsnog
    // los van het gesprek.
    headers.push(`References: ${id}`)
  }

  headers.push('MIME-Version: 1.0')
  headers.push('Content-Type: text/plain; charset="UTF-8"')
  headers.push('Content-Transfer-Encoding: base64')

  // De lege regel scheidt headers van body — dat is de hele reden dat een
  // regeleinde in een headerwaarde gevaarlijk is, en waarom `headerWaarde` ze weghaalt.
  const ruw = `${headers.join(CRLF)}${CRLF}${CRLF}${base64(invoer.body)}`

  return Buffer.from(ruw, 'utf8').toString('base64url')
}

// ─── Systeemgrens: de invoer lezen ──────────────────────────────────────────

export type ConceptValidatie =
  | { ok: true; waarde: ConceptInvoer }
  | { ok: false; fout: string }

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function tekst(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  return s.length > 0 ? s : null
}

/**
 * Leest en valideert een concept-invoer ({aan, onderwerp, body, …}).
 *
 * Let op de asymmetrie met `veiligeHeaderwaarde`: die VERVANGT stilletjes, deze
 * WEIGERT. Dat is met opzet en het is geen dubbelop. Deze validatie draait op de
 * grens vóór het bouwen — op een AI-gegenereerd concept (zie
 * `api/lifeos/inbox/concept/route.ts`): een regeleinde in het onderwerp is daar
 * geen ruis maar een injectiepoging (een mail van derden die het model echode),
 * en die hoort het concept te WEIGEREN in plaats van 'm half op te schonen en
 * alsnog klaar te zetten. `veiligeHeaderwaarde` is dan de laatste verdediging
 * binnen `bouwConceptBericht` voor wat tóch langs deze grens zou komen. Twee
 * sloten, twee bedreigingsmodellen — en allebei nu daadwerkelijk aangesloten.
 */
export function leesConceptInvoer(body: unknown): ConceptValidatie {
  if (!isObject(body)) return { ok: false, fout: 'Ongeldige invoer.' }

  if (body.aan !== null && body.aan !== undefined && typeof body.aan !== 'string') {
    return { ok: false, fout: 'Ontvanger moet tekst zijn.' }
  }
  const aan = tekst(body.aan)
  if (aan !== null && heeftHeaderInjectie(aan)) {
    return { ok: false, fout: 'Ontvanger bevat ongeldige tekens.' }
  }

  const onderwerp = typeof body.onderwerp === 'string' ? body.onderwerp.trim() : null
  if (onderwerp === null || onderwerp.length === 0) {
    return { ok: false, fout: 'Onderwerp ontbreekt.' }
  }
  if (onderwerp.length > MAX_ONDERWERP_LENGTE) {
    return { ok: false, fout: `Onderwerp mag maximaal ${MAX_ONDERWERP_LENGTE} tekens zijn.` }
  }
  if (heeftHeaderInjectie(onderwerp)) {
    return { ok: false, fout: 'Onderwerp bevat ongeldige tekens.' }
  }

  const tekstBody = typeof body.body === 'string' ? body.body : null
  if (tekstBody === null || tekstBody.trim().length === 0) {
    return { ok: false, fout: 'Een concept zonder tekst is geen concept.' }
  }
  if (tekstBody.length > MAX_BODY_LENGTE) {
    return { ok: false, fout: `Tekst mag maximaal ${MAX_BODY_LENGTE} tekens zijn.` }
  }

  const threadId = tekst(body.threadId)
  const inReplyTo = tekst(body.inReplyTo)

  return {
    ok: true,
    waarde: {
      aan,
      onderwerp,
      body: tekstBody,
      ...(threadId !== null ? { threadId } : {}),
      ...(inReplyTo !== null ? { inReplyTo } : {}),
    },
  }
}

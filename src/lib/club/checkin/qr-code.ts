// ─── Club, check-in: wisselende QR-code van een lid (PUUR, SERVER) ──────────
// De ledenapp toont een code die elke 30 seconden verandert. De code is
// ondertekend met HMAC-SHA256 en een server-geheim (CLUB_CHECKIN_SECRET):
// - niet te vervalsen: zonder het geheim geen geldige handtekening;
// - niet te hergebruiken: geldig tot 60 seconden na het eigen tijdvak;
// - niet bij een andere sportschool: de sleutel hangt af van de sportschool,
//   en de balie controleert dat de code bij de eigen sportschool hoort.
// Geen naam, lidnummer of andere gegevens in de code, alleen de id's.

import { createHmac, timingSafeEqual } from 'node:crypto'
import { QR_VOORVOEGSEL, lijktOpCheckinCode } from './qr-formaat'

export const QR_VAK_SEC = 30
export const QR_SPELING_SEC = 60
/** Minimale lengte van het geheim; korter telt als niet ingesteld. */
export const MIN_GEHEIM_LENGTE = 32

const VAK_MS = QR_VAK_SEC * 1000
/** Hoeveel tijdvakken na het eigen vak de code nog geldt (60 s speling = 2 vakken). */
const VAKKEN_SPELING = Math.ceil(QR_SPELING_SEC / QR_VAK_SEC)
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface CheckinCode {
  code: string
  /** Tot wanneer de balie hem accepteert (eind van het vak plus speling). */
  geldigTot: Date
  /** Wanneer de app een nieuwe code moet halen (eind van het vak). */
  vernieuwOp: Date
}

export type CodeControle =
  | { ok: true; lidId: string }
  | { ok: false; reden: 'ongeldig' | 'verlopen' | 'andere_sportschool' }

/** Het geheim uit de omgeving, of null als het ontbreekt of te kort is. */
export function checkinGeheim(omgeving: Readonly<Record<string, string | undefined>> = process.env): string | null {
  const g = omgeving.CLUB_CHECKIN_SECRET?.trim()
  return g && g.length >= MIN_GEHEIM_LENGTE ? g : null
}

export function tijdvak(nu: Date): number {
  return Math.floor(nu.getTime() / VAK_MS)
}

function uuidNaarKort(uuid: string): string {
  return Buffer.from(uuid.replace(/-/g, ''), 'hex').toString('base64url')
}

function kortNaarUuid(kort: string): string | null {
  const bytes = Buffer.from(kort, 'base64url')
  if (bytes.length !== 16 || bytes.toString('base64url') !== kort) return null
  const h = bytes.toString('hex')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

/** Per sportschool een eigen sleutel, afgeleid van het geheim. */
function handtekening(geheim: string, org: string, lid: string, vak: number): Buffer {
  const sleutel = createHmac('sha256', geheim).update(`club-checkin-v1|${org.toLowerCase()}`).digest()
  return createHmac('sha256', sleutel).update(`${lid.toLowerCase()}|${vak}`).digest().subarray(0, 16)
}

/** Maak de code voor dit lid bij deze sportschool, voor het tijdvak van `nu`. */
export function maakCheckinCode(lidId: string, organisatieId: string, geheim: string, nu: Date): CheckinCode {
  if (!UUID.test(lidId) || !UUID.test(organisatieId)) throw new Error('Ongeldige id voor de check-in code.')
  const vak = tijdvak(nu)
  const delen = [QR_VOORVOEGSEL, uuidNaarKort(lidId), uuidNaarKort(organisatieId), vak.toString(36), handtekening(geheim, organisatieId, lidId, vak).toString('base64url')]
  return {
    code: delen.join('.'),
    geldigTot: new Date((vak + 1 + VAKKEN_SPELING) * VAK_MS),
    vernieuwOp: new Date((vak + 1) * VAK_MS),
  }
}

/**
 * Controleer een gescande code voor de sportschool `organisatieId`. Eerst de
 * handtekening (anders 'ongeldig'), dan de sportschool, dan de tijd.
 */
export function controleerCheckinCode(code: string, organisatieId: string, geheim: string, nu: Date): CodeControle {
  if (typeof code !== 'string' || !lijktOpCheckinCode(code)) return { ok: false, reden: 'ongeldig' }
  const [, lidKort, orgKort, vakTekst, sigTekst] = code.trim().split('.')
  const lid = kortNaarUuid(lidKort)
  const org = kortNaarUuid(orgKort)
  const vak = Number.parseInt(vakTekst, 36)
  const sig = Buffer.from(sigTekst, 'base64url')
  if (!lid || !org || !Number.isSafeInteger(vak) || sig.length !== 16) return { ok: false, reden: 'ongeldig' }
  if (!timingSafeEqual(sig, handtekening(geheim, org, lid, vak))) return { ok: false, reden: 'ongeldig' }
  if (org.toLowerCase() !== organisatieId.toLowerCase()) return { ok: false, reden: 'andere_sportschool' }
  const verschil = tijdvak(nu) - vak
  // Een vak in de toekomst (meer dan een vak klokverschil) maakt de server nooit.
  if (verschil < -1) return { ok: false, reden: 'ongeldig' }
  if (verschil > VAKKEN_SPELING) return { ok: false, reden: 'verlopen' }
  return { ok: true, lidId: lid }
}

export const CODE_FOUT: Record<Exclude<CodeControle, { ok: true }>['reden'], string> = {
  ongeldig: 'Deze code is niet geldig. Laat het lid de app opnieuw openen.',
  verlopen: 'Deze code is verlopen. Laat het lid de app opnieuw openen.',
  andere_sportschool: 'Deze code hoort bij een andere sportschool.',
}

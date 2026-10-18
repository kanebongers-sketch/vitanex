// ─── Club, ledenlogin: de regels zonder database (PUUR) ─────────────────────
// Een lid logt in op de ledenapp (/mijn) met een persoonlijke link van de
// sportschool (/mijn/start/<code>) en een zelf gekozen pincode. Hier staan de
// regels: rijen lezen, cookies, wanneer een link of sessie nog geldt. Een
// pin-hash gaat nooit naar de browser of naar het scherm van de sportschool.

import { isUuid } from '@/lib/club/kern/organisatie'
import { MAX_BLOKKADES } from '@/lib/lifeos/leads/pin'

/** Het geheime deel van de link: 24 tekens base64url (144 bits). */
export const LID_CODE = /^[A-Za-z0-9_-]{24}$/

/** Een sessie leeft hooguit zo lang. */
export const LID_SESSIE_DAGEN = 90
/** Zo lang de app niet geopend: opnieuw de pincode (vergeten of gestolen telefoon). */
export const LID_INACTIEF_DAGEN = 30
/** "Laatst gebruikt" hooguit een keer per uur bijwerken. */
export const LID_AANRAAK_MS = 60 * 60 * 1000
/** Meer toestellen dan dit: het oudste wordt uitgelogd. */
export const MAX_LID_SESSIES = 5
/** Zo lang na het maken kan op een nieuwe link een pincode gekozen worden. */
export const LINK_KIES_DAGEN = 7

const DAG_MS = 24 * 60 * 60 * 1000

/**
 * De sessiecookie van een lid (httpOnly, een per toestel). In productie met het
 * voorvoegsel __Host-: alleen via https, alleen pad /, en geen ander subdomein
 * kan hem zetten of overschrijven (host-only).
 */
export function lidCookie(productie = process.env.NODE_ENV === 'production'): string {
  return productie ? '__Host-club_lid' : 'club_lid'
}

/**
 * Onthoudt op dit toestel de persoonlijke link, zodat /mijn/inloggen na een
 * verlopen sessie meteen om de pincode vraagt. Zonder geldige pincode geeft hij
 * geen toegang; een nieuwe link maakt hem waardeloos.
 */
export function lidApparaatCookie(productie = process.env.NODE_ENV === 'production'): string {
  return productie ? '__Host-club_lid_link' : 'club_lid_link'
}

/** Browsers bewaren een cookie hooguit 400 dagen. */
export const APPARAAT_DAGEN = 400

export interface LidToegangRij {
  id: string
  userId: string
  lidId: string
  code: string
  codeGemaaktOp: string
  actief: boolean
  /** SERVER-ONLY. */
  pinHash: string | null
  mislukt: number
  geblokkeerdTot: string | null
  blokkades: number
  laatstIngelogdOp: string | null
}

export const LID_TOEGANG_KOLOMMEN = 'id, user_id, lid_id, code, code_gemaakt_op, actief, pin_hash, mislukt, geblokkeerd_tot, blokkades, laatst_ingelogd_op'

function getal(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0
}

function tekstOfNull(v: unknown): string | null {
  return typeof v === 'string' && v ? v : null
}

/** Systeemgrens: een databaserij naar een LidToegangRij, of null als iets niet klopt. */
export function lidToegangUitRij(rij: unknown): LidToegangRij | null {
  if (typeof rij !== 'object' || rij === null) return null
  const r = rij as Record<string, unknown>
  if (!isUuid(r.id) || !isUuid(r.user_id) || !isUuid(r.lid_id)) return null
  if (typeof r.code !== 'string' || !LID_CODE.test(r.code)) return null
  if (typeof r.code_gemaakt_op !== 'string') return null
  return {
    id: r.id,
    userId: r.user_id,
    lidId: r.lid_id,
    code: r.code,
    codeGemaaktOp: r.code_gemaakt_op,
    actief: r.actief === true,
    pinHash: tekstOfNull(r.pin_hash),
    mislukt: getal(r.mislukt),
    geblokkeerdTot: tekstOfNull(r.geblokkeerd_tot),
    blokkades: getal(r.blokkades),
    laatstIngelogdOp: tekstOfNull(r.laatst_ingelogd_op),
  }
}

export type LinkStaat = 'kiezen' | 'inloggen' | 'ongeldig'

/**
 * Wat kan er met deze link? Een pincode kiezen kan alleen kort na het maken
 * (een oude, nooit gebruikte link in iemands mail is dan waardeloos); daarna
 * alleen inloggen met de gekozen pincode. Ingetrokken of dicht: ongeldig, en
 * dat ziet er voor de buitenwereld hetzelfde uit als een onbekende link.
 */
export function linkStaat(t: Pick<LidToegangRij, 'actief' | 'pinHash' | 'codeGemaaktOp' | 'blokkades'>, nu: Date): LinkStaat {
  if (!t.actief || t.blokkades >= MAX_BLOKKADES) return 'ongeldig'
  if (t.pinHash) return 'inloggen'
  const gemaakt = new Date(t.codeGemaaktOp).getTime()
  if (Number.isNaN(gemaakt) || nu.getTime() - gemaakt > LINK_KIES_DAGEN * DAG_MS) return 'ongeldig'
  return 'kiezen'
}

export interface LidSessieRij {
  toegang_id: string
  user_id: string
  lid_id: string
  verloopt_op: string
  laatst_gebruikt_op: string | null
  aangemaakt_op: string
}

export type SessieOordeel = 'geldig' | 'aanraken' | 'verlopen'

/** Hard na LID_SESSIE_DAGEN, zacht na LID_INACTIEF_DAGEN zonder gebruik. */
export function beoordeelLidSessie(s: Pick<LidSessieRij, 'verloopt_op' | 'laatst_gebruikt_op' | 'aangemaakt_op'>, nu: Date): SessieOordeel {
  const t = nu.getTime()
  const verloopt = new Date(s.verloopt_op).getTime()
  const laatst = new Date(s.laatst_gebruikt_op ?? s.aangemaakt_op).getTime()
  if (Number.isNaN(verloopt) || Number.isNaN(laatst) || verloopt <= t) return 'verlopen'
  if (t - laatst > LID_INACTIEF_DAGEN * DAG_MS) return 'verlopen'
  return t - laatst > LID_AANRAAK_MS ? 'aanraken' : 'geldig'
}

/**
 * Hoort de sessie bij deze toegang en dit lid? Elke koppeling wordt
 * nagerekend, zodat een sessie nooit bij een ander lid of een andere
 * sportschool terechtkomt.
 */
export function sessiePastBij(s: Pick<LidSessieRij, 'toegang_id' | 'user_id' | 'lid_id'>, t: Pick<LidToegangRij, 'id' | 'userId' | 'lidId'>): boolean {
  return s.toegang_id === t.id && s.user_id === t.userId && s.lid_id === t.lidId
}

/** Wat de sportschool op de ledenkaart ziet: nooit de pin-hash. */
export interface LidLinkOverzicht {
  /** null = nog nooit een link gemaakt of ingetrokken. */
  code: string | null
  staat: 'geen' | 'kiezen' | 'actief' | 'verlopen' | 'dicht' | 'ingetrokken'
  laatstIngelogdOp: string | null
  toestellen: number
}

export function linkOverzicht(t: LidToegangRij | null, toestellen: number, nu: Date): LidLinkOverzicht {
  if (!t) return { code: null, staat: 'geen', laatstIngelogdOp: null, toestellen: 0 }
  if (!t.actief) return { code: null, staat: 'ingetrokken', laatstIngelogdOp: t.laatstIngelogdOp, toestellen: 0 }
  const basis = { code: t.code, laatstIngelogdOp: t.laatstIngelogdOp, toestellen }
  if (t.blokkades >= MAX_BLOKKADES) return { ...basis, staat: 'dicht' }
  const staat = linkStaat(t, nu)
  return { ...basis, staat: staat === 'inloggen' ? 'actief' : staat === 'kiezen' ? 'kiezen' : 'verlopen' }
}

export { startPad } from './paden'

/**
 * Waar de link naartoe wijst: met subdomeinen aan het adres van de sportschool
 * (de sessie werkt alleen daar), anders null en dan het adres van de pagina zelf.
 */
export function linkBasis(slug: string | null, subdomeinenActief: boolean, clubDomein: string): string | null {
  return subdomeinenActief && slug ? `https://${slug}.${clubDomein}` : null
}

export const LINK_ACTIES = ['maak', 'intrekken', 'uitloggen'] as const
export type LinkActie = (typeof LINK_ACTIES)[number]

export function leesLinkActie(body: unknown): LinkActie | null {
  const actie = typeof body === 'object' && body !== null ? (body as Record<string, unknown>).actie : null
  return (LINK_ACTIES as readonly unknown[]).includes(actie) ? (actie as LinkActie) : null
}

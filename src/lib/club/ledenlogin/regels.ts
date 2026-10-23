// ─── Club, ledenlogin: de regels zonder database (PUUR) ─────────────────────
// Een lid logt in op de ledenapp (/mijn) met e-mailadres en een sterk
// wachtwoord (besluit Kane 23-10-2026). De persoonlijke link van de sportschool
// (/mijn/start/<code>) is alleen nog een eenmalige uitnodiging: daarmee
// bevestigt het lid zijn e-mailadres en kiest het een wachtwoord (ook bij
// "wachtwoord vergeten"). Hier staan de regels: rijen lezen, cookies, wanneer
// een link, account of sessie nog geldt. Een wachtwoord- of pin-hash gaat nooit
// naar de browser of naar het scherm van de sportschool.

import { isUuid } from '@/lib/club/kern/organisatie'
import { MAX_BLOKKADES } from '@/lib/club/kern/pin'
import { sportschoolUrl } from '@/lib/club/kern/subdomein'

/** Het geheime deel van de link: 24 tekens base64url (144 bits). */
export const LID_CODE = /^[A-Za-z0-9_-]{24}$/

/** Een sessie leeft hooguit zo lang. */
export const LID_SESSIE_DAGEN = 90
/** Zo lang de app niet geopend: opnieuw inloggen (vergeten of gestolen telefoon). */
export const LID_INACTIEF_DAGEN = 30
/** "Laatst gebruikt" hooguit een keer per uur bijwerken. */
export const LID_AANRAAK_MS = 60 * 60 * 1000
/** Meer toestellen dan dit: het oudste wordt uitgelogd. */
export const MAX_LID_SESSIES = 5
/** Zo lang na het maken kan met een uitnodiging een wachtwoord gekozen worden. */
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
 * Vroeger onthield dit toestel hier de persoonlijke link (inloggen met alleen
 * de pincode). Wordt niet meer gezet; alleen nog gewist bij inloggen en
 * uitloggen, zodat er geen oude code op het toestel blijft staan.
 */
export function lidApparaatCookie(productie = process.env.NODE_ENV === 'production'): string {
  return productie ? '__Host-club_lid_link' : 'club_lid_link'
}

export interface LidToegangRij {
  id: string
  userId: string
  lidId: string
  code: string
  codeGemaaktOp: string
  actief: boolean
  /** Het e-mailadres om mee in te loggen (genormaliseerd), of null. */
  email: string | null
  /** SERVER-ONLY. */
  wachtwoordHash: string | null
  /** SERVER-ONLY. Een oude pincode: alleen bestaande sessies tellen nog. */
  pinHash: string | null
  /** Wanneer de uitnodiging gebruikt is (dan werkt de link niet meer). */
  codeGebruiktOp: string | null
  mislukt: number
  geblokkeerdTot: string | null
  blokkades: number
  laatstIngelogdOp: string | null
}

export const LID_TOEGANG_KOLOMMEN =
  'id, user_id, lid_id, code, code_gemaakt_op, code_gebruikt_op, actief, email, wachtwoord_hash, pin_hash, mislukt, geblokkeerd_tot, blokkades, laatst_ingelogd_op'

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
    email: tekstOfNull(r.email),
    wachtwoordHash: tekstOfNull(r.wachtwoord_hash),
    pinHash: tekstOfNull(r.pin_hash),
    codeGebruiktOp: tekstOfNull(r.code_gebruikt_op),
    mislukt: getal(r.mislukt),
    geblokkeerdTot: tekstOfNull(r.geblokkeerd_tot),
    blokkades: getal(r.blokkades),
    laatstIngelogdOp: tekstOfNull(r.laatst_ingelogd_op),
  }
}

/**
 * Kan met deze uitnodiging nu een wachtwoord gekozen worden? Alleen eenmalig
 * en kort na het maken (een oude link in iemands mail is dan waardeloos).
 * Een dicht account (te vaak fout) mag via een verse uitnodiging weer open:
 * wie de uitnodiging heeft, bewijst daarmee wie hij is.
 */
export function linkBruikbaar(t: Pick<LidToegangRij, 'actief' | 'codeGemaaktOp' | 'codeGebruiktOp'>, nu: Date): boolean {
  if (!t.actief || t.codeGebruiktOp) return false
  const gemaakt = new Date(t.codeGemaaktOp).getTime()
  return !Number.isNaN(gemaakt) && nu.getTime() - gemaakt <= LINK_KIES_DAGEN * DAG_MS
}

/** Kan dit account inloggen met e-mail en wachtwoord? (De blokkade per tijd staat los.) */
export function kanInloggen(t: Pick<LidToegangRij, 'actief' | 'wachtwoordHash' | 'email' | 'blokkades'>): boolean {
  return t.actief && Boolean(t.wachtwoordHash) && Boolean(t.email) && t.blokkades < MAX_BLOKKADES
}

/**
 * Telt een bestaande sessie van dit account nog? Met een wachtwoord, of (tot
 * het lid een wachtwoord kiest) een oude pincode: bestaande sessies blijven
 * geldig. Ingetrokken of dicht: niet.
 */
export function sessieToegestaan(t: Pick<LidToegangRij, 'actief' | 'wachtwoordHash' | 'pinHash' | 'blokkades'>): boolean {
  return t.actief && t.blokkades < MAX_BLOKKADES && Boolean(t.wachtwoordHash || t.pinHash)
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

/** Wat de sportschool op de ledenkaart ziet: nooit een hash of het wachtwoord. */
export interface LidLinkOverzicht {
  /** De code van een uitnodiging die nu werkt; anders null. */
  code: string | null
  /**
   * kiezen: uitgenodigd, nog geen wachtwoord. actief: wachtwoord gekozen.
   * pincode: logt nog in met een oude pincode-sessie, nog geen wachtwoord.
   * verlopen: uitnodiging verlopen of gebruikt, nog geen wachtwoord.
   */
  staat: 'geen' | 'kiezen' | 'actief' | 'pincode' | 'verlopen' | 'dicht' | 'ingetrokken'
  laatstIngelogdOp: string | null
  toestellen: number
}

export function linkOverzicht(t: LidToegangRij | null, toestellen: number, nu: Date): LidLinkOverzicht {
  if (!t) return { code: null, staat: 'geen', laatstIngelogdOp: null, toestellen: 0 }
  if (!t.actief) return { code: null, staat: 'ingetrokken', laatstIngelogdOp: t.laatstIngelogdOp, toestellen: 0 }
  const basis = { code: linkBruikbaar(t, nu) ? t.code : null, laatstIngelogdOp: t.laatstIngelogdOp, toestellen }
  if (t.blokkades >= MAX_BLOKKADES) return { ...basis, staat: 'dicht' }
  if (t.wachtwoordHash) return { ...basis, staat: 'actief' }
  if (basis.code) return { ...basis, staat: 'kiezen' }
  return { ...basis, staat: t.pinHash && toestellen > 0 ? 'pincode' : 'verlopen' }
}

export { startPad } from './paden'

/**
 * Waar de link naartoe wijst: het adres van de sportschool (aiyourgym.com/<slug>,
 * of <slug>.aiyourgym.com met subdomeinen aan). Zonder slug null, dan het
 * adres van de pagina zelf.
 */
export function linkBasis(slug: string | null, subdomeinenActief: boolean): string | null {
  return slug ? sportschoolUrl(slug, subdomeinenActief) : null
}

export const LINK_ACTIES = ['maak', 'intrekken', 'uitloggen'] as const
export type LinkActie = (typeof LINK_ACTIES)[number]

export function leesLinkActie(body: unknown): LinkActie | null {
  const actie = typeof body === 'object' && body !== null ? (body as Record<string, unknown>).actie : null
  return (LINK_ACTIES as readonly unknown[]).includes(actie) ? (actie as LinkActie) : null
}

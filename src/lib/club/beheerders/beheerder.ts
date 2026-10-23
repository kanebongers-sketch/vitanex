// ─── Club: beheerders van een sportschool (PUUR) ────────────────────────────
// Een eigenaar of clubmanager van een sportschool logt in met een persoonlijke
// link (/clubinloggen/<code>) en een pincode die Kane goedkeurt. Hier staan de
// regels zonder database: rijen lezen, invoer controleren, sessies beoordelen.
// Een pin-hash of organisatie-id gaat nooit naar de browser van de beheerder.

import { isUuid } from '@/lib/club/kern/organisatie'

export const BEHEERDER_ROLLEN = ['eigenaar', 'clubmanager'] as const
export type BeheerderRol = (typeof BEHEERDER_ROLLEN)[number]

export const ROL_LABEL: Record<BeheerderRol, string> = { eigenaar: 'Eigenaar', clubmanager: 'Clubmanager' }

export const PIN_STATUSSEN = ['geen', 'wacht', 'actief'] as const
export type BeheerderPinStatus = (typeof PIN_STATUSSEN)[number]

/** Het geheime deel van de link: 24 tekens base64url (144 bits). */
export const BEHEERDER_CODE = /^[A-Za-z0-9_-]{24}$/

/**
 * De sessiecookie van een eigenaar of clubmanager (httpOnly, een per toestel).
 * In productie met het voorvoegsel __Host-: alleen via https, alleen pad /,
 * en geen subdomein (straks een per sportschool) kan hem zetten of overschrijven.
 */
export function beheerderCookie(productie = process.env.NODE_ENV === 'production'): string {
  return productie ? '__Host-club_sessie' : 'club_sessie'
}

/** Een sessie leeft hooguit zo lang. */
export const BEHEERDER_SESSIE_DAGEN = 30
/** Zo lang niet gebruikt: opnieuw inloggen (vergeten laptop, gestolen telefoon). */
export const BEHEERDER_INACTIEF_DAGEN = 7
/** "Laatst gebruikt" hooguit een keer per uur bijwerken. */
export const BEHEERDER_AANRAAK_MS = 60 * 60 * 1000
/** Meer toestellen dan dit: het oudste wordt uitgelogd. */
export const MAX_BEHEERDER_SESSIES = 5
/** Zoveel beheerders per sportschool is ruim genoeg. */
export const MAX_BEHEERDERS = 20

const DAG_MS = 24 * 60 * 60 * 1000

export interface Beheerder {
  id: string
  organisatieId: string
  naam: string
  email: string | null
  rol: BeheerderRol
  code: string
  actief: boolean
  pinStatus: BeheerderPinStatus
  /** SERVER-ONLY. */
  pinHash: string | null
  /** SERVER-ONLY. Inloggen met e-mail en wachtwoord (aiyourgym.com); null = alleen link plus pincode. */
  wachtwoordHash: string | null
  mislukt: number
  geblokkeerdTot: string | null
  blokkades: number
  laatstIngelogdOp: string | null
}

export const BEHEERDER_KOLOMMEN = 'id, organisatie_id, naam, email, rol, code, actief, pin_hash, pin_status, wachtwoord_hash, mislukt, geblokkeerd_tot, blokkades, laatst_ingelogd_op'

function isRol(v: unknown): v is BeheerderRol {
  return (BEHEERDER_ROLLEN as readonly unknown[]).includes(v)
}

function isPinStatus(v: unknown): v is BeheerderPinStatus {
  return (PIN_STATUSSEN as readonly unknown[]).includes(v)
}

function getal(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0
}

function tekstOfNull(v: unknown): string | null {
  return typeof v === 'string' && v ? v : null
}

/** Systeemgrens: een databaserij naar een Beheerder, of null als iets niet klopt. */
export function beheerderUitRij(rij: unknown): Beheerder | null {
  if (typeof rij !== 'object' || rij === null) return null
  const r = rij as Record<string, unknown>
  if (!isUuid(r.id) || !isUuid(r.organisatie_id) || !isRol(r.rol)) return null
  if (typeof r.code !== 'string' || !BEHEERDER_CODE.test(r.code)) return null
  if (typeof r.naam !== 'string' || !r.naam.trim()) return null
  return {
    id: r.id,
    organisatieId: r.organisatie_id,
    naam: r.naam,
    email: tekstOfNull(r.email),
    rol: r.rol,
    code: r.code,
    actief: r.actief === true,
    pinStatus: isPinStatus(r.pin_status) ? r.pin_status : 'geen',
    pinHash: tekstOfNull(r.pin_hash),
    wachtwoordHash: tekstOfNull(r.wachtwoord_hash),
    mislukt: getal(r.mislukt),
    geblokkeerdTot: tekstOfNull(r.geblokkeerd_tot),
    blokkades: getal(r.blokkades),
    laatstIngelogdOp: tekstOfNull(r.laatst_ingelogd_op),
  }
}

// ─── Invoer van Kane: een nieuwe beheerder ──────────────────────────────────

export interface NieuweBeheerder {
  naam: string
  email: string | null
  rol: BeheerderRol
}

export type Invoer<T> = { ok: true; waarde: T } | { ok: false; fout: string }

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export function leesNieuweBeheerder(body: unknown): Invoer<NieuweBeheerder> {
  const b = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}
  const naam = typeof b.naam === 'string' ? b.naam.trim().replace(/\s+/g, ' ') : ''
  if (!naam) return { ok: false, fout: 'Vul een naam in.' }
  if (naam.length > 60) return { ok: false, fout: 'De naam mag maximaal 60 tekens zijn.' }
  const ruwEmail = typeof b.email === 'string' ? b.email.trim().toLowerCase() : ''
  if (ruwEmail && (ruwEmail.length > 120 || !EMAIL.test(ruwEmail))) return { ok: false, fout: 'Dit e-mailadres klopt niet.' }
  if (!isRol(b.rol)) return { ok: false, fout: 'Kies eigenaar of clubmanager.' }
  return { ok: true, waarde: { naam, email: ruwEmail || null, rol: b.rol } }
}

export const BEHEERDER_ACTIES = ['goedkeuren', 'afwijzen', 'reset', 'stoppen'] as const
export type BeheerderActie = (typeof BEHEERDER_ACTIES)[number]

export interface Beoordeling {
  actie: BeheerderActie
  /** Bij goedkeuren verplicht: de controlecode die de beheerder aan Kane noemt. */
  controle: string | null
}

/**
 * Goedkeuren kan alleen met de controlecode die de beheerder zelf noemt: zo
 * keurt Kane nooit een pincode goed die iemand anders op een gelekte link koos.
 */
export function leesBeoordeling(body: unknown): Invoer<Beoordeling> {
  const b = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}
  if (!(BEHEERDER_ACTIES as readonly unknown[]).includes(b.actie)) return { ok: false, fout: 'Onbekende actie.' }
  const actie = b.actie as BeheerderActie
  if (actie !== 'goedkeuren') return { ok: true, waarde: { actie, controle: null } }
  const controle = typeof b.controle === 'string' ? b.controle.trim() : ''
  if (!/^\d{4}$/.test(controle)) return { ok: false, fout: 'Vul de controlecode van 4 cijfers in die de beheerder je noemt.' }
  return { ok: true, waarde: { actie, controle } }
}

// ─── Sessies ────────────────────────────────────────────────────────────────

export interface BeheerderSessieRij {
  beheerder_id: string
  verloopt_op: string
  laatst_gebruikt_op: string | null
  aangemaakt_op: string
}

export type SessieOordeel = 'geldig' | 'aanraken' | 'verlopen'

/**
 * Een sessie verloopt hard na BEHEERDER_SESSIE_DAGEN en zacht na
 * BEHEERDER_INACTIEF_DAGEN zonder gebruik. 'aanraken' = geldig, en "laatst
 * gebruikt" moet bijgewerkt worden.
 */
export function beoordeelBeheerderSessie(s: BeheerderSessieRij, nu: Date): SessieOordeel {
  const t = nu.getTime()
  const verloopt = new Date(s.verloopt_op).getTime()
  const laatst = new Date(s.laatst_gebruikt_op ?? s.aangemaakt_op).getTime()
  if (Number.isNaN(verloopt) || Number.isNaN(laatst) || verloopt <= t) return 'verlopen'
  if (t - laatst > BEHEERDER_INACTIEF_DAGEN * DAG_MS) return 'verlopen'
  return t - laatst > BEHEERDER_AANRAAK_MS ? 'aanraken' : 'geldig'
}

/** Mag deze beheerder Club in (los van de sessie)? Actief, met een goedgekeurde pin of een eigen wachtwoord. */
export function magBinnen(b: Pick<Beheerder, 'actief' | 'pinStatus' | 'wachtwoordHash'>): boolean {
  return b.actief && (b.pinStatus === 'actief' || b.wachtwoordHash !== null)
}

/** Wat Kane in het portaal ziet: nooit de pin-hash. */
export interface BeheerderOverzicht {
  id: string
  naam: string
  email: string | null
  rol: BeheerderRol
  code: string
  actief: boolean
  pinStatus: BeheerderPinStatus
  gesloten: boolean
  laatstIngelogdOp: string | null
}

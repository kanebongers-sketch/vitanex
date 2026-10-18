// ─── Club: eigen login van medewerkers (PUUR) ───────────────────────────────
// Een medewerker (trainer, groepslesinstructeur, clubmanager, administratie)
// logt in met een persoonlijke link (/clubinloggen/medewerker/<code>) en een
// zelf gekozen pincode. Ontwerp van de goedkeuring (zelfde als bij beheerders,
// maar zonder Kane): de medewerker kiest de pin en ziet een controlecode van 4
// cijfers. De eigenaar of clubmanager die de link uitdeelde, vult die code in
// bij Instellingen > Medewerkers. Zo werkt een gelekte link of een gefotografeerde
// QR-code nooit zonder dat de echte medewerker en zijn leidinggevende elkaar
// spreken, en hoeft niemand een pincode door te geven.
// Hier staan de regels zonder database: rijen lezen, invoer, sessies.

import { isUuid } from '@/lib/club/kern/organisatie'
import { medewerkerUitRij, type Medewerker } from '@/lib/club/kern/medewerker'
import { BEHEERDER_AANRAAK_MS, BEHEERDER_CODE, BEHEERDER_INACTIEF_DAGEN, BEHEERDER_SESSIE_DAGEN, type BeheerderPinStatus } from '@/lib/club/beheerders/beheerder'

/** Het geheime deel van de link: 24 tekens base64url (144 bits), zoals bij beheerders. */
export const MEDEWERKER_CODE = BEHEERDER_CODE

/**
 * De sessiecookie van een medewerker (httpOnly). In productie met __Host-:
 * alleen https, pad /, en host-only: met subdomeinen aan geldt hij alleen op
 * het subdomein waar de medewerker inlogde.
 */
export function medewerkerCookie(productie = process.env.NODE_ENV === 'production'): string {
  return productie ? '__Host-club_mw_sessie' : 'club_mw_sessie'
}

/** Dezelfde termijnen als bij beheerders: 30 dagen hard, 7 dagen ongebruikt. */
export const MEDEWERKER_SESSIE_DAGEN = BEHEERDER_SESSIE_DAGEN
export const MEDEWERKER_INACTIEF_DAGEN = BEHEERDER_INACTIEF_DAGEN
export const MEDEWERKER_AANRAAK_MS = BEHEERDER_AANRAAK_MS
/** Een medewerker gebruikt hooguit een paar toestellen (telefoon, baliecomputer). */
export const MAX_MEDEWERKER_SESSIES = 3

const DAG_MS = 24 * 60 * 60 * 1000

export interface MedewerkerToegang {
  id: string
  userId: string
  medewerkerId: string
  code: string
  actief: boolean
  pinStatus: BeheerderPinStatus
  /** SERVER-ONLY. */
  pinHash: string | null
  mislukt: number
  geblokkeerdTot: string | null
  blokkades: number
  laatstIngelogdOp: string | null
}

export const TOEGANG_KOLOMMEN = 'id, user_id, medewerker_id, code, actief, pin_hash, pin_status, mislukt, geblokkeerd_tot, blokkades, laatst_ingelogd_op'
export const MEDEWERKER_KOLOMMEN = 'id, user_id, naam, email, rollen, vestigingen, actief'

const PIN_STATUSSEN: readonly BeheerderPinStatus[] = ['geen', 'wacht', 'actief']

function getal(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0
}

function tekstOfNull(v: unknown): string | null {
  return typeof v === 'string' && v ? v : null
}

/** Systeemgrens: een rij uit club_medewerker_toegang, of null als iets niet klopt. */
export function toegangUitRij(rij: unknown): MedewerkerToegang | null {
  if (typeof rij !== 'object' || rij === null) return null
  const r = rij as Record<string, unknown>
  if (!isUuid(r.id) || !isUuid(r.user_id) || !isUuid(r.medewerker_id)) return null
  if (typeof r.code !== 'string' || !MEDEWERKER_CODE.test(r.code)) return null
  return {
    id: r.id,
    userId: r.user_id,
    medewerkerId: r.medewerker_id,
    code: r.code,
    actief: r.actief === true,
    pinStatus: PIN_STATUSSEN.includes(r.pin_status as BeheerderPinStatus) ? (r.pin_status as BeheerderPinStatus) : 'geen',
    pinHash: tekstOfNull(r.pin_hash),
    mislukt: getal(r.mislukt),
    geblokkeerdTot: tekstOfNull(r.geblokkeerd_tot),
    blokkades: getal(r.blokkades),
    laatstIngelogdOp: tekstOfNull(r.laatst_ingelogd_op),
  }
}

/** Een medewerker met de sportschool waar hij bij hoort (user_id). */
export interface MedewerkerMetOrg extends Medewerker {
  userId: string
}

export function medewerkerMetOrgUitRij(rij: unknown): MedewerkerMetOrg | null {
  const m = medewerkerUitRij(rij)
  const userId = typeof rij === 'object' && rij !== null ? (rij as Record<string, unknown>).user_id : null
  return m && isUuid(userId) ? { ...m, userId } : null
}

/**
 * Mag deze medewerker Club in (los van de sessie)? De link is actief, de pin is
 * goedgekeurd, de medewerker is in dienst, hoort bij dezelfde sportschool als
 * de link en heeft minstens een rol.
 */
export function magMedewerkerBinnen(t: MedewerkerToegang, m: MedewerkerMetOrg): boolean {
  return t.actief && t.pinStatus === 'actief' && m.actief && m.id === t.medewerkerId && m.userId === t.userId && m.rollen.length > 0
}

// ─── Sessies ────────────────────────────────────────────────────────────────

export interface MedewerkerSessieRij {
  toegang_id: string
  medewerker_id: string
  user_id: string
  verloopt_op: string
  laatst_gebruikt_op: string | null
  aangemaakt_op: string
}

export type SessieOordeel = 'geldig' | 'aanraken' | 'verlopen'

/** Hard na MEDEWERKER_SESSIE_DAGEN, zacht na MEDEWERKER_INACTIEF_DAGEN zonder gebruik. */
export function beoordeelMedewerkerSessie(s: Pick<MedewerkerSessieRij, 'verloopt_op' | 'laatst_gebruikt_op' | 'aangemaakt_op'>, nu: Date): SessieOordeel {
  const t = nu.getTime()
  const verloopt = new Date(s.verloopt_op).getTime()
  const laatst = new Date(s.laatst_gebruikt_op ?? s.aangemaakt_op).getTime()
  if (Number.isNaN(verloopt) || Number.isNaN(laatst) || verloopt <= t) return 'verlopen'
  if (t - laatst > MEDEWERKER_INACTIEF_DAGEN * DAG_MS) return 'verlopen'
  return t - laatst > MEDEWERKER_AANRAAK_MS ? 'aanraken' : 'geldig'
}

/** Past de sessie bij deze link en medewerker? Een sessie van een oude link telt niet. */
export function sessiePastBij(s: Pick<MedewerkerSessieRij, 'toegang_id' | 'medewerker_id' | 'user_id'>, t: MedewerkerToegang): boolean {
  return s.toegang_id === t.id && s.medewerker_id === t.medewerkerId && s.user_id === t.userId
}

// ─── Beheer door eigenaar of clubmanager ────────────────────────────────────

export const LOGIN_ACTIES = ['maken', 'goedkeuren', 'afwijzen', 'reset', 'intrekken'] as const
export type LoginActie = (typeof LOGIN_ACTIES)[number]

export interface LoginBeoordeling {
  actie: LoginActie
  /** Bij goedkeuren verplicht: de controlecode die de medewerker noemt. */
  controle: string | null
}

export type Invoer<T> = { ok: true; waarde: T } | { ok: false; fout: string }

/**
 * maken: een nieuwe link (of opnieuw maken: de oude link en pincode vervallen,
 * alle toestellen uitgelogd). goedkeuren: alleen met de controlecode.
 * afwijzen, reset: de pin weg. intrekken: de link werkt niet meer.
 */
export function leesLoginActie(body: unknown): Invoer<LoginBeoordeling> {
  const b = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}
  if (!(LOGIN_ACTIES as readonly unknown[]).includes(b.actie)) return { ok: false, fout: 'Onbekende actie.' }
  const actie = b.actie as LoginActie
  if (actie !== 'goedkeuren') return { ok: true, waarde: { actie, controle: null } }
  const controle = typeof b.controle === 'string' ? b.controle.trim() : ''
  if (!/^\d{4}$/.test(controle)) return { ok: false, fout: 'Vul de controlecode van 4 cijfers in die de medewerker je noemt.' }
  return { ok: true, waarde: { actie, controle } }
}

/** Wat de eigenaar of clubmanager ziet: nooit de pin-hash. */
export interface LoginOverzicht {
  medewerkerId: string
  code: string
  actief: boolean
  pinStatus: BeheerderPinStatus
  gesloten: boolean
  laatstIngelogdOp: string | null
}

/** Het pad van de persoonlijke link. */
export function medewerkerLinkPad(code: string): string {
  return `/clubinloggen/medewerker/${code}`
}

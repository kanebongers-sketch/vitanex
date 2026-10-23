// ─── Club: eigen login van medewerkers (PUUR) ───────────────────────────────
// Besluit Kane (23-10-2026): op aiyourgym.com logt een medewerker (trainer,
// groepslesinstructeur, clubmanager, administratie) in met e-mailadres en een
// sterk wachtwoord, net als de eigenaar. De eigenaar of clubmanager nodigt hem
// uit bij Instellingen > Medewerkers; de medewerker krijgt een eenmalige
// uitnodigingslink (/clubinloggen/medewerker/<token>, UITNODIGING_DAGEN geldig),
// kiest een wachtwoord en is meteen binnen. Geen pincode en geen controlecode
// meer. Sessies van de oude login (link plus pincode) blijven geldig tot de
// medewerker een wachtwoord kiest of de toegang wordt ingetrokken.
// Hier staan de regels zonder database: rijen lezen, invoer, sessies.

import { isUuid } from '@/lib/club/kern/organisatie'
import { medewerkerUitRij, type Medewerker } from '@/lib/club/kern/medewerker'
import { normaalEmail } from '@/lib/club/kern/wachtwoord-regels'
import { BEHEERDER_AANRAAK_MS, BEHEERDER_CODE, BEHEERDER_INACTIEF_DAGEN, BEHEERDER_SESSIE_DAGEN, type BeheerderPinStatus } from '@/lib/club/beheerders/beheerder'

/** Intern kenmerk van een login (oude persoonlijke link): 24 tekens base64url. Werkt niet meer om in te loggen. */
export const MEDEWERKER_CODE = BEHEERDER_CODE

/** De uitnodigingstoken: 32 willekeurige bytes als base64url (43 tekens). In de database alleen de sha256. */
export const UITNODIGING_TOKEN = /^[A-Za-z0-9_-]{43}$/
/** Zo lang werkt een uitnodiging. */
export const UITNODIGING_DAGEN = 7

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
  /** Het inlogadres (kleine letters), of null zolang er geen uitnodiging is. */
  email: string | null
  /** Oude login met pincode; blijft gelden tot er een wachtwoord is. */
  pinStatus: BeheerderPinStatus
  /** SERVER-ONLY. */
  pinHash: string | null
  /** SERVER-ONLY. */
  wachtwoordHash: string | null
  uitnodigingVerlooptOp: string | null
  mislukt: number
  geblokkeerdTot: string | null
  blokkades: number
  laatstIngelogdOp: string | null
}

export const TOEGANG_KOLOMMEN = 'id, user_id, medewerker_id, code, actief, email, pin_hash, pin_status, wachtwoord_hash, uitnodiging_verloopt_op, mislukt, geblokkeerd_tot, blokkades, laatst_ingelogd_op'
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
    email: normaalEmail(r.email),
    pinStatus: PIN_STATUSSEN.includes(r.pin_status as BeheerderPinStatus) ? (r.pin_status as BeheerderPinStatus) : 'geen',
    pinHash: tekstOfNull(r.pin_hash),
    wachtwoordHash: tekstOfNull(r.wachtwoord_hash),
    uitnodigingVerlooptOp: tekstOfNull(r.uitnodiging_verloopt_op),
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

/** Kan deze login inloggen: een wachtwoord, of nog de oude goedgekeurde pincode (alleen bestaande sessies). */
export function heeftInlog(t: Pick<MedewerkerToegang, 'wachtwoordHash' | 'pinStatus'>): boolean {
  return t.wachtwoordHash !== null || t.pinStatus === 'actief'
}

/**
 * Mag deze medewerker Club in (los van de sessie)? De login is actief en heeft
 * een wachtwoord (of nog de oude goedgekeurde pincode), de medewerker is in
 * dienst, hoort bij dezelfde sportschool als de login en heeft minstens een rol.
 */
export function magMedewerkerBinnen(t: MedewerkerToegang, m: MedewerkerMetOrg): boolean {
  return t.actief && heeftInlog(t) && m.actief && m.id === t.medewerkerId && m.userId === t.userId && m.rollen.length > 0
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

/** Past de sessie bij deze login en medewerker? Een sessie van een oude login telt niet. */
export function sessiePastBij(s: Pick<MedewerkerSessieRij, 'toegang_id' | 'medewerker_id' | 'user_id'>, t: MedewerkerToegang): boolean {
  return s.toegang_id === t.id && s.medewerker_id === t.medewerkerId && s.user_id === t.userId
}

// ─── Beheer door eigenaar of clubmanager ────────────────────────────────────

export const LOGIN_ACTIES = ['uitnodigen', 'intrekken'] as const
export type LoginActie = (typeof LOGIN_ACTIES)[number]

export type LoginBeoordeling = { actie: 'uitnodigen'; email: string } | { actie: 'intrekken' }

export type Invoer<T> = { ok: true; waarde: T } | { ok: false; fout: string }

/**
 * uitnodigen: een nieuwe eenmalige uitnodigingslink met dit e-mailadres (ook
 * opnieuw: de vorige uitnodiging vervalt, een dichtgelopen login gaat weer open).
 * intrekken: inloggen kan niet meer, e-mailadres en wachtwoord weg, alle toestellen uit.
 */
export function leesLoginActie(body: unknown): Invoer<LoginBeoordeling> {
  const b = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}
  if (b.actie === 'intrekken') return { ok: true, waarde: { actie: 'intrekken' } }
  if (b.actie !== 'uitnodigen') return { ok: false, fout: 'Onbekende actie.' }
  const email = normaalEmail(b.email)
  if (!email) return { ok: false, fout: 'Vul een geldig e-mailadres in.' }
  return { ok: true, waarde: { actie: 'uitnodigen', email } }
}

/** geen: nooit uitgenodigd of ingetrokken. uitgenodigd/verlopen: nog geen wachtwoord. actief: kan inloggen. oud: alleen de oude pincode. */
export type LoginStaat = 'geen' | 'uitgenodigd' | 'verlopen' | 'actief' | 'oud'

export function loginStaat(t: MedewerkerToegang, nu: Date): LoginStaat {
  if (!t.actief) return 'geen'
  if (t.wachtwoordHash) return 'actief'
  if (t.uitnodigingVerlooptOp) return new Date(t.uitnodigingVerlooptOp).getTime() > nu.getTime() ? 'uitgenodigd' : 'verlopen'
  return t.pinStatus === 'actief' ? 'oud' : 'geen'
}

/** Wat de eigenaar of clubmanager ziet: nooit een hash of token. */
export interface LoginOverzicht {
  medewerkerId: string
  email: string | null
  staat: LoginStaat
  gesloten: boolean
  uitnodigingTot: string | null
  laatstIngelogdOp: string | null
}

/** Het pad van de uitnodigingslink. */
export function uitnodigingPad(token: string): string {
  return `/clubinloggen/medewerker/${token}`
}

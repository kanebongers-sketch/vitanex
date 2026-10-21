// ─── AI Your Gym: inlog van de platform-eigenaar (PUUR) ─────────────────────
// Het master account van Kane (besluit Kane 21-10-2026): ziet en beheert alle
// sportscholen. Inloggen met een persoonlijke link plus een zelf gekozen
// pincode van 6 cijfers, alleen op aiyourgym.com. De link maakt alleen de
// SQL-functie club_platform_startlink(email) (migratie 450); daarmee kiest Kane
// binnen 24 uur een pincode, en daarna is dezelfde link de vaste inloglink.
// Hier de regels zonder database. Pin-hash, link-hash en e-mail gaan nooit
// naar de browser en nooit in een log.

import { isUuid } from '@/lib/club/kern/organisatie'

/** Het geheime deel van de link: 32 tekens base64url (192 bits). */
export const PLATFORM_CODE = /^[A-Za-z0-9_-]{32}$/

/**
 * De sessiecookie van de platform-eigenaar (httpOnly). In productie met het
 * voorvoegsel __Host-: alleen via https, alleen pad / en nooit door een
 * subdomein (een sportschool) te zetten of te overschrijven.
 */
export function platformCookie(productie = process.env.NODE_ENV === 'production'): string {
  return productie ? '__Host-ayg_platform' : 'ayg_platform'
}

/** Een sessie leeft hooguit zo lang. */
export const PLATFORM_SESSIE_DAGEN = 30
/** Zo lang niet gebruikt: opnieuw inloggen (vergeten laptop, gestolen telefoon). */
export const PLATFORM_INACTIEF_DAGEN = 7
/** "Laatst gebruikt" hooguit een keer per uur bijwerken. */
export const PLATFORM_AANRAAK_MS = 60 * 60 * 1000
/** Meer toestellen dan dit: het oudste wordt uitgelogd. */
export const MAX_PLATFORM_SESSIES = 5

const DAG_MS = 24 * 60 * 60 * 1000

export interface PlatformAccount {
  id: string
  naam: string
  /** De beheerder_id van alle sportscholen in club_organisaties. */
  beheerderId: string
  actief: boolean
  /** SERVER-ONLY. */
  pinHash: string | null
  /** Tot wanneer met de link een pincode gekozen kan worden. */
  linkKiezenTot: string | null
  mislukt: number
  geblokkeerdTot: string | null
  blokkades: number
}

/** Bewust zonder e-mail: die is voor het herstel in SQL, niet voor de app. */
export const PLATFORM_KOLOMMEN = 'id, naam, beheerder_id, actief, pin_hash, link_kiezen_tot, mislukt, geblokkeerd_tot, blokkades'

function getal(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0
}

function tekstOfNull(v: unknown): string | null {
  return typeof v === 'string' && v ? v : null
}

/** Systeemgrens: een databaserij naar een PlatformAccount, of null als iets niet klopt. */
export function platformAccountUitRij(rij: unknown): PlatformAccount | null {
  if (typeof rij !== 'object' || rij === null) return null
  const r = rij as Record<string, unknown>
  if (!isUuid(r.id) || !isUuid(r.beheerder_id)) return null
  const naam = typeof r.naam === 'string' && r.naam.trim() ? r.naam.trim() : 'Kane'
  return {
    id: r.id,
    naam,
    beheerderId: r.beheerder_id,
    actief: r.actief === true,
    pinHash: tekstOfNull(r.pin_hash),
    linkKiezenTot: tekstOfNull(r.link_kiezen_tot),
    mislukt: getal(r.mislukt),
    geblokkeerdTot: tekstOfNull(r.geblokkeerd_tot),
    blokkades: getal(r.blokkades),
  }
}

export type LinkStand = 'kiezen' | 'inloggen' | 'verlopen'

/**
 * Wat de link nu doet: een pincode kiezen (nog geen pin en binnen 24 uur),
 * inloggen (er is een pin), of niets meer (geen pin en te laat: nieuwe link nodig).
 */
export function linkStand(a: Pick<PlatformAccount, 'pinHash' | 'linkKiezenTot'>, nu: Date): LinkStand {
  if (a.pinHash) return 'inloggen'
  const tot = a.linkKiezenTot ? new Date(a.linkKiezenTot).getTime() : Number.NaN
  return Number.isFinite(tot) && tot > nu.getTime() ? 'kiezen' : 'verlopen'
}

export interface PlatformSessieRij {
  account_id: string
  verloopt_op: string
  laatst_gebruikt_op: string | null
  aangemaakt_op: string
}

export type SessieOordeel = 'geldig' | 'aanraken' | 'verlopen'

/**
 * Een sessie verloopt hard na PLATFORM_SESSIE_DAGEN en zacht na
 * PLATFORM_INACTIEF_DAGEN zonder gebruik. 'aanraken' = geldig, en "laatst
 * gebruikt" moet bijgewerkt worden.
 */
export function beoordeelPlatformSessie(s: PlatformSessieRij, nu: Date): SessieOordeel {
  const t = nu.getTime()
  const verloopt = new Date(s.verloopt_op).getTime()
  const laatst = new Date(s.laatst_gebruikt_op ?? s.aangemaakt_op).getTime()
  if (Number.isNaN(verloopt) || Number.isNaN(laatst) || verloopt <= t) return 'verlopen'
  if (t - laatst > PLATFORM_INACTIEF_DAGEN * DAG_MS) return 'verlopen'
  return t - laatst > PLATFORM_AANRAAK_MS ? 'aanraken' : 'geldig'
}

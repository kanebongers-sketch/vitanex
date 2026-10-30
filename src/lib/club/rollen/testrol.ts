// ─── Club, rollen v2: testen als een rol (PUUR) ─────────────────────────────
// Opdracht Kane (30-10-2026): in een testaccount (zoals Tester5) wisselen
// tussen rollen om alles goed te testen. Alleen het master account kan dit,
// en alleen in een andere sportschool dan de eigen omgeving (Fit Factory).
// De keuze staat in een httpOnly-cookie; de toegang (toegang.ts) rekent dan
// met precies de rechten van die rollen, in pagina's en in de API. Het kan
// alleen minder: nooit meer rechten dan het master account al heeft.

import type { MedewerkerRol } from '@/lib/club/kern/medewerker'
import type { Organisatie } from '@/lib/club/kern/organisatie'
import { bouwProfiel } from './profiel'
import { ROLLEN, isRol, type Rol } from './typen'
import type { ProfielToegang } from './wie'

export const TESTROL_COOKIE = 'club-testrol'

/** Acht uur: daarna ben je vanzelf weer het master account. */
export const TESTROL_MAX_SECONDEN = 60 * 60 * 8

/** De rollen uit de cookie (komma's), in vaste volgorde en zonder dubbele; null als er niets geldigs in staat. */
export function leesTestRollen(waarde: unknown): Rol[] | null {
  if (typeof waarde !== 'string' || waarde.length > 120) return null
  const delen = waarde.split(',').map((d) => d.trim())
  if (delen.some((d) => !isRol(d))) return null
  const rollen = ROLLEN.filter((r) => delen.includes(r))
  return rollen.length > 0 ? rollen : null
}

/** De rollen uit een verzoek (lijst); [] = stoppen; null = onleesbaar. */
export function testRollenUitBody(body: unknown): Rol[] | null {
  const lijst = typeof body === 'object' && body !== null ? (body as Record<string, unknown>).rollen : undefined
  if (!Array.isArray(lijst) || lijst.length > ROLLEN.length || !lijst.every(isRol)) return null
  return ROLLEN.filter((r) => lijst.includes(r))
}

export function cookieWaarde(rollen: readonly Rol[]): string {
  return rollen.join(',')
}

/** Testen kan in elke sportschool van het master account, behalve de eigen omgeving. */
export function magTestRol(org: Pick<Organisatie, 'id'>, beheerderId: string): boolean {
  return org.id !== beheerderId
}

/** De oude medewerkerrollen (voor code die daar nog naar kijkt, zoals uren). */
const OUDE_ROL: Partial<Record<Rol, MedewerkerRol>> = {
  manager: 'manager',
  trainer: 'trainer',
  instructeur: 'instructeur',
  administratie: 'administratie',
}

export interface PlatformBasis {
  organisatie: Organisatie
  naam: string
}

export interface TestToegang {
  rol: 'eigenaar' | 'clubmanager' | 'medewerker'
  isPlatformEigenaar: false
  persoonId: null
  profiel: ProfielToegang
  onderdelen: string[]
  medewerkerRollen: MedewerkerRol[]
  naam: string
  testAls: Rol[]
}

/**
 * Wat er verandert aan de toegang van het master account als hij test als
 * deze rollen: geen platformrechten meer, de soort sessie die bij de rollen
 * hoort, en het profiel met de rechten van deze sportschool. Alle vestigingen.
 */
export function alsTestRol(basis: PlatformBasis, rollen: readonly Rol[]): TestToegang {
  const { profiel, onderdelen } = bouwProfiel({ id: null, rollen, alleVestigingen: true }, basis.organisatie)
  const rol = rollen.includes('eigenaar') ? 'eigenaar' : rollen.includes('manager') ? 'clubmanager' : 'medewerker'
  return {
    rol,
    isPlatformEigenaar: false,
    persoonId: null,
    profiel,
    onderdelen,
    medewerkerRollen: rollen.flatMap((r) => (OUDE_ROL[r] ? [OUDE_ROL[r]] : [])),
    naam: `${basis.naam} (test)`,
    testAls: [...rollen],
  }
}

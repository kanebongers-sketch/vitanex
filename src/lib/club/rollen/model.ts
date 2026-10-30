// ─── Club, rollen v2: het model (PUUR) ──────────────────────────────────────
// Een functie beslist wat iemand ziet en mag: niveau(). Zichtbaar is een
// onderdeel als het pakket is afgenomen EN het onderdeel aan staat EN een van
// de rollen er een recht op heeft; bij meerdere rollen telt het hoogste niveau.
// Menu, pagina's, API, hulpbalk, Ctrl K en het instellingencentrum lezen de
// uitkomst via ClubToegang (t.onderdelen en t.profiel.niveaus).

import { zichtbaar, type Verborgen } from '@/lib/club/kern/pakketten'
import type { Module } from '@/lib/club/kern/organisatie'
import { ONDERDEEL_SLEUTELS } from '@/lib/club/kern/org-instellingen'
import { ONDERDELEN, inMenu } from '@/components/club/shell/onderdelen'
import { ALLEEN_EIGENAAR, RECHT_SLEUTELS, ROLLEN, hoogste, isNiveau, isRol, minstens, rang, type Niveau, type NiveauKaart, type Rol, type Rolrechten } from './typen'
import { START_OPTIES, START_VOLGORDE, STANDAARD_RECHTEN, STANDAARD_START, isStartSleutel, standaardRolrechten } from './standaard'

export interface RollenContext {
  /** De rollen van het profiel (leeg voor wie geen profiel heeft). */
  rollen: readonly Rol[]
  rechten: Rolrechten
  /** organisatie.uit: modules die uit staan en pakketten die niet zijn afgenomen. */
  uit: readonly Verborgen[]
  /** Kane (master account): alles op beheren wat afgenomen en aan is. */
  platform?: boolean
}

/** Extra sleutels volgen de zichtbaarheid van een onderdeel (uren hoort bij het personeelsrooster). */
const VOLGT: Readonly<Record<string, string>> = { uren: 'personeel', widget: 'rooster' }

const MODULE_VAN: ReadonlyMap<string, Module | undefined> = new Map(ONDERDELEN.map((o) => [o.sleutel, o.module]))

/** Afgenomen EN aan (los van de rollen). */
export function bestaatVoorSportschool(uit: readonly Verborgen[], sleutel: string): boolean {
  const basis = VOLGT[sleutel] ?? sleutel
  return zichtbaar(uit, { sleutel: basis, module: MODULE_VAN.get(basis) })
}

/** Het niveau van een rol voor een sleutel, met de vergrendeling van de eigenaar. */
export function rolNiveau(rechten: Rolrechten, rol: Rol, sleutel: string): Niveau {
  if (ALLEEN_EIGENAAR.has(sleutel)) return rol === 'eigenaar' ? 'beheren' : 'geen'
  if (sleutel === 'hulp') return hoogste('zien', rechten.rollen[rol]?.[sleutel] ?? 'geen')
  return rechten.rollen[rol]?.[sleutel] ?? 'geen'
}

/** DE functie: wat mag deze persoon met dit onderdeel? */
export function niveau(ctx: RollenContext, sleutel: string): Niveau {
  if (!bestaatVoorSportschool(ctx.uit, sleutel)) return 'geen'
  if (ctx.platform) return 'beheren'
  return ctx.rollen.reduce<Niveau>((max, rol) => hoogste(max, rolNiveau(ctx.rechten, rol, sleutel)), 'geen')
}

/** Het niveau voor elke sleutel (voor ClubToegang). */
export function niveausVoor(ctx: RollenContext): Record<string, Niveau> {
  return Object.fromEntries(RECHT_SLEUTELS.map((s) => [s, niveau(ctx, s)]))
}

/**
 * De sleutels met minstens zien: dit wordt t.onderdelen. De onderdelen van het
 * menu plus de sleutels van v2 (team, uren...), zodat het instellingencentrum
 * ook Team kan tonen.
 */
export function onderdelenVoor(niveaus: Readonly<Record<string, Niveau>>): string[] {
  return RECHT_SLEUTELS.filter((s) => minstens(niveaus[s] ?? 'geen', 'zien'))
}

export function heeftRol(rollen: readonly Rol[], rol: Rol): boolean {
  return rollen.includes(rol)
}

// ── Startpagina ──────────────────────────────────────────────────────────────

export function startPad(sleutel: string): string {
  const optie = START_OPTIES.find((o) => o.sleutel === sleutel)
  return `/club${optie?.pad ?? ''}`
}

/**
 * De startpagina: van de eerste rol in START_VOLGORDE die deze persoon heeft.
 * Valt die weg (niet zichtbaar), dan het eerste zichtbare onderdeel van het
 * menu, en anders Hulp.
 */
export function startpagina(rollen: readonly Rol[], rechten: Rolrechten, niveaus: Readonly<Record<string, Niveau>>): string {
  const eerste = START_VOLGORDE.find((r) => rollen.includes(r))
  const sleutel = eerste ? rechten.start[eerste] : undefined
  if (sleutel && minstens(niveaus[sleutel] ?? 'geen', 'zien')) return startPad(sleutel)
  const zichtbaarOnderdeel = ONDERDELEN.find((o) => (inMenu(o) || o.sleutel === 'vandaag') && minstens(niveaus[o.sleutel] ?? 'geen', 'zien'))
  return zichtbaarOnderdeel ? `/club${zichtbaarOnderdeel.pad}` : '/club/hulp'
}

// ── Lezen en opslaan ─────────────────────────────────────────────────────────

function object(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

/** Een kaart opschonen: alleen bekende sleutels en niveaus, en de vergrendeling van de eigenaar. */
export function schoneKaart(rol: Rol, ruw: unknown): NiveauKaart {
  const o = object(ruw) ?? {}
  const uit: Record<string, Niveau> = {}
  for (const s of RECHT_SLEUTELS) {
    if (ALLEEN_EIGENAAR.has(s)) {
      if (rol === 'eigenaar') uit[s] = 'beheren'
      continue
    }
    const n = o[s]
    if (isNiveau(n) && n !== 'geen') uit[s] = n
  }
  return uit
}

/** Rechten v1 (per rol een lijst sleutels) naar v2: elke oude sleutel wordt bewerken, de nieuwe sleutels de standaard. */
export function vanV1(v1: Record<string, unknown>): Rolrechten {
  const basis = standaardRolrechten()
  const NIEUW = RECHT_SLEUTELS.filter((s) => !(ONDERDEEL_SLEUTELS as readonly string[]).includes(s))
  const rollen = Object.fromEntries(
    ROLLEN.map((rol) => {
      const lijst = v1[rol]
      if (rol === 'eigenaar' || rol === 'roosteraar' || !Array.isArray(lijst)) return [rol, basis.rollen[rol]]
      const oud: Record<string, Niveau> = {}
      for (const s of lijst) if (typeof s === 'string') oud[s] = 'bewerken'
      for (const s of NIEUW) {
        const n = STANDAARD_RECHTEN[rol][s]
        if (n) oud[s] = n
      }
      return [rol, schoneKaart(rol, oud)]
    }),
  ) as Record<Rol, NiveauKaart>
  return { rollen, start: basis.start }
}

/**
 * Uit club_organisaties.instellingen, vergevingsgezind: rolrechten (v2) als
 * die er zijn, anders de oude rechten (v1) omgezet, anders de standaard.
 */
export function leesRolrechten(instellingen: unknown): Rolrechten {
  const o = object(instellingen)
  const v2 = object(o?.rolrechten)
  if (v2) {
    const rollen = object(v2.rollen) ?? {}
    const start = object(v2.start) ?? {}
    return {
      rollen: Object.fromEntries(ROLLEN.map((r) => [r, r in rollen ? schoneKaart(r, rollen[r]) : STANDAARD_RECHTEN[r]])) as Record<Rol, NiveauKaart>,
      start: Object.fromEntries(ROLLEN.map((r) => [r, isStartSleutel(start[r]) ? start[r] : STANDAARD_START[r]])) as Record<Rol, string>,
    }
  }
  const v1 = object(o?.rechten)
  return v1 ? vanV1(v1) : standaardRolrechten()
}

export type Uitslag<T> = { ok: true; waarde: T } | { ok: false; fout: string }

/** Een wijziging van Rechten per rol: streng. Wat ontbreekt blijft zoals het was. */
export function leesRolrechtenInvoer(body: unknown, huidig: Rolrechten): Uitslag<Rolrechten> {
  const o = object(body)
  if (!o) return { ok: false, fout: 'ongeldig' }
  const rollen: Record<string, NiveauKaart> = { ...huidig.rollen }
  const r = o.rollen === undefined ? {} : object(o.rollen)
  if (!r) return { ok: false, fout: 'ongeldig' }
  for (const [rol, k] of Object.entries(r)) {
    if (!isRol(rol)) return { ok: false, fout: 'rol' }
    const ruw = object(k)
    if (!ruw || !Object.entries(ruw).every(([s, n]) => RECHT_SLEUTELS.includes(s) && isNiveau(n))) return { ok: false, fout: 'niveau' }
    rollen[rol] = schoneKaart(rol, ruw)
  }
  const start: Record<string, string> = { ...huidig.start }
  const s = o.start === undefined ? {} : object(o.start)
  if (!s) return { ok: false, fout: 'ongeldig' }
  for (const [rol, sleutel] of Object.entries(s)) {
    if (!isRol(rol)) return { ok: false, fout: 'rol' }
    if (!isStartSleutel(sleutel)) return { ok: false, fout: 'start' }
    start[rol] = sleutel
  }
  return { ok: true, waarde: { rollen: rollen as Rolrechten['rollen'], start: start as Rolrechten['start'] } }
}

/** Naar de database (instellingen.rolrechten). */
export function rolrechtenNaarJson(r: Rolrechten): Record<string, unknown> {
  return { versie: 2, rollen: r.rollen, start: r.start }
}

/** Voor sorteren en tonen: de rollen in vaste volgorde, zonder dubbelen. */
export function schoneRollen(ruw: unknown): Rol[] {
  if (!Array.isArray(ruw)) return []
  return ROLLEN.filter((r) => ruw.includes(r))
}

export { rang }

/**
 * Waar /club heen moet met rollen v2: na het inloggen (?start=1) en altijd als
 * deze persoon Vandaag niet ziet naar de startpagina; anders null (blijven).
 */
export function startDoorverwijzing(profiel: { niveaus: Readonly<Record<string, Niveau>>; start: string } | null | undefined, startParam: unknown): string | null {
  if (!profiel) return null
  const zietVandaag = minstens(profiel.niveaus.vandaag ?? 'geen', 'zien')
  if (zietVandaag && startParam !== '1') return null
  if (profiel.start === '/club') return zietVandaag ? null : '/club/hulp'
  return profiel.start
}

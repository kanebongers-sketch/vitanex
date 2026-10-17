// ─── Club, challenges: invoer controleren (PUUR) ────────────────────────────
// Systeemgrens voor de API: alles wat binnenkomt is unknown tot het hier klopt.

import { hoortBij, type VestigingInfo } from '@/lib/club/kern/vestigingen'
import { isDatum } from '@/lib/club/rooster/tijd'
import { isChallengeSoort, isDeelname, MAX_DAGEN, MAX_DOEL, MAX_TITEL, MAX_UITLEG, type ChallengeSoort, type Deelname } from './model'
import { dagenTussen } from './periode'

export type Gecontroleerd<T> = { ok: true; waarde: T } | { ok: false; fout: string }

const mis = <T>(fout: string): Gecontroleerd<T> => ({ ok: false, fout })

export interface ChallengeInvoer {
  titel: string
  uitleg: string | null
  soort: ChallengeSoort
  doel: number
  start: string
  eind: string
  vestigingen: string[]
  deelname: Deelname
  zichtbaarApp: boolean
  ranglijst: boolean
}

function alsObject(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function schoon(v: unknown): string {
  return typeof v === 'string' ? v.trim().replace(/[ \t]+/g, ' ') : ''
}

function leesVestigingen(v: unknown, vestigingen: readonly VestigingInfo[]): Gecontroleerd<string[]> {
  if (v === null || v === undefined) return { ok: true, waarde: [] }
  if (!Array.isArray(v)) return mis('Kies de vestigingen opnieuw.')
  if (v.some((s) => !hoortBij(vestigingen, s))) return mis('Onbekende vestiging.')
  const uniek = [...new Set(v as string[])]
  // Alle vestigingen aangevinkt = alle vestigingen (ook die er later bij komen).
  return { ok: true, waarde: uniek.length === vestigingen.length ? [] : uniek }
}

function leesPeriode(start: unknown, eind: unknown): Gecontroleerd<{ start: string; eind: string }> {
  if (!isDatum(start)) return mis('Kies een geldige startdatum.')
  if (!isDatum(eind)) return mis('Kies een geldige einddatum.')
  if (eind < start) return mis('De einddatum moet op of na de startdatum liggen.')
  if (dagenTussen(start, eind) > MAX_DAGEN) return mis('Een challenge duurt hoogstens een jaar.')
  return { ok: true, waarde: { start, eind } }
}

function leesDoel(v: unknown, soort: ChallengeSoort, start: string, eind: string): Gecontroleerd<number> {
  const doel = typeof v === 'string' ? Number(v) : v
  if (typeof doel !== 'number' || !Number.isInteger(doel) || doel < 1 || doel > MAX_DOEL) return mis(`Vul als doel een heel getal in van 1 tot en met ${MAX_DOEL}.`)
  if (soort === 'weken_op_rij') {
    const weken = Math.ceil(dagenTussen(start, eind) / 7) + 1
    if (doel > weken) return mis(`In deze periode passen hoogstens ${weken} weken; kies een lager doel of een langere periode.`)
  }
  return { ok: true, waarde: doel }
}

/** Een challenge uit het formulier (nieuw of wijzigen). */
export function leesChallenge(ruw: unknown, vestigingen: readonly VestigingInfo[]): Gecontroleerd<ChallengeInvoer> {
  const b = alsObject(ruw)
  if (!b) return mis('Ongeldig verzoek.')
  const titel = schoon(b.titel)
  if (!titel) return mis('Geef de challenge een titel.')
  if (titel.length > MAX_TITEL) return mis(`De titel mag hoogstens ${MAX_TITEL} tekens zijn.`)
  const uitleg = typeof b.uitleg === 'string' ? b.uitleg.trim() : ''
  if (uitleg.length > MAX_UITLEG) return mis(`De uitleg mag hoogstens ${MAX_UITLEG} tekens zijn.`)
  if (!isChallengeSoort(b.soort)) return mis('Kies wat er telt.')
  if (!isDeelname(b.deelname)) return mis('Kies hoe leden meedoen.')
  const periode = leesPeriode(b.start, b.eind)
  if (!periode.ok) return periode
  const doel = leesDoel(b.doel, b.soort, periode.waarde.start, periode.waarde.eind)
  if (!doel.ok) return doel
  const vest = leesVestigingen(b.vestigingen, vestigingen)
  if (!vest.ok) return vest
  return {
    ok: true,
    waarde: {
      titel,
      uitleg: uitleg || null,
      soort: b.soort,
      doel: doel.waarde,
      ...periode.waarde,
      vestigingen: vest.waarde,
      deelname: b.deelname,
      zichtbaarApp: b.zichtbaarApp !== false,
      ranglijst: b.ranglijst === true,
    },
  }
}

export type ChallengeActie = { soort: 'stoppen' } | { soort: 'wijzigen'; waarde: ChallengeInvoer }

/** PATCH: { actie: 'stoppen' } of de hele challenge opnieuw. */
export function leesWijziging(ruw: unknown, vestigingen: readonly VestigingInfo[]): Gecontroleerd<ChallengeActie> {
  const b = alsObject(ruw)
  if (b?.actie === 'stoppen') return { ok: true, waarde: { soort: 'stoppen' } }
  const c = leesChallenge(ruw, vestigingen)
  return c.ok ? { ok: true, waarde: { soort: 'wijzigen', waarde: c.waarde } } : c
}

/** Inschrijven of uitschrijven: het lid-id. */
export function leesLidId(ruw: unknown): Gecontroleerd<string> {
  const b = alsObject(ruw)
  const id = b?.lidId
  return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ? { ok: true, waarde: id } : mis('Kies een lid.')
}

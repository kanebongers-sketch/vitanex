// ─── Fit Factory Club, training: de basisset startschema's (PUUR) ───────────
// Eerlijke, gangbare schema's zoals een personal trainer ze opzet. Sinds
// 28-10-2026 (besluit Kane) alleen oefeningen met een eigen Blender-render en
// coaching (dat bewaakt basis.test.ts tegen blender-bibliotheek.ts). Bij toepassen worden de oefeningen op naam
// gekoppeld aan de eigen bibliotheek van de sportschool. Een sportschool kan
// er een eigen sjabloon van maken en dat verder aanpassen.

import { normaliseerGroepen } from '../blokken'
import type { RegelInvoer } from '../invoer'
import type { Doel, Niveau } from '../typen'

export interface BasisRegel {
  oefening: string
  sets: number
  herhalingen?: string
  tijdSec?: number
  rustSec: number
  /** Zelfde nummer = superset of circuit (direct na elkaar). */
  groep?: number
  rir?: number
  tempo?: string
  notitie?: string
}

export interface BasisDag {
  titel: string
  regels: readonly BasisRegel[]
}

export interface BasisSjabloon {
  sleutel: string
  naam: string
  doel: Doel
  niveau: Niveau
  weken: number
  perWeek: string
  uitleg: string
  dagen: readonly BasisDag[]
}

const r = (oefening: string, sets: number, herhalingen: string, rustSec: number, extra: Partial<BasisRegel> = {}): BasisRegel => ({ oefening, sets, herhalingen, rustSec, ...extra })
const t = (oefening: string, sets: number, tijdSec: number, rustSec: number, extra: Partial<BasisRegel> = {}): BasisRegel => ({ oefening, sets, tijdSec, rustSec, ...extra })

const FULL_BODY: BasisSjabloon = {
  sleutel: 'full-body-2x',
  naam: 'Full body 2x per week',
  doel: 'gezondheid',
  niveau: 1,
  weken: 8,
  perWeek: '2 keer per week, A en B om en om',
  uitleg: 'Het hele lichaam in elke training: een squat of heupscharnier, duwen, trekken en de romp. Licht beginnen, de techniek eerst.',
  dagen: [
    {
      titel: 'Full body A',
      regels: [
        r('Back squat', 3, '8-10', 120, { rir: 3, tempo: '3110', notitie: 'Begin met de lege stang.' }),
        r('Push-up', 3, '8-12', 90, { rir: 3 }),
        r('Barbell row', 3, '10-12', 90, { rir: 3 }),
        r('Glute bridge', 3, '12-15', 60),
        t('Plank', 3, 30, 45),
      ],
    },
    {
      titel: 'Full body B',
      regels: [
        r('Deadlift', 3, '6-8', 120, { rir: 3, notitie: 'Licht beginnen, de techniek eerst.' }),
        r('Overhead press', 3, '8-10', 90, { rir: 3 }),
        r('Lunge met barbell', 2, '8-10', 90, { rir: 3, notitie: 'Per been.' }),
        r('Barbell curl', 2, '10-12', 60, { rir: 3 }),
        t('Plank', 3, 30, 45),
      ],
    },
  ],
}

const BOVEN_ONDER: BasisSjabloon = {
  sleutel: 'boven-onder-4x',
  naam: 'Boven en onder 4x per week',
  doel: 'spiermassa',
  niveau: 2,
  weken: 10,
  perWeek: '4 keer per week: boven, onder, rustdag, boven, onder',
  uitleg: 'Elke spiergroep twee keer per week. De zware oefening eerst, daarna aanvullend werk in supersets.',
  dagen: [
    {
      titel: 'Bovenlichaam 1',
      regels: [
        r('Overhead press', 4, '6-8', 150, { rir: 2 }),
        r('Barbell row', 4, '8-10', 120, { rir: 2 }),
        r('Push-up', 3, '10-15', 0, { groep: 1 }),
        r('Barbell curl', 3, '10-12', 75, { groep: 1 }),
      ],
    },
    {
      titel: 'Onderlichaam 1',
      regels: [
        r('Back squat', 4, '6-8', 180, { rir: 2, tempo: '3110' }),
        r('Lunge met barbell', 3, '8-10', 90, { rir: 2, notitie: 'Per been.' }),
        r('Glute bridge', 3, '12-15', 60),
        t('Plank', 3, 40, 45),
      ],
    },
    {
      titel: 'Bovenlichaam 2',
      regels: [
        r('Barbell row', 4, '6-8', 120, { rir: 2 }),
        r('Push-up', 4, '8-15', 90, { tempo: '3110' }),
        r('Overhead press', 3, '8-10', 0, { rir: 2, groep: 1 }),
        r('Barbell curl', 3, '8-10', 75, { groep: 1 }),
      ],
    },
    {
      titel: 'Onderlichaam 2',
      regels: [
        r('Deadlift', 4, '5-6', 180, { rir: 2 }),
        r('Front squat', 3, '6-8', 150, { rir: 2 }),
        r('Glute bridge', 3, '12-15', 0, { groep: 1 }),
        t('Plank', 3, 40, 60, { groep: 1 }),
      ],
    },
  ],
}

const PPL: BasisSjabloon = {
  sleutel: 'duwen-trekken-benen',
  naam: 'Duwen, trekken, benen',
  doel: 'kracht',
  niveau: 3,
  weken: 12,
  perWeek: '3 keer per week, of 6 keer voor gevorderden met goed herstel',
  uitleg: 'Per dag een bewegingsgroep, met zware basisoefeningen met de barbell. Voor wie de techniek goed beheerst.',
  dagen: [
    {
      titel: 'Duwen',
      regels: [
        r('Overhead press', 5, '3-5', 180, { rir: 2 }),
        r('Push-up', 3, '8-12', 90, { tempo: '3110' }),
        t('Plank', 3, 45, 60),
      ],
    },
    {
      titel: 'Trekken',
      regels: [
        r('Deadlift', 4, '3-5', 180, { rir: 2 }),
        r('Barbell row', 4, '6-8', 120, { rir: 2 }),
        r('Barbell curl', 3, '8-10', 75),
      ],
    },
    {
      titel: 'Benen',
      regels: [
        r('Back squat', 5, '3-5', 180, { rir: 2, tempo: '3110' }),
        r('Front squat', 3, '5-6', 150, { rir: 2 }),
        r('Lunge met barbell', 3, '6-8', 120, { notitie: 'Per been.' }),
        r('Glute bridge', 3, '10-12', 60),
      ],
    },
  ],
}

const LICHAAMSGEWICHT: BasisSjabloon = {
  sleutel: 'lichaamsgewicht-start',
  naam: 'Start met lichaamsgewicht',
  doel: 'gezondheid',
  niveau: 1,
  weken: 4,
  perWeek: '2 tot 3 keer per week, ook thuis',
  uitleg: 'Drie oefeningen zonder materiaal voor een sterke romp, billen en borst. Een rustige start voordat de stang erbij komt.',
  dagen: [
    {
      titel: 'Lichaamsgewicht',
      regels: [
        r('Glute bridge', 3, '12-15', 45, { tempo: '2120' }),
        r('Push-up', 3, '6-12', 60, { rir: 2 }),
        t('Plank', 3, 25, 45),
      ],
    },
  ],
}

export const BASIS_SJABLONEN: readonly BasisSjabloon[] = [FULL_BODY, BOVEN_ONDER, PPL, LICHAAMSGEWICHT]

export function basisSjabloon(sleutel: unknown): BasisSjabloon | null {
  return BASIS_SJABLONEN.find((s) => s.sleutel === sleutel) ?? null
}

/** Alle oefeningnamen die een basissjabloon gebruikt. */
export function oefeningNamen(s: BasisSjabloon): string[] {
  return [...new Set(s.dagen.flatMap((d) => d.regels.map((x) => x.oefening)))]
}

export const naamSleutel = (naam: string): string => naam.trim().replace(/\s+/g, ' ').toLowerCase()

/**
 * De regels voor de database, met de oefeningen uit de eigen bibliotheek
 * (naamSleutel naar id). Ontbreekt een oefening, dan staat die in `ontbreekt`
 * en wordt er niets gemaakt.
 */
export function basisRegels(s: BasisSjabloon, opNaam: ReadonlyMap<string, string>): { regels: RegelInvoer[]; ontbreekt: string[] } {
  const ontbreekt = oefeningNamen(s).filter((n) => !opNaam.has(naamSleutel(n)))
  if (ontbreekt.length > 0) return { regels: [], ontbreekt }
  const regels = s.dagen.flatMap((d, i) =>
    d.regels.map((x): RegelInvoer => ({
      dag: i + 1,
      oefeningId: opNaam.get(naamSleutel(x.oefening)) as string,
      sets: x.sets,
      herhalingen: x.herhalingen ?? null,
      gewichtKg: null,
      rustSec: x.rustSec,
      notitie: x.notitie ?? null,
      // Per dag eigen nummers, zodat groep 1 op dag A en dag B niet samenvalt.
      groep: x.groep ? i * 10 + x.groep : null,
      tijdSec: x.tijdSec ?? null,
      rpe: null,
      rir: x.rir ?? null,
      tempo: x.tempo ?? null,
    })),
  )
  return { regels: normaliseerGroepen(regels), ontbreekt: [] }
}

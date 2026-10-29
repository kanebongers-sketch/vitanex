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
        t('Zijplank', 2, 20, 30, { notitie: 'Per kant.' }),
      ],
    },
    {
      titel: 'Full body B',
      regels: [
        r('Roemeense deadlift met barbell', 3, '8-10', 120, { rir: 3, tempo: '3110', notitie: 'Licht beginnen, de techniek eerst.' }),
        r('Overhead press', 3, '8-10', 90, { rir: 3 }),
        r('Achterwaartse lunge', 2, '8-10', 90, { rir: 3, notitie: 'Per been.' }),
        r('Barbell curl', 2, '10-12', 60, { rir: 3 }),
        r('Bird dog', 2, '6-8', 45, { notitie: 'Per kant.' }),
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
        r('Push-up met smalle handen', 3, '8-12', 0, { groep: 1 }),
        r('Barbell curl', 3, '10-12', 75, { groep: 1 }),
        r('Schouders ophalen met barbell', 3, '10-12', 60),
      ],
    },
    {
      titel: 'Onderlichaam 1',
      regels: [
        r('Back squat', 4, '6-8', 180, { rir: 2, tempo: '3110' }),
        r('Roemeense deadlift met barbell', 3, '8-10', 120, { rir: 2, tempo: '3110' }),
        r('Split squat', 3, '8-10', 75, { rir: 2, notitie: 'Per been.' }),
        r('Calf raise met lichaamsgewicht', 3, '15-20', 0, { groep: 1, tempo: '1130' }),
        t('Plank', 3, 40, 60, { groep: 1 }),
      ],
    },
    {
      titel: 'Bovenlichaam 2',
      regels: [
        r('Barbell row met onderhandse greep', 4, '6-8', 120, { rir: 2 }),
        r('Push-up', 4, '8-15', 90, { tempo: '3110' }),
        r('Overhead press', 3, '8-10', 0, { rir: 2, groep: 1 }),
        r('Barbell curl', 3, '8-10', 75, { groep: 1 }),
        r('Leg raise liggend', 3, '8-12', 60, { tempo: '2030' }),
      ],
    },
    {
      titel: 'Onderlichaam 2',
      regels: [
        r('Deadlift', 4, '5-6', 180, { rir: 2 }),
        r('Front squat', 3, '6-8', 150, { rir: 2 }),
        r('Glute bridge op een been', 3, '10-12', 0, { groep: 1, notitie: 'Per been.' }),
        t('Zijplank', 3, 30, 60, { groep: 1, notitie: 'Per kant.' }),
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
        r('Push-up met smalle handen', 3, '8-12', 90, { tempo: '3110' }),
        r('Pike push-up', 3, '6-10', 90, { rir: 2 }),
        t('Plank', 3, 45, 60),
      ],
    },
    {
      titel: 'Trekken',
      regels: [
        r('Deadlift', 4, '3-5', 180, { rir: 2 }),
        r('Barbell row', 4, '6-8', 120, { rir: 2 }),
        r('Schouders ophalen met barbell', 3, '8-10', 75),
        r('Barbell curl', 3, '8-10', 75),
        r('Russian twist', 3, '16-20', 60, { notitie: 'Totaal, links en rechts samen.' }),
      ],
    },
    {
      titel: 'Benen',
      regels: [
        r('Back squat', 5, '3-5', 180, { rir: 2, tempo: '3110' }),
        r('Roemeense deadlift met barbell', 3, '6-8', 150, { rir: 2 }),
        r('Lunge met barbell', 3, '6-8', 120, { notitie: 'Per been.' }),
        r('Calf raise met lichaamsgewicht', 3, '15-20', 60, { tempo: '1130' }),
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
  perWeek: '2 tot 3 keer per week, A en B om en om, ook thuis',
  uitleg: 'Twee trainingen zonder materiaal voor benen, billen, borst en een sterke romp. Een rustige start voordat de stang erbij komt.',
  dagen: [
    {
      titel: 'Lichaamsgewicht A',
      regels: [
        r('Squat met lichaamsgewicht', 3, '10-15', 60, { tempo: '3110' }),
        r('Push-up op knieën', 3, '8-12', 60, { rir: 2, notitie: 'Gaat het makkelijk, doe dan de gewone push-up.' }),
        r('Glute bridge', 3, '12-15', 45, { tempo: '2120' }),
        r('Bird dog', 2, '6-8', 45, { notitie: 'Per kant.' }),
        t('Plank', 3, 25, 45),
      ],
    },
    {
      titel: 'Lichaamsgewicht B',
      regels: [
        r('Achterwaartse lunge', 3, '8-10', 60, { notitie: 'Per been.' }),
        r('Push-up', 3, '6-12', 60, { rir: 2 }),
        r('Superman', 3, '8-10', 45),
        r('Calf raise met lichaamsgewicht', 2, '15-20', 45, { tempo: '1130' }),
        r('Crunch', 2, '12-15', 45, { tempo: '1120' }),
        t('Zijplank', 2, 20, 30, { notitie: 'Per kant.' }),
      ],
    },
  ],
}

// Het oude machine-circuit kwam terug als circuit zonder materiaal: er zijn
// (nog) geen machines met een Blender-render.
const CIRCUIT: BasisSjabloon = {
  sleutel: 'circuit-lichaamsgewicht',
  naam: 'Circuit met lichaamsgewicht',
  doel: 'conditie',
  niveau: 2,
  weken: 6,
  perWeek: '2 tot 3 keer per week',
  uitleg: 'Zes oefeningen direct na elkaar, rust pas na de ronde. Vier rondes zonder materiaal, in ongeveer 30 minuten klaar.',
  dagen: [
    {
      titel: 'Circuit',
      regels: [
        r('Squat jump', 4, '8-10', 0, { groep: 1, notitie: 'Zacht landen.' }),
        r('Push-up', 4, '8-12', 0, { groep: 1 }),
        r('Walking lunge met lichaamsgewicht', 4, '10-12', 0, { groep: 1, notitie: 'Totaal, om en om.' }),
        t('Mountain climber', 4, 30, 0, { groep: 1 }),
        r('Superman', 4, '10', 0, { groep: 1 }),
        r('Burpee', 4, '6-10', 120, { groep: 1, notitie: 'Daarna rust en de volgende ronde.' }),
      ],
    },
  ],
}

const MOBILITEIT_CORE: BasisSjabloon = {
  sleutel: 'mobiliteit-core',
  naam: 'Mobiliteit en core',
  doel: 'gezondheid',
  niveau: 1,
  weken: 6,
  perWeek: '1 tot 3 keer per week, ook als aanvulling op een krachtschema',
  uitleg: 'Rustige oefeningen met lichaamsgewicht door de volle bewegingsuitslag, voor controle, een sterke romp en soepele heupen.',
  dagen: [
    {
      titel: 'Mobiliteit en core',
      regels: [
        r('Squat met lichaamsgewicht', 2, '10', 45, { tempo: '3120', notitie: 'Zo diep als je rug recht blijft.' }),
        r('Zijwaartse lunge', 2, '6-8', 45, { notitie: 'Per kant.' }),
        r('Bird dog', 3, '6-8', 45, { notitie: 'Per kant.' }),
        r('Dead bug', 3, '6-8', 45, { tempo: '3120', notitie: 'Per kant.' }),
        r('Glute bridge op een been', 2, '8-10', 45, { notitie: 'Per been.' }),
        r('Superman', 2, '8-10', 45),
        t('Hollow hold', 3, 20, 40),
        t('Zijplank', 2, 20, 30, { notitie: 'Per kant.' }),
      ],
    },
  ],
}

export const BASIS_SJABLONEN: readonly BasisSjabloon[] = [FULL_BODY, BOVEN_ONDER, PPL, LICHAAMSGEWICHT, CIRCUIT, MOBILITEIT_CORE]

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

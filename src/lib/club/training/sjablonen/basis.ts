// ─── Fit Factory Club, training: de basisset startschema's (PUUR) ───────────
// Eerlijke, gangbare schema's zoals een personal trainer ze opzet. Alleen
// oefeningen die in de standaardbibliotheek staan en coaching hebben (dat
// bewaakt basis.test.ts). Bij toepassen worden de oefeningen op naam
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
  uitleg: 'Het hele lichaam in elke training, met machines en dumbbells. Goed voor wie net begint of weinig tijd heeft.',
  dagen: [
    {
      titel: 'Full body A',
      regels: [
        r('Goblet squat', 3, '10-12', 90, { rir: 3 }),
        r('Chest press machine', 3, '10-12', 90, { rir: 3 }),
        r('Lat pulldown', 3, '10-12', 90, { rir: 3 }),
        r('Roemeense deadlift met dumbbells', 3, '10-12', 90, { rir: 3 }),
        r('Shoulder press machine', 2, '10-12', 75, { rir: 3 }),
        t('Plank', 3, 30, 45),
      ],
    },
    {
      titel: 'Full body B',
      regels: [
        r('Leg press', 3, '10-12', 90, { rir: 3 }),
        r('Dumbbell bankdrukken', 3, '8-12', 90, { rir: 3 }),
        r('Seated cable row', 3, '10-12', 90, { rir: 3 }),
        r('Glute bridge', 3, '12-15', 60),
        r('Dumbbell curl', 2, '12-15', 0, { groep: 1 }),
        r('Triceps pushdown', 2, '12-15', 60, { groep: 1 }),
        r('Dead bug', 3, '8-10', 45, { notitie: 'Per kant.' }),
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
  uitleg: 'Elke spiergroep twee keer per week. Zware basisoefeningen eerst, daarna aanvullend werk in supersets.',
  dagen: [
    {
      titel: 'Bovenlichaam 1',
      regels: [
        r('Bankdrukken met barbell', 4, '6-8', 150, { rir: 2, tempo: '3110' }),
        r('Barbell row', 4, '6-8', 120, { rir: 2 }),
        r('Dumbbell shoulder press', 3, '8-10', 90, { rir: 2 }),
        r('Lat pulldown', 3, '8-10', 90, { rir: 2 }),
        r('Hammer curl', 3, '10-12', 0, { groep: 1 }),
        r('Triceps pushdown', 3, '10-12', 60, { groep: 1 }),
      ],
    },
    {
      titel: 'Onderlichaam 1',
      regels: [
        r('Back squat', 4, '6-8', 180, { rir: 2, tempo: '3110' }),
        r('Roemeense deadlift met barbell', 3, '8-10', 120, { rir: 2 }),
        r('Lunge met dumbbells', 3, '10-12', 90, { notitie: 'Per been.' }),
        r('Leg curl liggend', 3, '10-12', 0, { groep: 1 }),
        r('Calf raise staand', 3, '12-15', 60, { groep: 1 }),
        r('Hanging knee raise', 3, '10-12', 60),
      ],
    },
    {
      titel: 'Bovenlichaam 2',
      regels: [
        r('Schuin bankdrukken met dumbbells', 3, '8-10', 120, { rir: 2 }),
        r('Seated cable row', 3, '10-12', 90, { rir: 2 }),
        r('Lat pulldown met onderhandse greep', 3, '8-10', 90, { rir: 2 }),
        r('Lateral raise', 3, '12-15', 0, { groep: 1 }),
        r('Face pull', 3, '12-15', 60, { groep: 1 }),
        r('Skull crusher', 3, '10-12', 0, { groep: 2 }),
        r('Dumbbell curl', 3, '10-12', 60, { groep: 2 }),
      ],
    },
    {
      titel: 'Onderlichaam 2',
      regels: [
        r('Hip thrust met barbell', 4, '8-10', 120, { rir: 2 }),
        r('Hack squat', 3, '8-10', 120, { rir: 2 }),
        r('Bulgarian split squat', 3, '8-10', 90, { notitie: 'Per been.' }),
        r('Leg extension', 3, '12-15', 0, { groep: 1 }),
        r('Leg curl zittend', 3, '12-15', 60, { groep: 1 }),
        r('Calf raise zittend', 3, '12-15', 45),
        r('Cable crunch', 3, '12-15', 45),
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
        r('Bankdrukken met barbell', 4, '5-8', 180, { rir: 2 }),
        r('Overhead press', 3, '6-8', 150, { rir: 2 }),
        r('Schuin bankdrukken met dumbbells', 3, '8-10', 90, { rir: 2 }),
        r('Lateral raise', 3, '12-15', 60),
        r('Triceps pushdown', 3, '10-12', 60),
      ],
    },
    {
      titel: 'Trekken',
      regels: [
        r('Deadlift', 3, '4-6', 180, { rir: 2 }),
        r('Pull-up', 3, '6-10', 120, { rir: 2 }),
        r('Barbell row', 3, '8-10', 120, { rir: 2 }),
        r('Face pull', 3, '12-15', 0, { groep: 1 }),
        r('Barbell curl', 3, '8-10', 60, { groep: 1 }),
        r('Hammer curl', 2, '10-12', 60),
      ],
    },
    {
      titel: 'Benen',
      regels: [
        r('Back squat', 4, '5-8', 180, { rir: 2, tempo: '3110' }),
        r('Roemeense deadlift met barbell', 3, '8-10', 120, { rir: 2 }),
        r('Leg press', 3, '10-12', 90),
        r('Leg curl liggend', 3, '10-12', 60),
        r('Calf raise staand', 4, '10-15', 60),
        r('Ab wheel rollout', 3, '8-10', 60),
      ],
    },
  ],
}

const MACHINE_CIRCUIT: BasisSjabloon = {
  sleutel: 'machine-circuit',
  naam: 'Beginner machine-circuit',
  doel: 'gezondheid',
  niveau: 1,
  weken: 6,
  perWeek: '2 tot 3 keer per week',
  uitleg: 'Een rondje langs acht machines, telkens een set, rust pas na de ronde. Veilig, snel te leren en in 40 minuten klaar.',
  dagen: [
    {
      titel: 'Circuit',
      regels: [
        t('Crosstrainer', 1, 480, 60, { notitie: 'Warming-up, rustig tempo.' }),
        r('Leg press', 2, '12-15', 0, { groep: 1, tempo: '2010' }),
        r('Chest press machine', 2, '12-15', 0, { groep: 1, tempo: '2010' }),
        r('Seated row machine', 2, '12-15', 0, { groep: 1, tempo: '2010' }),
        r('Shoulder press machine', 2, '12-15', 0, { groep: 1, tempo: '2010' }),
        r('Leg curl zittend', 2, '12-15', 0, { groep: 1, tempo: '2010' }),
        r('Lat pulldown', 2, '12-15', 0, { groep: 1, tempo: '2010' }),
        r('Leg extension', 2, '12-15', 0, { groep: 1, tempo: '2010' }),
        r('Pallof press', 2, '10-12', 120, { groep: 1, notitie: 'Per kant. Na deze oefening rust, dan de tweede ronde.' }),
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
  uitleg: 'Rustige bewegingen met lichaamsgewicht en elastiek voor controle, een sterke romp en soepele heupen en schouders.',
  dagen: [
    {
      titel: 'Mobiliteit en core',
      regels: [
        r('Squat met lichaamsgewicht', 2, '10-12', 45, { tempo: '3111' }),
        r('Achterwaartse lunge', 2, '8-10', 45, { notitie: 'Per been.' }),
        r('Glute bridge', 2, '12-15', 45, { tempo: '2120' }),
        r('Band pull-apart', 2, '15-20', 45),
        r('Bird dog', 2, '8-10', 0, { groep: 1, notitie: 'Per kant, 2 tellen vasthouden.' }),
        r('Dead bug', 2, '8-10', 45, { groep: 1, notitie: 'Per kant.' }),
        t('Zijplank', 2, 20, 30, { notitie: 'Per kant.' }),
        r('Superman', 2, '10-12', 30),
        r('Pallof press', 2, '10-12', 45, { notitie: 'Per kant.' }),
      ],
    },
  ],
}

export const BASIS_SJABLONEN: readonly BasisSjabloon[] = [FULL_BODY, BOVEN_ONDER, PPL, MACHINE_CIRCUIT, MOBILITEIT_CORE]

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

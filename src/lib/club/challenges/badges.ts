// ─── Club, challenges: badges (PUUR) ────────────────────────────────────────
// Een vaste set mijlpalen, berekend uit bestaande data: check-ins, aanwezige
// groepslessen, afgeronde schema's en gehaalde challenges. Niets opgeslagen.
// Een badge is erkenning, geen beloning: er hoort geen prijs bij.

import { nlDatum } from './periode'
import { reeksBehaaldOp } from './voortgang'

export type BadgeIcoon = 'deur' | 'tien' | 'vijfentwintig' | 'vijftig' | 'honderd' | 'reeks' | 'groepsles' | 'schema' | 'challenge'

export interface BadgeDef {
  sleutel: string
  titel: string
  uitleg: string
  icoon: BadgeIcoon
}

export interface Badge extends BadgeDef {
  behaald: boolean
  /** De dag waarop hij behaald werd (yyyy-mm-dd), als die bekend is. */
  op: string | null
  /** Voor een nog niet behaalde telbadge: waar het lid staat. */
  stand: { nu: number; doel: number } | null
}

export interface BadgeBron {
  /** Alle check-ins van het lid (ISO), in willekeurige volgorde. */
  bezoeken: readonly string[]
  /** Begin van de groepslessen waarbij het lid aanwezig was (ISO). */
  lessen: readonly string[]
  /** Afgeronde schema's: het moment van afronden of laatste wijziging (ISO of datum). */
  schemasAfgerond: readonly string[]
  /** Dagen (yyyy-mm-dd) waarop een challenge gehaald werd. */
  challengesGehaald: readonly string[]
}

const BEZOEK_DOELEN = [
  { n: 1, sleutel: 'eerste-bezoek', titel: 'Eerste bezoek', uitleg: 'Je eerste check-in.', icoon: 'deur' },
  { n: 10, sleutel: 'bezoeken-10', titel: '10 bezoeken', uitleg: 'Tien keer ingecheckt.', icoon: 'tien' },
  { n: 25, sleutel: 'bezoeken-25', titel: '25 bezoeken', uitleg: 'Vijfentwintig keer ingecheckt.', icoon: 'vijfentwintig' },
  { n: 50, sleutel: 'bezoeken-50', titel: '50 bezoeken', uitleg: 'Vijftig keer ingecheckt.', icoon: 'vijftig' },
  { n: 100, sleutel: 'bezoeken-100', titel: '100 bezoeken', uitleg: 'Honderd keer ingecheckt.', icoon: 'honderd' },
] as const

export const REEKS_DOEL = 4

/** Alle badges in vaste volgorde (ook voor een legenda of uitleg). */
export const BADGES: readonly BadgeDef[] = [
  ...BEZOEK_DOELEN.map(({ sleutel, titel, uitleg, icoon }) => ({ sleutel, titel, uitleg, icoon })),
  { sleutel: 'weken-4', titel: '4 weken op rij', uitleg: 'Vier weken achter elkaar minstens een keer gesport.', icoon: 'reeks' },
  { sleutel: 'eerste-groepsles', titel: 'Eerste groepsles', uitleg: 'Aanwezig bij je eerste groepsles.', icoon: 'groepsles' },
  { sleutel: 'eerste-schema', titel: 'Schema afgerond', uitleg: 'Je eerste trainingsschema helemaal afgerond.', icoon: 'schema' },
  { sleutel: 'challenge-gehaald', titel: 'Challenge gehaald', uitleg: 'Het doel van een challenge gehaald.', icoon: 'challenge' },
]

function def(sleutel: string): BadgeDef {
  const d = BADGES.find((b) => b.sleutel === sleutel)
  if (!d) throw new Error(`Onbekende badge ${sleutel}`)
  return d
}

function eerste(momenten: readonly string[]): string | null {
  return momenten.length ? [...momenten].sort()[0] : null
}

function dag(moment: string | null): string | null {
  if (!moment) return null
  return /^\d{4}-\d{2}-\d{2}$/.test(moment) ? moment : nlDatum(moment)
}

function badge(sleutel: string, op: string | null, stand: Badge['stand'] = null): Badge {
  return { ...def(sleutel), behaald: op !== null, op, stand: op === null ? stand : null }
}

/** Alle badges met behaald ja of nee, in vaste volgorde. */
export function berekenBadges(bron: BadgeBron): Badge[] {
  const bezoeken = [...bron.bezoeken].sort()
  return [
    ...BEZOEK_DOELEN.map((b) => badge(b.sleutel, dag(bezoeken[b.n - 1] ?? null), { nu: bezoeken.length, doel: b.n })),
    badge('weken-4', dag(reeksBehaaldOp(bezoeken, REEKS_DOEL))),
    badge('eerste-groepsles', dag(eerste(bron.lessen))),
    badge('eerste-schema', dag(eerste(bron.schemasAfgerond))),
    badge('challenge-gehaald', eerste(bron.challengesGehaald)),
  ]
}

/** Behaalde badges eerst (nieuwste bovenaan), daarna de rest in vaste volgorde. */
export function sorteerVoorWeergave(badges: readonly Badge[]): Badge[] {
  const behaald = badges.filter((b) => b.behaald).sort((a, b) => (b.op ?? '').localeCompare(a.op ?? ''))
  return [...behaald, ...badges.filter((b) => !b.behaald)]
}

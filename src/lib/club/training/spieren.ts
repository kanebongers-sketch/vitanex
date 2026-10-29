// ─── Fit Factory Club, training: de spieren (PUUR) ──────────────────────────
// Fijner dan de grove spiergroep: niet "benen" maar quadriceps, hamstrings,
// bilspieren. Dezelfde sleutels als de check in 394_club_oefening_spieren.sql.
// Eén bron voor de spierkaart, de filters, het formulier en het voorstel.

import type { Spiergroep } from './typen'

export const SPIEREN = [
  'borstspieren',
  'voorste_schouder', 'middelste_schouder', 'achterste_schouder',
  'trapezius', 'latissimus', 'rhomboideus', 'onderrug',
  'biceps', 'triceps', 'onderarmen',
  'rechte_buikspier', 'schuine_buikspieren', 'diepe_buikspier', 'heupbuigers',
  'bilspieren', 'quadriceps', 'hamstrings', 'adductoren', 'abductoren', 'kuiten', 'scheenbeenspier',
  'hart_longen',
] as const
export type Spier = (typeof SPIEREN)[number]

export const SPIER_GROEPEN = ['borst', 'rug', 'schouders', 'armen', 'romp', 'benen', 'conditie'] as const
export type SpierGroep = (typeof SPIER_GROEPEN)[number]

export interface SpierInfo {
  /** Nederlandse naam, met hoofdletter. */
  naam: string
  /** Latijnse of gangbare naam, of een korte plaatsaanduiding. */
  ook: string
  groep: SpierGroep
}

export const SPIER_INFO: Record<Spier, SpierInfo> = {
  borstspieren: { naam: 'Borstspieren', ook: 'pectoralis', groep: 'borst' },
  voorste_schouder: { naam: 'Voorste schouder', ook: 'deltoideus voorzijde', groep: 'schouders' },
  middelste_schouder: { naam: 'Middelste schouder', ook: 'deltoideus zijkant', groep: 'schouders' },
  achterste_schouder: { naam: 'Achterste schouder', ook: 'deltoideus achterzijde', groep: 'schouders' },
  trapezius: { naam: 'Trapezius', ook: 'monnikskapspier', groep: 'rug' },
  latissimus: { naam: 'Latissimus', ook: 'brede rugspier', groep: 'rug' },
  rhomboideus: { naam: 'Rhomboideus', ook: 'ruitspieren', groep: 'rug' },
  onderrug: { naam: 'Onderrug', ook: 'rugstrekkers', groep: 'rug' },
  biceps: { naam: 'Biceps', ook: 'biceps brachii', groep: 'armen' },
  triceps: { naam: 'Triceps', ook: 'triceps brachii', groep: 'armen' },
  onderarmen: { naam: 'Onderarmen', ook: 'grip en pols', groep: 'armen' },
  rechte_buikspier: { naam: 'Rechte buikspier', ook: 'rectus abdominis', groep: 'romp' },
  schuine_buikspieren: { naam: 'Schuine buikspieren', ook: 'obliquus', groep: 'romp' },
  diepe_buikspier: { naam: 'Diepe buikspier', ook: 'transversus abdominis', groep: 'romp' },
  heupbuigers: { naam: 'Heupbuigers', ook: 'iliopsoas', groep: 'romp' },
  bilspieren: { naam: 'Bilspieren', ook: 'gluteus', groep: 'benen' },
  quadriceps: { naam: 'Quadriceps', ook: 'bovenbeen voorkant', groep: 'benen' },
  hamstrings: { naam: 'Hamstrings', ook: 'bovenbeen achterkant', groep: 'benen' },
  adductoren: { naam: 'Adductoren', ook: 'binnenkant bovenbeen', groep: 'benen' },
  abductoren: { naam: 'Abductoren', ook: 'buitenkant heup', groep: 'benen' },
  kuiten: { naam: 'Kuiten', ook: 'gastrocnemius en soleus', groep: 'benen' },
  scheenbeenspier: { naam: 'Scheenbeenspier', ook: 'tibialis anterior', groep: 'benen' },
  hart_longen: { naam: 'Hart en longen', ook: 'conditie', groep: 'conditie' },
}

export const SPIER_GROEP_LABEL: Record<SpierGroep, string> = {
  borst: 'Borst',
  rug: 'Rug',
  schouders: 'Schouders',
  armen: 'Armen',
  romp: 'Romp',
  benen: 'Benen en billen',
  conditie: 'Conditie',
}

/** Spieren per groep, in de vaste volgorde (voor keuzelijsten en filters). */
export function spierenInGroep(groep: SpierGroep): Spier[] {
  return SPIEREN.filter((s) => SPIER_INFO[s].groep === groep)
}

export const isSpier = (v: unknown): v is Spier => (SPIEREN as readonly unknown[]).includes(v)
export const isSpierGroep = (v: unknown): v is SpierGroep => (SPIER_GROEPEN as readonly unknown[]).includes(v)

/** Kleine letters voor in een zin: "quadriceps", "voorste schouder". */
export function spierNaamKlein(s: Spier): string {
  return SPIER_INFO[s].naam.toLowerCase()
}

/** "a", "a en b", "a, b en c". */
export function opsomming(delen: readonly string[]): string {
  if (delen.length <= 1) return delen[0] ?? ''
  return `${delen.slice(0, -1).join(', ')} en ${delen[delen.length - 1]}`
}

/** "Werkt vooral op quadriceps en bilspieren. Werkt mee: hamstrings, adductoren en onderrug." */
export function spierUitleg(primair: readonly Spier[], secundair: readonly Spier[]): string {
  if (primair.length === 0) return ''
  const hoofd = `Werkt vooral op ${opsomming(primair.map(spierNaamKlein))}.`
  return secundair.length === 0 ? hoofd : `${hoofd} Werkt mee: ${opsomming(secundair.map(spierNaamKlein))}.`
}

/** Uniek en alleen geldige sleutels, in de volgorde waarin ze binnenkomen. */
export function schoonSpieren(v: unknown): Spier[] {
  if (!Array.isArray(v)) return []
  return v.filter(isSpier).filter((s, i, lijst) => lijst.indexOf(s) === i)
}

export type SpierUitslag = { ok: true; primair: Spier[]; secundair: Spier[] } | { ok: false; fout: string }

/** Validatie voor het formulier en de API: minstens een primaire spier, geen spier in beide lijsten. */
export function leesSpierKeuze(primairRuw: unknown, secundairRuw: unknown, taal: 'nl' | 'en' = 'nl'): SpierUitslag {
  const en = taal === 'en'
  const onbekend = [primairRuw, secundairRuw].some((l) => Array.isArray(l) && l.some((s) => !isSpier(s)))
  if (onbekend) return { ok: false, fout: en ? 'Unknown muscle selected.' : 'Onbekende spier gekozen.' }
  const primair = schoonSpieren(primairRuw)
  const secundair = schoonSpieren(secundairRuw)
  if (primair.length === 0) return { ok: false, fout: en ? 'Choose at least one muscle the exercise mainly works.' : 'Kies minstens een spier waar de oefening vooral op werkt.' }
  const dubbel = primair.filter((s) => secundair.includes(s))
  if (dubbel.length > 0) {
    // In het Engels zonder spiernaam: de Engelse namen staan in het woordenboek (training-labels.ts), dat deze module zelf gebruikt.
    return { ok: false, fout: en ? 'A muscle is set as both main and secondary. Choose one of the two.' : `${SPIER_INFO[dubbel[0]].naam} staat bij vooral en bij meewerkend. Kies een van de twee.` }
  }
  if (primair.length > 6 || secundair.length > 8) return { ok: false, fout: en ? 'Too many muscles selected. Keep to the most important ones.' : 'Te veel spieren gekozen. Houd het bij de belangrijkste.' }
  return { ok: true, primair, secundair }
}

export type SpierStaat = 'primair' | 'secundair' | 'rust'

export function spierStaat(s: Spier, primair: readonly Spier[], secundair: readonly Spier[]): SpierStaat {
  if (primair.includes(s)) return 'primair'
  if (secundair.includes(s)) return 'secundair'
  return 'rust'
}

/** Wissel in het formulier: uit, dan vooral, dan meewerkend, dan weer uit. */
export function volgendeStaat(s: Spier, primair: readonly Spier[], secundair: readonly Spier[]): { primair: Spier[]; secundair: Spier[] } {
  const staat = spierStaat(s, primair, secundair)
  if (staat === 'rust') return { primair: [...primair, s], secundair: [...secundair] }
  if (staat === 'primair') return { primair: primair.filter((x) => x !== s), secundair: [...secundair, s] }
  return { primair: [...primair], secundair: secundair.filter((x) => x !== s) }
}

/** Grove spiergroep naar spieren: alleen als terugval voor oefeningen zonder spieren. */
const GROF: Record<Spiergroep, readonly Spier[]> = {
  borst: ['borstspieren'],
  rug: ['latissimus', 'rhomboideus'],
  schouders: ['voorste_schouder', 'middelste_schouder', 'achterste_schouder'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  benen: ['quadriceps', 'hamstrings'],
  billen: ['bilspieren'],
  buik: ['rechte_buikspier'],
  onderrug: ['onderrug'],
  kuiten: ['kuiten'],
  hele_lichaam: [],
  cardio: ['hart_longen'],
}

/** De primaire spieren van een oefening, of een schatting uit de grove spiergroep als ze ontbreken. */
export function hoofdspieren(o: { spierenPrimair: readonly Spier[]; spiergroep: Spiergroep }): readonly Spier[] {
  return o.spierenPrimair.length > 0 ? o.spierenPrimair : GROF[o.spiergroep]
}

/** Hoofdspieren waarbij een trainer een gat in het schema wil zien. */
export const KERNSPIEREN: readonly Spier[] = [
  'borstspieren', 'voorste_schouder', 'middelste_schouder', 'achterste_schouder', 'latissimus', 'rhomboideus',
  'biceps', 'triceps', 'rechte_buikspier', 'onderrug', 'bilspieren', 'quadriceps', 'hamstrings', 'kuiten',
]

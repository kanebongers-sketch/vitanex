// ─── Fit Factory Club, training: de vormen van de spierkaart ────────────────
// Een eigen, gestileerde tekening (geen overgenomen afbeelding). Elke figuur
// is 120 breed en 244 hoog; het midden ligt op x = 60. Alleen de linkerhelft
// is getekend, de rechterhelft is dezelfde vorm gespiegeld. Vormen met
// `midden` liggen op de middellijn en worden niet gespiegeld.

import type { Spier } from '@/lib/club/training/spieren'

export interface SpierVorm {
  spier: Spier
  d: string
  /** Ligt diep of is een orgaan: in rust alleen een stippellijn. */
  diep?: boolean
  /** Op de middellijn, niet spiegelen. */
  midden?: boolean
}

export const FIGUUR_BREEDTE = 120
export const FIGUUR_HOOGTE = 244

export const HOOFD = { cx: 60, cy: 16, r: 11 }

/** Linkerhelft van het lichaam, iets over de middellijn zodat er geen naad ontstaat. */
export const SILHOUET_HELFT =
  'M61,30 L54,30 L54,34 Q47,37 40,41 Q31,42 29,52 L25,92 L21,130 Q18,142 23,148 L28,146 L28,132 L31,96 L35,66 L41,64 ' +
  'Q41,84 44,100 Q42,110 41,122 Q40,150 43,176 Q43,200 46,226 L40,236 L56,237 L56,226 Q58,200 56,178 Q58,154 59,134 L61,133 Z'

export const VOORKANT: readonly SpierVorm[] = [
  { spier: 'trapezius', d: 'M54,33 Q47,37 41,41 L45,44 Q50,40 55,37 Z' },
  { spier: 'middelste_schouder', d: 'M37,42 Q30,44 29,54 L31,60 Q32,49 38,45 Z' },
  { spier: 'voorste_schouder', d: 'M39,45 Q33,50 32,61 L36,64 Q38,54 44,48 Z' },
  { spier: 'borstspieren', d: 'M45,48 Q52,45 60,46 L60,66 Q51,70 43,66 Q38,60 45,48 Z' },
  { spier: 'biceps', d: 'M29,64 Q27,78 27,90 L31,92 Q34,80 34,67 Z' },
  { spier: 'onderarmen', d: 'M26,97 L22,126 L27,128 L30,99 Z' },
  { spier: 'schuine_buikspieren', d: 'M42,70 Q48,72 52,72 Q51,94 54,114 Q47,110 45,104 Q43,88 42,70 Z' },
  { spier: 'rechte_buikspier', d: 'M53,70 L60,70 L60,118 L55,116 Q52,94 53,70 Z' },
  { spier: 'diepe_buikspier', d: 'M45,97 Q52,100 60,100 L60,107 Q52,107 46,104 Z', diep: true },
  { spier: 'heupbuigers', d: 'M47,114 Q52,120 57,129 L52,132 Q47,124 45,117 Z' },
  { spier: 'abductoren', d: 'M41,119 L44,118 Q44,128 43,138 L41,135 Z' },
  { spier: 'quadriceps', d: 'M44,134 Q50,132 54,134 Q55,154 53,172 Q48,176 45,173 Q42,152 44,134 Z' },
  { spier: 'adductoren', d: 'M55,134 L58.5,135 Q58,150 56.5,162 Q55,150 55,134 Z' },
  { spier: 'scheenbeenspier', d: 'M45,184 Q46,202 47,220 L49,220 Q49,202 48,184 Z' },
  { spier: 'kuiten', d: 'M51,184 Q55,192 55.5,206 L53,210 Q51,196 50,186 Z' },
  { spier: 'hart_longen', d: 'M60,63 C54,58 54.5,51 57.8,51.5 C59,51.7 59.7,52.6 60,53.6 C60.3,52.6 61,51.7 62.2,51.5 C65.5,51 66,58 60,63 Z', diep: true, midden: true },
]

export const ACHTERKANT: readonly SpierVorm[] = [
  { spier: 'trapezius', d: 'M54,31 Q47,36 40,41 L48,46 Q54,52 57,62 L60,80 L60,31 Z' },
  { spier: 'middelste_schouder', d: 'M37,42 Q30,44 29,54 L31,60 Q32,49 38,45 Z' },
  { spier: 'achterste_schouder', d: 'M39,45 Q33,50 32,61 L36,64 Q38,55 46,48 Z' },
  { spier: 'rhomboideus', d: 'M47,49 Q53,54 56,63 L57,70 Q51,66 47,60 Z' },
  { spier: 'latissimus', d: 'M41,64 Q45,62 48,63 Q54,70 58,82 L60,84 L60,92 Q52,96 46,95 Q43,82 41,64 Z' },
  { spier: 'triceps', d: 'M29,64 Q27,78 27,90 L32,92 Q35,80 34,66 Z' },
  { spier: 'onderarmen', d: 'M26,97 L22,126 L27,128 L30,99 Z' },
  { spier: 'onderrug', d: 'M53,98 L60,98 L60,120 L54,118 Q52,107 53,98 Z' },
  { spier: 'bilspieren', d: 'M43,121 Q50,116 60,122 L60,144 Q50,148 44,142 Q41,132 43,121 Z' },
  { spier: 'abductoren', d: 'M42,106 Q48,104 52,108 L46,119 Q42,115 42,106 Z' },
  { spier: 'hamstrings', d: 'M44,148 Q51,151 57,148 Q58,162 56,174 Q50,177 46,174 Q42,162 44,148 Z' },
  { spier: 'kuiten', d: 'M45,182 Q50,178 56,182 Q57,196 54,210 Q49,212 46,208 Q43,196 45,182 Z' },
]

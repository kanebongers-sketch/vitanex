// ─── Club, voeding: de rekenhulp (PUUR) ─────────────────────────────────────
// Een startpunt voor de trainer, geen voorschrift. Rustverbruik volgens
// Mifflin-St Jeor, maal een activiteitsfactor, plus of min een doelpercentage.
// Eiwit in gram per kilo lichaamsgewicht (instelbaar), vet als deel van de
// kcal, koolhydraten vullen de rest. De trainer past de uitkomst daarna vrij aan.

export const ACTIVITEITEN = ['zittend', 'licht', 'matig', 'actief', 'zeer_actief'] as const
export type Activiteit = (typeof ACTIVITEITEN)[number]

export const DOELEN = ['afvallen', 'onderhoud', 'aankomen'] as const
export type VoedingDoel = (typeof DOELEN)[number]

export const GESLACHTEN = ['man', 'vrouw', 'anders'] as const
export type RekenGeslacht = (typeof GESLACHTEN)[number]

export const ACTIVITEIT_INFO: Record<Activiteit, { label: string; uitleg: string; factor: number }> = {
  zittend: { label: 'Zittend', uitleg: 'Kantoorwerk, weinig sport', factor: 1.2 },
  licht: { label: 'Licht actief', uitleg: '1 tot 2 keer per week sporten', factor: 1.375 },
  matig: { label: 'Matig actief', uitleg: '3 tot 4 keer per week sporten', factor: 1.55 },
  actief: { label: 'Actief', uitleg: '5 tot 6 keer per week, of lichamelijk werk', factor: 1.725 },
  zeer_actief: { label: 'Zeer actief', uitleg: 'Dagelijks zwaar trainen en lichamelijk werk', factor: 1.9 },
}

export const DOEL_INFO: Record<VoedingDoel, { label: string; uitleg: string; aanpassing: number }> = {
  afvallen: { label: 'Afvallen', uitleg: 'Ongeveer 15% onder het verbruik', aanpassing: -0.15 },
  onderhoud: { label: 'Onderhoud', uitleg: 'Gelijk aan het verbruik', aanpassing: 0 },
  aankomen: { label: 'Aankomen', uitleg: 'Ongeveer 10% boven het verbruik', aanpassing: 0.1 },
}

export const GESLACHT_LABEL: Record<RekenGeslacht, string> = { man: 'Man', vrouw: 'Vrouw', anders: 'Anders of zeg ik liever niet' }

/** Grenzen van de invoer: daarbuiten rekent de hulp niet. */
export const GRENZEN = {
  gewicht: { min: 35, max: 250 },
  lengte: { min: 120, max: 230 },
  leeftijd: { min: 16, max: 90 },
  eiwitPerKg: { min: 0.8, max: 2.5 },
  vetPercentage: { min: 20, max: 40 },
} as const

export const STANDAARD_EIWIT_PER_KG = 1.6
export const STANDAARD_VET_PERCENTAGE = 25

export interface RekenInvoer {
  gewichtKg: number
  lengteCm: number
  leeftijd: number
  geslacht: RekenGeslacht
  activiteit: Activiteit
  doel: VoedingDoel
  /** Gram eiwit per kilo lichaamsgewicht. */
  eiwitPerKg: number
  /** Deel van de kcal uit vet, in procenten. */
  vetPercentage: number
}

export interface Macros {
  kcal: number
  eiwitG: number
  koolhydratenG: number
  vetG: number
}

export interface RekenUitkomst extends Macros {
  /** Rustverbruik (Mifflin-St Jeor), afgerond. */
  rustverbruik: number
  /** Dagverbruik: rustverbruik maal de activiteitsfactor, afgerond. */
  dagverbruik: number
  /** Afvallen kwam onder het rustverbruik uit; de kcal staat daarom op het rustverbruik. */
  begrensd: boolean
  /** Eiwit en vet vullen samen (bijna) alle kcal; koolhydraten zijn dan op nul gezet. */
  geenRuimteKh: boolean
}

export const KCAL_PER_GRAM = { eiwit: 4, koolhydraten: 4, vet: 9 } as const

/** Mifflin-St Jeor. Bij "anders" het midden tussen man (+5) en vrouw (-161). */
export function rustverbruik(i: Pick<RekenInvoer, 'gewichtKg' | 'lengteCm' | 'leeftijd' | 'geslacht'>): number {
  const basis = 10 * i.gewichtKg + 6.25 * i.lengteCm - 5 * i.leeftijd
  const correctie = i.geslacht === 'man' ? 5 : i.geslacht === 'vrouw' ? -161 : -78
  return basis + correctie
}

function rondKcal(n: number): number {
  return Math.round(n / 10) * 10
}

/** Is de invoer bruikbaar? Een lijst met wat er mist of buiten de grenzen valt. */
export function controleerInvoer(i: Partial<RekenInvoer>): string[] {
  const fouten: string[] = []
  const binnen = (v: number | undefined, g: { min: number; max: number }) => typeof v === 'number' && Number.isFinite(v) && v >= g.min && v <= g.max
  if (!binnen(i.gewichtKg, GRENZEN.gewicht)) fouten.push(`Gewicht tussen ${GRENZEN.gewicht.min} en ${GRENZEN.gewicht.max} kg`)
  if (!binnen(i.lengteCm, GRENZEN.lengte)) fouten.push(`Lengte tussen ${GRENZEN.lengte.min} en ${GRENZEN.lengte.max} cm`)
  if (!binnen(i.leeftijd, GRENZEN.leeftijd)) fouten.push(`Leeftijd tussen ${GRENZEN.leeftijd.min} en ${GRENZEN.leeftijd.max} jaar`)
  if (!binnen(i.eiwitPerKg, GRENZEN.eiwitPerKg)) fouten.push(`Eiwit tussen ${GRENZEN.eiwitPerKg.min} en ${GRENZEN.eiwitPerKg.max} g per kg`)
  if (!binnen(i.vetPercentage, GRENZEN.vetPercentage)) fouten.push(`Vet tussen ${GRENZEN.vetPercentage.min} en ${GRENZEN.vetPercentage.max}%`)
  if (!i.geslacht || !(GESLACHTEN as readonly string[]).includes(i.geslacht)) fouten.push('Kies een geslacht')
  if (!i.activiteit || !(ACTIVITEITEN as readonly string[]).includes(i.activiteit)) fouten.push('Kies een activiteit')
  if (!i.doel || !(DOELEN as readonly string[]).includes(i.doel)) fouten.push('Kies een doel')
  return fouten
}

/** De dagdoelen voor deze invoer. Roep eerst controleerInvoer aan; daarbuiten is de uitkomst zinloos. */
export function bereken(i: RekenInvoer): RekenUitkomst {
  const rust = rustverbruik(i)
  const dag = rust * ACTIVITEIT_INFO[i.activiteit].factor
  const gewenst = dag * (1 + DOEL_INFO[i.doel].aanpassing)
  const begrensd = gewenst < rust
  const kcal = rondKcal(Math.max(gewenst, rust))
  const eiwitG = Math.round(i.gewichtKg * i.eiwitPerKg)
  const vetG = Math.round((kcal * i.vetPercentage) / 100 / KCAL_PER_GRAM.vet)
  const rest = kcal - eiwitG * KCAL_PER_GRAM.eiwit - vetG * KCAL_PER_GRAM.vet
  const koolhydratenG = Math.max(0, Math.round(rest / KCAL_PER_GRAM.koolhydraten))
  return { kcal, eiwitG, koolhydratenG, vetG, rustverbruik: Math.round(rust), dagverbruik: Math.round(dag), begrensd, geenRuimteKh: rest < 4 * 50 }
}

/** De kcal die de macro's samen opleveren (4, 4, 9 per gram). */
export function kcalUitMacros(m: Omit<Macros, 'kcal'>): number {
  return m.eiwitG * KCAL_PER_GRAM.eiwit + m.koolhydratenG * KCAL_PER_GRAM.koolhydraten + m.vetG * KCAL_PER_GRAM.vet
}

export interface Verdeling {
  eiwit: number
  koolhydraten: number
  vet: number
}

/** Het deel van de kcal per macro, in hele procenten (samen 100, of alles 0). */
export function verdeling(m: Omit<Macros, 'kcal'>): Verdeling {
  const totaal = kcalUitMacros(m)
  if (totaal <= 0) return { eiwit: 0, koolhydraten: 0, vet: 0 }
  const eiwit = Math.round((m.eiwitG * KCAL_PER_GRAM.eiwit * 100) / totaal)
  const vet = Math.round((m.vetG * KCAL_PER_GRAM.vet * 100) / totaal)
  return { eiwit, vet, koolhydraten: Math.max(0, 100 - eiwit - vet) }
}

/**
 * Wijken de macro's flink af van het kcal-doel (meer dan 10%)? Dan een korte
 * zin voor de trainer, anders null. Puur een hint: opslaan mag gewoon.
 */
export function afwijkingTekst(m: Macros): string | null {
  if (m.kcal <= 0) return null
  const uitMacros = kcalUitMacros(m)
  const verschil = uitMacros - m.kcal
  if (Math.abs(verschil) <= m.kcal * 0.1) return null
  return `De macro's tellen op tot ${uitMacros} kcal, ${Math.abs(verschil)} kcal ${verschil > 0 ? 'boven' : 'onder'} het dagdoel.`
}

/** Leeftijd in hele jaren op een datum (yyyy-mm-dd), of null. */
export function leeftijdOp(geboortedatum: string | null, vandaag: string): number | null {
  if (!geboortedatum || !/^\d{4}-\d{2}-\d{2}/.test(geboortedatum) || !/^\d{4}-\d{2}-\d{2}$/.test(vandaag)) return null
  const [gj, gm, gd] = geboortedatum.slice(0, 10).split('-').map(Number)
  const [j, m, d] = vandaag.split('-').map(Number)
  const jaren = j - gj - (m < gm || (m === gm && d < gd) ? 1 : 0)
  return jaren >= 0 && jaren < 130 ? jaren : null
}

// ════════════════════════════════════════════════════════════════════════════
// Gezondheid-berekeningen — één bron van waarheid voor hydratatie, stappen,
// calorieën en macro's. Gevoed door het intake-profiel (gewicht, lengte,
// leeftijd, geslacht, activiteitsniveau, doel).
//
// Deze module is het GEDEELDE CONTRACT waar onboarding, water, stappen,
// instellingen, voeding, training en profiel-prestaties op bouwen. Pas hier
// de logica aan, niet verspreid over de pagina's.
// ════════════════════════════════════════════════════════════════════════════

// ─── Domeintypes ──────────────────────────────────────────────────────────────

export type Geslacht = 'man' | 'vrouw' | 'anders' | 'zeg_ik_niet'

export type Activiteitsniveau =
  | 'sedentair'
  | 'licht'
  | 'gemiddeld'
  | 'actief'
  | 'zeer_actief'

export type FitnessDoel = 'afvallen' | 'onderhouden' | 'aankomen' | 'fitter'

export interface GezondheidProfiel {
  gewicht_kg: number | null
  lengte_cm: number | null
  geboortedatum: string | null
  geslacht: Geslacht | null
  activiteitsniveau: Activiteitsniveau | null
  fitness_doel: FitnessDoel | null
}

/** Profiel inclusief eventueel handmatig overschreven doelen (uit Instellingen). */
export interface DoelProfiel extends GezondheidProfiel {
  water_doel_ml?: number | null
  stappen_doel?: number | null
  calorie_doel?: number | null
}

export interface Macros {
  eiwit_g: number
  koolhydraten_g: number
  vet_g: number
}

// ─── Configuratie (labels, kleuren, multipliers) ──────────────────────────────

export const ACTIVITEIT_CONFIG: Record<
  Activiteitsniveau,
  { label: string; sub: string; multiplier: number; water_bonus_ml: number }
> = {
  sedentair:   { label: 'Zittend',      sub: 'Weinig beweging, kantoorwerk',          multiplier: 1.2,   water_bonus_ml: 0 },
  licht:       { label: 'Licht actief', sub: '1–2× sporten per week',                 multiplier: 1.375, water_bonus_ml: 250 },
  gemiddeld:   { label: 'Gemiddeld',    sub: '3–4× sporten per week',                 multiplier: 1.55,  water_bonus_ml: 500 },
  actief:      { label: 'Actief',       sub: '5–6× sporten per week',                 multiplier: 1.725, water_bonus_ml: 750 },
  zeer_actief: { label: 'Zeer actief',  sub: 'Dagelijks sport of fysiek werk',        multiplier: 1.9,   water_bonus_ml: 1000 },
}

export const DOEL_CONFIG: Record<
  FitnessDoel,
  {
    label: string
    sub: string
    kleur: string
    icoon: string
    stappen_doel: number
    /** kcal-aanpassing t.o.v. onderhoud (TDEE) */
    calorie_aanpassing: number
    eiwit_g_per_kg: number
    vet_g_per_kg: number
  }
> = {
  afvallen:    { label: 'Afvallen',      sub: 'Vet verliezen, gewicht omlaag',   kleur: 'var(--mf-red, #E24B4A)',   icoon: 'trending-down', stappen_doel: 10000, calorie_aanpassing: -500, eiwit_g_per_kg: 2.0, vet_g_per_kg: 0.8 },
  onderhouden: { label: 'Onderhouden',   sub: 'Gewicht stabiel houden',          kleur: 'var(--mf-blue, #185FA5)',  icoon: 'minus',         stappen_doel: 8000,  calorie_aanpassing: 0,    eiwit_g_per_kg: 1.8, vet_g_per_kg: 1.0 },
  aankomen:    { label: 'Aankomen',      sub: 'Spiermassa opbouwen',             kleur: 'var(--mf-green, #1D9E75)', icoon: 'trending-up',   stappen_doel: 7000,  calorie_aanpassing: 350,  eiwit_g_per_kg: 1.8, vet_g_per_kg: 1.0 },
  fitter:      { label: 'Fitter worden', sub: 'Conditie & energie verbeteren',   kleur: 'var(--mf-amber, #BA7517)', icoon: 'activity',      stappen_doel: 12000, calorie_aanpassing: 0,    eiwit_g_per_kg: 1.8, vet_g_per_kg: 1.0 },
}

export const STANDAARD_WATER_DOEL_ML = 2000
export const STANDAARD_STAPPEN_DOEL = 8000

// ─── Leeftijd ─────────────────────────────────────────────────────────────────

/** Leeftijd in hele jaren uit een ISO-datum (yyyy-mm-dd). Null bij ongeldige input. */
export function berekenLeeftijd(geboortedatum: string | null | undefined): number | null {
  if (!geboortedatum) return null
  const geboren = new Date(geboortedatum)
  if (Number.isNaN(geboren.getTime())) return null
  const nu = new Date()
  let leeftijd = nu.getFullYear() - geboren.getFullYear()
  const maand = nu.getMonth() - geboren.getMonth()
  if (maand < 0 || (maand === 0 && nu.getDate() < geboren.getDate())) leeftijd--
  if (leeftijd < 0 || leeftijd > 130) return null
  return leeftijd
}

// ─── Water ────────────────────────────────────────────────────────────────────

/**
 * Dagelijks hydratatiedoel in ml: 35 ml per kg lichaamsgewicht plus een bonus
 * op basis van activiteitsniveau. Afgerond op 250 ml, geklemd op 1500–4000 ml.
 */
export function berekenWaterDoelMl(
  gewichtKg: number | null | undefined,
  activiteitsniveau: Activiteitsniveau | null | undefined,
): number {
  if (!gewichtKg || gewichtKg <= 0) return STANDAARD_WATER_DOEL_ML
  const basis = gewichtKg * 35
  const bonus = activiteitsniveau ? ACTIVITEIT_CONFIG[activiteitsniveau].water_bonus_ml : 0
  const ruw = basis + bonus
  const afgerond = Math.round(ruw / 250) * 250
  return Math.max(1500, Math.min(4000, afgerond))
}

// ─── Stappen ──────────────────────────────────────────────────────────────────

/** Standaard stappendoel afgeleid van het fitnessdoel. */
export function standaardStappenDoel(fitnessDoel: FitnessDoel | null | undefined): number {
  if (!fitnessDoel) return STANDAARD_STAPPEN_DOEL
  return DOEL_CONFIG[fitnessDoel].stappen_doel
}

// ─── BMR / TDEE / Calorieën ───────────────────────────────────────────────────

/** Basaalmetabolisme (kcal/dag) volgens Mifflin-St Jeor. Null bij onvolledige data. */
export function berekenBMR(profiel: GezondheidProfiel): number | null {
  const { gewicht_kg, lengte_cm, geslacht } = profiel
  const leeftijd = berekenLeeftijd(profiel.geboortedatum)
  if (!gewicht_kg || !lengte_cm || leeftijd === null) return null

  const basis = 10 * gewicht_kg + 6.25 * lengte_cm - 5 * leeftijd
  // Geslachtsoffset; bij onbekend geslacht het gemiddelde van +5 en -161.
  const offset =
    geslacht === 'man' ? 5 :
    geslacht === 'vrouw' ? -161 :
    -78
  return Math.round(basis + offset)
}

/** Totale dagelijkse energiebehoefte (kcal/dag) = BMR × activiteitsmultiplier. */
export function berekenTDEE(profiel: GezondheidProfiel): number | null {
  const bmr = berekenBMR(profiel)
  if (bmr === null) return null
  const multiplier = profiel.activiteitsniveau
    ? ACTIVITEIT_CONFIG[profiel.activiteitsniveau].multiplier
    : 1.375
  return Math.round(bmr * multiplier)
}

/** Calorie-doel (kcal/dag) op basis van TDEE en fitnessdoel. Nooit onder BMR×1.1. */
export function berekenCalorieDoel(profiel: GezondheidProfiel): number | null {
  const tdee = berekenTDEE(profiel)
  if (tdee === null) return null
  const aanpassing = profiel.fitness_doel ? DOEL_CONFIG[profiel.fitness_doel].calorie_aanpassing : 0
  const bmr = berekenBMR(profiel)
  const ondergrens = bmr ? Math.round(bmr * 1.1) : 0
  return Math.max(ondergrens, tdee + aanpassing)
}

// ─── Macro's ──────────────────────────────────────────────────────────────────

/**
 * Macroverdeling (gram) op basis van calorie-doel, lichaamsgewicht en doel.
 * Eiwit en vet schalen met gewicht; koolhydraten vullen de resterende calorieën.
 */
export function berekenMacros(profiel: GezondheidProfiel): Macros | null {
  const calorieDoel = berekenCalorieDoel(profiel)
  if (calorieDoel === null || !profiel.gewicht_kg) return null

  const doel = profiel.fitness_doel ? DOEL_CONFIG[profiel.fitness_doel] : DOEL_CONFIG.onderhouden
  const eiwit_g = Math.round(profiel.gewicht_kg * doel.eiwit_g_per_kg)
  const vet_g = Math.round(profiel.gewicht_kg * doel.vet_g_per_kg)
  const restKcal = calorieDoel - eiwit_g * 4 - vet_g * 9
  const koolhydraten_g = Math.max(0, Math.round(restKcal / 4))

  return { eiwit_g, koolhydraten_g, vet_g }
}

// ─── BMI ──────────────────────────────────────────────────────────────────────

export interface BmiResultaat {
  waarde: number
  categorie: 'ondergewicht' | 'gezond' | 'overgewicht' | 'obesitas'
  label: string
  kleur: string
}

export function berekenBMI(
  gewichtKg: number | null | undefined,
  lengteCm: number | null | undefined,
): BmiResultaat | null {
  if (!gewichtKg || !lengteCm || lengteCm <= 0) return null
  const meter = lengteCm / 100
  const waarde = Math.round((gewichtKg / (meter * meter)) * 10) / 10

  if (waarde < 18.5) return { waarde, categorie: 'ondergewicht', label: 'Ondergewicht', kleur: 'var(--mf-amber, #BA7517)' }
  if (waarde < 25)   return { waarde, categorie: 'gezond',       label: 'Gezond gewicht', kleur: 'var(--mf-green, #1D9E75)' }
  if (waarde < 30)   return { waarde, categorie: 'overgewicht',  label: 'Overgewicht', kleur: 'var(--mf-amber, #BA7517)' }
  return { waarde, categorie: 'obesitas', label: 'Obesitas', kleur: 'var(--mf-red, #E24B4A)' }
}

// ─── Effectieve doelen (handmatig overschreven > automatisch berekend) ─────────

export interface EffectieveDoelen {
  water_doel_ml: number
  stappen_doel: number
  calorie_doel: number | null
  macros: Macros | null
  /** true wanneer de gebruiker dit doel handmatig heeft ingesteld in Instellingen. */
  water_handmatig: boolean
  stappen_handmatig: boolean
  calorie_handmatig: boolean
}

/**
 * Lost de daadwerkelijk te tonen doelen op. Een handmatig ingevuld doel (kolom
 * niet-null) wint; anders wordt het automatisch uit het profiel berekend.
 * Eén bron van waarheid voor water-, stappen-, voeding- en home-oppervlakken.
 */
export function effectieveDoelen(profiel: DoelProfiel): EffectieveDoelen {
  const water_handmatig = profiel.water_doel_ml != null
  const stappen_handmatig = profiel.stappen_doel != null
  const calorie_handmatig = profiel.calorie_doel != null

  return {
    water_doel_ml: profiel.water_doel_ml ?? berekenWaterDoelMl(profiel.gewicht_kg, profiel.activiteitsniveau),
    stappen_doel: profiel.stappen_doel ?? standaardStappenDoel(profiel.fitness_doel),
    calorie_doel: profiel.calorie_doel ?? berekenCalorieDoel(profiel),
    macros: berekenMacros(profiel),
    water_handmatig,
    stappen_handmatig,
    calorie_handmatig,
  }
}

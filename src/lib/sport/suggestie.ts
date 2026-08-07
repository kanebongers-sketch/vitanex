// ─── Sport — gewichtssuggestie (pure) ───────────────────────────────────────
// Lichte dubbele progressie voor de consumenten-sportlogger: haalde je vorige keer
// de bovenkant van je rep-bereik, dan één stap zwaarder; anders hetzelfde gewicht.
// Zonder vorige prestatie verzinnen we NOOIT een startgewicht (eerlijkheidsregel).
//
// Los van de persoonlijke blok-motor (lifeos/blok) gehouden: die werkt op RIR, de
// consumenten-logger op reps + gewicht. Zelfde idee, simpeler datamodel.

export interface VorigeSet {
  herhalingen: number
  gewichtKg: number | null
}

export type SuggestieActie = 'verhoog' | 'behoud' | 'onbekend'

export interface Suggestie {
  actie: SuggestieActie
  vorigeGewichtKg: number | null
  vorigeReps: number | null
  voorstelKg: number | null
}

/** Rondt een gewicht op de dichtstbijzijnde stap (bv. 2.5 kg). 0 bij onzin. */
export function rondOpStap(kg: number, stap: number): number {
  if (!Number.isFinite(kg) || kg <= 0) return 0
  if (!Number.isFinite(stap) || stap <= 0) return Math.round(kg * 100) / 100
  return Math.max(0, Math.round(Math.round((kg / stap) * 100) / 100) * stap)
}

/**
 * Het gewichtsadvies voor vandaag op basis van de vorige sessie van deze oefening.
 * `doelRepMax` is de bovenkant van het rep-bereik; `stap` de plaatstap (default 2.5).
 */
export function stelGewichtVoor(vorige: readonly VorigeSet[], doelRepMax: number, stap = 2.5): Suggestie {
  const werk = vorige.filter((s) => s.gewichtKg !== null && s.gewichtKg > 0 && s.herhalingen > 0)
  if (werk.length === 0) {
    return { actie: 'onbekend', vorigeGewichtKg: null, vorigeReps: null, voorstelKg: null }
  }
  // De zwaarste werkset van vorige keer is het ijkpunt.
  const top = werk.reduce((a, b) => ((b.gewichtKg as number) > (a.gewichtKg as number) ? b : a))
  const kg = top.gewichtKg as number

  if (Number.isFinite(doelRepMax) && doelRepMax > 0 && top.herhalingen >= doelRepMax) {
    const naar = rondOpStap(kg + stap, stap)
    if (naar > kg) {
      return { actie: 'verhoog', vorigeGewichtKg: kg, vorigeReps: top.herhalingen, voorstelKg: naar }
    }
  }
  return { actie: 'behoud', vorigeGewichtKg: kg, vorigeReps: top.herhalingen, voorstelKg: kg }
}

/** Parseert een rep-doel als tekst ("8-12", "10", "8 tot 12") naar {min,max}. */
export function leesRepBereik(herhalingen: string): { min: number; max: number } {
  const nums = (herhalingen.match(/\d+/g) ?? []).map(Number)
  if (nums.length === 0) return { min: 0, max: 0 }
  if (nums.length === 1) return { min: nums[0], max: nums[0] }
  return { min: Math.min(nums[0], nums[1]), max: Math.max(nums[0], nums[1]) }
}

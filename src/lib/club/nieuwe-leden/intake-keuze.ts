// ─── Club, nieuwe leden: de keuzes in de intake van het lid (PUUR) ──────────
// Wat het lid op de vier schermen tikt, en hoe dat het verzoek naar
// /api/club/lid/intake wordt (dezelfde vorm als de intake van de trainer).
// Zonder toestemming gaan gewicht, lengte en gezondheid niet mee.

import { METING_GRENZEN, PARQ_VRAGEN, type ParqSleutel } from '@/lib/club/training/intake'
import type { Doel, Niveau, Voorkeur, Zone } from '@/lib/club/training/typen'

/** De gezondheidsvragen in vaste volgorde (de teksten staan in TRAINING_LABELS.parq). */
export const PARQ_SLEUTELS: readonly ParqSleutel[] = PARQ_VRAGEN.map((v) => v.sleutel)

export interface IntakeKeuze {
  doelen: Doel[]
  /** Zoals getikt ("82,5"); leeg = niet ingevuld. */
  gewicht: string
  lengte: string
  toestemming: boolean
  /** Per gezondheidsvraag: ja (true), nee (false) of nog niet beantwoord. */
  gezondheid: Partial<Record<ParqSleutel, boolean>>
  toelichting: Partial<Record<ParqSleutel, string>>
  zones: Zone[]
  niveau: Niveau
  dagen: number
  minuten: number
  voorkeuren: Voorkeur[]
}

function getal(v: string): number | null {
  const t = v.trim().replace(',', '.')
  if (t === '') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : NaN
}

/** Klopt scherm 2? null = verder, anders welk veld fout is. */
export function kanVerderLichaam(k: Pick<IntakeKeuze, 'gewicht' | 'lengte' | 'toestemming'>): 'gewicht' | 'lengte' | null {
  if (!k.toestemming) return null
  const g = getal(k.gewicht)
  const [gMin, gMax] = METING_GRENZEN.gewicht_kg
  if (g !== null && (Number.isNaN(g) || g < gMin || g > gMax)) return 'gewicht'
  const l = getal(k.lengte)
  const [lMin, lMax] = METING_GRENZEN.lengte_cm
  if (l !== null && (Number.isNaN(l) || l < lMin || l > lMax)) return 'lengte'
  return null
}

/** Hoeveel gezondheidsvragen nog geen ja of nee hebben. */
export function gezondheidOpen(k: Pick<IntakeKeuze, 'gezondheid'>): number {
  return PARQ_VRAGEN.filter((v) => k.gezondheid[v.sleutel] === undefined).length
}

function tekst(v: string | undefined, max: number): string | null {
  const t = v?.trim()
  return t ? t.slice(0, max) : null
}

/** Het verzoek voor /api/club/lid/intake. */
export function bouwIntake(k: IntakeKeuze): Record<string, unknown> {
  const ja = PARQ_VRAGEN.map((v) => v.sleutel).filter((s) => k.gezondheid[s] === true)
  const beantwoord = gezondheidOpen(k) < PARQ_VRAGEN.length
  const klachten = ja
    .filter((s) => s !== 'gewricht' && s !== 'bloeddruk')
    .map((s) => (tekst(k.toelichting[s], 160) ? `${s}: ${tekst(k.toelichting[s], 160)}` : null))
    .filter((x): x is string => x !== null)
    .join('; ')
  const gezondheid = k.toestemming && beantwoord
    ? {
        blessures: ja.includes('gewricht') ? k.zones : [],
        blessureToelichting: ja.includes('gewricht') ? tekst(k.toelichting.gewricht, 500) : null,
        klachten: klachten ? klachten.slice(0, 500) : null,
        medicatie: ja.includes('bloeddruk') ? tekst(k.toelichting.bloeddruk, 300) : null,
        parqJa: ja,
      }
    : null
  const g = getal(k.gewicht)
  const l = getal(k.lengte)
  return {
    antwoorden: {
      doelen: k.doelen,
      niveau: k.niveau,
      dagenPerWeek: k.dagen,
      minutenPerSessie: k.minuten,
      voorkeuren: k.voorkeuren,
      motivatie: null,
      gezondheid,
    },
    metingen: k.toestemming ? { gewicht_kg: g !== null && !Number.isNaN(g) ? g : undefined, lengte_cm: l !== null && !Number.isNaN(l) ? l : undefined } : {},
    toestemming: k.toestemming,
  }
}

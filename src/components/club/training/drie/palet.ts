// ─── Fit Factory Club, 3D-oefenbeelden: kleuren van het figuur ──────────────
// Huid, kleding, schoenen en haar, plus welke spieren werken. Werkende spieren
// mengen naar de accentkleur van de sportschool en gloeien zacht.

import { Color } from 'three'
import type { Lichaamsdeel } from '@/lib/club/training/3d/typen'

export interface Palet {
  readonly huid: Color
  readonly shirt: Color
  readonly broek: Color
  readonly schoen: Color
  readonly zool: Color
  readonly haar: Color
  readonly accent: Color
  readonly spieren: ReadonlySet<Lichaamsdeel>
}

/** Hoe sterk een werkende spier naar de accentkleur mengt. */
const MENG = { huid: 0.55, stof: 0 } as const

/**
 * Op de huid mengen we naar een iets lichtere, verzadigde versie van de
 * accentkleur: een accent dat op huid lijkt (brons) blijft zo goed zichtbaar.
 */
function huidAccent(accent: Color): Color {
  return accent.clone().offsetHSL(0, 0.18, 0.1)
}

export function werkt(p: Palet, deel: Lichaamsdeel): boolean {
  return p.spieren.has(deel)
}

/** Basiskleur gemengd met de accentkleur (m van 0 tot 1) en wat schaduw in plooien (ao). */
export function kleurMet(basis: Color, p: Palet, m: number, stof = false, ao = 0): Color {
  const doel = stof ? p.accent : huidAccent(p.accent)
  const k = basis.clone().lerp(doel, (stof ? MENG.stof : MENG.huid) * Math.min(1, Math.max(0, m)))
  return ao > 0 ? k.multiplyScalar(1 - ao) : k
}

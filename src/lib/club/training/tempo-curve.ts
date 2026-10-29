// ─── Club, training: het tempo als bewegingscurve (PUUR) ────────────────────
// Het schema bewaart tempo als vier tekens ("3110": 3 sec omlaag, 1 sec stil
// onder, 1 sec omhoog, 0 sec stil boven; X is explosief). Hier wordt het een
// curve voor op het scherm: de stand van het gewicht door een herhaling heen.
// Alleen voor de weergave; de rep-speler leest het tempo zelf (repspeler/tempo).

export type TempoFase = 'omlaag' | 'onder' | 'omhoog' | 'boven'

export interface TempoDeel {
  fase: TempoFase
  /** Het teken zoals het in het schema staat: een cijfer of X. */
  teken: string
  /** Seconden (X telt als 0,6 sec), voor de breedte op de tijdlijn. */
  sec: number
}

export interface TempoCurve {
  delen: TempoDeel[]
  /** Duur van een herhaling in seconden. */
  totaal: number
  /** Punten van de curve, x en y van 0 tot 1 (y 0 = boven, 1 = onder). */
  punten: { x: number; y: number }[]
}

const FASEN: readonly TempoFase[] = ['omlaag', 'onder', 'omhoog', 'boven']
const EXPLOSIEF = 0.6

/** Het tempo uit het schema als vier delen, of null als het leeg of onleesbaar is. */
export function leesTempoCurve(ruw: string | null | undefined): TempoCurve | null {
  if (typeof ruw !== 'string') return null
  const t = ruw.toUpperCase().replace(/[\s.:/,-]/g, '')
  if (!/^[0-9X]{4}$/.test(t)) return null
  const delen = FASEN.map((fase, i) => {
    const teken = t[i]
    const sec = teken === 'X' ? EXPLOSIEF : Number(teken)
    return { fase, teken, sec }
  })
  const totaal = delen.reduce((s, d) => s + d.sec, 0)
  if (totaal <= 0) return null
  // De beweging zelf krijgt altijd wat breedte, ook bij 0: anders lijkt het een sprong.
  const breed = delen.map((d) => (d.fase === 'omlaag' || d.fase === 'omhoog' ? Math.max(d.sec, EXPLOSIEF) : d.sec))
  const som = breed.reduce((s, b) => s + b, 0)
  const hoogte: Record<TempoFase, [number, number]> = { omlaag: [0, 1], onder: [1, 1], omhoog: [1, 0], boven: [0, 0] }
  const punten = [{ x: 0, y: 0 }]
  let x = 0
  delen.forEach((d, i) => {
    if (breed[i] <= 0) return
    x += breed[i] / som
    punten.push({ x: Math.min(1, x), y: hoogte[d.fase][1] })
  })
  return { delen, totaal, punten }
}

/** Het tempo als korte notatie voor naast de curve: "3 1 1 0". */
export function tempoNotatie(curve: TempoCurve): string {
  return curve.delen.map((d) => d.teken).join(' ')
}

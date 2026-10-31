// ─── Club, rep-speler: geheugen van de frames (PUUR) ────────────────────────
// Een render heeft 72 losse frames. Uitgepakt kost een frame breedte maal
// hoogte maal 4 bytes: op 1080 px is dat ongeveer 336 MB per oefening, en
// Safari op de iPhone sluit het tabblad als dat na een paar oefeningen oploopt.
// Daarom drie regels:
// 1. De framemaat volgt de echte breedte op het scherm, met een plafond van
//    720 px op telefoons en 480 px bij databesparing (plafondVoor).
// 2. Uitgepakte frames bestaan alleen zolang een speler ze gebruikt; daarna
//    worden ze vrijgegeven (ImageBitmap.close()).
// 3. De ingepakte bestanden (webp, een paar MB per oefening) blijven bewaard
//    voor hoogstens de laatste 2 oefeningen, zodat terugkeren niet opnieuw
//    downloadt. Oudere oefeningen vallen eruit.
// Hier alleen de regels, zonder browser: getest in geheugen.test.ts.

/** Hoogstens zoveel oefeningen bewaren. */
export const MAX_OEFENINGEN = 2

export const PLAFOND_TELEFOON = 720
export const PLAFOND_ZUINIG = 480

export interface SchermProfiel {
  /** Telefoon (grove aanwijzer en een korte schermzijde). */
  telefoon: boolean
  /** navigator.connection.saveData. */
  zuinig: boolean
}

/** Een telefoon: aanraken als hoofdinvoer en de korte zijde van het scherm onder 600 css-px. Tablets niet. */
export function isTelefoon(grof: boolean, korteZijde: number): boolean {
  return grof && Number.isFinite(korteZijde) && korteZijde > 0 && korteZijde < 600
}

/** Grootste framemaat voor dit scherm, of null (geen plafond: HD op grote schermen). */
export function plafondVoor(p: SchermProfiel): number | null {
  if (p.zuinig) return PLAFOND_ZUINIG
  if (p.telefoon) return PLAFOND_TELEFOON
  return null
}

/** Geschat werkgeheugen van een uitgepakte reeks in bytes (RGBA). */
export function uitgepaktBytes(frames: number, breedte: number, hoogte = breedte): number {
  return Math.max(0, frames) * Math.max(0, breedte) * Math.max(0, hoogte) * 4
}

interface Post<R, K> {
  ruw: R | null
  klaar: K | null
  gebruik: number
}

/**
 * Voorraad per sleutel (oefening plus maat) met twee lagen: `ruw` (ingepakt,
 * klein) en `klaar` (uitgepakt, groot). `klaar` leeft alleen zolang `gebruik`
 * boven 0 is; de voorraad houdt hoogstens `max` sleutels, de oudste ongebruikte
 * valt eruit. Vrijgeven gaat via `sluitKlaar` en `sluitRuw`.
 */
export class FrameVoorraad<R, K> {
  private readonly posten = new Map<string, Post<R, K>>()

  constructor(
    private readonly max: number,
    private readonly sluitKlaar: (k: K) => void,
    private readonly sluitRuw: (r: R) => void = () => {},
  ) {}

  /** Een speler gaat deze sleutel gebruiken; hij wordt de nieuwste. */
  pak(sleutel: string): void {
    const post = this.posten.get(sleutel) ?? { ruw: null, klaar: null, gebruik: 0 }
    this.posten.delete(sleutel)
    this.posten.set(sleutel, { ...post, gebruik: post.gebruik + 1 })
    this.ruimOp()
  }

  /** Een speler stopt met deze sleutel. Bij 0 gebruikers worden de uitgepakte frames vrijgegeven. */
  laatGaan(sleutel: string): void {
    const post = this.posten.get(sleutel)
    if (!post) return
    const gebruik = Math.max(0, post.gebruik - 1)
    if (gebruik === 0 && post.klaar) this.sluitKlaar(post.klaar)
    this.posten.set(sleutel, { ...post, gebruik, klaar: gebruik === 0 ? null : post.klaar })
    this.ruimOp()
  }

  inGebruik(sleutel: string): boolean {
    return (this.posten.get(sleutel)?.gebruik ?? 0) > 0
  }

  ruw(sleutel: string): R | null {
    return this.posten.get(sleutel)?.ruw ?? null
  }

  klaar(sleutel: string): K | null {
    return this.posten.get(sleutel)?.klaar ?? null
  }

  /** Ingepakte bestanden bewaren. Zonder post (al uit de voorraad) meteen vrijgeven. */
  zetRuw(sleutel: string, ruw: R): boolean {
    const post = this.posten.get(sleutel)
    if (!post) {
      this.sluitRuw(ruw)
      return false
    }
    if (post.ruw && post.ruw !== ruw) this.sluitRuw(post.ruw)
    this.posten.set(sleutel, { ...post, ruw })
    return true
  }

  /**
   * Uitgepakte frames bewaren. Gebruikt niemand de sleutel meer (de speler is
   * al weg), dan meteen vrijgeven en false: zo blijft er nooit iets hangen.
   */
  zetKlaar(sleutel: string, klaar: K): boolean {
    const post = this.posten.get(sleutel)
    if (!post || post.gebruik === 0 || (post.klaar && post.klaar !== klaar)) {
      this.sluitKlaar(klaar)
      return false
    }
    this.posten.set(sleutel, { ...post, klaar })
    return true
  }

  /** Sleutels van oud naar nieuw (voor tests en controle). */
  sleutels(): string[] {
    return [...this.posten.keys()]
  }

  private ruimOp(): void {
    for (const [sleutel, post] of this.posten) {
      if (this.posten.size <= this.max) return
      if (post.gebruik > 0) continue
      if (post.klaar) this.sluitKlaar(post.klaar)
      if (post.ruw) this.sluitRuw(post.ruw)
      this.posten.delete(sleutel)
    }
  }
}

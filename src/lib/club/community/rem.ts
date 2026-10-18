// ─── Club, community: rem per lid (PUUR) ────────────────────────────────────
// Een lid kan niet onbeperkt berichten plaatsen of melden. De server telt de
// eigen berichten (ook vastgehouden en verborgen) in de database, dus de rem
// werkt ook over meerdere servers en na een herstart.

export interface RemRegel {
  max: number
  vensterMs: number
  fout: string
}

const MINUUT = 60_000
const DAG = 24 * 60 * MINUUT

export const BERICHT_REM: readonly RemRegel[] = [
  { max: 1, vensterMs: 15_000, fout: 'Je plaatste net al een bericht. Wacht een paar seconden.' },
  { max: 5, vensterMs: 10 * MINUUT, fout: 'Je hebt veel berichten achter elkaar geplaatst. Probeer het over tien minuten opnieuw.' },
  { max: 30, vensterMs: DAG, fout: 'Je hebt vandaag het maximum aantal berichten bereikt. Morgen kan het weer.' },
]

export const MELD_REM: readonly RemRegel[] = [{ max: 10, vensterMs: DAG, fout: 'Je hebt vandaag al veel berichten gemeld. De sportschool kijkt ernaar.' }]

/** Het langste venster: zo ver terug hoeft de server te tellen. */
export function remVenster(regels: readonly RemRegel[]): number {
  return regels.reduce((max, r) => Math.max(max, r.vensterMs), 0)
}

/** null = het mag; anders de foutmelding voor het lid. */
export function remt(regels: readonly RemRegel[], eerdere: readonly string[], nu: Date): string | null {
  const t = nu.getTime()
  const tijden = eerdere.map((op) => Date.parse(op)).filter((x) => !Number.isNaN(x) && x <= t)
  const geraakt = regels.find((r) => tijden.filter((x) => t - x < r.vensterMs).length >= r.max)
  return geraakt ? geraakt.fout : null
}

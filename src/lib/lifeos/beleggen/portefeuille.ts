// ─── LifeOS — de portefeuille doorrekenen (PUUR) ────────────────────────────
// Posities + koersen + wisselkoersen → waarde in euro, vandaag, en winst/verlies.
//
// EERLIJK OVER WAT WE NIET WETEN:
//   • Zonder aankoopprijs geen winst/verlies — dan staat er "onbekend", geen 0.
//   • Bij een notering in een andere valuta (CoreWeave in USD) rekenen we je
//     aankoopwaarde om tegen de wisselkoers van NU — tenzij je je inleg in euro
//     vastlegde (`inlegEur`, DEGIRO: waarde − ongerealiseerde W/V). Dan rekenen we
//     daarmee, en loopt je winst/verlies gelijk met DEGIRO.

export interface Positie {
  id: string
  symbool: string
  isin: string | null
  naam: string
  valuta: string
  aantal: number
  aankoopprijs: number | null
  /** Je inleg in euro, als je die vastlegde. Wint van aankoopprijs × wisselkoers. */
  inlegEur?: number | null
}

export interface KoersStand {
  koers: number
  vorigeSlot: number | null
  valuta: string
  opgehaaldOp: string
}

export interface PositieRegel extends Positie {
  koers: number | null
  koersValuta: string
  dagPct: number | null
  waardeEur: number | null
  dagEur: number | null
  inlegEur: number | null
  winstEur: number | null
  winstPct: number | null
}

export interface Totaal {
  waardeEur: number
  dagEur: number
  dagPct: number | null
  inlegEur: number | null
  winstEur: number | null
  winstPct: number | null
  /** Alle posities hebben een koers én een aankoopprijs. */
  compleet: boolean
  zonderKoers: number
  zonderAankoop: number
}

/** Het Yahoo-symbool van de wisselkoers voor `valuta` (aantal valuta per euro). */
export function fxSymbool(valuta: string): string | null {
  const v = valuta === 'GBp' || valuta === 'GBX' ? 'GBP' : valuta.toUpperCase()
  return v === 'EUR' ? null : `EUR${v}=X`
}

/** Factor om een bedrag in `valuta` naar euro om te zetten, of null als de wisselkoers ontbreekt. */
export function naarEuroFactor(valuta: string, koersen: ReadonlyMap<string, KoersStand>): number | null {
  const pence = valuta === 'GBp' || valuta === 'GBX'
  const sym = fxSymbool(valuta)
  if (sym === null) return 1
  const fx = koersen.get(sym)?.koers
  if (!fx || fx <= 0) return null
  return (pence ? 0.01 : 1) / fx
}

const rond = (n: number): number => Math.round(n * 100) / 100

export function rekenRegel(p: Positie, koersen: ReadonlyMap<string, KoersStand>): PositieRegel {
  const k = koersen.get(p.symbool)
  const valuta = k?.valuta ?? p.valuta
  const factor = naarEuroFactor(valuta, koersen)
  const leeg: PositieRegel = { ...p, koers: k?.koers ?? null, koersValuta: valuta, dagPct: null, waardeEur: null, dagEur: null, inlegEur: null, winstEur: null, winstPct: null }
  if (!k || factor === null) return leeg

  const waardeEur = k.koers * p.aantal * factor
  const dagEur = k.vorigeSlot ? (k.koers - k.vorigeSlot) * p.aantal * factor : null
  const dagPct = k.vorigeSlot ? ((k.koers - k.vorigeSlot) / k.vorigeSlot) * 100 : null
  const inlegEur = p.inlegEur ?? (p.aankoopprijs !== null ? p.aankoopprijs * p.aantal * factor : null)
  const winstEur = inlegEur !== null ? waardeEur - inlegEur : null
  return {
    ...leeg,
    waardeEur: rond(waardeEur),
    dagEur: dagEur !== null ? rond(dagEur) : null,
    dagPct,
    inlegEur: inlegEur !== null ? rond(inlegEur) : null,
    winstEur: winstEur !== null ? rond(winstEur) : null,
    winstPct: inlegEur ? ((waardeEur - inlegEur) / inlegEur) * 100 : null,
  }
}

export function rekenTotaal(regels: readonly PositieRegel[], cashEur: number): Totaal {
  const metKoers = regels.filter((r) => r.waardeEur !== null)
  const waarde = metKoers.reduce((s, r) => s + (r.waardeEur ?? 0), 0) + cashEur
  const dagEur = metKoers.reduce((s, r) => s + (r.dagEur ?? 0), 0)
  const gisteren = waarde - dagEur
  const zonderAankoop = regels.filter((r) => r.aankoopprijs === null && (r.inlegEur ?? null) === null).length
  const compleet = metKoers.length === regels.length && zonderAankoop === 0 && regels.length > 0
  const inleg = compleet ? regels.reduce((s, r) => s + (r.inlegEur ?? 0), 0) : null
  const belegd = metKoers.reduce((s, r) => s + (r.waardeEur ?? 0), 0)
  return {
    waardeEur: rond(waarde),
    dagEur: rond(dagEur),
    dagPct: gisteren > 0 ? (dagEur / gisteren) * 100 : null,
    inlegEur: inleg !== null ? rond(inleg) : null,
    winstEur: inleg !== null ? rond(belegd - inleg) : null,
    winstPct: inleg ? ((belegd - inleg) / inleg) * 100 : null,
    compleet,
    zonderKoers: regels.length - metKoers.length,
    zonderAankoop,
  }
}

/** Welke symbolen (posities + benodigde wisselkoersen) we moeten ophalen. */
export function benodigdeSymbolen(posities: readonly Positie[]): string[] {
  const set = new Set<string>()
  for (const p of posities) {
    set.add(p.symbool)
    const fx = fxSymbool(p.valuta)
    if (fx) set.add(fx)
  }
  return [...set]
}

// ─── Club, betalen: kalenderdatums zonder tijdzonefouten (PUUR) ─────────────
// Contracten en facturen rekenen in kalenderdagen in Nederland. Een datum is
// een ISO-tekst "jjjj-mm-dd" (type Datum), zonder tijd en zonder tijdzone.
// Rekenen gaat via een dagnummer (dagen sinds 1970-01-01) met het algoritme
// van Howard Hinnant voor de gregoriaanse kalender, nooit via Date. Alleen
// vandaagInAmsterdam() kijkt naar een tijdstip, en die vraagt de kalenderdag
// in Europe/Amsterdam op, dus zomertijd en middernacht in UTC tellen niet.

declare const DATUM_MERK: unique symbol

/** Een kalenderdatum "jjjj-mm-dd" in Nederlandse kalenderdagen. */
export type Datum = string & { readonly [DATUM_MERK]: true }

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/

export interface JMD {
  jaar: number
  maand: number
  dag: number
}

export function isSchrikkeljaar(jaar: number): boolean {
  return (jaar % 4 === 0 && jaar % 100 !== 0) || jaar % 400 === 0
}

const DAGEN = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const

export function dagenInMaand(jaar: number, maand: number): number {
  if (maand === 2 && isSchrikkeljaar(jaar)) return 29
  return DAGEN[maand - 1]
}

/** Lees een datum. Gooit bij iets dat geen bestaande kalenderdag is (zoals 2026-02-30). */
export function datum(tekst: string): Datum {
  const m = ISO.exec(tekst)
  if (!m) throw new RangeError(`Geen datum in de vorm jjjj-mm-dd: ${tekst}`)
  const jaar = Number(m[1])
  const maand = Number(m[2])
  const dag = Number(m[3])
  if (maand < 1 || maand > 12 || dag < 1 || dag > dagenInMaand(jaar, maand)) throw new RangeError(`Deze dag bestaat niet: ${tekst}`)
  return tekst as Datum
}

export function isDatum(tekst: unknown): tekst is Datum {
  if (typeof tekst !== 'string') return false
  try {
    datum(tekst)
    return true
  } catch {
    return false
  }
}

export function delen(d: Datum): JMD {
  return { jaar: Number(d.slice(0, 4)), maand: Number(d.slice(5, 7)), dag: Number(d.slice(8, 10)) }
}

export function vanDelen(jaar: number, maand: number, dag: number): Datum {
  return datum(`${String(jaar).padStart(4, '0')}-${String(maand).padStart(2, '0')}-${String(dag).padStart(2, '0')}`)
}

/** Dagnummer: dagen sinds 1970-01-01 (Hinnant, days_from_civil). */
export function dagNummer(d: Datum): number {
  const { jaar, maand, dag } = delen(d)
  const y = maand <= 2 ? jaar - 1 : jaar
  const era = Math.floor(y / 400)
  const yoe = y - era * 400
  const mp = (maand + 9) % 12
  const doy = Math.floor((153 * mp + 2) / 5) + dag - 1
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy
  return era * 146097 + doe - 719468
}

/** Datum bij een dagnummer (Hinnant, civil_from_days). */
export function vanDagNummer(n: number): Datum {
  const z = n + 719468
  const era = Math.floor(z / 146097)
  const doe = z - era * 146097
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365)
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100))
  const mp = Math.floor((5 * doy + 2) / 153)
  const dag = doy - Math.floor((153 * mp + 2) / 5) + 1
  const maand = mp < 10 ? mp + 3 : mp - 9
  const jaar = yoe + era * 400 + (maand <= 2 ? 1 : 0)
  return vanDelen(jaar, maand, dag)
}

export function plusDagen(d: Datum, dagen: number): Datum {
  if (!Number.isSafeInteger(dagen)) throw new RangeError(`Aantal dagen moet een geheel getal zijn: ${String(dagen)}`)
  return vanDagNummer(dagNummer(d) + dagen)
}

/**
 * Tel maanden op. Bestaat de dag niet in de doelmaand, dan wordt het de
 * laatste dag van die maand: 31 januari plus een maand is 28 februari (29 in
 * een schrikkeljaar). Voor een vast schema reken je altijd vanaf het anker,
 * nooit van uitkomst naar uitkomst (zie periodes.ts).
 */
export function plusMaanden(d: Datum, maanden: number): Datum {
  if (!Number.isSafeInteger(maanden)) throw new RangeError(`Aantal maanden moet een geheel getal zijn: ${String(maanden)}`)
  const { jaar, maand, dag } = delen(d)
  const index = jaar * 12 + (maand - 1) + maanden
  const nieuwJaar = Math.floor(index / 12)
  const nieuweMaand = index - nieuwJaar * 12 + 1
  return vanDelen(nieuwJaar, nieuweMaand, Math.min(dag, dagenInMaand(nieuwJaar, nieuweMaand)))
}

/** Aantal dagen van `van` tot `tot` (tot telt niet mee). Negatief als tot voor van ligt. */
export function dagenTussen(van: Datum, tot: Datum): number {
  return dagNummer(tot) - dagNummer(van)
}

/** Vergelijk twee datums: negatief, 0 of positief. ISO-teksten sorteren als tekst goed. */
export function vergelijk(a: Datum, b: Datum): number {
  return a < b ? -1 : a > b ? 1 : 0
}

export function vroegste(a: Datum, b: Datum): Datum {
  return a <= b ? a : b
}

export function laatste(a: Datum, b: Datum): Datum {
  return a >= b ? a : b
}

const AMSTERDAM = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' })

/** De kalenderdag in Nederland op dit tijdstip. */
export function vandaagInAmsterdam(nu: Date): Datum {
  const delenNu = AMSTERDAM.formatToParts(nu)
  const deel = (soort: string): string => delenNu.find((p) => p.type === soort)?.value ?? ''
  return datum(`${deel('year')}-${deel('month')}-${deel('day')}`)
}

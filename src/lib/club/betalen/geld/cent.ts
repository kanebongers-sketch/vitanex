// ─── Club, betalen: geld in hele centen (PUUR) ──────────────────────────────
// Elk bedrag in het betaalsysteem is een geheel aantal centen van het type
// Cent. Nooit een kommagetal in euro's: dat geeft afrondfouten. Alleen dit
// bestand rekent tussen centen en euro's (lintregel: geen deling door 100
// buiten dit bestand, zie geld/lintregel.test.ts).
//
// Vermenigvuldigen met een breuk (korting, btw, pro rata) rekent exact met
// BigInt en rondt daarna een keer af volgens AFRONDING.

declare const CENT_MERK: unique symbol

/** Een geheel aantal eurocenten. Alleen te maken via cent() of de rekenfuncties hieronder. */
export type Cent = number & { readonly [CENT_MERK]: true }

/**
 * Afronding bij een breuk: "half op" in de commerciele betekenis. Precies een
 * halve cent gaat van nul af (2,5 wordt 3 en -2,5 wordt -3), de rest naar de
 * dichtstbijzijnde cent. Zo is een creditnota altijd het spiegelbeeld van de
 * factuur en hangt de uitkomst niet af van het teken.
 */
export const AFRONDING = 'half_van_nul_af' as const

/** Maak een Cent van een geheel getal. Gooit bij een kommagetal, NaN of een getal buiten het veilige bereik. */
export function cent(n: number): Cent {
  if (!Number.isSafeInteger(n)) throw new RangeError(`Geen geldig bedrag in centen: ${String(n)}`)
  return (n === 0 ? 0 : n) as Cent
}

/** Is dit een geldig bedrag in centen? */
export function isCent(n: unknown): n is Cent {
  return typeof n === 'number' && Number.isSafeInteger(n)
}

export const NUL: Cent = cent(0)

export function plus(a: Cent, b: Cent): Cent {
  return cent(a + b)
}

export function min(a: Cent, b: Cent): Cent {
  return cent(a - b)
}

export function negatief(a: Cent): Cent {
  return cent(-a)
}

export function absoluut(a: Cent): Cent {
  return cent(Math.abs(a))
}

/** De som van een rij bedragen (lege rij is 0). */
export function som(bedragen: readonly Cent[]): Cent {
  return bedragen.reduce<Cent>((s, b) => plus(s, b), NUL)
}

/** Het kleinste van twee bedragen. */
export function kleinste(a: Cent, b: Cent): Cent {
  return a <= b ? a : b
}

/** Het grootste van twee bedragen. */
export function grootste(a: Cent, b: Cent): Cent {
  return a >= b ? a : b
}

/** Vermenigvuldig met een geheel getal (bijvoorbeeld een aantal). */
export function maal(a: Cent, factor: number): Cent {
  if (!Number.isSafeInteger(factor)) throw new RangeError(`Factor moet een geheel getal zijn: ${String(factor)}`)
  return vanBigInt(BigInt(a) * BigInt(factor))
}

/**
 * Vermenigvuldig met de breuk teller/noemer en rond af volgens AFRONDING.
 * Voorbeeld: 21 procent btw uit een bedrag inclusief is maalBreuk(b, 21, 121).
 */
export function maalBreuk(a: Cent, teller: number, noemer: number): Cent {
  if (!Number.isSafeInteger(teller)) throw new RangeError(`Teller moet een geheel getal zijn: ${String(teller)}`)
  if (!Number.isSafeInteger(noemer) || noemer <= 0) throw new RangeError(`Noemer moet een positief geheel getal zijn: ${String(noemer)}`)
  return vanBigInt(deelAfgerond(BigInt(a) * BigInt(teller), BigInt(noemer)))
}

/** Exacte deling met afronding half van nul af. Noemer is positief. */
export function deelAfgerond(n: bigint, d: bigint): bigint {
  const q = n / d
  const r = n % d
  const rAbs = r < BigInt(0) ? -r : r
  if (rAbs * BigInt(2) >= d) return n < BigInt(0) ? q - BigInt(1) : q + BigInt(1)
  return q
}

function vanBigInt(n: bigint): Cent {
  const getal = Number(n)
  if (!Number.isSafeInteger(getal)) throw new RangeError('Bedrag valt buiten het veilige bereik')
  return cent(getal)
}

/** Hele euro's naar centen (bijvoorbeeld 40 wordt 4000). */
export function euro(heleEuros: number): Cent {
  if (!Number.isSafeInteger(heleEuros)) throw new RangeError(`Geen geheel aantal euro: ${String(heleEuros)}`)
  return maal(cent(100), heleEuros)
}

/**
 * Bedrag als tekst in nl-NL: "€ 1.234,56", negatief "€ -1.234,56" (zoals
 * Intl nl-NL). Gewone spaties, zelf opgebouwd, zodat de uitkomst niet afhangt
 * van de ICU-versie van de server.
 */
export function formatEuro(a: Cent): string {
  const teken = a < 0 ? '-' : ''
  const abs = Math.abs(a)
  const centen = abs % 100
  // Deelbaar door 100, dus exact (geen kommagetal onderweg).
  const euros = (abs - centen) / 100
  const heel = String(euros).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `€ ${teken}${heel},${String(centen).padStart(2, '0')}`
}

const EURO_TEKST = /^(-)?(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/

/**
 * Lees een bedrag dat iemand intypt ("40", "40,5", "1.234,56", "-12,00").
 * Geeft null bij alles wat niet eenduidig is (punt als decimaalteken, drie
 * decimalen, letters). Nooit via parseFloat.
 */
export function leesEuroTekst(tekst: string): Cent | null {
  const m = EURO_TEKST.exec(tekst.trim().replace(/^€\s*/, ''))
  if (!m) return null
  const euros = Number(m[2].replace(/\./g, ''))
  const centen = m[3] === undefined ? 0 : Number(m[3].padEnd(2, '0'))
  if (!Number.isSafeInteger(euros * 100 + centen)) return null
  const bedrag = euros * 100 + centen
  return cent(m[1] ? -bedrag : bedrag)
}

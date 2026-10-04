// Getallen voor de beleggingskaart: euro's, procenten, koersen. Eén plek.

const EURO = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' })
const PCT = new Intl.NumberFormat('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const AANTAL = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 6 })

export function euro(n: number): string {
  return EURO.format(n)
}

/** "+€ 12,30" / "−€ 4,10" — teken altijd zichtbaar (niet alleen kleur). */
export function euroMetTeken(n: number): string {
  const s = EURO.format(Math.abs(n))
  return n > 0 ? `+${s}` : n < 0 ? `−${s}` : s
}

export function procent(n: number): string {
  const s = PCT.format(Math.abs(n))
  return `${n > 0 ? '+' : n < 0 ? '−' : ''}${s}%`
}

export function koers(n: number, valuta: string): string {
  try {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: valuta === 'GBp' ? 'GBP' : valuta, maximumFractionDigits: 4 }).format(valuta === 'GBp' ? n / 100 : n)
  } catch {
    return `${AANTAL.format(n)} ${valuta}`
  }
}

export function aantal(n: number): string {
  return AANTAL.format(n)
}

/** De klasse voor winst/verlies: richting via teken én kleur. */
export function richting(n: number | null): string {
  if (n === null || n === 0) return ''
  return n > 0 ? 'bel--plus' : 'bel--min'
}

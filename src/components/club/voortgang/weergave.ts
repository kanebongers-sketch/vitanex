// ─── Club, voortgang: kleine weergavehulpjes voor de componenten ────────────

const KORT = new Intl.DateTimeFormat('nl-NL', { timeZone: 'UTC', day: 'numeric', month: 'short' })
const LANG = new Intl.DateTimeFormat('nl-NL', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' })

function alsDatum(iso: string): Date | null {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`)
  return Number.isNaN(d.getTime()) ? null : d
}

/** "1 aug." zonder punt: "1 aug". */
export function datumKort(iso: string): string {
  const d = alsDatum(iso)
  return d ? KORT.format(d).replace('.', '') : iso
}

export function datumLang(iso: string): string {
  const d = alsDatum(iso)
  return d ? LANG.format(d) : iso
}

/** Getal op Nederlandse wijze, hoogstens een decimaal. */
export function getal(n: number): string {
  return n.toLocaleString('nl-NL', { maximumFractionDigits: 1 })
}

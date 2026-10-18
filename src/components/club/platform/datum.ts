// Datums op het platformoverzicht, altijd in Nederlandse tijd.

const DATUM = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Amsterdam' })
const MOMENT = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' })

function geldig(iso: string): Date | null {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

/** "18 okt. 2026", of "onbekend" als de datum kapot is. */
export function nlDatum(iso: string): string {
  const d = geldig(iso)
  return d ? DATUM.format(d) : 'onbekend'
}

/** "18 okt. 10:24". */
export function nlMoment(iso: string): string {
  const d = geldig(iso)
  return d ? MOMENT.format(d) : 'onbekend'
}

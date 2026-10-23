// ─── Club, health: adressen van de leden-API in de app (PUUR) ───────────────
// Kijkt Kane mee (voorvertoning), dan krijgt elke URL ?voor=<id>; voor een lid nooit.

export function healthUrl(pad: string, voor: string | null): string {
  const url = `/api/club/lid/health${pad}`
  return voor ? `${url}${url.includes('?') ? '&' : '?'}voor=${encodeURIComponent(voor)}` : url
}

export const DATUM_KORT = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', timeZone: 'Europe/Amsterdam' })

export function datumKort(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : DATUM_KORT.format(d)
}

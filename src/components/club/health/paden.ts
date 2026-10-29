// ─── Club, health: adressen van de leden-API in de app (PUUR) ───────────────
import { LOCALE, type Taal } from '@/lib/aiyourgym/taal/taal'
import { TIJDZONE } from '@/lib/aiyourgym/taal/formaat'

// Kijkt Kane mee (voorvertoning), dan krijgt elke URL ?voor=<id>; voor een lid nooit.

export function healthUrl(pad: string, voor: string | null): string {
  const url = `/api/club/lid/health${pad}`
  return voor ? `${url}${url.includes('?') ? '&' : '?'}voor=${encodeURIComponent(voor)}` : url
}

/** 12 okt. | 12 Oct, in de taal van de pagina. */
export function datumKort(iso: string | null, taal: Taal = 'nl'): string {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat(LOCALE[taal], { day: 'numeric', month: 'short', timeZone: TIJDZONE }).format(d)
}

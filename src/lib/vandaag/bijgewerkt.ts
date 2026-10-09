// "Waar rust deze kaart op?" — één regel over hoe vers de telefoon-data is.
// Oude data verzwijgen is oneerlijk; daarom zegt de regel het erbij als de
// laatste sync meer dan een dag geleden is.

import { dagPlus, dagVan } from '@/lib/lifeos/blokken/tijd'
import { NL, type Taalset } from '@/lib/i18n/taalset'

const BRON_NAAM: Record<string, string> = {
  health_connect: 'Health Connect',
  healthkit: 'Apple Health',
  google_health: 'Google Fit',
}

export interface Bijgewerkt {
  bron: string
  tijd: string
}

export interface BijgewerktRegel {
  tekst: string
  /** Meer dan een dag oud: de kaart mist waarschijnlijk je laatste nacht. */
  oud: boolean
}

export function bijgewerktRegel(b: Bijgewerkt | null, nu: Date = new Date(), ts: Taalset = NL): BijgewerktRegel | null {
  if (!b) return null
  const moment = new Date(b.tijd)
  if (Number.isNaN(moment.getTime())) return null
  const bron = BRON_NAAM[b.bron] ?? ts.t('vandaag.bijgewerkt.jeTelefoon')
  const tijd = new Intl.DateTimeFormat(ts.locale, { timeZone: 'Europe/Amsterdam', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(moment)
  const dag = dagVan(moment)
  const vandaag = dagVan(nu)
  if (dag === vandaag) return { tekst: ts.t('vandaag.bijgewerkt.vandaag', { tijd, bron }), oud: false }
  if (dag === dagPlus(vandaag, -1)) return { tekst: ts.t('vandaag.bijgewerkt.gisteren', { tijd, bron }), oud: false }
  const datum = new Intl.DateTimeFormat(ts.locale, { timeZone: 'Europe/Amsterdam', day: 'numeric', month: 'short' }).format(moment)
  return { tekst: ts.t('vandaag.bijgewerkt.oud', { datum, bron }), oud: true }
}

// "Waar rust deze kaart op?" — één regel over hoe vers de telefoon-data is.
// Oude data verzwijgen is oneerlijk; daarom zegt de regel het erbij als de
// laatste sync meer dan een dag geleden is.

import { dagPlus, dagVan } from '@/lib/lifeos/blokken/tijd'

const BRON_NAAM: Record<string, string> = {
  health_connect: 'Health Connect',
  healthkit: 'Apple Health',
  google_health: 'Google Fit',
}

const TIJD = new Intl.DateTimeFormat('nl-NL', { timeZone: 'Europe/Amsterdam', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
const DATUM = new Intl.DateTimeFormat('nl-NL', { timeZone: 'Europe/Amsterdam', day: 'numeric', month: 'short' })

export interface Bijgewerkt {
  bron: string
  tijd: string
}

export interface BijgewerktRegel {
  tekst: string
  /** Meer dan een dag oud: de kaart mist waarschijnlijk je laatste nacht. */
  oud: boolean
}

export function bijgewerktRegel(b: Bijgewerkt | null, nu: Date = new Date()): BijgewerktRegel | null {
  if (!b) return null
  const moment = new Date(b.tijd)
  if (Number.isNaN(moment.getTime())) return null
  const bron = BRON_NAAM[b.bron] ?? 'je telefoon'
  const dag = dagVan(moment)
  const vandaag = dagVan(nu)
  const gisteren = dagPlus(vandaag, -1)
  if (dag === vandaag) return { tekst: `Bijgewerkt vandaag om ${TIJD.format(moment)} uit ${bron}.`, oud: false }
  if (dag === gisteren) return { tekst: `Bijgewerkt gisteren om ${TIJD.format(moment)} uit ${bron}.`, oud: false }
  return {
    tekst: `Laatst bijgewerkt op ${DATUM.format(moment)} uit ${bron}. Open de app op je telefoon om je nacht en stappen op te halen.`,
    oud: true,
  }
}

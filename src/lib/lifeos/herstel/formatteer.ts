// ─── LifeOS — herstel in leesbare taal ─────────────────────────────────────
// Puur bestand: geen React. Zo is de opmaak testbaar zonder de kaart te renderen.
//
// De regel die deze module draagt: `null` in → `null` uit. Nooit '0', nooit
// '—' als returnwaarde, want dan kan de kaart niet meer zien of er iets gemeten
// is. Wát er getoond wordt als er niets is, beslist de UI — niet de formatter.

import type { HerstelBron } from './herstel'
// getalTekst is neutraal en woont in lib/format. Hier ge-re-exporteerd zodat
// een herstel-component 'm uit één plek kan halen samen met bronLabel/slaapTekst.
import { getalTekst } from '@/lib/lifeos/format/getal'

export { getalTekst }

const BRON_LABELS: Record<HerstelBron, string> = {
  whoop: 'WHOOP',
  oura: 'Oura',
  garmin: 'Garmin',
  samsung: 'Samsung Health',
  handmatig: 'handmatig',
}

export function bronLabel(bron: HerstelBron): string {
  return BRON_LABELS[bron]
}

/** 450 → '7u 30m'. Null blijft null. */
export function slaapTekst(minuten: number | null): string | null {
  if (minuten === null || !Number.isFinite(minuten) || minuten < 0) return null
  const uren = Math.floor(minuten / 60)
  const rest = Math.round(minuten % 60)
  if (uren === 0) return `${rest}m`
  return rest === 0 ? `${uren}u` : `${uren}u ${rest}m`
}

/** 'gisteren' / 'vandaag' / 'maandag 13 juli' — voor de datum boven de kaart. */
export function dagTekst(datum: string, vandaag: string): string {
  if (datum === vandaag) return 'vandaag'

  const d = new Date(`${datum}T00:00:00Z`)
  const v = new Date(`${vandaag}T00:00:00Z`)
  if (Number.isNaN(d.getTime()) || Number.isNaN(v.getTime())) return datum

  const verschil = Math.round((v.getTime() - d.getTime()) / 86_400_000)
  if (verschil === 1) return 'gisteren'

  return d.toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  })
}

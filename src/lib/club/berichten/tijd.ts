// ─── Club: tijdvenster van een bericht in Nederlandse tijd (PUUR) ──────────
// Het formulier werkt met <input type="datetime-local"> ("2026-12-01T08:00"),
// altijd gelezen als Nederlandse tijd, ook als de server in UTC draait.

import { isDatum, isTijd, nlDelen, nlNaarUtc } from '@/lib/club/rooster/tijd'
import { LOCALE, type Taal } from '@/lib/aiyourgym/taal/taal'
import { BERICHTEN } from '@/lib/aiyourgym/taal/woorden/club/berichten'

const LOKAAL = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?$/

/** "2026-12-01T08:00" (NL) naar een echt tijdstip; ongeldig = null. */
export function lokaalNaarDatum(waarde: string): Date | null {
  const m = LOKAAL.exec(waarde.trim())
  if (!m || !isDatum(m[1]) || !isTijd(m[2])) return null
  return nlNaarUtc(m[1], m[2])
}

/** Een tijdstip naar de waarde voor datetime-local, in Nederlandse tijd. */
export function datumNaarLokaal(moment: Date): string {
  const d = nlDelen(moment)
  return `${d.datum}T${d.tijd}`
}

const ZONE = 'Europe/Amsterdam'
const kort = (taal: Taal) => new Intl.DateTimeFormat(LOCALE[taal], { day: 'numeric', month: 'short', timeZone: ZONE })
const kortJaar = (taal: Taal) => new Intl.DateTimeFormat(LOCALE[taal], { day: 'numeric', month: 'short', year: 'numeric', timeZone: ZONE })
const klok = (taal: Taal) => new Intl.DateTimeFormat(LOCALE[taal], { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: ZONE })

/** "1 dec. 08:00", met jaar als het niet dit jaar is. */
export function momentKort(iso: string, nu: Date, taal: Taal = 'nl'): string {
  const d = new Date(iso)
  const zelfdeJaar = nlDelen(d).datum.slice(0, 4) === nlDelen(nu).datum.slice(0, 4)
  return `${(zelfdeJaar ? kort(taal) : kortJaar(taal)).format(d)} ${klok(taal).format(d)}`
}

/** "Sinds 3 okt. 09:00 · tot 2 nov. 00:00" of "Vanaf 1 dec. 08:00 · geen einde". */
export function vensterTekst(van: string, tot: string | null, nu: Date, taal: Taal = 'nl'): string {
  const t = BERICHTEN[taal].venster
  const begonnen = Date.parse(van) <= nu.getTime()
  const begin = `${begonnen ? t.sinds : t.vanaf} ${momentKort(van, nu, taal)}`
  return `${begin} · ${tot ? `${t.tot} ${momentKort(tot, nu, taal)}` : t.geenEinde}`
}

/** "2 dagen geleden" voor de app; vandaag en gisteren in woorden. */
export function geledenTekst(iso: string, nu: Date, taal: Taal = 'nl'): string {
  const t = BERICHTEN[taal].app
  const dag = (d: Date) => Date.parse(`${nlDelen(d).datum}T00:00:00Z`)
  const dagen = Math.round((dag(nu) - dag(new Date(iso))) / 86_400_000)
  if (dagen <= 0) return t.vandaag
  if (dagen === 1) return t.gisteren
  if (dagen < 7) return t.dagenGeleden(dagen)
  return kort(taal).format(new Date(iso))
}

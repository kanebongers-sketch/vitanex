// ─── Club: tijdvenster van een bericht in Nederlandse tijd (PUUR) ──────────
// Het formulier werkt met <input type="datetime-local"> ("2026-12-01T08:00"),
// altijd gelezen als Nederlandse tijd, ook als de server in UTC draait.

import { isDatum, isTijd, nlDelen, nlNaarUtc } from '@/lib/club/rooster/tijd'

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

const KORT = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', timeZone: 'Europe/Amsterdam' })
const KORT_JAAR = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Amsterdam' })
const KLOK = new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Amsterdam' })

/** "1 dec. 08:00", met jaar als het niet dit jaar is. */
export function momentKort(iso: string, nu: Date): string {
  const d = new Date(iso)
  const zelfdeJaar = nlDelen(d).datum.slice(0, 4) === nlDelen(nu).datum.slice(0, 4)
  return `${(zelfdeJaar ? KORT : KORT_JAAR).format(d)} ${KLOK.format(d)}`
}

/** "Sinds 3 okt. 09:00 · tot 2 nov. 00:00" of "Vanaf 1 dec. 08:00 · geen einde". */
export function vensterTekst(van: string, tot: string | null, nu: Date): string {
  const begonnen = Date.parse(van) <= nu.getTime()
  const begin = `${begonnen ? 'Sinds' : 'Vanaf'} ${momentKort(van, nu)}`
  return `${begin} · ${tot ? `tot ${momentKort(tot, nu)}` : 'geen einde'}`
}

/** "2 dagen geleden" voor de app; vandaag en gisteren in woorden. */
export function geledenTekst(iso: string, nu: Date): string {
  const dag = (d: Date) => Date.parse(`${nlDelen(d).datum}T00:00:00Z`)
  const dagen = Math.round((dag(nu) - dag(new Date(iso))) / 86_400_000)
  if (dagen <= 0) return 'Vandaag'
  if (dagen === 1) return 'Gisteren'
  if (dagen < 7) return `${dagen} dagen geleden`
  return KORT.format(new Date(iso))
}

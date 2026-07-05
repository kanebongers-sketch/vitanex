/**
 * Datum-hulpfuncties met Nederlandse tijdzone (Europe/Amsterdam).
 * Server-side new Date() is altijd UTC — gebruik deze functies voor
 * user-facing datums zodat 00:00 NL-tijd correct als "vandaag" telt.
 */

const TIJDZONE = 'Europe/Amsterdam'

/** Geeft de huidige datum als YYYY-MM-DD string in NL-tijdzone. */
export function vandaagNL(): string {
  return new Date().toLocaleDateString('nl-NL', {
    timeZone: TIJDZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).split('-').reverse().join('-')
}

/** Geeft een datum N dagen geleden als YYYY-MM-DD string in NL-tijdzone. */
export function datumMinusDagenNL(days: number): string {
  const d = new Date(Date.now() - days * 86_400_000)
  return d.toLocaleDateString('nl-NL', {
    timeZone: TIJDZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).split('-').reverse().join('-')
}

/** Geeft het begin van vandaag als ISO timestamp in UTC (voor timestamp-kolommen). */
export function dagstartUtcNL(): string {
  const vandaag = vandaagNL()
  // Vandaag 00:00 NL-tijd → UTC ISO
  return new Date(`${vandaag}T00:00:00+${offsetNL()}`).toISOString()
}

/** Geeft het uur van de dag in NL-tijdzone (0-23). */
export function huidigUurNL(): number {
  return parseInt(
    new Date().toLocaleString('nl-NL', { timeZone: TIJDZONE, hour: 'numeric', hour12: false }),
    10,
  )
}

/** Geeft de UTC offset string voor NL-tijdzone (bijv. '02:00' of '01:00'). */
function offsetNL(): string {
  const formatter = new Intl.DateTimeFormat('nl-NL', {
    timeZone: TIJDZONE,
    timeZoneName: 'shortOffset',
  })
  const parts = formatter.formatToParts(new Date())
  const offset = parts.find(p => p.type === 'timeZoneName')?.value ?? 'GMT+1'
  // offset is bijv. "GMT+2" → "02:00"
  const match = offset.match(/GMT([+-]\d+)/)
  if (!match) return '01:00'
  const uren = parseInt(match[1], 10)
  return `${String(Math.abs(uren)).padStart(2, '0')}:00`
}

/** Converteert een YYYY-MM-DD string of ISO timestamp naar YYYY-MM-DD. */
export function toDateString(value: string): string {
  return value.slice(0, 10)
}

function alsLokaleDatumString(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

/**
 * Lokale kalenderdag als 'YYYY-MM-DD' — de centrale dag-sleutel voor
 * client-side opslag (localStorage-keys, dag-vergelijkingen).
 *
 * Bewust lokale datumdelen, géén toISOString(): die serialiseert naar UTC en
 * schuift vlak na middernacht lokale tijd een dag terug (00:30 NL = 22:30/23:30
 * UTC de dag ervoor). Client-side draait dit in de tijdzone van de gebruiker;
 * voor server-side NL-datums gebruik je `vandaagNL()`.
 */
export function dagKey(datum: Date = new Date()): string {
  return alsLokaleDatumString(datum)
}

/**
 * Maandag van de week waarin `nu` valt, als 'YYYY-MM-DD'.
 * - Ook op zondag (getDay() === 0) blijft dit de HUIDIGE week.
 * - Lokale datumdelen (client-side = tijdzone van de gebruiker):
 *   toISOString() (UTC) schuift rond middernacht lokale tijd een dag terug
 *   en schreef dan naar de vórige week.
 */
export function bepaalWeekStart(nu: Date): string {
  const d = new Date(nu)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return alsLokaleDatumString(d)
}

function vorigeWeek(weekStart: string): string {
  const [jaar, maand, dag] = weekStart.split('-').map(Number)
  return alsLokaleDatumString(new Date(jaar, maand - 1, dag - 7))
}

/**
 * Aantal aaneengesloten weken (t/m nu) met een entry, op basis van de al
 * opgehaalde week-starts. Is er deze week nog niets opgeslagen, dan telt de
 * reeks vanaf vorige week — zo blijft het ritme zichtbaar terwijl je invult.
 */
export function berekenWekenOpRij(
  weekStarts: readonly string[],
  huidigeWeekStart: string,
): number {
  const bekend = new Set(weekStarts)
  let cursor = bekend.has(huidigeWeekStart) ? huidigeWeekStart : vorigeWeek(huidigeWeekStart)
  let aantal = 0
  while (bekend.has(cursor)) {
    aantal += 1
    cursor = vorigeWeek(cursor)
  }
  return aantal
}

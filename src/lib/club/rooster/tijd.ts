// ─── Fit Factory Club, rooster: tijd in Europe/Amsterdam (PUUR) ─────────────
// Lessen staan in de database als UTC-tijdstip, maar het rooster denkt in
// Nederlandse kalenderdagen en kloktijden. Alles hier rekent expliciet met de
// zone Europe/Amsterdam (niet met de zone van de server), zodat zomer- en
// wintertijd goed gaan: "elke dinsdag 19:00" blijft 19:00 op de klok.

export const ZONE = 'Europe/Amsterdam'

const DELEN = new Intl.DateTimeFormat('en-GB', {
  timeZone: ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

const DATUM_RE = /^(\d{4})-(\d{2})-(\d{2})$/
const TIJD_RE = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/
const WEEK_RE = /^(\d{4})-W(\d{2})$/

export interface NlMoment {
  /** Kalenderdag in Nederland, "2026-10-14". */
  datum: string
  /** Kloktijd in Nederland, "19:00". */
  tijd: string
  /** Minuten sinds middernacht (Nederlandse klok). */
  minuten: number
  /** ISO-weekdag: 1 = maandag, 7 = zondag. */
  weekdag: number
}

function getal(delen: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): number {
  const deel = delen.find((d) => d.type === type)
  return deel ? Number(deel.value) : 0
}

/** Het verschil tussen de Nederlandse klok en UTC op dit tijdstip, in ms. */
function verschilMs(instant: number): number {
  const d = DELEN.formatToParts(new Date(instant))
  const alsUtc = Date.UTC(getal(d, 'year'), getal(d, 'month') - 1, getal(d, 'day'), getal(d, 'hour'), getal(d, 'minute'), getal(d, 'second'))
  return alsUtc - Math.floor(instant / 1000) * 1000
}

/** Een tijdstip uitgesplitst naar de Nederlandse kalender en klok. */
export function nlDelen(moment: Date): NlMoment {
  const d = DELEN.formatToParts(moment)
  const jaar = getal(d, 'year')
  const maand = getal(d, 'month')
  const dag = getal(d, 'day')
  const uur = getal(d, 'hour')
  const minuut = getal(d, 'minute')
  const datum = `${jaar}-${String(maand).padStart(2, '0')}-${String(dag).padStart(2, '0')}`
  return {
    datum,
    tijd: `${String(uur).padStart(2, '0')}:${String(minuut).padStart(2, '0')}`,
    minuten: uur * 60 + minuut,
    weekdag: isoWeekdag(datum),
  }
}

export function isDatum(v: unknown): v is string {
  if (typeof v !== 'string') return false
  const m = DATUM_RE.exec(v)
  if (!m) return false
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  return d.getUTCFullYear() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3])
}

export function isTijd(v: unknown): v is string {
  return typeof v === 'string' && TIJD_RE.test(v)
}

/** "19:00:00" of "19:00" naar "19:00"; ongeldig = null. */
export function normaliseerTijd(v: unknown): string | null {
  if (!isTijd(v)) return null
  return v.slice(0, 5)
}

/** "19:30" naar 1170 minuten. Ga uit van een geldige tijd. */
export function tijdNaarMinuten(tijd: string): number {
  const [u, m] = tijd.split(':')
  return Number(u) * 60 + Number(m)
}

/** 1170 naar "19:30". */
export function minutenNaarTijd(minuten: number): string {
  const m = ((Math.round(minuten) % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

/**
 * Een Nederlandse datum en kloktijd naar het echte (UTC) tijdstip.
 * Rekent met de zomertijd van die dag, niet die van vandaag.
 */
export function nlNaarUtc(datum: string, tijd: string): Date {
  const [j, m, d] = datum.split('-').map(Number)
  const [u, min] = tijd.split(':').map(Number)
  const naief = Date.UTC(j, m - 1, d, u, min)
  const eerste = verschilMs(naief)
  let utc = naief - eerste
  const tweede = verschilMs(utc)
  if (tweede !== eerste) utc = naief - tweede
  return new Date(utc)
}

/** Een datum plus n dagen ("2026-10-14" + 1 = "2026-10-15"). */
export function plusDagen(datum: string, n: number): string {
  const [j, m, d] = datum.split('-').map(Number)
  const nieuw = new Date(Date.UTC(j, m - 1, d + n))
  return nieuw.toISOString().slice(0, 10)
}

/** ISO-weekdag van een kalenderdatum (1 = maandag, 7 = zondag). */
export function isoWeekdag(datum: string): number {
  const [j, m, d] = datum.split('-').map(Number)
  const dag = new Date(Date.UTC(j, m - 1, d)).getUTCDay()
  return dag === 0 ? 7 : dag
}

/** De maandag van de week waarin deze datum valt. */
export function maandagVan(datum: string): string {
  return plusDagen(datum, 1 - isoWeekdag(datum))
}

/** ISO-jaar en weeknummer van een datum (donderdag bepaalt het jaar). */
export function isoWeek(datum: string): { jaar: number; week: number } {
  const donderdag = plusDagen(datum, 4 - isoWeekdag(datum))
  const jaar = Number(donderdag.slice(0, 4))
  const eersteJan = `${jaar}-01-01`
  const dagen = Math.round((Date.parse(donderdag) - Date.parse(eersteJan)) / 86_400_000)
  return { jaar, week: Math.floor(dagen / 7) + 1 }
}

/** De weekparameter voor in de URL: "2026-W42". */
export function weekParam(datum: string): string {
  const { jaar, week } = isoWeek(datum)
  return `${jaar}-W${String(week).padStart(2, '0')}`
}

/** "2026-W42" naar de maandag van die week; ongeldig of leeg = de week van `vandaag`. */
export function maandagUitWeekParam(ruw: string | string[] | undefined | null, vandaag: string): string {
  const waarde = Array.isArray(ruw) ? ruw[0] : ruw
  const m = typeof waarde === 'string' ? WEEK_RE.exec(waarde) : null
  if (!m) return maandagVan(vandaag)
  const jaar = Number(m[1])
  const week = Number(m[2])
  if (week < 1 || week > 53 || jaar < 2000 || jaar > 2100) return maandagVan(vandaag)
  // 4 januari valt altijd in week 1.
  const maandagWeek1 = maandagVan(`${jaar}-01-04`)
  const maandag = plusDagen(maandagWeek1, (week - 1) * 7)
  // Week 53 bestaat niet elk jaar: dan valt hij in week 1 van het volgende jaar.
  return isoWeek(maandag).week === week ? maandag : maandagVan(vandaag)
}

/** De zeven datums van een week, maandag eerst. */
export function dagenVanWeek(maandag: string): string[] {
  return Array.from({ length: 7 }, (_, i) => plusDagen(maandag, i))
}

/** Het tijdvak van een week: maandag 00:00 tot de volgende maandag 00:00 (Nederlandse tijd). */
export function weekBereik(maandag: string): { van: Date; tot: Date } {
  return { van: nlNaarUtc(maandag, '00:00'), tot: nlNaarUtc(plusDagen(maandag, 7), '00:00') }
}

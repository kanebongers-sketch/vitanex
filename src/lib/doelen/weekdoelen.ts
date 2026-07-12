export type WellbeingCat = 'slaap' | 'stress' | 'energie' | 'focus' | 'balans' | 'motivatie'

export type GoalLog = {
  datum: string   // YYYY-MM-DD
  gehaald: boolean
  notitie?: string
}

export type WeekDoel = {
  vlak: WellbeingCat
  doel_titel: string
  doel_beschrijving: string
  target_waarde: number
  eenheid: string
  meetType: 'dagelijks' | 'wekelijks'
  logs: GoalLog[]
}

export type WeekSelectie = {
  weekStart: string
  doelen: WeekDoel[]   // 3 AI-generated goals
  vlak_scores: Partial<Record<WellbeingCat, number>>  // 4-20 per domain
}

/** Compacte samenvatting van één doel in een afgeronde week. */
export type WeekHistorieDoel = {
  vlak: WellbeingCat
  doel_titel: string
  target_waarde: number
  eenheid: string
  /** Aantal logs met gehaald === true in die week. */
  gehaald: number
}

/** Eén afgeronde week in de historie, voor week-op-week-vergelijking. */
export type WeekHistorieEntry = {
  weekStart: string
  doelen: WeekHistorieDoel[]
}

const STORAGE_KEY = 'mf-week-doelen-v2'
// Aparte sleutel: de actieve-week-opslag (STORAGE_KEY) blijft ongewijzigd,
// zodat bestaande data zonder historie gewoon blijft werken.
const HISTORIE_KEY = 'mf-week-doelen-historie-v1'
const MAX_HISTORIE_WEKEN = 8
const WEEKSTART_FORMAAT = /^\d{4}-\d{2}-\d{2}$/

export function getMaandag(): string {
  const nu = new Date()
  const dag = nu.getDay() === 0 ? 6 : nu.getDay() - 1
  const ma = new Date(nu)
  ma.setDate(nu.getDate() - dag)
  // Lokale datumdelen formatteren (zoals vandaag() hieronder) — toISOString()
  // serialiseert naar UTC en gaf op NL-machines structureel de zóndag terug
  // (maandag 00:00 lokaal = zondag 22:00/23:00 UTC).
  return [
    ma.getFullYear(),
    String(ma.getMonth() + 1).padStart(2, '0'),
    String(ma.getDate()).padStart(2, '0'),
  ].join('-')
}

export function vandaag(): string {
  const d = new Date()
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

export function laadWeekSelectie(): WeekSelectie | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data: WeekSelectie = JSON.parse(raw)
    const start = new Date(data.weekStart)
    const dagsSinds = (Date.now() - start.getTime()) / (1000 * 60 * 60 * 24)
    if (dagsSinds >= 7) {
      // Week-rollover: archiveer de afgelopen week vóór hij onzichtbaar wordt,
      // zodat week-op-week-vergelijking mogelijk blijft. Gedrag van de actieve
      // week verandert niet: de functie geeft nog steeds null terug.
      archiveerInHistorie(data)
      return null
    }
    if (dagsSinds < 0) return null // toekomstige weekStart = corrupte data, niet archiveren
    return data
  } catch { return null }
}

export function slaWeekSelectieOp(s: WeekSelectie) {
  // Wordt een selectie van een ándere week overschreven zonder dat
  // laadWeekSelectie() de rollover zag, archiveer die dan alsnog.
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const vorige: WeekSelectie = JSON.parse(raw)
      if (typeof vorige?.weekStart === 'string' && vorige.weekStart !== s.weekStart) {
        archiveerInHistorie(vorige)
      }
    }
  } catch { /* onleesbare oude selectie → niets te archiveren */ }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

function isGeldigeHistorieEntry(entry: unknown): entry is WeekHistorieEntry {
  if (typeof entry !== 'object' || entry === null) return false
  const kandidaat = entry as Partial<WeekHistorieEntry>
  return typeof kandidaat.weekStart === 'string'
    && WEEKSTART_FORMAAT.test(kandidaat.weekStart)
    && Array.isArray(kandidaat.doelen)
}

/** Historie van afgeronde weken, nieuwste eerst (max 8). Corrupte of afwezige opslag geeft []. */
export function laadWeekHistorie(): WeekHistorieEntry[] {
  try {
    const raw = localStorage.getItem(HISTORIE_KEY)
    if (!raw) return []
    const data: unknown = JSON.parse(raw)
    if (!Array.isArray(data)) return []
    return data.filter(isGeldigeHistorieEntry)
  } catch { return [] }
}

function archiveerInHistorie(s: WeekSelectie): void {
  try {
    if (typeof s.weekStart !== 'string' || !WEEKSTART_FORMAAT.test(s.weekStart)) return
    const entry: WeekHistorieEntry = {
      weekStart: s.weekStart,
      doelen: (s.doelen ?? []).map(d => ({
        vlak: d.vlak,
        doel_titel: d.doel_titel,
        target_waarde: d.target_waarde,
        eenheid: d.eenheid,
        gehaald: (d.logs ?? []).filter(l => l.gehaald).length,
      })),
    }
    // Dedupliceer op weekStart (herhaald laden archiveert dezelfde week opnieuw),
    // sorteer nieuwste eerst en cap op de laatste weken.
    const historie = [entry, ...laadWeekHistorie().filter(h => h.weekStart !== entry.weekStart)]
      .sort((a, b) => (a.weekStart < b.weekStart ? 1 : -1))
      .slice(0, MAX_HISTORIE_WEKEN)
    localStorage.setItem(HISTORIE_KEY, JSON.stringify(historie))
  } catch { /* historie is een extraatje — de actieve-week-flow mag hier nooit op stuklopen */ }
}

export function isVandaagGelogd(doel: WeekDoel): boolean {
  return doel.logs.some(l => l.datum === vandaag())
}

export function logVandaag(doel: WeekDoel): GoalLog | undefined {
  return doel.logs.find(l => l.datum === vandaag())
}

/** Aaneengesloten reeks gehaalde dagen t/m vandaag (dagen in de toekomst tellen niet mee). */
export function berekenStreak(doel: WeekDoel, weekDagen: string[]): number {
  const vandaagStr = vandaag()
  let streak = 0
  for (const dag of [...weekDagen].reverse()) {
    if (dag > vandaagStr) continue
    const log = doel.logs.find(l => l.datum === dag)
    if (log?.gehaald === true) streak++
    else break
  }
  return streak
}

export function scoreKleur(score: number): string {
  if (score >= 16) return 'var(--mf-green)'
  if (score >= 12) return 'var(--mf-amber)'
  if (score >= 8)  return 'var(--mf-amber-dark)'
  return 'var(--mf-red)'
}

export function scoreLabel(score: number): string {
  if (score >= 16) return 'Goed'
  if (score >= 12) return 'Matig'
  if (score >= 8)  return 'Aandacht'
  return 'Laag'
}

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

const STORAGE_KEY = 'mf-week-doelen-v2'

export function getMaandag(): string {
  const nu = new Date()
  const dag = nu.getDay() === 0 ? 6 : nu.getDay() - 1
  const ma = new Date(nu)
  ma.setDate(nu.getDate() - dag)
  ma.setHours(0, 0, 0, 0)
  return ma.toISOString().slice(0, 10)
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
    if (dagsSinds < 0 || dagsSinds >= 7) return null
    return data
  } catch { return null }
}

export function slaWeekSelectieOp(s: WeekSelectie) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
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

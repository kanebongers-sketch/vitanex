export type WellbeingCat = 'slaap' | 'stress' | 'energie' | 'focus' | 'balans' | 'motivatie'

export type GoalLog = {
  datum: string   // YYYY-MM-DD
  waarde: number
  notitie?: string
}

export type WeekDoel = {
  vlak: WellbeingCat
  presetIndex: number
  logs: GoalLog[]
}

export type WeekSelectie = {
  weekStart: string   // maandag YYYY-MM-DD
  doelen: WeekDoel[]  // altijd 3
}

const STORAGE_KEY = 'mf-week-doelen-v1'

export function getMaandag(): string {
  const nu = new Date()
  const dag = nu.getDay() === 0 ? 6 : nu.getDay() - 1
  const ma = new Date(nu)
  ma.setDate(nu.getDate() - dag)
  ma.setHours(0, 0, 0, 0)
  return ma.toISOString().slice(0, 10)
}

export function vandaag(): string {
  return new Date().toISOString().slice(0, 10)
}

export function laadWeekSelectie(): WeekSelectie | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data: WeekSelectie = JSON.parse(raw)
    if (data.weekStart !== getMaandag()) return null
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

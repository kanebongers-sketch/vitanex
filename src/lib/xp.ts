// ─── XP / Fit Level system (localStorage-backed, no DB) ──────────────────────

export interface XPEvent {
  datum: string   // YYYY-MM-DD
  xp: number      // positive = earned, negative = decay
  reden: string
  type: 'checkin' | 'goal' | 'streak' | 'achievement' | 'decay'
}

export interface XPData {
  xp: number
  lastCheckinDatum: string | null
  lastGoalLogDatum: string | null
  checkinCount: number
  goalsCompleted: number
  streakRecord: number
  achievements: string[]
  history: XPEvent[]
  lastDecayCheck: string | null
}

export interface Achievement {
  id: string
  naam: string
  beschrijving: string
  xpBonus: number
  kleur: string
}

export interface XPResult {
  xpGewonnen: number
  nieuweAchievements: Achievement[]
  xpData: XPData
  levelOmhoog: boolean
  nieuwLevel: number
}

// ─── Level config ─────────────────────────────────────────────────────────────

export const LEVEL_NAMEN = [
  '', 'Starter', 'Beginner', 'Actief', 'Consistent', 'Gedreven',
  'Vitaal', 'Krachtig', 'Elite', 'Champion', 'Legende',
]

// Minimum XP to reach this level (index = level number)
export const LEVEL_DREMPELS = [0, 0, 150, 375, 675, 1050, 1525, 2125, 2875, 3800, 5000]

export const LEVEL_KLEUREN = [
  '', '#9CA3AF', '#6B7280',
  '#1D9E75', '#059669',
  '#185FA5', '#378ADD',
  '#7C3AED', '#6D28D9',
  '#B45309',
  '#DC2626',
]

export const LEVEL_BG = [
  '', '#F3F4F6', '#F9FAFB',
  '#E1F5EE', '#D1FAE5',
  '#E6F1FB', '#EFF6FF',
  '#EDE9FE', '#F5F3FF',
  '#FEF3C7',
  '#FEE2E2',
]

export function berekenLevel(xp: number): number {
  for (let l = 10; l >= 1; l--) {
    if (xp >= LEVEL_DREMPELS[l]) return l
  }
  return 1
}

export function xpVoortgang(xp: number, level: number): { inLevel: number; levelBreedte: number; pct: number; nodig: number } {
  if (level >= 10) return { inLevel: xp - LEVEL_DREMPELS[10], levelBreedte: 500, pct: 100, nodig: 0 }
  const start = LEVEL_DREMPELS[level]
  const einde = LEVEL_DREMPELS[level + 1]
  const inLevel = xp - start
  const levelBreedte = einde - start
  return {
    inLevel,
    levelBreedte,
    pct: Math.min(100, Math.round((inLevel / levelBreedte) * 100)),
    nodig: einde - xp,
  }
}

// ─── Achievements ─────────────────────────────────────────────────────────────

export const ALLE_ACHIEVEMENTS: Achievement[] = [
  { id: 'eerste_checkin', naam: 'Eerste stap',    beschrijving: 'Eerste wekelijkse check-in gedaan',       xpBonus: 50,  kleur: '#1D9E75' },
  { id: 'drie_checkins',  naam: 'Op weg',          beschrijving: '3 wekelijkse check-ins ingevuld',         xpBonus: 75,  kleur: '#059669' },
  { id: 'tien_checkins',  naam: 'Consistent',      beschrijving: '10 wekelijkse check-ins ingevuld',        xpBonus: 200, kleur: '#BA7517' },
  { id: 'eerste_doel',    naam: 'Doelgericht',     beschrijving: 'Eerste doel succesvol bereikt',           xpBonus: 100, kleur: '#185FA5' },
  { id: 'drie_doelen',    naam: 'Veelzijdig',      beschrijving: '3 doelen bereikt',                        xpBonus: 200, kleur: '#378ADD' },
  { id: 'vijf_doelen',    naam: 'Doorzetter',      beschrijving: '5 doelen bereikt',                        xpBonus: 350, kleur: '#7C3AED' },
  { id: 'streek_7',       naam: 'Streekheld',      beschrijving: '7 aaneengesloten dagen gelogd',           xpBonus: 75,  kleur: '#E24B4A' },
  { id: 'streek_30',      naam: 'IJzerdiscipline', beschrijving: '30 aaneengesloten dagen gelogd',          xpBonus: 300, kleur: '#6D28D9' },
  { id: 'hoge_score',     naam: 'Topweek',         beschrijving: 'Check-in met gemiddelde score ≥ 4.5',     xpBonus: 100, kleur: '#F59E0B' },
  { id: 'level_5',        naam: 'Halverwege',      beschrijving: 'Fit Level 5 — Gedreven bereikt',          xpBonus: 150, kleur: '#059669' },
  { id: 'level_8',        naam: 'Bijna top',       beschrijving: 'Fit Level 8 — Elite bereikt',             xpBonus: 250, kleur: '#7C3AED' },
  { id: 'level_10',       naam: 'Legende',         beschrijving: 'Fit Level 10 bereikt — het maximum',      xpBonus: 500, kleur: '#DC2626' },
]

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'mf-xp-v1'

const DEFAULT_DATA: XPData = {
  xp: 0, lastCheckinDatum: null, lastGoalLogDatum: null,
  checkinCount: 0, goalsCompleted: 0, streakRecord: 0,
  achievements: [], history: [], lastDecayCheck: null,
}

export function laadXPData(): XPData {
  if (typeof window === 'undefined') return { ...DEFAULT_DATA }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_DATA }
    return { ...DEFAULT_DATA, ...JSON.parse(raw) }
  } catch { return { ...DEFAULT_DATA } }
}

export function slaXPOp(data: XPData): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// ─── Core helpers ─────────────────────────────────────────────────────────────

function verdienXP(data: XPData, hoeveel: number, reden: string, type: XPEvent['type']): XPData {
  const event: XPEvent = { datum: new Date().toISOString().slice(0, 10), xp: hoeveel, reden, type }
  return {
    ...data,
    xp: Math.max(0, data.xp + hoeveel),
    history: [event, ...data.history].slice(0, 50),
  }
}

function sameISOWeek(d1: string, d2: string): boolean {
  const weekStart = (s: string) => {
    const d = new Date(s)
    const day = d.getDay() === 0 ? 6 : d.getDay() - 1
    d.setDate(d.getDate() - day)
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  }
  return weekStart(d1) === weekStart(d2)
}

function checkAndAwardAchievements(data: XPData): { data: XPData; nieuw: Achievement[] } {
  const level = berekenLevel(data.xp)
  const verdiend: Achievement[] = []

  const checks: [string, boolean][] = [
    ['eerste_checkin', data.checkinCount >= 1],
    ['drie_checkins',  data.checkinCount >= 3],
    ['tien_checkins',  data.checkinCount >= 10],
    ['eerste_doel',    data.goalsCompleted >= 1],
    ['drie_doelen',    data.goalsCompleted >= 3],
    ['vijf_doelen',    data.goalsCompleted >= 5],
    ['streek_7',       (data.streakRecord ?? 0) >= 7],
    ['streek_30',      (data.streakRecord ?? 0) >= 30],
    ['level_5',        level >= 5],
    ['level_8',        level >= 8],
    ['level_10',       level >= 10],
  ]

  let current = { ...data }
  for (const [id, behaald] of checks) {
    if (behaald && !current.achievements.includes(id)) {
      current = { ...current, achievements: [...current.achievements, id] }
      const ach = ALLE_ACHIEVEMENTS.find(a => a.id === id)
      if (ach) {
        current = verdienXP(current, ach.xpBonus, `Achievement: ${ach.naam}`, 'achievement')
        verdiend.push(ach)
      }
    }
  }
  return { data: current, nieuw: verdiend }
}

// ─── Decay ────────────────────────────────────────────────────────────────────

export function pasDecayToe(data: XPData): XPData {
  const vandaag = new Date().toISOString().slice(0, 10)
  if (data.lastDecayCheck === vandaag) return data

  let result: XPData = { ...data, lastDecayCheck: vandaag }

  if (data.lastCheckinDatum) {
    const dagen = Math.floor((Date.now() - new Date(data.lastCheckinDatum).getTime()) / 86400000)
    if (dagen > 14) {
      const weken = Math.floor((dagen - 14) / 7)
      const verlies = weken * 25
      if (verlies > 0) result = verdienXP(result, -verlies, `Geen check-in in ${dagen} dagen (−${verlies} XP)`, 'decay')
    }
  }

  if (data.lastGoalLogDatum) {
    const dagen = Math.floor((Date.now() - new Date(data.lastGoalLogDatum).getTime()) / 86400000)
    if (dagen > 14) {
      const weken = Math.floor((dagen - 14) / 7)
      const verlies = weken * 15
      if (verlies > 0) result = verdienXP(result, -verlies, `Geen doellog in ${dagen} dagen (−${verlies} XP)`, 'decay')
    }
  }

  result.xp = Math.max(0, result.xp)
  return result
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function verwerkCheckin(gemiddeldeScore: number): XPResult {
  let data = laadXPData()
  const oudLevel = berekenLevel(data.xp)
  data = pasDecayToe(data)

  const vandaag = new Date().toISOString().slice(0, 10)
  const alAl = data.lastCheckinDatum && sameISOWeek(data.lastCheckinDatum, vandaag)
  let totaalXP = 0

  if (!alAl) {
    data = verdienXP(data, 75, 'Wekelijkse check-in gedaan', 'checkin')
    totaalXP += 75
    data = { ...data, lastCheckinDatum: vandaag, checkinCount: data.checkinCount + 1 }

    if (gemiddeldeScore >= 4.5) {
      data = verdienXP(data, 25, 'Uitstekende score (≥ 4.5)', 'checkin')
      totaalXP += 25
      if (!data.achievements.includes('hoge_score')) {
        data = { ...data, achievements: [...data.achievements, 'hoge_score'] }
        const ach = ALLE_ACHIEVEMENTS.find(a => a.id === 'hoge_score')!
        data = verdienXP(data, ach.xpBonus, `Achievement: ${ach.naam}`, 'achievement')
        totaalXP += ach.xpBonus
      }
    }
  }

  const { data: metAch, nieuw } = checkAndAwardAchievements(data)
  nieuw.forEach(a => { totaalXP += a.xpBonus })

  const nieuwLevel = berekenLevel(metAch.xp)
  slaXPOp(metAch)
  return { xpGewonnen: totaalXP, nieuweAchievements: nieuw, xpData: metAch, levelOmhoog: nieuwLevel > oudLevel, nieuwLevel }
}

export function verwerkGoalLog(streakLengte: number): XPResult {
  let data = laadXPData()
  const oudLevel = berekenLevel(data.xp)

  const vandaag = new Date().toISOString().slice(0, 10)
  let totaalXP = 0

  if (data.lastGoalLogDatum !== vandaag) {
    data = verdienXP(data, 15, 'Dagelijkse doelregistratie', 'goal')
    totaalXP += 15
    data = { ...data, lastGoalLogDatum: vandaag }
  }

  const oudRecord = data.streakRecord ?? 0
  if (streakLengte > oudRecord) data = { ...data, streakRecord: streakLengte }

  if (streakLengte === 7 && oudRecord < 7) {
    data = verdienXP(data, 75, '7-daagse streak behaald!', 'streak')
    totaalXP += 75
  } else if (streakLengte === 14 && oudRecord < 14) {
    data = verdienXP(data, 100, '14-daagse streak behaald!', 'streak')
    totaalXP += 100
  } else if (streakLengte === 30 && oudRecord < 30) {
    data = verdienXP(data, 250, '30-daagse streak behaald!', 'streak')
    totaalXP += 250
  }

  const { data: metAch, nieuw } = checkAndAwardAchievements(data)
  nieuw.forEach(a => { totaalXP += a.xpBonus })

  const nieuwLevel = berekenLevel(metAch.xp)
  slaXPOp(metAch)
  return { xpGewonnen: totaalXP, nieuweAchievements: nieuw, xpData: metAch, levelOmhoog: nieuwLevel > oudLevel, nieuwLevel }
}

export function verwerkGoalVoltooid(): XPResult {
  let data = laadXPData()
  const oudLevel = berekenLevel(data.xp)

  let totaalXP = 0
  data = verdienXP(data, 150, 'Doel succesvol bereikt', 'goal')
  totaalXP += 150
  data = { ...data, goalsCompleted: data.goalsCompleted + 1 }

  const { data: metAch, nieuw } = checkAndAwardAchievements(data)
  nieuw.forEach(a => { totaalXP += a.xpBonus })

  const nieuwLevel = berekenLevel(metAch.xp)
  slaXPOp(metAch)
  return { xpGewonnen: totaalXP, nieuweAchievements: nieuw, xpData: metAch, levelOmhoog: nieuwLevel > oudLevel, nieuwLevel }
}

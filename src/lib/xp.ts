// ─── XP / Fit Level system (localStorage-backed, no DB) ──────────────────────

import { bepaalWeekStart, dagKey } from '@/lib/date-nl'

export interface XPEvent {
  datum: string   // YYYY-MM-DD
  xp: number      // verdiende XP (altijd positief — er is geen straf/decay)
  reden: string
  type: 'checkin' | 'goal' | 'streak' | 'achievement'
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
  '', 'var(--text-3)', 'var(--text-2)',
  'var(--mf-green)', 'var(--mf-green-dark)',
  'var(--mf-blue)', 'var(--mf-blue-mid)',
  'var(--mf-purple)', 'var(--mf-purple)',
  'var(--mf-amber)',
  'var(--mf-red)',
]

export const LEVEL_BG = [
  '', 'var(--bg-subtle)', 'var(--bg-subtle)',
  'var(--mf-green-light)', 'var(--mf-green-light)',
  'var(--mf-blue-light)', 'var(--mf-blue-light)',
  'var(--mf-purple-light)', 'var(--mf-purple-light)',
  'var(--mf-amber-light)',
  'var(--mf-red-light)',
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
  { id: 'eerste_checkin', naam: 'Eerste stap',    beschrijving: 'Eerste wekelijkse check-in gedaan',       xpBonus: 50,  kleur: 'var(--mf-green)' },
  { id: 'drie_checkins',  naam: 'Op weg',          beschrijving: '3 wekelijkse check-ins ingevuld',         xpBonus: 75,  kleur: 'var(--mf-green-dark)' },
  { id: 'tien_checkins',  naam: 'Consistent',      beschrijving: '10 wekelijkse check-ins ingevuld',        xpBonus: 200, kleur: 'var(--mf-amber-dark)' },
  { id: 'eerste_doel',    naam: 'Doelgericht',     beschrijving: 'Eerste doel succesvol bereikt',           xpBonus: 100, kleur: 'var(--mf-blue)' },
  { id: 'drie_doelen',    naam: 'Veelzijdig',      beschrijving: '3 doelen bereikt',                        xpBonus: 200, kleur: 'var(--mf-blue-mid)' },
  { id: 'vijf_doelen',    naam: 'Doorzetter',      beschrijving: '5 doelen bereikt',                        xpBonus: 350, kleur: 'var(--mf-purple)' },
  { id: 'streek_7',       naam: 'Reeks van 7',     beschrijving: '7 aaneengesloten dagen gelogd',           xpBonus: 75,  kleur: 'var(--mf-red)' },
  { id: 'streek_30',      naam: 'IJzerdiscipline', beschrijving: '30 aaneengesloten dagen gelogd',          xpBonus: 300, kleur: 'var(--mf-purple)' },
  { id: 'hoge_score',     naam: 'Topweek',         beschrijving: 'Check-in met gemiddelde score ≥ 4.5',     xpBonus: 100, kleur: 'var(--mf-amber)' },
  { id: 'level_5',        naam: 'Halverwege',      beschrijving: 'Fit Level 5 — Gedreven bereikt',          xpBonus: 150, kleur: 'var(--mf-green)' },
  { id: 'level_8',        naam: 'Bijna top',       beschrijving: 'Fit Level 8 — Elite bereikt',             xpBonus: 250, kleur: 'var(--mf-purple)' },
  { id: 'level_10',       naam: 'Legende',         beschrijving: 'Fit Level 10 bereikt — het maximum',      xpBonus: 500, kleur: 'var(--mf-red)' },
]

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'mf-xp-v1'

const DEFAULT_DATA: XPData = {
  xp: 0, lastCheckinDatum: null, lastGoalLogDatum: null,
  checkinCount: 0, goalsCompleted: 0, streakRecord: 0,
  achievements: [], history: [],
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

// Datum-overgang: events kregen vroeger een UTC-dag via toISOString() —
// een event om 00:30 lokale tijd telde zo bij de vórige dag/week. Sinds deze
// fix gebruiken we de lokale dagKey(). Reeds opgeslagen events houden hun
// UTC-afgeleide sleutel, maar het formaat (YYYY-MM-DD) is identiek, dus oude
// data blijft gewoon leesbaar en vergelijkbaar; hooguit staat een oud
// rond-middernacht-event één dag te vroeg. Nieuwe events zijn correct.
function verdienXP(data: XPData, hoeveel: number, reden: string, type: XPEvent['type']): XPData {
  const event: XPEvent = { datum: dagKey(), xp: hoeveel, reden, type }
  return {
    ...data,
    xp: Math.max(0, data.xp + hoeveel),
    history: [event, ...data.history].slice(0, 50),
  }
}

/** Parseert een YYYY-MM-DD dagsleutel als LOKALE datum — new Date('YYYY-MM-DD')
 *  is UTC-middernacht en verschuift op machines west van UTC een dag terug. */
function parseDagKey(s: string): Date {
  const [jaar, maand, dag] = s.split('-').map(Number)
  return new Date(jaar, maand - 1, dag)
}

function sameISOWeek(d1: string, d2: string): boolean {
  return bepaalWeekStart(parseDagKey(d1)) === bepaalWeekStart(parseDagKey(d2))
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

// ─── Public API ───────────────────────────────────────────────────────────────

export function verwerkCheckin(gemiddeldeScore: number): XPResult {
  let data = laadXPData()
  const oudLevel = berekenLevel(data.xp)

  const vandaag = dagKey()
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
        const ach = ALLE_ACHIEVEMENTS.find(a => a.id === 'hoge_score')
        if (ach) {
          data = verdienXP(data, ach.xpBonus, `Achievement: ${ach.naam}`, 'achievement')
          totaalXP += ach.xpBonus
        }
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

  const vandaag = dagKey()
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

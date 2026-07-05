// ─── Lange-termijn-berekeningen voor de voortgangspagina ──────────────────────
// Pure helpers zonder React of databronnen: alles rekent op de logs die de
// pagina toch al ophaalt (laatste 30 dagen per bron). Geen verzonnen data —
// bij te weinig historie zeggen we dat gewoon.

export interface WeekStats {
  week: string
  stemming: number | null
  slaap: number | null
  stress: number | null
  focus: number
  checkins: number
}

export interface StreakData {
  huidige_streak: number
  langste_streak: number
  totaal_dagen: number
}

export interface TrendBronnen {
  stemming: { stemming: number; aangemaakt_op: string }[]
  slaap: { uren_slaap: number; datum: string }[]
  stress: { stress_niveau: number; aangemaakt_op: string }[]
  focus: { duur_minuten: number; aangemaakt_op: string }[]
  /** ISO-timestamps van check-in-sessies, aflopend gesorteerd. */
  checkinDatums: string[]
}

export interface TrendRichting {
  /** Kort chip-label ('Stijgend', 'Stabiel', …) of null als er geen zinnig label is. */
  label: string | null
  /** Schuldvrije NL-duiding van de richting. */
  tekst: string
}

/**
 * Bereken huidige + langste streak in één enkele pass over de
 * (aflopend gesorteerde) check-in datums. Vervangt de eerdere
 * dubbele O(n) lus met herhaalde Date-allocaties.
 */
export function berekenStreaks(datumsAflopend: readonly string[]): StreakData {
  const totaal = datumsAflopend.length
  if (totaal === 0) return { huidige_streak: 0, langste_streak: 0, totaal_dagen: 0 }

  const vandaagStr = new Date().toISOString().slice(0, 10)
  const gisterStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const startTeltVoorHuidig = datumsAflopend[0] === vandaagStr || datumsAflopend[0] === gisterStr

  let langst = 1
  let lopend = 1
  let huidig = startTeltVoorHuidig ? 1 : 0
  let huidigNogActief = startTeltVoorHuidig

  for (let i = 1; i < totaal; i++) {
    const prevMs = new Date(datumsAflopend[i - 1]).getTime()
    const currMs = new Date(datumsAflopend[i]).getTime()
    const diff = Math.round((prevMs - currMs) / 86400000)

    if (diff <= 1) {
      lopend++
      if (huidigNogActief) huidig++
    } else {
      if (lopend > langst) langst = lopend
      lopend = 1
      huidigNogActief = false
    }
  }
  if (lopend > langst) langst = lopend

  return { huidige_streak: huidig, langste_streak: langst, totaal_dagen: totaal }
}

function weekGemiddelde(waarden: readonly number[]): number | null {
  if (waarden.length === 0) return null
  return Math.round(waarden.reduce((s, v) => s + v, 0) / waarden.length * 10) / 10
}

/**
 * Weekgemiddelden voor de laatste 4 weken (oudste eerst, laatste = huidige
 * lopende week). Zelfde vensterlogica als voorheen: maandag t/m zondag.
 */
export function berekenWeekStats(bronnen: TrendBronnen): WeekStats[] {
  const weeks: WeekStats[] = []
  for (let w = 3; w >= 0; w--) {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1 - w * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    const ws = weekStart.toISOString().slice(0, 10)
    const we = weekEnd.toISOString().slice(0, 10)
    const inWeek = (datum: string) => datum >= ws && datum <= we

    const stLogs = bronnen.stemming.filter(l => inWeek(l.aangemaakt_op.slice(0, 10)))
    const slLogs = bronnen.slaap.filter(l => inWeek(l.datum))
    const stressLogs = bronnen.stress.filter(l => inWeek(l.aangemaakt_op.slice(0, 10)))
    const focusLogs = bronnen.focus.filter(l => inWeek(l.aangemaakt_op.slice(0, 10)))
    const ciWeek = bronnen.checkinDatums.filter(d => inWeek(d.slice(0, 10)))

    weeks.push({
      week: weekStart.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' }),
      stemming: weekGemiddelde(stLogs.map(l => l.stemming)),
      slaap: weekGemiddelde(slLogs.map(l => l.uren_slaap)),
      stress: weekGemiddelde(stressLogs.map(l => l.stress_niveau)),
      focus: focusLogs.reduce((s, l) => s + l.duur_minuten, 0),
      checkins: ciWeek.length,
    })
  }
  return weeks
}

/**
 * Richting over de beschikbare periode, op basis van check-in-activiteit.
 * Vergelijkt de laatste vólledige week met de twee weken ervoor — de lopende
 * week is nog niet af en telt dus niet mee als "daling". Nooit schuld-framing.
 */
export function bepaalRichting(weekStats: readonly WeekStats[]): TrendRichting {
  if (weekStats.length < 4) {
    return { label: null, tekst: 'Nog te weinig historie voor een trend — die bouwt zich vanzelf op.' }
  }
  const checkins = weekStats.map(w => w.checkins)
  const [drieTerug, tweeTerug, vorige, huidige] = checkins
  const eerder = (drieTerug + tweeTerug) / 2

  if (vorige === 0 && eerder === 0) {
    return huidige > 0
      ? { label: 'Net gestart', tekst: 'Je bent deze week begonnen — vanaf hier bouwt je trend zich op.' }
      : { label: null, tekst: 'Nog geen check-ins in de afgelopen weken — je trend begint bij je eerstvolgende check-in.' }
  }
  if (vorige > eerder + 0.5) {
    return { label: 'Stijgend', tekst: 'De lijn loopt op: vorige week was je actiever dan de weken ervoor.' }
  }
  if (vorige >= eerder - 0.5) {
    return { label: 'Stabiel', tekst: 'Een stabiel ritme over de afgelopen weken — consistentie is de basis.' }
  }
  return { label: 'Wisselend', tekst: 'De afgelopen weken wisselden in ritme — elke actieve dag telt gewoon mee.' }
}

export function dagWoord(n: number): string {
  return n === 1 ? 'dag' : 'dagen'
}

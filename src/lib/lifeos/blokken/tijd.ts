// ─── LifeOS — Amsterdamse kloktijd, onafhankelijk van de server-TZ ──────────
// De planner rekent in "maandag 09:00" en "de dag van vandaag". Op de server mag
// dat niet afhangen van de TZ van de runtime (Render draait desnoods in UTC), dus
// alles gaat expliciet via Europe/Amsterdam. Puur en getest.

export const TIJDZONE = 'Europe/Amsterdam'

const DELEN = new Intl.DateTimeFormat('en-US', {
  timeZone: TIJDZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

function delen(d: Date): Record<string, number> {
  const uit: Record<string, number> = {}
  for (const p of DELEN.formatToParts(d)) if (p.type !== 'literal') uit[p.type] = Number(p.value)
  return uit
}

/** Hoeveel minuten Amsterdam vóór loopt op UTC op dat moment (60 of 120). */
function verschilMinuten(d: Date): number {
  const p = delen(d)
  const alsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return Math.round((alsUtc - Math.floor(d.getTime() / 1000) * 1000) / 60_000)
}

/** De dagsleutel (YYYY-MM-DD) van dit moment in Amsterdam. */
export function dagVan(d: Date): string {
  const p = delen(d)
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`
}

/** Het lokale uur (0–23, met minuten als fractie) van dit moment in Amsterdam. */
export function uurVan(d: Date): number {
  const p = delen(d)
  return p.hour + p.minute / 60
}

/** `dag` om `uur:minuut` Amsterdamse tijd, als absoluut moment. */
export function opMoment(dag: string, uur: number, minuut = 0): Date {
  const [j, m, d] = dag.split('-').map(Number)
  const gok = Date.UTC(j, m - 1, d, uur, minuut)
  // Twee rondes: rond de zomertijdwissel kan het verschil op de gok anders zijn.
  const eerste = gok - verschilMinuten(new Date(gok)) * 60_000
  return new Date(gok - verschilMinuten(new Date(eerste)) * 60_000)
}

/** `dag` plus `n` kalenderdagen. */
export function dagPlus(dag: string, n: number): string {
  const [j, m, d] = dag.split('-').map(Number)
  const t = new Date(Date.UTC(j, m - 1, d + n))
  return t.toISOString().slice(0, 10)
}

/** 0 = zondag … 6 = zaterdag. */
export function weekdag(dag: string): number {
  const [j, m, d] = dag.split('-').map(Number)
  return new Date(Date.UTC(j, m - 1, d)).getUTCDay()
}

/** De maandag van de week van `dag` — de sleutel van die week. */
export function weekVan(dag: string): string {
  const wd = weekdag(dag)
  return dagPlus(dag, wd === 0 ? -6 : 1 - wd)
}

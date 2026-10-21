// ─── Pure helpers voor de wekelijkse inzichten (weekreview) ───────────────────
// Types spiegelen exact de respons van /api/inzichten/weekrapport. De AI-velden
// kunnen daar null zijn (geen data of AI niet beschikbaar) — dat modelleren we
// eerlijk in plaats van lege kaarten te renderen. Duidingen zijn schuldvrij en
// komen uitsluitend uit echte, al opgehaalde weekdata.

export interface WeekStats {
  stemming: number | null
  slaap: number | null
  stress: number | null
  aantal_checkins: number
  dankbaarheid_items: number
}

export interface Rapport {
  samenvatting: string | null
  patroon: string | null
  tip: string | null
  score_label: string | null
  stats: WeekStats
}

export interface WeekRapportResponse {
  rapport: Rapport | null
  week_start: string
  bericht?: string
}

const SCORE_LABEL_KLEUR: Record<string, string> = {
  Uitstekend: 'var(--mf-green)',
  Goed: 'var(--mf-purple)',
  Matig: 'var(--mf-amber)',
  Lastig: 'var(--mf-red)',
}

export function scoreLabelKleur(label: string | null): string {
  return (label !== null && SCORE_LABEL_KLEUR[label]) || 'var(--mf-purple)'
}

/** Is er deze week íéts gelogd dat we kunnen tonen? */
export function heeftWeekData(stats: WeekStats | null): boolean {
  if (!stats) return false
  return stats.stemming !== null
    || stats.slaap !== null
    || stats.stress !== null
    || stats.aantal_checkins > 0
    || stats.dankbaarheid_items > 0
}

/** NL-notatie: 7.2 → '7,2'; hele getallen zonder decimaal. */
export function formatteerGetal(waarde: number): string {
  return Number.isInteger(waarde) ? `${waarde}` : waarde.toFixed(1).replace('.', ',')
}

// ── Kleur per metriek (zelfde drempels als de duiding-teksten) ────────────────

export function stemmingKleur(v: number | null): string {
  if (v === null) return 'var(--text-4)'
  if (v >= 4) return 'var(--mf-green)'
  return v >= 3 ? 'var(--mf-amber)' : 'var(--mf-red)'
}

export function slaapKleur(v: number | null): string {
  if (v === null) return 'var(--text-4)'
  if (v >= 7) return 'var(--mf-green)'
  return v >= 5 ? 'var(--mf-amber)' : 'var(--mf-red)'
}

export function rustKleur(rust: number | null): string {
  if (rust === null) return 'var(--text-4)'
  if (rust >= 7) return 'var(--mf-green)'
  return rust >= 5 ? 'var(--mf-amber)' : 'var(--mf-red)'
}

export function checkinsKleur(aantal: number): string {
  if (aantal === 0) return 'var(--text-4)'
  return aantal >= 3 ? 'var(--mf-green)' : 'var(--mf-amber)'
}

export function dankbaarheidKleur(items: number): string {
  if (items >= 5) return 'var(--mf-green)'
  return items >= 2 ? 'var(--mf-amber)' : 'var(--text-4)'
}

// ── Schuldvrije NL-duiding per metriek ────────────────────────────────────────

export function stemmingDuiding(v: number | null): string {
  if (v === null) return 'Stemming: nog niets gelogd deze week.'
  const getal = formatteerGetal(v)
  if (v >= 4) return `Stemming gemiddeld ${getal}/5 — je zat er goed bij.`
  if (v >= 3) return `Stemming gemiddeld ${getal}/5 — wisselend, en dat is oké.`
  return `Stemming gemiddeld ${getal}/5 — een zwaardere week.`
}

export function slaapDuiding(v: number | null): string {
  if (v === null) return 'Slaap: nog niets gelogd deze week.'
  const getal = formatteerGetal(v)
  if (v >= 7) return `Slaap gemiddeld ${getal} uur — een gezond ritme.`
  if (v >= 5) return `Slaap gemiddeld ${getal} uur — aan de korte kant.`
  return `Slaap gemiddeld ${getal} uur — je lichaam vraagt om meer rust.`
}

/** Rust = 10 − gemiddelde stress; hoger is rustiger. */
export function rustDuiding(rust: number | null): string {
  if (rust === null) return 'Rust: nog geen stresslogs deze week.'
  const getal = formatteerGetal(rust)
  if (rust >= 7) return `Rust ${getal}/10 — de spanning bleef laag.`
  if (rust >= 5) return `Rust ${getal}/10 — gemiddelde spanning, niets geks.`
  return `Rust ${getal}/10 — een gespannen week; wees mild voor jezelf.`
}

/** Eén feitelijke zin over gelogde activiteit — zonder druk of schuld. */
export function activiteitDuiding(checkins: number, dankbaarheid: number): string {
  if (checkins === 0 && dankbaarheid === 0) {
    return 'Nog geen check-ins of dankbaarheidsmomenten deze week — alles wat je logt, scherpt dit beeld aan.'
  }
  const checkinDeel = checkins === 0
    ? 'nog geen check-ins'
    : `${checkins} ${checkins === 1 ? 'check-in' : 'check-ins'}`
  const dankDeel = dankbaarheid === 0
    ? 'nog geen dankbaarheidsmomenten'
    : `${dankbaarheid} ${dankbaarheid === 1 ? 'dankbaarheidsmoment' : 'dankbaarheidsmomenten'}`
  return `Deze week: ${checkinDeel} en ${dankDeel} gelogd.`
}

// ── Metriek-model voor de ringen ──────────────────────────────────────────────

export interface Metriek {
  key: 'stemming' | 'slaap' | 'rust'
  label: string
  waarde: number | null
  max: number
  eenheid: string
  kleur: string
  duiding: string
}

/** De drie ring-metrieken, afgeleid uit de echte weekstats. */
export function metrieken(stats: WeekStats): Metriek[] {
  const rust = stats.stress === null ? null : 10 - stats.stress
  return [
    {
      key: 'stemming', label: 'Stemming', waarde: stats.stemming, max: 5, eenheid: '/5',
      kleur: stemmingKleur(stats.stemming), duiding: stemmingDuiding(stats.stemming),
    },
    {
      key: 'slaap', label: 'Slaap', waarde: stats.slaap, max: 9, eenheid: 'u',
      kleur: slaapKleur(stats.slaap), duiding: slaapDuiding(stats.slaap),
    },
    {
      key: 'rust', label: 'Rust', waarde: rust, max: 10, eenheid: '/10',
      kleur: rustKleur(rust), duiding: rustDuiding(rust),
    },
  ]
}

// ─── Pure helpers voor de wekelijkse inzichten (weekreview) ───────────────────
// Types spiegelen exact de respons van /api/inzichten/weekrapport. De AI-velden
// kunnen daar null zijn (geen data of AI niet beschikbaar) — dat modelleren we
// eerlijk in plaats van lege kaarten te renderen. Duidingen zijn schuldvrij en
// komen uitsluitend uit echte, al opgehaalde weekdata.

import type { Taalset } from '@/lib/i18n/taalset'
import { NL_VOORTGANG } from '@/lib/pijlers/teksten'

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

/** NL-notatie: 7.2 → '7,2'; hele getallen zonder decimaal. Met `locale` in die notatie. */
export function formatteerGetal(waarde: number, locale?: string): string {
  if (Number.isInteger(waarde)) return `${waarde}`
  if (locale && !locale.startsWith('nl')) return waarde.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  return waarde.toFixed(1).replace('.', ',')
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

export function stemmingDuiding(v: number | null, ts: Taalset = NL_VOORTGANG): string {
  if (v === null) return ts.t('voortgang.duiding.stemmingLeeg')
  const getal = formatteerGetal(v, ts.locale)
  if (v >= 4) return ts.t('voortgang.duiding.stemmingGoed', { getal })
  if (v >= 3) return ts.t('voortgang.duiding.stemmingWisselend', { getal })
  return ts.t('voortgang.duiding.stemmingZwaar', { getal })
}

export function slaapDuiding(v: number | null, ts: Taalset = NL_VOORTGANG): string {
  if (v === null) return ts.t('voortgang.duiding.slaapLeeg')
  const getal = formatteerGetal(v, ts.locale)
  if (v >= 7) return ts.t('voortgang.duiding.slaapGoed', { getal })
  if (v >= 5) return ts.t('voortgang.duiding.slaapKort', { getal })
  return ts.t('voortgang.duiding.slaapTeKort', { getal })
}

/** Rust = 10 − gemiddelde stress; hoger is rustiger. */
export function rustDuiding(rust: number | null, ts: Taalset = NL_VOORTGANG): string {
  if (rust === null) return ts.t('voortgang.duiding.rustLeeg')
  const getal = formatteerGetal(rust, ts.locale)
  if (rust >= 7) return ts.t('voortgang.duiding.rustLaag', { getal })
  if (rust >= 5) return ts.t('voortgang.duiding.rustGemiddeld', { getal })
  return ts.t('voortgang.duiding.rustGespannen', { getal })
}

/** Eén feitelijke zin over gelogde activiteit — zonder druk of schuld. */
export function activiteitDuiding(checkins: number, dankbaarheid: number, ts: Taalset = NL_VOORTGANG): string {
  if (checkins === 0 && dankbaarheid === 0) return ts.t('voortgang.duiding.activiteitLeeg')
  const checkinDeel = checkins === 0
    ? ts.t('voortgang.duiding.geenCheckins')
    : ts.t(checkins === 1 ? 'voortgang.duiding.checkinEen' : 'voortgang.duiding.checkinMeer', { n: checkins })
  const dankDeel = dankbaarheid === 0
    ? ts.t('voortgang.duiding.geenDank')
    : ts.t(dankbaarheid === 1 ? 'voortgang.duiding.dankEen' : 'voortgang.duiding.dankMeer', { n: dankbaarheid })
  return ts.t('voortgang.duiding.activiteit', { checkins: checkinDeel, dank: dankDeel })
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
export function metrieken(stats: WeekStats, ts: Taalset = NL_VOORTGANG): Metriek[] {
  const rust = stats.stress === null ? null : 10 - stats.stress
  return [
    {
      key: 'stemming', label: ts.t('voortgang.metrieken.stemming'), waarde: stats.stemming, max: 5, eenheid: '/5',
      kleur: stemmingKleur(stats.stemming), duiding: stemmingDuiding(stats.stemming, ts),
    },
    {
      key: 'slaap', label: ts.t('voortgang.metrieken.slaap'), waarde: stats.slaap, max: 9, eenheid: ts.t('voortgang.metrieken.uur'),
      kleur: slaapKleur(stats.slaap), duiding: slaapDuiding(stats.slaap, ts),
    },
    {
      key: 'rust', label: ts.t('voortgang.metrieken.rust'), waarde: rust, max: 10, eenheid: '/10',
      kleur: rustKleur(rust), duiding: rustDuiding(rust, ts),
    },
  ]
}

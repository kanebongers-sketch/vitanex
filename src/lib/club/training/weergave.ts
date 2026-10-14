// ─── Fit Factory Club, training: weergave-hulpjes (PUUR) ─────────────────────

import type { LogRegel } from './rijen'

/** "8-10" wordt "8 tot 10", "30-45 sec" wordt "30 tot 45 sec". Geen streepjes op het scherm. */
export function toonHerhalingen(h: string | null | undefined): string {
  if (!h) return ''
  return h.replace(/(\d)\s*[-–—]\s*(\d)/g, '$1 tot $2').trim()
}

/** Rust in seconden naar "45 sec" of "1:30 min". */
export function toonRust(sec: number | null | undefined): string {
  if (sec === null || sec === undefined) return ''
  if (sec <= 0) return 'geen'
  if (sec < 60) return `${sec} sec`
  const m = Math.floor(sec / 60)
  const r = sec % 60
  return r === 0 ? `${m} min` : `${m}:${String(r).padStart(2, '0')} min`
}

const DATUM = new Intl.DateTimeFormat('nl-NL', { timeZone: 'Europe/Amsterdam', weekday: 'short', day: 'numeric', month: 'short' })
const DATUM_LANG = new Intl.DateTimeFormat('nl-NL', { timeZone: 'Europe/Amsterdam', day: 'numeric', month: 'long', year: 'numeric' })

export function toonDatum(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso)
  return Number.isNaN(d.getTime()) ? iso : DATUM.format(d)
}

export function toonDatumLang(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso)
  return Number.isNaN(d.getTime()) ? iso : DATUM_LANG.format(d)
}

/** Maandag (yyyy-mm-dd, Amsterdam) van de week waarin `iso` valt. */
export function weekStart(iso: string): string {
  const dag = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(new Date(iso))
  const d = new Date(`${dag}T12:00:00Z`)
  const weekdag = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - weekdag)
  return d.toISOString().slice(0, 10)
}

export interface LogWeek {
  week: string
  aantal: number
}

/** Trainingen per week over de laatste `weken` weken (oudste eerst), ook lege weken. */
export function trainingenPerWeek(log: readonly LogRegel[], nu: Date, weken = 8): LogWeek[] {
  const huidig = weekStart(nu.toISOString())
  const telling = new Map<string, number>()
  for (const r of log) {
    const w = weekStart(r.op)
    telling.set(w, (telling.get(w) ?? 0) + 1)
  }
  return Array.from({ length: weken }, (_, i) => {
    const d = new Date(`${huidig}T12:00:00Z`)
    d.setUTCDate(d.getUTCDate() - 7 * (weken - 1 - i))
    const week = d.toISOString().slice(0, 10)
    return { week, aantal: telling.get(week) ?? 0 }
  })
}

export interface Punt {
  x: number
  y: number
  waarde: number
  label: string
}

/** Punten voor een kleine lijngrafiek. Een punt: in het midden. Min gelijk aan max: in het midden. */
export function lijnPunten(reeks: readonly { label: string; waarde: number }[], breedte: number, hoogte: number, marge = 8): Punt[] {
  if (reeks.length === 0) return []
  const waarden = reeks.map((r) => r.waarde)
  const min = Math.min(...waarden)
  const max = Math.max(...waarden)
  const bruikbaarB = breedte - 2 * marge
  const bruikbaarH = hoogte - 2 * marge
  return reeks.map((r, i) => ({
    x: reeks.length === 1 ? breedte / 2 : marge + (bruikbaarB * i) / (reeks.length - 1),
    y: max === min ? hoogte / 2 : marge + bruikbaarH * (1 - (r.waarde - min) / (max - min)),
    waarde: r.waarde,
    label: r.label,
  }))
}

/** Verschil tussen eerste en laatste waarde, met teken: "+1,5" of "-2". */
export function toonVerschil(eerste: number, laatste: number): string {
  const v = Math.round((laatste - eerste) * 10) / 10
  const tekst = Math.abs(v).toLocaleString('nl-NL', { maximumFractionDigits: 1 })
  if (v === 0) return '0'
  return v > 0 ? `+${tekst}` : `-${tekst}`
}

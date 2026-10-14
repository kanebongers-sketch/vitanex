// ─── Fit Factory Club, training: oefeningen filteren (PUUR) ─────────────────

import type { Oefening } from './rijen'
import { isMateriaal, isNiveau, isSpiergroep, type Materiaal, type Niveau, type Spiergroep } from './typen'

export interface OefeningFilter {
  zoek: string
  spiergroep: Spiergroep | null
  materiaal: Materiaal | null
  niveau: Niveau | null
  metInactief: boolean
  /** Alleen oefeningen zonder tekening (om aan te vullen). */
  zonderBeeld: boolean
}

export const LEEG_FILTER: OefeningFilter = { zoek: '', spiergroep: null, materiaal: null, niveau: null, metInactief: false, zonderBeeld: false }

/** Zonder hoofdletters en accenten, zodat "knieen" ook "knieën" vindt. */
export function normaliseer(t: string): string {
  return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

export function filterOefeningen(oefeningen: readonly Oefening[], f: OefeningFilter): Oefening[] {
  const woorden = normaliseer(f.zoek).split(/\s+/).filter(Boolean)
  return oefeningen.filter((o) => {
    if (!f.metInactief && !o.actief) return false
    if (f.spiergroep && o.spiergroep !== f.spiergroep) return false
    if (f.materiaal && o.materiaal !== f.materiaal) return false
    if (f.niveau && o.niveau !== f.niveau) return false
    if (f.zonderBeeld && o.beeld) return false
    const naam = normaliseer(o.naam)
    return woorden.every((w) => naam.includes(w))
  })
}

/** Filter uit de zoekparameters (?zoek=&spier=&mat=&niveau=&beeld=zonder). */
export function filterUitParams(p: Record<string, string | string[] | undefined>): OefeningFilter {
  const een = (k: string) => {
    const v = p[k]
    return Array.isArray(v) ? v[0] : v
  }
  const niveau = Number(een('niveau'))
  const spier = een('spier')
  const mat = een('mat')
  return {
    zoek: (een('zoek') ?? '').slice(0, 60),
    spiergroep: isSpiergroep(spier) ? spier : null,
    materiaal: isMateriaal(mat) ? mat : null,
    niveau: isNiveau(niveau) ? niveau : null,
    metInactief: een('inactief') === '1',
    zonderBeeld: een('beeld') === 'zonder',
  }
}

/** Filter naar zoekparameters; lege waarden vallen weg. */
export function filterNaarParams(f: OefeningFilter): Record<string, string> {
  const uit: Record<string, string> = {}
  if (f.zoek.trim()) uit.zoek = f.zoek.trim()
  if (f.spiergroep) uit.spier = f.spiergroep
  if (f.materiaal) uit.mat = f.materiaal
  if (f.niveau) uit.niveau = String(f.niveau)
  if (f.metInactief) uit.inactief = '1'
  if (f.zonderBeeld) uit.beeld = 'zonder'
  return uit
}

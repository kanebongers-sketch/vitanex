// ─── Fit Factory Club, training: oefeningen filteren (PUUR) ─────────────────

import { heeftOefenbeeld } from './beeld'
import type { Oefening } from './rijen'
import { hoofdspieren, isSpier, isSpierGroep, SPIER_INFO, type Spier, type SpierGroep } from './spieren'
import { isMateriaal, isNiveau, type Materiaal, type Niveau } from './typen'

/** Op een spier, op een hele groep (alle benen) of niets. */
export type SpierKeuze = { soort: 'spier'; spier: Spier } | { soort: 'groep'; groep: SpierGroep } | null

export interface OefeningFilter {
  zoek: string
  spier: SpierKeuze
  /** Ook oefeningen waar de spier alleen meewerkt. */
  ookMeewerkend: boolean
  materiaal: Materiaal | null
  niveau: Niveau | null
  /** Ook de oefeningen die de sportschool zelf op inactief zette. Gearchiveerde nooit. */
  metInactief: boolean
  /** Alleen oefeningen zonder tekening (om aan te vullen). */
  zonderBeeld: boolean
}

export const LEEG_FILTER: OefeningFilter = {
  zoek: '', spier: null, ookMeewerkend: false, materiaal: null, niveau: null, metInactief: false, zonderBeeld: false,
}

/** Zonder hoofdletters en accenten, zodat "knieen" ook "knieën" vindt. */
export function normaliseer(t: string): string {
  return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

function past(keuze: NonNullable<SpierKeuze>, spieren: readonly Spier[]): boolean {
  return keuze.soort === 'spier' ? spieren.includes(keuze.spier) : spieren.some((s) => SPIER_INFO[s].groep === keuze.groep)
}

/** Werkt deze oefening op de gekozen spier of groep? Vooral, of met het vinkje ook als meewerkende spier. */
export function raaktSpier(o: Pick<Oefening, 'spierenPrimair' | 'spierenSecundair' | 'spiergroep'>, keuze: SpierKeuze, ookMeewerkend: boolean): boolean {
  if (!keuze) return true
  if (past(keuze, hoofdspieren(o))) return true
  return ookMeewerkend && past(keuze, o.spierenSecundair)
}

export function filterOefeningen(oefeningen: readonly Oefening[], f: OefeningFilter): Oefening[] {
  const woorden = normaliseer(f.zoek).split(/\s+/).filter(Boolean)
  return oefeningen.filter((o) => {
    // Gearchiveerd (migratie 465): alleen nog leesbaar in bestaande schema's, nergens te kiezen.
    if (o.gearchiveerd) return false
    if (!f.metInactief && !o.actief) return false
    if (!raaktSpier(o, f.spier, f.ookMeewerkend)) return false
    if (f.materiaal && o.materiaal !== f.materiaal) return false
    if (f.niveau && o.niveau !== f.niveau) return false
    if (f.zonderBeeld && heeftOefenbeeld(o)) return false
    const naam = normaliseer(o.naam)
    return woorden.every((w) => naam.includes(w))
  })
}

/** De waarde in de keuzelijst: "s:quadriceps" of "g:benen". */
export function keuzeNaarWaarde(k: SpierKeuze): string {
  if (!k) return ''
  return k.soort === 'spier' ? `s:${k.spier}` : `g:${k.groep}`
}

export function waardeNaarKeuze(v: string): SpierKeuze {
  const [soort, sleutel] = v.split(':')
  if (soort === 's' && isSpier(sleutel)) return { soort: 'spier', spier: sleutel }
  if (soort === 'g' && isSpierGroep(sleutel)) return { soort: 'groep', groep: sleutel }
  return null
}

/** Filter uit de zoekparameters (?zoek=&spier=&groep=&mee=1&mat=&niveau=&beeld=zonder). */
export function filterUitParams(p: Record<string, string | string[] | undefined>): OefeningFilter {
  const een = (k: string) => {
    const v = p[k]
    return Array.isArray(v) ? v[0] : v
  }
  const niveau = Number(een('niveau'))
  const spier = een('spier')
  const groep = een('groep')
  const mat = een('mat')
  const keuze: SpierKeuze = isSpier(spier) ? { soort: 'spier', spier } : isSpierGroep(groep) ? { soort: 'groep', groep } : null
  return {
    zoek: (een('zoek') ?? '').slice(0, 60),
    spier: keuze,
    ookMeewerkend: een('mee') === '1',
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
  if (f.spier?.soort === 'spier') uit.spier = f.spier.spier
  if (f.spier?.soort === 'groep') uit.groep = f.spier.groep
  if (f.spier && f.ookMeewerkend) uit.mee = '1'
  if (f.materiaal) uit.mat = f.materiaal
  if (f.niveau) uit.niveau = String(f.niveau)
  if (f.metInactief) uit.inactief = '1'
  if (f.zonderBeeld) uit.beeld = 'zonder'
  return uit
}

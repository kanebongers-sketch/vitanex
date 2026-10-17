// ─── Club: welke berichten ziet wie, en wanneer (PUUR) ──────────────────────

import type { Lid } from '@/lib/club/kern/lid'
import type { Bericht, BerichtSoort } from './model'

export type BerichtStatus = 'actief' | 'gepland' | 'verlopen'

export const STATUS_LABEL: Record<BerichtStatus, string> = {
  actief: 'Actief',
  gepland: 'Gepland',
  verlopen: 'Verlopen',
}

type Venster = Pick<Bericht, 'zichtbaarVan' | 'zichtbaarTot'>

/** Gepland (nog niet begonnen), actief of verlopen, op dit moment. */
export function berichtStatus(b: Venster, nu: Date): BerichtStatus {
  const t = nu.getTime()
  if (Date.parse(b.zichtbaarVan) > t) return 'gepland'
  if (b.zichtbaarTot !== null && Date.parse(b.zichtbaarTot) <= t) return 'verlopen'
  return 'actief'
}

/** Het lid zoals de doelgroep het nodig heeft. */
export type LidVoorBericht = Pick<Lid, 'vestiging' | 'status' | 'tags'>

/** Hoort dit lid bij de doelgroep (vestiging, status en tag)? Los van het tijdvenster. */
export function hoortBijDoelgroep(b: Pick<Bericht, 'vestigingen' | 'statussen' | 'tag'>, lid: LidVoorBericht): boolean {
  if (b.vestigingen.length > 0 && !b.vestigingen.includes(lid.vestiging)) return false
  if (b.statussen.length > 0 && !b.statussen.includes(lid.status)) return false
  if (b.tag !== null) {
    const tag = b.tag.trim().toLowerCase()
    if (!lid.tags.some((t) => t.trim().toLowerCase() === tag)) return false
  }
  return true
}

/** Vastgepind eerst, daarna het nieuwste (begin van zichtbaarheid, dan aanmaakmoment). */
export function sorteerBerichten(a: Bericht, b: Bericht): number {
  if (a.vastgepind !== b.vastgepind) return a.vastgepind ? -1 : 1
  const van = Date.parse(b.zichtbaarVan) - Date.parse(a.zichtbaarVan)
  if (van !== 0) return van
  return Date.parse(b.aangemaaktOp) - Date.parse(a.aangemaaktOp)
}

/** De berichten die dit lid nu in de app ziet, in de volgorde van de app. */
export function berichtenVoorLid(berichten: readonly Bericht[], lid: LidVoorBericht, nu: Date): Bericht[] {
  return berichten.filter((b) => berichtStatus(b, nu) === 'actief' && hoortBijDoelgroep(b, lid)).sort(sorteerBerichten)
}

// ── Beheer ─────────────────────────────────────────────────────────────────

export interface BeheerFilters {
  status: BerichtStatus | 'alle'
  soort: BerichtSoort | 'alle'
  /** Alleen berichten die (ook) voor deze vestiging gelden; null = alle. */
  vestiging: string | null
}

export function pastInFilters(b: Bericht, f: BeheerFilters, nu: Date): boolean {
  if (f.status !== 'alle' && berichtStatus(b, nu) !== f.status) return false
  if (f.soort !== 'alle' && b.soort !== f.soort) return false
  if (f.vestiging !== null && b.vestigingen.length > 0 && !b.vestigingen.includes(f.vestiging)) return false
  return true
}

const STATUS_VOLGORDE: Record<BerichtStatus, number> = { actief: 0, gepland: 1, verlopen: 2 }

/** Beheerlijst: actief, dan gepland, dan verlopen; daarbinnen zoals in de app. */
export function sorteerVoorBeheer(berichten: readonly Bericht[], nu: Date): Bericht[] {
  return [...berichten].sort((a, b) => STATUS_VOLGORDE[berichtStatus(a, nu)] - STATUS_VOLGORDE[berichtStatus(b, nu)] || sorteerBerichten(a, b))
}

export function telPerStatus(berichten: readonly Bericht[], nu: Date): Record<BerichtStatus, number> {
  const tel: Record<BerichtStatus, number> = { actief: 0, gepland: 0, verlopen: 0 }
  for (const b of berichten) tel[berichtStatus(b, nu)] += 1
  return tel
}

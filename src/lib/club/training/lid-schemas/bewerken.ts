// ─── Club, ledenapp: het eigen schema bewerken (PUUR) ───────────────────────
// Hulp voor de editor in de ledenapp. De bewerkingen zelf (verplaatsen,
// superset, dag toevoegen) zijn die van de schema-editor in Club (editor.ts):
// een plek voor de regels, op de telefoon en op de pc hetzelfde gedrag.

import { uitOpgeslagen, type EditorStaat, type Standaard } from '../editor'
import type { RegelInvoer } from '../invoer'
import type { SchemaRegel } from '../rijen'
import { MATERIALEN, SPIERGROEPEN, type Materiaal, type Spiergroep } from '../typen'
import type { LidOefening } from './typen'

/** Waarmee een nieuwe oefening start: rustig en veilig, het lid past het aan. */
export const STANDAARD_NIEUW: Standaard = { sets: '3', herhalingen: '10', rustSec: '60' }

/** De rust die een lid met een tik kiest (seconden). */
export const RUST_KEUZES = [0, 30, 45, 60, 90, 120, 180] as const

/** Een voorstel (nog zonder ids) of een opgeslagen schema naar de staat van de editor. */
export function staatUit(regels: readonly (RegelInvoer | SchemaRegel)[], dagTitels: readonly string[], maakSleutel: () => string): EditorStaat {
  const teller = new Map<number, number>()
  const opgeslagen: SchemaRegel[] = regels.map((r) => {
    const volgorde = 'volgorde' in r ? r.volgorde : (teller.get(r.dag) ?? 0)
    teller.set(r.dag, (teller.get(r.dag) ?? 0) + 1)
    return { ...r, id: 'id' in r ? r.id : maakSleutel(), volgorde }
  })
  return uitOpgeslagen(opgeslagen, dagTitels)
}

export interface BibFilter {
  zoek: string
  spiergroep: Spiergroep | null
  materiaal: Materiaal | null
}

export const LEEG_FILTER: BibFilter = { zoek: '', spiergroep: null, materiaal: null }

const plat = (t: string): string => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/** De oefeningen die bij het filter passen; zoeken op naam, hoofdletters en accenten tellen niet. */
export function filterBibliotheek(lijst: readonly LidOefening[], f: BibFilter): LidOefening[] {
  const zoek = plat(f.zoek)
  return lijst.filter((o) => (!f.spiergroep || o.spiergroep === f.spiergroep) && (!f.materiaal || o.materiaal === f.materiaal) && (!zoek || plat(o.naam).includes(zoek)))
}

/** Alleen de spiergroepen en materialen die in de bibliotheek voorkomen, in de vaste volgorde. */
export function filterKeuzes(lijst: readonly LidOefening[]): { spiergroepen: Spiergroep[]; materialen: Materiaal[] } {
  return {
    spiergroepen: SPIERGROEPEN.filter((s) => lijst.some((o) => o.spiergroep === s)),
    materialen: MATERIALEN.filter((m) => lijst.some((o) => o.materiaal === m)),
  }
}

/** Is er minstens een oefening in het schema? Zonder oefening opslaan heeft geen zin. */
export function kanOpslaan(s: EditorStaat): boolean {
  return s.regels.length > 0
}

/** Een getal een stap hoger of lager, binnen de grenzen (voor de knoppen min en plus). */
export function stap(waarde: string, richting: -1 | 1, min: number, max: number): string {
  const n = Number.parseInt(waarde, 10)
  const basis = Number.isFinite(n) ? n : min
  return String(Math.min(max, Math.max(min, basis + richting)))
}

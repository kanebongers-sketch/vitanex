// ─── Fit Factory Club, training: de staat van de schema-editor (PUUR) ──────
// Onveranderlijke bewerkingen op de regels van een schema. De editor bewaart
// invoer als tekst (wat de trainer typt) en zet het pas bij opslaan om.

import type { SchemaRegel } from './rijen'
import { dagLetter, MAX_DAGEN } from './typen'
import { toonHerhalingen } from './weergave'

export interface EditorRegel {
  sleutel: string
  dag: number
  oefeningId: string
  sets: string
  herhalingen: string
  gewichtKg: string
  rustSec: string
  notitie: string
}

export interface EditorStaat {
  regels: EditorRegel[]
  dagTitels: string[]
}

const tekst = (v: number | string | null): string => (v === null ? '' : String(v))

export function uitOpgeslagen(regels: readonly SchemaRegel[], dagTitels: readonly string[]): EditorStaat {
  const sorteer = [...regels].sort((a, b) => a.dag - b.dag || a.volgorde - b.volgorde)
  const aantalDagen = Math.max(1, dagTitels.length, ...sorteer.map((r) => r.dag))
  return {
    regels: sorteer.map((r) => ({
      sleutel: r.id,
      dag: r.dag,
      oefeningId: r.oefeningId,
      sets: tekst(r.sets),
      herhalingen: toonHerhalingen(r.herhalingen),
      gewichtKg: tekst(r.gewichtKg),
      rustSec: tekst(r.rustSec),
      notitie: r.notitie ?? '',
    })),
    dagTitels: Array.from({ length: Math.min(aantalDagen, MAX_DAGEN) }, (_, i) => dagTitels[i] || `Dag ${dagLetter(i + 1)}`),
  }
}

export function aantalDagen(s: EditorStaat): number {
  return s.dagTitels.length
}

/** Een regel een plek omhoog (-1) of omlaag (+1) binnen zijn dag. */
export function verplaats(s: EditorStaat, sleutel: string, richting: -1 | 1): EditorStaat {
  const i = s.regels.findIndex((r) => r.sleutel === sleutel)
  if (i < 0) return s
  const dag = s.regels[i].dag
  const binnenDag = s.regels.map((r, idx) => ({ r, idx })).filter((x) => x.r.dag === dag)
  const pos = binnenDag.findIndex((x) => x.idx === i)
  const doel = binnenDag[pos + richting]
  if (!doel) return s
  const regels = [...s.regels]
  regels[i] = s.regels[doel.idx]
  regels[doel.idx] = s.regels[i]
  return { ...s, regels }
}

export function wijzigRegel(s: EditorStaat, sleutel: string, veld: keyof Omit<EditorRegel, 'sleutel' | 'dag' | 'oefeningId'>, waarde: string): EditorStaat {
  return { ...s, regels: s.regels.map((r) => (r.sleutel === sleutel ? { ...r, [veld]: waarde } : r)) }
}

export function verwijderRegel(s: EditorStaat, sleutel: string): EditorStaat {
  return { ...s, regels: s.regels.filter((r) => r.sleutel !== sleutel) }
}

export interface Standaard {
  sets: string
  herhalingen: string
  rustSec: string
}

export function voegToe(s: EditorStaat, dag: number, oefeningId: string, standaard: Standaard, sleutel: string): EditorStaat {
  const nieuw: EditorRegel = { sleutel, dag, oefeningId, ...standaard, gewichtKg: '', notitie: '' }
  const laatste = s.regels.map((r) => r.dag).lastIndexOf(dag)
  const regels = laatste < 0 ? [...s.regels, nieuw] : [...s.regels.slice(0, laatste + 1), nieuw, ...s.regels.slice(laatste + 1)]
  return { ...s, regels }
}

export function nieuweDag(s: EditorStaat): EditorStaat {
  if (s.dagTitels.length >= MAX_DAGEN) return s
  return { ...s, dagTitels: [...s.dagTitels, `Dag ${dagLetter(s.dagTitels.length + 1)}`] }
}

/** Kopieer een dag naar een nieuwe dag achteraan. */
export function kopieerDag(s: EditorStaat, dag: number, maakSleutel: () => string): EditorStaat {
  if (s.dagTitels.length >= MAX_DAGEN) return s
  const nieuw = s.dagTitels.length + 1
  const kopie = s.regels.filter((r) => r.dag === dag).map((r) => ({ ...r, sleutel: maakSleutel(), dag: nieuw }))
  const titel = `${s.dagTitels[dag - 1] ?? `Dag ${dagLetter(dag)}`} (kopie)`.slice(0, 40)
  return { regels: [...s.regels, ...kopie], dagTitels: [...s.dagTitels, titel] }
}

/** Verwijder een dag; de dagen erna schuiven een letter op. */
export function verwijderDag(s: EditorStaat, dag: number): EditorStaat {
  if (s.dagTitels.length <= 1) return s
  return {
    regels: s.regels.filter((r) => r.dag !== dag).map((r) => (r.dag > dag ? { ...r, dag: r.dag - 1 } : r)),
    dagTitels: s.dagTitels.filter((_, i) => i !== dag - 1),
  }
}

export function hernoemDag(s: EditorStaat, dag: number, titel: string): EditorStaat {
  return { ...s, dagTitels: s.dagTitels.map((t, i) => (i === dag - 1 ? titel.slice(0, 40) : t)) }
}

/** Naar het formaat van de API (PUT /api/club/training/schemas/[id]). */
export function naarPayloadRegels(s: EditorStaat) {
  const leeg = (v: string) => (v.trim() === '' ? null : v.trim())
  return [...s.regels]
    .sort((a, b) => a.dag - b.dag)
    .map((r) => ({
      dag: r.dag,
      oefeningId: r.oefeningId,
      sets: leeg(r.sets),
      herhalingen: leeg(r.herhalingen),
      gewichtKg: leeg(r.gewichtKg),
      rustSec: leeg(r.rustSec),
      notitie: leeg(r.notitie),
    }))
}

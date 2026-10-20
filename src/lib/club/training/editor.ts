// ─── Fit Factory Club, training: de staat van de schema-editor (PUUR) ──────
// Onveranderlijke bewerkingen op de regels van een schema. De editor bewaart
// invoer als tekst (wat de trainer typt) en zet het pas bij opslaan om.
// De volgorde van `regels` is de volgorde binnen een dag; supersets en
// circuits staan in `groep` (zie blokken.ts).

import { blokken, normaliseerGroepen } from './blokken'
import type { SchemaRegel } from './rijen'
import { dagLetter, MAX_DAGEN } from './typen'
import { toonHerhalingen } from './weergave'

export type Maat = 'herhalingen' | 'tijd'
export type Inspanning = 'geen' | 'rpe' | 'rir'

export interface EditorRegel {
  sleutel: string
  dag: number
  oefeningId: string
  groep: number | null
  maat: Maat
  sets: string
  herhalingen: string
  tijdSec: string
  gewichtKg: string
  inspanning: Inspanning
  inspanningWaarde: string
  rustSec: string
  tempo: string
  notitie: string
}

export type TekstVeld = 'sets' | 'herhalingen' | 'tijdSec' | 'gewichtKg' | 'inspanningWaarde' | 'rustSec' | 'tempo' | 'notitie'

export interface EditorStaat {
  regels: EditorRegel[]
  dagTitels: string[]
}

const tekst = (v: number | string | null): string => (v === null ? '' : String(v).replace('.', ','))

export function uitOpgeslagen(regels: readonly SchemaRegel[], dagTitels: readonly string[]): EditorStaat {
  const sorteer = [...regels].sort((a, b) => a.dag - b.dag || a.volgorde - b.volgorde)
  const aantalDagen = Math.max(1, dagTitels.length, ...sorteer.map((r) => r.dag))
  return {
    regels: normaliseerGroepen(
      sorteer.map((r) => ({
        sleutel: r.id,
        dag: r.dag,
        oefeningId: r.oefeningId,
        groep: r.groep,
        maat: r.tijdSec !== null && !r.herhalingen ? 'tijd' : 'herhalingen',
        sets: tekst(r.sets),
        herhalingen: toonHerhalingen(r.herhalingen),
        tijdSec: tekst(r.tijdSec),
        gewichtKg: tekst(r.gewichtKg),
        inspanning: r.rpe !== null ? 'rpe' : r.rir !== null ? 'rir' : 'geen',
        inspanningWaarde: tekst(r.rpe ?? r.rir),
        rustSec: tekst(r.rustSec),
        tempo: r.tempo ?? '',
        notitie: r.notitie ?? '',
      })),
    ),
    dagTitels: Array.from({ length: Math.min(aantalDagen, MAX_DAGEN) }, (_, i) => dagTitels[i] || `Dag ${dagLetter(i + 1)}`),
  }
}

export function aantalDagen(s: EditorStaat): number {
  return s.dagTitels.length
}

/** Vervang de regels van een dag door een nieuwe volgorde; andere dagen blijven staan. */
function metDag(s: EditorStaat, dag: number, nieuw: readonly EditorRegel[]): EditorStaat {
  const rest = s.regels.filter((r) => r.dag !== dag)
  const voor = rest.filter((r) => r.dag < dag)
  const na = rest.filter((r) => r.dag > dag)
  return { ...s, regels: normaliseerGroepen([...voor, ...nieuw, ...na]) }
}

/**
 * Een plek omhoog (-1) of omlaag (+1). Binnen een superset wisselt de oefening
 * van plek met de buur in het blok; aan de rand van het blok (of los) schuift
 * het hele blok voorbij het blok ernaast, zodat supersets heel blijven.
 */
export function verplaats(s: EditorStaat, sleutel: string, richting: -1 | 1): EditorStaat {
  const regel = s.regels.find((r) => r.sleutel === sleutel)
  if (!regel) return s
  const dagRegels = s.regels.filter((r) => r.dag === regel.dag)
  const bl = blokken(dagRegels)
  const b = bl.findIndex((x) => x.items.includes(regel))
  const items = bl[b].items
  const pos = items.indexOf(regel)
  const binnen = pos + richting
  if (binnen >= 0 && binnen < items.length) {
    const nieuwBlok = [...items]
    nieuwBlok[pos] = items[binnen]
    nieuwBlok[binnen] = regel
    const nieuweBlokken = bl.map((x, i) => (i === b ? nieuwBlok : x.items))
    return metDag(s, regel.dag, nieuweBlokken.flat())
  }
  const buur = b + richting
  if (buur < 0 || buur >= bl.length) return s
  const volgorde = bl.map((x) => x.items)
  volgorde[b] = bl[buur].items
  volgorde[buur] = items
  return metDag(s, regel.dag, volgorde.flat())
}

/**
 * Slepen: zet een regel voor `voorSleutel` op dag `dag` (of achteraan als die
 * null is). Valt hij tussen twee oefeningen van dezelfde superset, dan doet hij
 * mee; anders staat hij los.
 */
export function verplaatsNaar(s: EditorStaat, sleutel: string, dag: number, voorSleutel: string | null): EditorStaat {
  const regel = s.regels.find((r) => r.sleutel === sleutel)
  if (!regel || sleutel === voorSleutel || dag < 1 || dag > s.dagTitels.length) return s
  const zonder = s.regels.filter((r) => r.sleutel !== sleutel)
  const doelDag = zonder.filter((r) => r.dag === dag)
  const i = voorSleutel === null ? doelDag.length : doelDag.findIndex((r) => r.sleutel === voorSleutel)
  if (i < 0) return s
  const ervoor = doelDag[i - 1]
  const erna = doelDag[i]
  const groep = ervoor && erna && ervoor.groep !== null && ervoor.groep === erna.groep ? ervoor.groep : null
  const nieuw = [...doelDag.slice(0, i), { ...regel, dag, groep }, ...doelDag.slice(i)]
  const tussen = { ...s, regels: zonder }
  return metDag(tussen, dag, nieuw)
}

/** Koppel een oefening aan de oefening erboven: superset (2) of circuit (3 of meer). */
export function koppelAanVorige(s: EditorStaat, sleutel: string): EditorStaat {
  const regel = s.regels.find((r) => r.sleutel === sleutel)
  if (!regel) return s
  const dagRegels = s.regels.filter((r) => r.dag === regel.dag)
  const i = dagRegels.indexOf(regel)
  const vorige = dagRegels[i - 1]
  if (!vorige) return s
  const doel = vorige.groep ?? Math.max(0, ...s.regels.map((r) => r.groep ?? 0)) + 1
  const oud = regel.groep
  const nieuw = dagRegels.map((r) => (r === vorige || r === regel || (oud !== null && r.groep === oud) ? { ...r, groep: doel } : r))
  return metDag(s, regel.dag, nieuw)
}

/** Haal een oefening uit zijn superset of circuit. */
export function ontkoppel(s: EditorStaat, sleutel: string): EditorStaat {
  const regel = s.regels.find((r) => r.sleutel === sleutel)
  if (!regel || regel.groep === null) return s
  const dagRegels = s.regels.filter((r) => r.dag === regel.dag)
  const i = dagRegels.indexOf(regel)
  // Wat erna komt in hetzelfde blok wordt een eigen blok (nieuw nummer), zodat
  // het niet aan het stuk ervoor blijft hangen.
  const nieuwNummer = Math.max(0, ...s.regels.map((r) => r.groep ?? 0)) + 1
  const nieuw = dagRegels.map((r, j) => {
    if (r === regel) return { ...r, groep: null }
    if (j > i && r.groep === regel.groep) return { ...r, groep: nieuwNummer }
    return r
  })
  return metDag(s, regel.dag, nieuw)
}

export function wijzigRegel(s: EditorStaat, sleutel: string, veld: TekstVeld, waarde: string): EditorStaat {
  return { ...s, regels: s.regels.map((r) => (r.sleutel === sleutel ? { ...r, [veld]: waarde } : r)) }
}

export function zetMaat(s: EditorStaat, sleutel: string, maat: Maat): EditorStaat {
  return { ...s, regels: s.regels.map((r) => (r.sleutel === sleutel ? { ...r, maat } : r)) }
}

export function zetInspanning(s: EditorStaat, sleutel: string, inspanning: Inspanning): EditorStaat {
  return { ...s, regels: s.regels.map((r) => (r.sleutel === sleutel ? { ...r, inspanning, inspanningWaarde: inspanning === 'geen' ? '' : r.inspanningWaarde } : r)) }
}

/**
 * Een andere oefening op dezelfde plek: sets, herhalingen, rust, superset en
 * notitie blijven, het gewicht niet (een andere oefening, ander gewicht).
 */
export function vervangOefening(s: EditorStaat, sleutel: string, oefeningId: string): EditorStaat {
  return { ...s, regels: s.regels.map((r) => (r.sleutel === sleutel ? { ...r, oefeningId, gewichtKg: '' } : r)) }
}

export function verwijderRegel(s: EditorStaat, sleutel: string): EditorStaat {
  return { ...s, regels: normaliseerGroepen(s.regels.filter((r) => r.sleutel !== sleutel)) }
}

export interface Standaard {
  sets: string
  herhalingen: string
  rustSec: string
}

export function voegToe(s: EditorStaat, dag: number, oefeningId: string, standaard: Standaard, sleutel: string): EditorStaat {
  const nieuw: EditorRegel = {
    sleutel, dag, oefeningId, groep: null, maat: 'herhalingen', ...standaard, tijdSec: '', gewichtKg: '', inspanning: 'geen', inspanningWaarde: '', tempo: '', notitie: '',
  }
  const laatste = s.regels.map((r) => r.dag).lastIndexOf(dag)
  const regels = laatste < 0 ? [...s.regels, nieuw] : [...s.regels.slice(0, laatste + 1), nieuw, ...s.regels.slice(laatste + 1)]
  return { ...s, regels }
}

export function nieuweDag(s: EditorStaat): EditorStaat {
  if (s.dagTitels.length >= MAX_DAGEN) return s
  return { ...s, dagTitels: [...s.dagTitels, `Dag ${dagLetter(s.dagTitels.length + 1)}`] }
}

/** Kopieer een dag naar een nieuwe dag achteraan (supersets gaan mee). */
export function kopieerDag(s: EditorStaat, dag: number, maakSleutel: () => string): EditorStaat {
  if (s.dagTitels.length >= MAX_DAGEN) return s
  const nieuw = s.dagTitels.length + 1
  const kopie = s.regels.filter((r) => r.dag === dag).map((r) => ({ ...r, sleutel: maakSleutel(), dag: nieuw }))
  const titel = `${s.dagTitels[dag - 1] ?? `Dag ${dagLetter(dag)}`} (kopie)`.slice(0, 40)
  return { regels: normaliseerGroepen([...s.regels, ...kopie]), dagTitels: [...s.dagTitels, titel] }
}

/** Verwijder een dag; de dagen erna schuiven een letter op. */
export function verwijderDag(s: EditorStaat, dag: number): EditorStaat {
  if (s.dagTitels.length <= 1) return s
  return {
    regels: normaliseerGroepen(s.regels.filter((r) => r.dag !== dag).map((r) => (r.dag > dag ? { ...r, dag: r.dag - 1 } : r))),
    dagTitels: s.dagTitels.filter((_, i) => i !== dag - 1),
  }
}

export function hernoemDag(s: EditorStaat, dag: number, titel: string): EditorStaat {
  return { ...s, dagTitels: s.dagTitels.map((t, i) => (i === dag - 1 ? titel.slice(0, 40) : t)) }
}

/** Het gewicht van een regel aanpassen, bijvoorbeeld met de progressiesuggestie. */
export function zetGewicht(s: EditorStaat, oefeningId: string, kg: number): EditorStaat {
  const waarde = tekst(Math.round(kg * 100) / 100)
  return { ...s, regels: s.regels.map((r) => (r.oefeningId === oefeningId ? { ...r, gewichtKg: waarde } : r)) }
}

/** De regels in de volgorde waarin ze naar de API gaan: per dag, binnen de dag zoals in de editor. */
export function payloadVolgorde(s: EditorStaat): EditorRegel[] {
  return [...s.regels].sort((a, b) => a.dag - b.dag)
}

/** Naar het formaat van de API (PUT /api/club/training/schemas/[id]). */
export function naarPayloadRegels(s: EditorStaat) {
  const leeg = (v: string) => (v.trim() === '' ? null : v.trim())
  return payloadVolgorde(s)
    .map((r) => ({
      dag: r.dag,
      oefeningId: r.oefeningId,
      sets: leeg(r.sets),
      herhalingen: r.maat === 'tijd' ? null : leeg(r.herhalingen),
      tijdSec: r.maat === 'tijd' ? leeg(r.tijdSec) : null,
      gewichtKg: leeg(r.gewichtKg),
      rustSec: leeg(r.rustSec),
      notitie: leeg(r.notitie),
      groep: r.groep,
      rpe: r.inspanning === 'rpe' ? leeg(r.inspanningWaarde) : null,
      rir: r.inspanning === 'rir' ? leeg(r.inspanningWaarde) : null,
      tempo: leeg(r.tempo),
    }))
}

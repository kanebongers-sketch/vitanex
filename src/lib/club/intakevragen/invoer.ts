// ─── Club, intakevragen: invoer van het beheer valideren (PUUR) ─────────────

import type { Uitslag } from './eigen'
import { standaardSleutel, type KernDef } from './kern'
import type { Richting } from './lijst'
import {
  MAX_OPTIE, MAX_OPTIES, MAX_SECTIE, MAX_UITLEG, MAX_VRAAG, heeftOpties, isVraagSoort,
  type VraagSoort,
} from './soorten'

export interface VraagInvoer {
  vraag: string
  uitleg: string | null
  soort: VraagSoort
  opties: string[]
  verplicht: boolean
  gezondheid: boolean
  sectie: string
  actief: boolean
}

export type Verplaatsing = { wat: 'vraag'; id: string; richting: Richting } | { wat: 'sectie'; sectie: string; richting: Richting }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Een echt id (uuid) of het tijdelijke id van een kernvraag (kern:doelen). */
export function isVraagId(v: unknown): v is string {
  return typeof v === 'string' && (UUID.test(v) || standaardSleutel(v) !== null)
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Een regel tekst: spaties samengevoegd en ingekort. */
function regel(v: unknown, max: number): string {
  return typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : ''
}

function leesOpties(v: unknown): Uitslag<string[]> {
  if (!Array.isArray(v)) return { ok: false, fout: 'Geef minstens twee opties.' }
  const schoon = v.map((o) => regel(o, MAX_OPTIE)).filter((o) => o !== '')
  const uniek = schoon.filter((o, i) => schoon.findIndex((x) => x.toLowerCase() === o.toLowerCase()) === i)
  if (uniek.length < 2) return { ok: false, fout: 'Geef minstens twee verschillende opties.' }
  if (uniek.length > MAX_OPTIES) return { ok: false, fout: `Maximaal ${MAX_OPTIES} opties.` }
  return { ok: true, waarde: uniek }
}

/**
 * Een vraag uit het beheer. Bij een kernvraag (`kern`) liggen soort, opties,
 * verplicht en gezondheid vast en staat een vaste vraag altijd aan.
 */
export function leesVraagInvoer(body: unknown, kern: KernDef | null): Uitslag<VraagInvoer> {
  if (!isObject(body)) return { ok: false, fout: 'Ongeldig verzoek.' }
  const vraag = regel(body.vraag, MAX_VRAAG)
  if (vraag.length < 3) return { ok: false, fout: 'Schrijf de vraag uit (minstens 3 tekens).' }
  const sectie = regel(body.sectie, MAX_SECTIE)
  if (!sectie) return { ok: false, fout: 'Kies of typ een sectie.' }
  const uitleg = regel(body.uitleg, MAX_UITLEG) || null
  const actief = body.actief !== false
  if (kern) {
    return {
      ok: true,
      waarde: { vraag, uitleg, sectie, soort: kern.soort, opties: [...kern.opties], verplicht: kern.verplicht, gezondheid: kern.gezondheid, actief: kern.vast ? true : actief },
    }
  }
  if (!isVraagSoort(body.soort)) return { ok: false, fout: 'Kies het soort antwoord.' }
  const soort = body.soort
  let opties: string[] = []
  if (heeftOpties(soort)) {
    const o = leesOpties(body.opties)
    if (!o.ok) return o
    opties = o.waarde
  }
  return { ok: true, waarde: { vraag, uitleg, sectie, soort, opties, verplicht: body.verplicht === true, gezondheid: body.gezondheid === true, actief } }
}

function isRichting(v: unknown): v is Richting {
  return v === 'omhoog' || v === 'omlaag'
}

/** { wat: 'vraag', id, richting } of { wat: 'sectie', sectie, richting }. */
export function leesVerplaatsing(body: unknown): Uitslag<Verplaatsing> {
  if (!isObject(body) || !isRichting(body.richting)) return { ok: false, fout: 'Kies omhoog of omlaag.' }
  if (body.wat === 'vraag' && isVraagId(body.id)) {
    return { ok: true, waarde: { wat: 'vraag', id: body.id, richting: body.richting } }
  }
  const sectie = regel(body.sectie, MAX_SECTIE)
  if (body.wat === 'sectie' && sectie) return { ok: true, waarde: { wat: 'sectie', sectie, richting: body.richting } }
  return { ok: false, fout: 'Ongeldig verzoek.' }
}

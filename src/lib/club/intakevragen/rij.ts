// ─── Club, intakevragen: databaserij naar vraag (PUUR) ──────────────────────
// Systeemgrens: een rij die niet klopt wordt null en valt weg.

import { isKernSleutel } from './kern'
import { MAX_OPTIE, MAX_SECTIE, MAX_UITLEG, MAX_VRAAG, isVraagSoort, type IntakeVraag } from './soorten'
import type { VraagInvoer } from './invoer'

export const VRAAG_KOLOMMEN = 'id, sleutel, vraag, uitleg, soort, opties, verplicht, gezondheid, sectie, volgorde, actief'

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function vraagUitRij(rij: unknown): IntakeVraag | null {
  if (!isObject(rij)) return null
  const { id, vraag, soort, sectie } = rij
  if (typeof id !== 'string' || typeof vraag !== 'string' || !vraag.trim() || !isVraagSoort(soort)) return null
  const sleutel = isKernSleutel(rij.sleutel) ? rij.sleutel : null
  const opties = Array.isArray(rij.opties) ? rij.opties.filter((o): o is string => typeof o === 'string' && o !== '').map((o) => o.slice(0, MAX_OPTIE)) : []
  return {
    id,
    sleutel,
    vraag: vraag.slice(0, MAX_VRAAG),
    uitleg: typeof rij.uitleg === 'string' && rij.uitleg.trim() ? rij.uitleg.slice(0, MAX_UITLEG) : null,
    soort,
    opties,
    verplicht: rij.verplicht === true,
    gezondheid: rij.gezondheid === true,
    sectie: typeof sectie === 'string' && sectie.trim() ? sectie.slice(0, MAX_SECTIE) : 'Overig',
    volgorde: typeof rij.volgorde === 'number' && Number.isFinite(rij.volgorde) ? rij.volgorde : 0,
    actief: rij.actief !== false,
  }
}

/** De kolommen voor een insert of update. */
export function naarRij(v: VraagInvoer) {
  return {
    vraag: v.vraag,
    uitleg: v.uitleg,
    soort: v.soort,
    opties: v.opties,
    verplicht: v.verplicht,
    gezondheid: v.gezondheid,
    sectie: v.sectie,
    actief: v.actief,
  }
}

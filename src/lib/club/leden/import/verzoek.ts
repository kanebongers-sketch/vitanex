// ─── Fit Factory Club: het importverzoek van de pagina lezen (PUUR) ─────────
// Systeemgrens. De pagina stuurt de rijen al als velden (na het koppelen van de
// kolommen); de server controleert elke rij opnieuw.

import { isVestiging, type Vestiging } from '@/lib/club/kern/vestiging'
import type { ImportRegel } from './plan'
import { controleerRij, ruweRijUit } from './rij'

export const MAX_IMPORT_RIJEN = 5000
/** Ruim genoeg voor 5000 leden, maar geen tientallen megabytes in het geheugen. */
export const MAX_IMPORT_BYTES = 6 * 1024 * 1024

export interface ImportVerzoek {
  vestiging: Vestiging
  opslaan: boolean
  regels: ImportRegel[]
  fouten: { regel: number; fout: string }[]
  waarschuwingen: number
}

export type VerzoekUitslag = { ok: true; waarde: ImportVerzoek } | { ok: false; fout: string }

export function leesImportVerzoek(body: unknown, vandaag: string): VerzoekUitslag {
  if (typeof body !== 'object' || body === null) return { ok: false, fout: 'Ongeldige invoer.' }
  const o = body as Record<string, unknown>
  if (!isVestiging(o.vestiging)) return { ok: false, fout: 'Kies een vestiging.' }
  if (!Array.isArray(o.rijen) || o.rijen.length === 0) return { ok: false, fout: 'Het bestand bevat geen leden.' }
  if (o.rijen.length > MAX_IMPORT_RIJEN) return { ok: false, fout: `Maximaal ${MAX_IMPORT_RIJEN} leden per keer. Splits het bestand.` }

  const regels: ImportRegel[] = []
  const fouten: ImportVerzoek['fouten'] = []
  const gezien = new Set<number>()
  let waarschuwingen = 0
  for (const invoer of o.rijen) {
    const regel = typeof invoer === 'object' && invoer !== null ? (invoer as Record<string, unknown>).regel : null
    if (typeof regel !== 'number' || !Number.isInteger(regel) || regel < 2 || gezien.has(regel)) return { ok: false, fout: 'Ongeldige regelnummers.' }
    gezien.add(regel)
    const ruw = ruweRijUit(invoer)
    const uitslag = ruw ? controleerRij(ruw, vandaag) : { ok: false as const, fout: 'Ongeldige rij.' }
    if (uitslag.ok) {
      regels.push({ regel, lid: uitslag.lid })
      waarschuwingen += uitslag.waarschuwingen.length
    } else fouten.push({ regel, fout: uitslag.fout })
  }
  return { ok: true, waarde: { vestiging: o.vestiging, opslaan: o.opslaan === true, regels, fouten, waarschuwingen } }
}

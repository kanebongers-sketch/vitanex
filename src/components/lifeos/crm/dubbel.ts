// ─── Mensen — staat deze naam er al? ────────────────────────────────────────
// PUUR. Voorkomt per ongeluk dubbele kaarten ("Linsey" twee keer in Team Budel):
// het formulier waarschuwt, maar blokkeert niet — twee echte mensen mogen best
// dezelfde naam hebben. Vergelijkt hoofdletter-, witruimte- en accent-ongevoelig.

import type { Persoon } from '@/lib/lifeos/crm/crm'

function sleutel(naam: string): string {
  return naam
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** De bestaande persoon met (vrijwel) dezelfde naam, of `null`. */
export function bestaandeNaamgenoot(naam: string, personen: readonly Persoon[]): Persoon | null {
  const s = sleutel(naam)
  if (!s) return null
  return personen.find((p) => sleutel(p.naam) === s) ?? null
}

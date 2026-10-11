// ─── Taalset voor het gebied "lichaam" ────────────────────────────────────────
// Pure gezondheidsmodules maken zelf tekst. Ze krijgen een taalset mee; zonder
// taalset gebruiken ze Nederlands uit het lichaam-woordenboek, zodat bestaande
// aanroepen en tests niet veranderen.

import lichaamNl from '@/lib/i18n/woordenboeken/lichaam/nl.json'
import { maakTaalset, type Taalset } from '@/lib/i18n/taalset'
import { STANDAARD_TAAL } from '@/lib/i18n/talen'

export const NL_LICHAAM: Taalset = maakTaalset(STANDAARD_TAAL, lichaamNl)

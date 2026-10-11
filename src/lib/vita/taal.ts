// ─── Nederlands voor Vita-teksten buiten React ───────────────────────────────
// De standaard-taalset NL kent alleen de kern van het woordenboek. Vita's
// teksten staan in het eigen gebied 'vita'; deze taalset voegt die erbij, zodat
// pure functies zonder meegegeven taalset gewoon Nederlands blijven geven.

import { BRON_WOORDENBOEK, maakTaalset, type Taalset } from '@/lib/i18n/taalset'
import vitaNl from '@/lib/i18n/woordenboeken/vita/nl.json'

export const NL_VITA: Taalset = maakTaalset('nl', { ...BRON_WOORDENBOEK, ...vitaNl })

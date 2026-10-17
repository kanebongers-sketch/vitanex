// ─── Club: voortgang zoals het lid hem mag zien (PUUR) ──────────────────────
// Gezondheidsgegevens zijn bijzondere persoonsgegevens (AVG). Naar de ledenapp
// gaat alleen wat het lid zelf ziet: lichaamsmaten en trainingen. Geen
// bloeddruk, rusthartslag, notities van de trainer of wie de meting deed.
// Dit filter draait op de server, zodat de rest nooit in de browser komt.

import type { MeetSleutel, MeetWaarden } from './meting'
import type { VoortgangData } from './model'

export const VOOR_LID: readonly MeetSleutel[] = ['gewicht_kg', 'buikomtrek_cm', 'heupomtrek_cm', 'vetpercentage', 'spiermassa_kg'] as readonly MeetSleutel[]

function alleenVoorLid(waarden: MeetWaarden): MeetWaarden {
  return Object.fromEntries(Object.entries(waarden).filter(([sleutel]) => (VOOR_LID as readonly string[]).includes(sleutel))) as MeetWaarden
}

export function voortgangVoorLid(data: VoortgangData): VoortgangData {
  return {
    lidId: data.lidId,
    punten: data.punten
      .map((p) => ({ id: p.id, bron: p.bron, datum: p.datum, waarden: alleenVoorLid(p.waarden) }))
      .filter((p) => Object.keys(p.waarden).length > 0),
    metingen: [],
    trainingen: data.trainingen,
    totaalTrainingen: data.totaalTrainingen,
    fouten: data.fouten,
  }
}

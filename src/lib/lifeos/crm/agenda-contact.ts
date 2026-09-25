// ─── LifeOS — CRM: contact via je agenda ────────────────────────────────────
// PUUR. Een afspraak met iemand ís contact. "Kevin PT" elke week, maar het laatste
// gelógde contact 2 augustus → Kevin stond als "verwaterend". Hier leiden we per
// persoon de laatste VOORBIJE afspraak af, met dezelfde naam-koppeling als overal
// (`matchPersoonInTitel`): alleen een eenduidige match, of een afspraak met meerdere
// verschillende mensen ("Ruben Ken en Dave") telt voor elk van hen. Naamgenoten
// (twee Niecks) tellen voor niemand — geen gok.

import type { Persoon } from './crm'
import { isGroepsafspraak, matchPersoonInTitel } from './agenda-match'

export interface ContactAfspraak {
  titel: string | null
  startOp: Date
}

/** De personen, elk met `laatsteAfspraakOp` (ISO) uit de voorbije afspraken, of null. */
export function metAgendaContact(
  personen: readonly Persoon[],
  afspraken: readonly ContactAfspraak[],
  nu: Date,
): Persoon[] {
  const laatste = new Map<string, number>()
  for (const a of afspraken) {
    const t = a.startOp.getTime()
    if (Number.isNaN(t) || t > nu.getTime()) continue
    const match = matchPersoonInTitel(a.titel, personen)
    const wie =
      match.soort === 'match'
        ? [match.persoon]
        : match.soort === 'ambigu' && isGroepsafspraak(match.kandidaten)
          ? match.kandidaten
          : []
    for (const p of wie) {
      if (t > (laatste.get(p.id) ?? Number.NEGATIVE_INFINITY)) laatste.set(p.id, t)
    }
  }
  return personen.map((p) => {
    const t = laatste.get(p.id)
    return { ...p, laatsteAfspraakOp: t === undefined ? null : new Date(t).toISOString() }
  })
}

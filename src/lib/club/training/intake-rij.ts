// ─── Fit Factory Club, training: een opgeslagen intake lezen (PUUR) ─────────
// Mild: een rij met een onbekend of kapot veld blijft bruikbaar, het veld valt weg.

import { leesAntwoorden, leesBloeddruk, METING_GRENZEN, type Antwoorden, type Metingen } from './intake'
import { isRij, naamUitRelatie, tekstOfNull } from './rijen'

export interface Intake {
  id: string
  lidId: string
  lidNaam: string | null
  medewerkerId: string | null
  datum: string
  antwoorden: Antwoorden | null
  metingen: Metingen
  toestemmingGezondheid: boolean
  notitie: string | null
  /** Wie de intake invulde: de trainer, of het lid zelf in de ledenapp (migratie 480). */
  bron: 'trainer' | 'lid'
}

export const INTAKE_KOLOMMEN =
  'id, lid_id, medewerker_id, datum, antwoorden, metingen, toestemming_gezondheid, notitie, bron, club_leden(voornaam, achternaam)'

function metingenUitRij(ruw: unknown, toestemming: boolean): Metingen {
  // Metingen zijn gezondheidsgegevens: zonder vastgelegde toestemming niet tonen.
  if (!toestemming || !isRij(ruw)) return {}
  const uit: Metingen = {}
  for (const [sleutel, [min, max]] of Object.entries(METING_GRENZEN)) {
    const n = ruw[sleutel]
    if (typeof n !== 'number' || n < min || n > max) continue
    uit[sleutel as keyof typeof METING_GRENZEN] = n
  }
  const bd = leesBloeddruk(ruw.bloeddruk)
  if (bd) uit.bloeddruk = bd
  return uit
}

export function intakeUitRij(rij: unknown): Intake | null {
  if (!isRij(rij)) return null
  const id = tekstOfNull(rij.id)
  const lidId = tekstOfNull(rij.lid_id)
  const datum = tekstOfNull(rij.datum)
  if (!id || !lidId || !datum) return null
  const toestemming = rij.toestemming_gezondheid === true
  const antwoorden = leesAntwoorden(rij.antwoorden, toestemming)
  return {
    id,
    lidId,
    lidNaam: naamUitRelatie(rij.club_leden),
    medewerkerId: tekstOfNull(rij.medewerker_id),
    datum: datum.slice(0, 10),
    antwoorden: antwoorden.ok ? antwoorden.waarde : null,
    metingen: metingenUitRij(rij.metingen, toestemming),
    toestemmingGezondheid: toestemming,
    notitie: tekstOfNull(rij.notitie),
    bron: rij.bron === 'lid' ? 'lid' : 'trainer',
  }
}

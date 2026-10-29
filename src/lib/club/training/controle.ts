// ─── Fit Factory Club, training: controles in de schema-editor (PUUR) ───────
// Twee dingen die de trainer op de vloer tijd kosten: een foutmelding die niet
// zegt welke oefening het is, en een schema dat actief gaat terwijl het lid er
// niets aan heeft (geen oefeningen, of een lege dag).

import { payloadVolgorde, type EditorStaat } from './editor'
import { dagLetter } from './typen'
import type { Taal } from '@/lib/aiyourgym/taal/taal'

const OEFENING_NR = /^Oefening (\d+): ([\s\S]+)$/

/**
 * Een melding van de server ("Oefening 7: sets moet tussen 1 en 20 liggen.")
 * met de dag en de naam erbij: "Dag B, Bankdrukken: sets moet ...".
 * Een andere melding blijft zoals hij is.
 */
export function foutMetNaam(fout: string, s: EditorStaat, naamVan: (oefeningId: string) => string | undefined, taal: Taal = 'nl'): string {
  const m = OEFENING_NR.exec(fout)
  if (!m) return fout
  const regel = payloadVolgorde(s)[Number(m[1]) - 1]
  if (!regel) return fout
  const naam = naamVan(regel.oefeningId) ?? (taal === 'en' ? 'unknown exercise' : 'onbekende oefening')
  return `${taal === 'en' ? 'Day' : 'Dag'} ${dagLetter(regel.dag)}, ${naam}: ${m[2]}`
}

/** Kan dit schema naar het lid? Null als het klopt, anders wat er nog mist. */
export function nietKlaarVoorLid(s: EditorStaat, taal: Taal = 'nl'): string | null {
  const en = taal === 'en'
  if (s.regels.length === 0) return en ? 'Add exercises first. The member does not see an empty programme.' : 'Voeg eerst oefeningen toe. Een leeg schema ziet het lid niet.'
  const leeg = s.dagTitels.map((_, i) => i + 1).filter((dag) => !s.regels.some((r) => r.dag === dag))
  if (leeg.length === 0) return null
  const dagen = leeg.map((d) => dagLetter(d))
  if (en) {
    const lijst = dagen.length === 1 ? `Day ${dagen[0]} has` : `Days ${dagen.slice(0, -1).join(', ')} and ${dagen[dagen.length - 1]} have`
    return `${lijst} no exercises yet. Add one or delete the day.`
  }
  const lijst = dagen.length === 1 ? `Dag ${dagen[0]} heeft` : `Dag ${dagen.slice(0, -1).join(', ')} en ${dagen[dagen.length - 1]} hebben`
  return `${lijst} nog geen oefeningen. Voeg er een toe of verwijder de dag.`
}

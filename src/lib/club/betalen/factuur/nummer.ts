// ─── Club, betalen: factuurnummers per reeks (PUUR) ─────────────────────────
// Elke sportschool heeft een of meer reeksen (bijvoorbeeld facturen en
// creditnota's). Een nummer is uniek en opeenvolgend binnen zijn reeks
// (factuureis Belastingdienst, ONDERZOEK-STRIPE.md par. 6). Het volgnummer zelf
// komt alleen uit de databasefunctie club_betalen_factuur_definitief() met een
// rijslot; dit bestand maakt er alleen tekst van en controleert reeksen.
//
// Vorm: PREFIX-JJJJ-0001 met jaar, of PREFIX-0001 zonder. Prefix 1 tot 12
// hoofdletters of cijfers (zelfde regel als Stripe). Met jaar begint het
// volgnummer elk jaar opnieuw bij 1.

export interface Factuurreeks {
  prefix: string
  /** Jaar in het nummer, en elk jaar opnieuw beginnen bij 1. */
  metJaar: boolean
  /** Minimaal aantal cijfers van het volgnummer (aanvullen met nullen), 1 tot 10. */
  cijfers: number
}

export const STANDAARD_REEKSEN = {
  factuur: { prefix: 'F', metJaar: true, cijfers: 5 },
  creditnota: { prefix: 'C', metJaar: true, cijfers: 5 },
} as const satisfies Record<string, Factuurreeks>

const PREFIX = /^[A-Z0-9]{1,12}$/

/** Controleer een reeks; null = in orde, anders een melding. */
export function controleerReeks(r: Factuurreeks): string | null {
  if (!PREFIX.test(r.prefix)) return 'Het voorvoegsel moet 1 tot 12 hoofdletters of cijfers zijn.'
  if (!Number.isSafeInteger(r.cijfers) || r.cijfers < 1 || r.cijfers > 10) return 'Het aantal cijfers moet tussen 1 en 10 liggen.'
  return null
}

/** Maak de tekst van een factuurnummer. */
export function factuurnummer(r: Factuurreeks, volgnummer: number, jaar: number): string {
  const fout = controleerReeks(r)
  if (fout) throw new RangeError(fout)
  if (!Number.isSafeInteger(volgnummer) || volgnummer < 1) throw new RangeError(`Volgnummer moet 1 of meer zijn: ${String(volgnummer)}`)
  if (r.metJaar && (!Number.isSafeInteger(jaar) || jaar < 1000 || jaar > 9999)) throw new RangeError(`Ongeldig jaar: ${String(jaar)}`)
  const nr = String(volgnummer).padStart(r.cijfers, '0')
  return r.metJaar ? `${r.prefix}-${jaar}-${nr}` : `${r.prefix}-${nr}`
}

export interface GelezenNummer {
  prefix: string
  jaar: number | null
  volgnummer: number
}

const MET_JAAR = /^([A-Z0-9]{1,12})-(\d{4})-(\d{1,16})$/
const ZONDER_JAAR = /^([A-Z0-9]{1,12})-(\d{1,16})$/

/** Lees een nummer terug volgens de reeks. Null als het niet bij de reeks past. */
export function leesFactuurnummer(r: Factuurreeks, tekst: string): GelezenNummer | null {
  const m = (r.metJaar ? MET_JAAR : ZONDER_JAAR).exec(tekst)
  if (!m || m[1] !== r.prefix) return null
  const volgTekst = r.metJaar ? m[3] : m[2]
  const volgnummer = Number(volgTekst)
  if (!Number.isSafeInteger(volgnummer) || volgnummer < 1 || volgTekst.length < r.cijfers) return null
  if (volgTekst.length > r.cijfers && volgTekst.startsWith('0')) return null
  return { prefix: m[1], jaar: r.metJaar ? Number(m[2]) : null, volgnummer }
}

/** Het volgende volgnummer na het laatst uitgegeven (null = nog niets uitgegeven). Bij een nieuw jaar weer 1. */
export function volgendVolgnummer(r: Factuurreeks, laatste: { volgnummer: number; jaar: number } | null, jaar: number): number {
  if (laatste === null) return 1
  if (r.metJaar && laatste.jaar !== jaar) {
    if (jaar < laatste.jaar) throw new RangeError('Het jaar kan niet terug in de tijd')
    return 1
  }
  return laatste.volgnummer + 1
}

/** Ontbrekende en dubbele volgnummers in een reeks (voor de dagelijkse controle). */
export function controleerVolgnummers(volgnummers: readonly number[]): { gaten: number[]; dubbel: number[] } {
  const gesorteerd = [...volgnummers].sort((a, b) => a - b)
  const gaten: number[] = []
  const dubbel: number[] = []
  let verwacht = 1
  for (const n of gesorteerd) {
    if (n < verwacht) {
      if (dubbel[dubbel.length - 1] !== n) dubbel.push(n)
      continue
    }
    for (let g = verwacht; g < n; g++) gaten.push(g)
    verwacht = n + 1
  }
  return { gaten, dubbel }
}

// ─── Club, intakevragen: antwoorden op eigen vragen (PUUR) ──────────────────
// Antwoorden op eigen vragen gaan mee in club_intakes.antwoorden.eigen, met een
// kopie van de vraag erbij. Zo blijft een oude intake leesbaar, ook als de
// sportschool de vraag later wijzigt, uitzet of verwijdert.
//
// AVG: een gezondheidsvraag zonder toestemming van het lid wordt geweigerd.

import {
  MAX_GETAL, MAX_KORT_ANTWOORD, MAX_LANG_ANTWOORD, MAX_SECTIE, MAX_VRAAG, isEigen, isVraagSoort,
  type IntakeVraag, type VraagSoort,
} from './soorten'

export type EigenWaarde = string | string[] | boolean | number

export interface EigenAntwoord {
  vraagId: string
  vraag: string
  sectie: string
  soort: VraagSoort
  gezondheid: boolean
  waarde: EigenWaarde
}

export type Uitslag<T> = { ok: true; waarde: T } | { ok: false; fout: string }

export const GEEN_TOESTEMMING = 'Antwoorden op gezondheidsvragen bewaren mag alleen met toestemming van het lid.'

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Niets ingevuld: undefined, null, lege tekst of een lege lijst. */
export function isLeeg(v: unknown): boolean {
  if (v === undefined || v === null) return true
  if (typeof v === 'string') return v.trim() === ''
  if (Array.isArray(v)) return v.length === 0
  return false
}

function leesGetal(v: unknown): number | null {
  const n = typeof v === 'string' ? Number(v.trim().replace(',', '.')) : v
  return typeof n === 'number' && Number.isFinite(n) ? n : null
}

/** Een ingevuld antwoord tegen de soort van de vraag, of null als het niet klopt. */
export function leesWaarde(v: IntakeVraag, ruw: unknown): EigenWaarde | null {
  switch (v.soort) {
    case 'kort':
    case 'lang': {
      if (typeof ruw !== 'string') return null
      const max = v.soort === 'kort' ? MAX_KORT_ANTWOORD : MAX_LANG_ANTWOORD
      return ruw.trim().slice(0, max)
    }
    case 'keuze':
      return typeof ruw === 'string' && v.opties.includes(ruw) ? ruw : null
    case 'meerkeuze': {
      if (!Array.isArray(ruw) || !ruw.every((x) => typeof x === 'string' && v.opties.includes(x))) return null
      return v.opties.filter((o) => ruw.includes(o))
    }
    case 'ja_nee':
      return typeof ruw === 'boolean' ? ruw : null
    case 'schaal_1_10': {
      const n = leesGetal(ruw)
      return n !== null && Number.isInteger(n) && n >= 1 && n <= 10 ? n : null
    }
    case 'getal': {
      const n = leesGetal(ruw)
      return n !== null && Math.abs(n) <= MAX_GETAL ? Math.round(n * 100) / 100 : null
    }
  }
}

function foutVoor(v: IntakeVraag): string {
  if (v.soort === 'getal') return `"${v.vraag}": vul een getal in tot ${MAX_GETAL.toLocaleString('nl-NL')}.`
  if (v.soort === 'schaal_1_10') return `"${v.vraag}": kies een cijfer van 1 tot 10.`
  if (v.soort === 'keuze' || v.soort === 'meerkeuze') return `"${v.vraag}": kies uit de opties.`
  return `Het antwoord op "${v.vraag}" is ongeldig.`
}

/**
 * Streng, bij opslaan: de antwoorden (per vraag-id) tegen de actieve eigen
 * vragen van de sportschool. Verplicht, typen en toestemming worden
 * gecontroleerd; antwoorden op onbekende of uitgezette vragen vallen weg.
 */
export function leesEigenAntwoorden(ruw: unknown, vragen: readonly IntakeVraag[], toestemming: boolean): Uitslag<EigenAntwoord[]> {
  if (ruw !== undefined && ruw !== null && !isObject(ruw)) return { ok: false, fout: 'De antwoorden op de eigen vragen zijn ongeldig.' }
  const invoer = isObject(ruw) ? ruw : {}
  const uit: EigenAntwoord[] = []
  for (const v of vragen) {
    if (!v.actief || !isEigen(v)) continue
    const antwoord = invoer[v.id]
    if (isLeeg(antwoord)) {
      if (v.verplicht && (!v.gezondheid || toestemming)) return { ok: false, fout: `Vul "${v.vraag}" in.` }
      continue
    }
    if (v.gezondheid && !toestemming) return { ok: false, fout: GEEN_TOESTEMMING }
    const waarde = leesWaarde(v, antwoord)
    if (waarde === null) return { ok: false, fout: foutVoor(v) }
    if (isLeeg(waarde)) continue
    uit.push({ vraagId: v.id, vraag: v.vraag, sectie: v.sectie, soort: v.soort, gezondheid: v.gezondheid, waarde })
  }
  return { ok: true, waarde: uit }
}

function isWaarde(v: unknown): v is EigenWaarde {
  return typeof v === 'string' || typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v)) || (Array.isArray(v) && v.every((x) => typeof x === 'string'))
}

/**
 * Mild, bij lezen uit de database: kapotte regels vallen weg, en zonder
 * toestemming tonen we nooit een gezondheidsantwoord.
 */
export function eigenUitOpslag(ruw: unknown, toestemming: boolean): EigenAntwoord[] {
  if (!Array.isArray(ruw)) return []
  return ruw.flatMap((r): EigenAntwoord[] => {
    if (!isObject(r) || typeof r.vraagId !== 'string' || typeof r.vraag !== 'string' || !isVraagSoort(r.soort) || !isWaarde(r.waarde)) return []
    const gezondheid = r.gezondheid === true
    if (gezondheid && !toestemming) return []
    const sectie = typeof r.sectie === 'string' && r.sectie.trim() ? r.sectie.slice(0, MAX_SECTIE) : 'Overig'
    return [{ vraagId: r.vraagId, vraag: r.vraag.slice(0, MAX_VRAAG), sectie, soort: r.soort, gezondheid, waarde: r.waarde }]
  })
}

/** Een antwoord als leesbare tekst. */
export function toonWaarde(soort: VraagSoort, w: EigenWaarde, taal: 'nl' | 'en' = 'nl'): string {
  const en = taal === 'en'
  if (typeof w === 'boolean') return w ? (en ? 'Yes' : 'Ja') : en ? 'No' : 'Nee'
  if (Array.isArray(w)) return w.join(', ')
  if (typeof w === 'number') return soort === 'schaal_1_10' ? `${w} ${en ? 'out of' : 'van'} 10` : w.toLocaleString(en ? 'en-GB' : 'nl-NL')
  return w
}

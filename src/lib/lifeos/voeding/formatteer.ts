// ─── LifeOS — voeding in leesbare taal ──────────────────────────────────────
// Puur bestand: geen React. Zo is de opmaak testbaar zonder de kaart te
// renderen.
//
// De regel die deze module draagt (overgenomen uit herstel/formatteer.ts):
// `null` in → `null` uit. Nooit '0', nooit '—' als returnwaarde, want dan kan
// de kaart niet meer zien of er iets gelogd is. Wát er getoond wordt als er
// niets is, beslist de UI — niet de formatter.
//
// En de regel die deze module afdwingt: een onvolledig totaal komt hier NOOIT
// zonder zijn dekkingszin naar buiten. Zie `macroTekst`.

// `getalTekst` is neutraal gedeeld (lib/format): NL-notatie, en null blijft null.
import { getalTekst } from '@/lib/lifeos/format/getal'
import { isOnvolledig, type Totaal } from './totalen'
import type { Moment } from './voeding'

const MOMENT_LABELS: Record<Moment, string> = {
  ontbijt: 'Ontbijt',
  lunch: 'Lunch',
  diner: 'Diner',
  snack: 'Snack',
}

export function momentLabel(moment: Moment): string {
  return MOMENT_LABELS[moment]
}

/** 1500 → '1,5 l' · 750 → '750 ml'. Null blijft null. */
export function waterTekst(ml: number | null): string | null {
  if (ml === null || !Number.isFinite(ml) || ml < 0) return null
  if (ml < 1000) return `${Math.round(ml)} ml`
  const liters = getalTekst(ml / 1000, 1)
  return liters === null ? null : `${liters} l`
}

/**
 * De dekkingszin bij een totaal, of `null` als er niets bij te melden valt.
 *
 * DIT IS HET ANTWOORD op de onvolledige-macro-vraag, in één zin. Er zijn drie
 * gevallen en ze zijn alle drie anders:
 *
 *   niets gemeten (0 van 3)  → null; de UI toont sowieso geen getal
 *   alles gemeten (3 van 3)  → null; het getal staat er zonder voorbehoud
 *   deels gemeten (1 van 3)  → 'uit 1 van 3 maaltijden'
 *
 * Alleen in het derde geval is er iets te zeggen — en dan moet het er ook
 * echt staan, want anders leest '42g' als een dagtotaal.
 */
export function dekkingTekst(t: Totaal): string | null {
  if (!isOnvolledig(t)) return null
  const woord = t.vanTotaal === 1 ? 'maaltijd' : 'maaltijden'
  return `uit ${t.gemeten} van ${t.vanTotaal} ${woord}`
}

/**
 * Een macro-totaal als tekst, mét zijn dekking. Null als er niets gemeten is.
 *
 * Bewust één functie die beide teruggeeft in plaats van twee losse: zo kan een
 * aanroeper het getal niet ophalen en de dekking "even later" vergeten. Het
 * type dwingt af dat je allebei in handen krijgt.
 */
export interface MacroTekst {
  /** '42 g' — de som van wat je invulde. Altijd een echt getal, nooit geschat. */
  waarde: string
  /** 'uit 1 van 3 maaltijden', of null als het totaal de hele dag dekt. */
  dekking: string | null
}

export function macroTekst(t: Totaal, eenheid: string, decimalen = 0): MacroTekst | null {
  const waarde = getalTekst(t.waarde, decimalen)
  if (waarde === null) return null
  return { waarde: `${waarde} ${eenheid}`, dekking: dekkingTekst(t) }
}

/**
 * De samenvattende zin onder de macrokaart.
 *
 * Beschrijft alleen wat er is — geen advies, geen oordeel. LifeOS is geen
 * diëtist en Kane is geen patiënt: "je eet te weinig eiwit" komt hier nooit
 * uit, hoe verleidelijk het ook is. Cijfers tonen, niet vinden.
 */
export function dagSamenvatting(logs: number): string {
  if (logs === 0) return 'Nog niets gelogd vandaag.'
  if (logs === 1) return '1 ding gelogd vandaag.'
  return `${logs} dingen gelogd vandaag.`
}

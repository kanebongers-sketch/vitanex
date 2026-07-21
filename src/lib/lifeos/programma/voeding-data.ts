import type { BoodschapItem, Macros, Maaltijd, VoedingDag, VoedingItem } from './types'

// Voedingsschema — 7 dagen. Bron: Kane's Excel, sheet "Voeding".
//
// Geverifieerd tegen de bron: per dag sommeren de vier maaltijd-totalen exact op
// het "Streef totaal" (2606–2621 kcal, dicht bij het macro-doel van 2600). De
// item-macro's binnen een maaltijd sommeren meestal exact op het maaltijd-totaal;
// waar eiwit/vet in de bron afwijken houden we de bron-totalen aan (zie types.ts).
//
// Dagen delen maaltijden (1≡2, 4≡5, 6≡7), dus we bouwen de maaltijden één keer
// en stellen de dagen samen. Alle waarden komen letterlijk uit de sheet.

/** Het door de coach gestelde macro-doel (bron: rij "Macro's"). */
export const MACRO_DOEL: Macros = { kcal: 2600, eiwit: 200, kh: 315, vet: 60 }

/* ── constructie-suikers (puur, geen mutatie) ── */
function item(
  voedingsmiddel: string,
  aantal: number | null,
  eenheid: string | null,
  kcal: number,
  eiwit: number,
  kh: number,
  vet: number,
): VoedingItem {
  return { voedingsmiddel, aantal, eenheid, kcal, eiwit, kh, vet }
}

function maaltijd(naam: string, items: VoedingItem[], totaal: Macros): Maaltijd {
  return { naam, items, totaal }
}

const SNACK = 'Tussendoortjes (pre/post workout)'

/* ── Ontbijt-varianten ── */
const ontbijtBrood = maaltijd('Ontbijt', [
  item('Volkoren boterham', 4, 'stuk', 328, 15.5, 54.6, 3.2),
  item('Ei M', 4, 'stuk', 274, 24.6, 3.0, 18.2),
  item('Kalkoenfilet', 100, 'gram', 106, 21.0, 0.5, 2.2),
  item('Cashewnoten', 20, 'gram', 124, 4.1, 3.5, 10.1),
], { kcal: 832, eiwit: 65.2, kh: 61.6, vet: 33.7 })

const ontbijtBroodKaas = maaltijd('Ontbijt', [
  item('Volkoren boterham', 4, 'stuk', 328, 15.5, 54.6, 3.2),
  item('Kalkoenfilet', 100, 'gram', 106, 21.0, 0.5, 2.2),
  item('Jong belegen kaas 30+', 2, 'stuk', 181, 19.4, 0.0, 11.0),
  item('Cashewnoten', 20, 'gram', 124, 4.1, 3.5, 10.1),
], { kcal: 739, eiwit: 60, kh: 58.6, vet: 26.5 })

const ontbijtRice = maaltijd('Ontbijt', [
  item('Cream of rice', 50, 'gram', 172, 3.2, 39.0, 0.4),
  item('Whey', 60, 'gram', 216, 43.8, 4.4, 2.0),
  item('Blauwe besjes', 150, 'gram', 78, 1.0, 16.5, 0.0),
  item('Pure chocolade 85%', 25, 'gram', 147, 2.3, 5.5, 12.3),
], { kcal: 613, eiwit: 50.3, kh: 65.4, vet: 14.7 })

const ontbijtHaver = maaltijd('Ontbijt', [
  item('Havermout', 100, 'gram', 376, 11.9, 62.4, 7.2),
  item('Half volle melk', 300, 'gram', 138, 10.2, 14.1, 4.5),
  item('Whey protein', 30, 'gram', 118, 24.3, 2.9, 1.3),
  item('Pure chocolade 85%', 25, 'gram', 147, 2.3, 5.5, 12.3),
], { kcal: 779, eiwit: 48.7, kh: 84.9, vet: 25.3 })

/* ── Lunch-varianten ── */
const lunchBrood = maaltijd('Lunch', [
  item('Volkoren boterham', 4, 'stuk', 328, 15.5, 54.6, 3.2),
  item('Kalkoenfilet', 100, 'gram', 106, 21.0, 0.5, 2.2),
  item('Jong belegen kaas 30+', 2, 'stuk', 181, 19.4, 0.0, 11.0),
], { kcal: 615, eiwit: 40.4, kh: 55.1, vet: 13.2 })

const lunchBroodPlus = maaltijd('Lunch', [
  item('Volkoren boterham', 4, 'stuk', 328, 15.5, 54.6, 3.2),
  item('Kalkoenfilet', 150, 'gram', 169, 29.6, 4.6, 3.6),
  item('Jong belegen kaas 30+', 2, 'stuk', 181, 19.4, 0.0, 11.0),
], { kcal: 678, eiwit: 49, kh: 59.2, vet: 14.6 })

const lunchEiMango = maaltijd('Lunch', [
  item('Volkoren boterham', 4, 'stuk', 328, 15.5, 54.6, 3.2),
  item('Ei M', 2, 'stuk', 137, 12.3, 1.5, 9.1),
  item('Kalkoenfilet', 150, 'gram', 169, 29.6, 4.6, 3.6),
  item('Mango', 200, 'gram', 130, 1.2, 28.6, 0.4),
], { kcal: 764, eiwit: 43.1, kh: 89.3, vet: 13.1 })

/* ── Avondeten-varianten ── */
const avondKip = maaltijd('Avondeten', [
  item('Basmati rijst', 100, 'gram', 355, 8.8, 78.0, 0.5),
  item('Kipfilet', 150, 'gram', 165, 34.9, 0.0, 2.7),
  item('Chinese wokgroente', 200, 'gram', 64, 4.0, 8.0, 0.4),
  item('Olijfolie', 10, 'gram', 82, 0.0, 0.0, 9.1),
], { kcal: 666, eiwit: 47.7, kh: 86, vet: 12.7 })

const avondPasta = maaltijd('Avondeten', [
  item('Volkorenpasta', 150, 'gram', 528, 18.0, 97.6, 3.7),
  item('Italiaanse wokgroente', 200, 'gram', 60, 3.8, 7.0, 0.8),
  item('Mager rundergehakt', 150, 'gram', 273, 30.0, 0.5, 16.7),
  item('Olijfolie', 10, 'gram', 82, 0.0, 0.0, 9.1),
], { kcal: 943, eiwit: 51.8, kh: 105.1, vet: 30.3 })

const avondBroccoli = maaltijd('Avondeten', [
  item('Basmati rijst', 100, 'gram', 355, 8.8, 78.0, 0.5),
  item('Broccoli', 300, 'gram', 81, 11.7, 2.4, 0.9),
  item('Kipfilet', 150, 'gram', 165, 34.9, 0.0, 2.7),
  item('Olijfolie', 10, 'gram', 82, 0.0, 0.0, 9.1),
], { kcal: 683, eiwit: 55.4, kh: 80.4, vet: 13.2 })

/* ── Tussendoortjes-varianten ── */
const snackKwarkMango = maaltijd(SNACK, [
  item('Magere kwark', 500, 'gram', 265, 40.5, 24.5, 2.5),
  item('Mango', 350, 'gram', 228, 2.1, 50.1, 0.7),
], { kcal: 493, eiwit: 42.6, kh: 74.6, vet: 3.2 })

const snackRijk = maaltijd(SNACK, [
  item('Magere kwark', 500, 'gram', 265, 40.5, 24.5, 2.5),
  item('Honing', 15, 'gram', 48, 0.1, 12.0, 0.0),
  item('Blauwe bessen', 200, 'gram', 104, 1.4, 22.0, 0.0),
  item('Cottage cheese', 200, 'gram', 184, 26.0, 2.0, 8.0),
], { kcal: 601, eiwit: 68, kh: 60.5, vet: 10.5 })

const snackBosvruchten = maaltijd(SNACK, [
  item('Magere kwark', 500, 'gram', 265, 40.5, 24.5, 2.5),
  item('Bosvruchten mix', 200, 'gram', 110, 2.4, 13.2, 0.8),
], { kcal: 375, eiwit: 42.9, kh: 37.7, vet: 3.3 })

const snackCashew = maaltijd(SNACK, [
  item('Magere kwark', 500, 'gram', 265, 40.5, 24.5, 2.5),
  item('Cashewnoten', 20, 'gram', 124, 4.1, 3.5, 10.1),
], { kcal: 389, eiwit: 44.6, kh: 28, vet: 12.6 })

/* ── De 7 dagen ── */
const streef127 = { kcal: 2606, eiwit: 195.9, kh: 277.3, vet: 62.8 }
const streef3 = { kcal: 2621, eiwit: 216.1, kh: 260.2, vet: 62.9 }
const streef45 = { kcal: 2609, eiwit: 194, kh: 267.4, vet: 62.9 }
const streef67 = { kcal: 2615, eiwit: 191.8, kh: 282.6, vet: 64.2 }

export const VOEDING: VoedingDag[] = [
  { dag: 'Dag 1', maaltijden: [ontbijtBrood, lunchBrood, avondKip, snackKwarkMango], streefTotaal: streef127 },
  { dag: 'Dag 2', maaltijden: [ontbijtBrood, lunchBrood, avondKip, snackKwarkMango], streefTotaal: streef127 },
  { dag: 'Dag 3', maaltijden: [ontbijtBroodKaas, lunchBrood, avondKip, snackRijk], streefTotaal: streef3 },
  { dag: 'Dag 4', maaltijden: [ontbijtRice, lunchBroodPlus, avondPasta, snackBosvruchten], streefTotaal: streef45 },
  { dag: 'Dag 5', maaltijden: [ontbijtRice, lunchBroodPlus, avondPasta, snackBosvruchten], streefTotaal: streef45 },
  { dag: 'Dag 6', maaltijden: [ontbijtHaver, lunchEiMango, avondBroccoli, snackCashew], streefTotaal: streef67 },
  { dag: 'Dag 7', maaltijden: [ontbijtHaver, lunchEiMango, avondBroccoli, snackCashew], streefTotaal: streef67 },
]

/* ── Weekboodschappenlijst (bron: kolom "Voedingsmiddel/Hoeveelheid/Eenheid") ── */
export const BOODSCHAPPEN: BoodschapItem[] = [
  { voedingsmiddel: 'Kipfilet', hoeveelheid: '750', eenheid: 'gram' },
  { voedingsmiddel: 'Chinese wokgroente', hoeveelheid: '600', eenheid: 'gram' },
  { voedingsmiddel: 'Volkoren boterham', hoeveelheid: '40', eenheid: 'stuk' },
  { voedingsmiddel: 'Kalkoenfilet', hoeveelheid: '1200', eenheid: 'gram' },
  { voedingsmiddel: 'Jong belegen kaas 30+', hoeveelheid: '12', eenheid: 'stuk' },
  { voedingsmiddel: 'Bosvruchten mix', hoeveelheid: '400', eenheid: 'gram' },
  { voedingsmiddel: 'Mango', hoeveelheid: '1100', eenheid: 'gram' },
  { voedingsmiddel: 'Ei M', hoeveelheid: '8', eenheid: 'stuk' },
  { voedingsmiddel: 'Magere kwark', hoeveelheid: '3500', eenheid: 'gram' },
  { voedingsmiddel: 'Cashewnoten', hoeveelheid: '100', eenheid: 'gram' },
  { voedingsmiddel: 'Basmati rijst', hoeveelheid: '500', eenheid: 'gram' },
  { voedingsmiddel: 'Banaan M', hoeveelheid: null, eenheid: 'stuk' },
  { voedingsmiddel: 'Blauwe bessen', hoeveelheid: '200', eenheid: 'gram' },
  { voedingsmiddel: 'Havermout', hoeveelheid: '200', eenheid: 'gram' },
  { voedingsmiddel: 'Half volle melk', hoeveelheid: '600', eenheid: 'gram' },
  { voedingsmiddel: 'Whey protein', hoeveelheid: '60', eenheid: 'gram' },
  { voedingsmiddel: 'Cottage cheese', hoeveelheid: '200', eenheid: 'gram' },
  { voedingsmiddel: 'Mandarijnen', hoeveelheid: null, eenheid: 'gram' },
  { voedingsmiddel: 'Pure chocolade 85%', hoeveelheid: '100', eenheid: 'gram' },
  { voedingsmiddel: 'Mexicaanse roerbak', hoeveelheid: null, eenheid: 'gram' },
  { voedingsmiddel: 'Kiwi', hoeveelheid: null, eenheid: 'gram' },
  { voedingsmiddel: 'Broccoli', hoeveelheid: '600', eenheid: 'gram' },
  { voedingsmiddel: 'Ananas', hoeveelheid: null, eenheid: 'gram' },
  { voedingsmiddel: 'Cream of rice', hoeveelheid: '100', eenheid: 'gram' },
  { voedingsmiddel: 'Honing', hoeveelheid: '15', eenheid: 'gram' },
]

/** Kane's eigen notities onderaan het voedingsschema — letterlijk overgenomen. */
export const VOEDING_TIPS: string[] = [
  'Zaken als spinazie, broccoli, blauwe bessen, zomerfruit en aardbeien uit het vriesvak halen. Stukken goedkoper, langer houdbaar en dezelfde vitaminen & mineralen.',
  'Kwark altijd met rood of zomerfruit combineren. Staat er andere groente bij, dan is dat om apart te eten — sommige combinaties kunnen niet met zuivel.',
  'Eieren zijn ongekookt afgewogen; per stuk klopt het ongeveer. Staat er meer groente bij, maak er dan een boerenomelet van.',
  'Rijst, pasta en dergelijke ongekookt afwegen.',
]

// ─── Club, betalen: btw-tarieven (REGELBESTAND) ─────────────────────────────
// De enige plek met btw-percentages voor ledengeld. Bron:
// docs/aiyourgym/betalen/ONDERZOEK-STRIPE.md, paragraaf 6 "Btw voor sport".
// Dit is geen fiscaal advies: de sportschool kiest zelf het tarief per plan of
// product, wij doen alleen een voorstel. Laat de keuze toetsen door een fiscalist.
// Wijzigt een tarief bij wet, voeg dan een nieuwe sleutel toe en laat de oude
// staan: bevroren facturen houden hun eigen percentage.

export interface BtwTariefRegel {
  /** Percentage als geheel getal (9 betekent 9 procent). */
  procent: number
  label: string
  /** Waarvoor dit tarief het voorstel is. */
  voorstelVoor: string
  bron: string
  /** true zolang de waarde niet op een primaire bron is gecontroleerd. */
  check: boolean
}

export const BTW_REGELS = {
  laag: {
    procent: 9,
    label: 'Btw 9%',
    voorstelVoor: 'Lidmaatschap met gebruik van de sportaccommodatie (fitness, groepslessen in de zaal)',
    // [CHECK] Verhoging naar 21% per 1-1-2026 is volgens SRA (juni 2025) en de
    // Miljoenennota 2026 niet doorgegaan. Niet op belastingdienst.nl zelf
    // gecontroleerd (de pagina gaf een 404).
    bron: 'Wet OB tabel I (sportaccommodatie); SRA 06-2025 "definitief geen verhoging btw op sport"',
    check: true,
  },
  hoog: {
    procent: 21,
    label: 'Btw 21%',
    voorstelVoor: 'Personal training of begeleiding zonder accommodatie, producten en kleding',
    // [CHECK] PT zonder accommodatie valt volgens Europese rechtspraak buiten 9%;
    // per opzet laten toetsen.
    bron: 'Algemeen tarief Wet OB; ONDERZOEK-STRIPE.md par. 6',
    check: true,
  },
  vrijgesteld: {
    procent: 0,
    label: 'Vrijgesteld van btw',
    voorstelVoor: 'Sportvereniging zonder winstoogmerk die vrijgesteld is',
    // [CHECK] Of een vereniging vrijgesteld is, hangt af van haar situatie.
    bron: 'Art. 11 Wet OB (sportvrijstelling); ONDERZOEK-STRIPE.md par. 6',
    check: true,
  },
} as const satisfies Record<string, BtwTariefRegel>

export type BtwSleutel = keyof typeof BTW_REGELS
export type BtwProcent = (typeof BTW_REGELS)[BtwSleutel]['procent']

export const BTW_SLEUTELS = Object.keys(BTW_REGELS) as BtwSleutel[]

/** Het percentage van een sleutel. */
export function btwProcentVan(sleutel: BtwSleutel): BtwProcent {
  return BTW_REGELS[sleutel].procent
}

/** Is dit een tarief dat in het regelbestand staat? */
export function isBekendBtwProcent(p: unknown): p is BtwProcent {
  return typeof p === 'number' && BTW_SLEUTELS.some((s) => BTW_REGELS[s].procent === p)
}

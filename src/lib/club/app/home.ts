// ─── Club, ledenapp: wat er op Home staat (PUUR) ────────────────────────────
// EENVOUD-10-MINUTEN.md, hoofdstuk 5 (03-11-2026): bij de deur is inchecken de
// enige taak. Home is daarom vast: QR bovenaan, de volgende les, deze week
// (ring en reeks in een blok), hoogstens een kaart "te doen", en het nieuwste
// bericht. Kopen staat op Profiel. Deze functie kiest die ene kaart, in een
// vaste volgorde: intake invullen, sluiting binnenkort, de eerste-keer-uitleg
// (tot het lid hem wegklikt) en als laatste de vraag om meldingen aan te zetten.

export const TE_DOEN_VOLGORDE = ['intake', 'sluiting', 'uitleg', 'meldingen'] as const
export type TeDoen = (typeof TE_DOEN_VOLGORDE)[number]

/** Wat er voor dit lid open staat; elke waarde komt van een echte bron. */
export interface HomeStand {
  /** Nog geen intake en het pakket Training en coaching is afgenomen. */
  intakeOpen: boolean
  /** De vestiging is vandaag of de komende dagen dicht of anders open. */
  sluitingBinnenkort: boolean
  /** De eerste-keer-kaarten zijn nog niet weggeklikt (per account) en er is er minstens een. */
  uitlegOpen: boolean
  /** Push kan bij deze sportschool en het lid heeft al eens geboekt (zachte vraag). */
  meldingenVragen: boolean
}

const OPEN: Readonly<Record<TeDoen, (s: HomeStand) => boolean>> = {
  intake: (s) => s.intakeOpen,
  sluiting: (s) => s.sluitingBinnenkort,
  uitleg: (s) => s.uitlegOpen,
  meldingen: (s) => s.meldingenVragen,
}

/** De ene kaart "te doen" op Home, of null als er niets open staat. */
export function homeVolgorde(stand: HomeStand): TeDoen | null {
  return TE_DOEN_VOLGORDE.find((k) => OPEN[k](stand)) ?? null
}

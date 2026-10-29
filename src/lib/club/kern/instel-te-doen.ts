// ─── Club: "Nog te doen" bovenaan het instellingencentrum (PUUR) ────────────
// Besluit Kane (29-10-2026): alleen als er echt iets openstaat een kort blok
// met hoogstens drie grote acties en een voortgangsbalk. Alleen de basis telt:
// zonder vestiging, logo, webadres of bedrijfsgegevens is een sportschool niet
// af. De pagina geeft alleen de punten door die deze persoon mag en kan doen.

/** De punten die tellen, in volgorde van belang. */
export const TE_DOEN_IDS = ['vestigingen', 'huisstijl', 'adres', 'bedrijf'] as const

export type TeDoenId = (typeof TE_DOEN_IDS)[number]

export const MAX_TE_DOEN = 3

export interface TeDoenPunt {
  id: TeDoenId
  klaar: boolean
}

export interface TeDoenOverzicht {
  /** De open punten, hoogstens MAX_TE_DOEN, in volgorde van belang. */
  open: TeDoenId[]
  klaar: number
  totaal: number
}

export function isTeDoenId(id: string): id is TeDoenId {
  return (TE_DOEN_IDS as readonly string[]).includes(id)
}

/** Het blok Nog te doen, of null als alles klaar is (dan staat er geen blok). */
export function teDoenOverzicht(punten: readonly TeDoenPunt[]): TeDoenOverzicht | null {
  const geldig = TE_DOEN_IDS.flatMap((id) => punten.filter((p) => p.id === id).slice(0, 1))
  const open = geldig.filter((p) => !p.klaar).map((p) => p.id)
  if (open.length === 0) return null
  return { open: open.slice(0, MAX_TE_DOEN), klaar: geldig.length - open.length, totaal: geldig.length }
}

// ─── Club, ledenkaart: lessen om voor het lid te boeken (PUUR) ──────────────
// Uit het rooster van de vestiging van het lid: de lessen die nog komen, niet
// geannuleerd zijn en waar het lid nog niet in staat. Alleen gewone data: dit
// gaat van de server naar de client.

export const BOEK_DAGEN = 14
export const MAX_BOEKBAAR = 40

export interface LesVoorBoeken {
  id: string
  naam: string
  startOp: string
  eindOp: string
  capaciteit: number
  geboekt: number
  instructeur: string | null
  vol: boolean
}

interface LesInvoer {
  id: string
  startOp: string
  eindOp: string
  capaciteit: number
  geannuleerd: boolean
  geboekt: number
  lestype: { naam: string } | null
  instructeur: { naam: string } | null
}

/** De lessen die de balie voor dit lid kan boeken, vroegste eerst. */
export function boekbareLessen(lessen: readonly LesInvoer[], alGeboekt: ReadonlySet<string>, nu: Date, max = MAX_BOEKBAAR): LesVoorBoeken[] {
  return lessen
    .filter((l) => !l.geannuleerd && !alGeboekt.has(l.id) && new Date(l.startOp).getTime() > nu.getTime())
    .sort((a, b) => a.startOp.localeCompare(b.startOp))
    .slice(0, max)
    .map((l) => ({
      id: l.id,
      naam: l.lestype?.naam ?? '',
      startOp: l.startOp,
      eindOp: l.eindOp,
      capaciteit: l.capaciteit,
      geboekt: l.geboekt,
      instructeur: l.instructeur?.naam ?? null,
      vol: l.capaciteit > 0 && l.geboekt >= l.capaciteit,
    }))
}

/** Statussen waarmee een lid nog in een les staat (dan staat hij niet bij de boekbare lessen). */
export const STAAT_IN_LES: readonly string[] = ['geboekt', 'wachtlijst', 'aanwezig']

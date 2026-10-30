// ─── Club: "Aan de slag" in de kop (PUUR) ───────────────────────────────────
// Idee geleend van HubFit (besluit Kane 30-10-2026), op onze manier: voor een
// nieuwe sportschool een compacte voortgang in de kop ("4 van 8") met een link
// naar de volgende stap. Geen nieuwe lijst: de stappen zijn de stappen van de
// startwizard (start/stappen.ts, met dezelfde regels voor af) plus de punten
// van "Nog te doen" in het instellingencentrum (kern/instel-te-doen.ts) die de
// wizard niet al dekt. Alleen voor eigenaar en clubmanager, alleen zolang er
// iets open staat, en weg te klikken (AanDeSlag.tsx).

import type { StapSleutel, StapStand } from '@/lib/club/start/stappen'
import type { TeDoenId, TeDoenPunt } from '@/lib/club/kern/instel-te-doen'

/** Welke stap van de wizard een punt van Nog te doen al dekt (null: een eigen stap). */
export const TE_DOEN_IN_WIZARD: Readonly<Record<TeDoenId, StapSleutel | null>> = {
  vestigingen: 'vestigingen',
  huisstijl: 'huisstijl',
  adres: 'huisstijl',
  bedrijf: null,
}

export interface AanDeSlagStap {
  id: string
  titel: string
  af: boolean
  /** Waar deze persoon de stap afmaakt; null als hij dat niet mag (clubmanager bij de wizard). */
  href: string | null
}

export interface AanDeSlagStand {
  af: number
  totaal: number
  volgende: AanDeSlagStap
}

export interface AanDeSlagInvoer {
  /** De stappen van de wizard die nodig zijn (nodigeStappen), in volgorde. */
  wizard: readonly StapStand[]
  /** De link naar een stap van de wizard, of null als deze persoon de wizard niet mag openen. */
  wizardHref: ((nummer: number) => string) | null
  /** De punten van Nog te doen die deze persoon ziet en die gelezen konden worden. */
  teDoen: readonly (TeDoenPunt & { titel: string; href: string })[]
}

/** De stappen op volgorde: eerst de wizard, dan wat de wizard niet dekt. */
export function aanDeSlagStappen({ wizard, wizardHref, teDoen }: AanDeSlagInvoer): AanDeSlagStap[] {
  const stappen: AanDeSlagStap[] = wizard.map((s) => ({ id: `wizard-${s.sleutel}`, titel: s.titel, af: s.af, href: wizardHref ? wizardHref(s.nummer) : null }))
  const eigen = teDoen.filter((p) => TE_DOEN_IN_WIZARD[p.id] === null || !wizard.some((s) => s.sleutel === TE_DOEN_IN_WIZARD[p.id]))
  const uniek = eigen.filter((p, i) => eigen.findIndex((q) => q.id === p.id) === i)
  return [...stappen, ...uniek.map((p) => ({ id: `instel-${p.id}`, titel: p.titel, af: p.klaar, href: p.href }))]
}

/** De stand, of null als alles af is of er niets te tonen valt (dan staat er niets in de kop). */
export function aanDeSlagStand(stappen: readonly AanDeSlagStap[]): AanDeSlagStand | null {
  const volgende = stappen.find((s) => !s.af)
  if (!volgende) return null
  return { af: stappen.filter((s) => s.af).length, totaal: stappen.length, volgende }
}

/**
 * Onthouden dat iemand het blok wegklikte, per persoon en sportschool. De
 * sleutel bevat de stand: zet de eigenaar later een stap af, dan blijft het
 * weg; komt er een nieuw open punt bij (meer stappen), dan komt het terug.
 */
export function verborgenSleutel(persoon: string, sportschool: string, stand: Pick<AanDeSlagStand, 'totaal'>): string {
  return `club-aan-de-slag:${persoon}:${sportschool}:${stand.totaal}`
}

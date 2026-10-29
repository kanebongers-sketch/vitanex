// Wat elk hoofdstuk van de cijferpagina mee krijgt.

import type { Rapport } from '@/lib/club/cijfers/rapport'
import type { Bereik } from '@/lib/club/cijfers/periode'
import { maandKort, maandNaam, type Maand } from '@/lib/club/cijfers/maand'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { CIJFERS, type CijfersTekst } from '@/lib/aiyourgym/taal/woorden/club/cijfers'

export interface CijferContext {
  rapport: Rapport
  maand: Maand
  vestiging: Vestiging
  /** De naam van de gekozen vestiging (uit club_vestigingen). */
  vestigingNaam: string
  bereik: Bereik
  vandaag: string
  /** De taal van de pagina (cookie ayg-taal). */
  taal: Taal
}

/** De teksten van de cijferpagina in de taal van de context. */
export function tekstVan(c: Pick<CijferContext, 'taal'>): CijfersTekst {
  return CIJFERS[c.taal]
}

/** "Budel" of "Alle vestigingen". */
export function bereikNaam(c: Pick<CijferContext, 'bereik' | 'vestigingNaam' | 'taal'>): string {
  return c.bereik === 'alle' ? CIJFERS[c.taal].kop.alleVestigingen : c.vestigingNaam
}

/** Deel van een bestandsnaam: "budel-2026-10". */
export function bestandsdeel(c: Pick<CijferContext, 'bereik' | 'vestiging' | 'maand'>): string {
  return `${c.bereik === 'alle' ? 'alle-vestigingen' : c.vestiging}-${c.maand}`
}

/** Labels voor een reeks maanden: kort onder de as, voluit in tabel en tooltip. */
export function maandLabels(maanden: readonly Maand[], taal: Taal = 'nl'): { labels: string[]; namen: string[] } {
  return {
    labels: maanden.map((m) => (m.endsWith('-01') ? `${maandKort(m, taal)} ${m.slice(2, 4)}` : maandKort(m, taal))),
    namen: maanden.map((m) => maandNaam(m, taal)),
  }
}

// Wat elk hoofdstuk van de cijferpagina mee krijgt.

import type { Rapport } from '@/lib/club/cijfers/rapport'
import type { Bereik } from '@/lib/club/cijfers/periode'
import { maandKort, maandNaam, type Maand } from '@/lib/club/cijfers/maand'
import { VESTIGING_LABEL, type Vestiging } from '@/lib/club/kern/vestiging'

export interface CijferContext {
  rapport: Rapport
  maand: Maand
  vestiging: Vestiging
  bereik: Bereik
  vandaag: string
}

/** "Budel" of "Alle vestigingen". */
export function bereikNaam(c: Pick<CijferContext, 'bereik' | 'vestiging'>): string {
  return c.bereik === 'alle' ? 'Alle vestigingen' : VESTIGING_LABEL[c.vestiging]
}

/** Deel van een bestandsnaam: "budel-2026-10". */
export function bestandsdeel(c: Pick<CijferContext, 'bereik' | 'vestiging' | 'maand'>): string {
  return `${c.bereik === 'alle' ? 'alle-vestigingen' : c.vestiging}-${c.maand}`
}

/** Labels voor een reeks maanden: kort onder de as, voluit in tabel en tooltip. */
export function maandLabels(maanden: readonly Maand[]): { labels: string[]; namen: string[] } {
  return {
    labels: maanden.map((m) => (m.endsWith('-01') ? `${maandKort(m)} ${m.slice(2, 4)}` : maandKort(m))),
    namen: maanden.map(maandNaam),
  }
}

// Wat elk hoofdstuk van de cijferpagina mee krijgt.

import type { Rapport } from '@/lib/club/cijfers/rapport'
import type { Bereik, Periode } from '@/lib/club/cijfers/periode'
import { dagKort } from '@/lib/club/cijfers/tijd'
import { VESTIGING_LABEL, type Vestiging } from '@/lib/club/gedeeld/vestiging'

export interface CijferContext {
  rapport: Rapport
  maandagen: string[]
  vestiging: Vestiging
  bereik: Bereik
  weken: Periode
  vandaag: string
}

/** "Budel" of "Alle vestigingen". */
export function bereikNaam(c: Pick<CijferContext, 'bereik' | 'vestiging'>): string {
  return c.bereik === 'alle' ? 'Alle vestigingen' : VESTIGING_LABEL[c.vestiging]
}

/** Deel van een bestandsnaam: "budel-12w". */
export function bestandsdeel(c: Pick<CijferContext, 'bereik' | 'vestiging' | 'weken'>): string {
  return `${c.bereik === 'alle' ? 'alle-vestigingen' : c.vestiging}-${c.weken}w`
}

export function weekLabels(maandagen: readonly string[]): { labels: string[]; namen: string[]; labelElke: number } {
  return {
    labels: maandagen.map(dagKort),
    namen: maandagen.map((m) => `week van ${dagKort(m)}`),
    labelElke: maandagen.length <= 4 ? 1 : maandagen.length <= 12 ? 2 : maandagen.length <= 26 ? 4 : 8,
  }
}

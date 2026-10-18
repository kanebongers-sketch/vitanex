'use client'

import type { OefeningHistorie, AppSchemaDag } from '@/lib/club/app/schema'
import { beginInvoer } from '@/lib/club/app/training-modus'
import { leesConcept, nieuwConcept, type Concept } from '@/lib/club/app/training-sessie'

// De lopende training op dit toestel. Opslag is een gemak: lukt het lezen of
// schrijven niet (privevenster, opslag vol), dan werkt de training gewoon.

/** De bewaarde training, aangevuld met de sets van het schema zoals het nu is; anders een nieuwe. */
export function laadConcept(sleutel: string, dag: AppSchemaDag, historie: Readonly<Record<string, OefeningHistorie>>): Concept {
  const basis = beginInvoer(dag, historie)
  let ruw: string | null = null
  try {
    ruw = window.localStorage.getItem(sleutel)
  } catch {
    ruw = null
  }
  const nu = Date.now()
  const c = leesConcept(ruw, nu)
  if (!c) return nieuwConcept(basis, nu)
  const invoer = Object.fromEntries(Object.entries(basis).map(([k, v]) => [k, c.invoer[k] ?? v]))
  return { ...c, invoer, scherm: Math.min(c.scherm, Math.max(0, dag.oefeningen.length - 1)) }
}

export function bewaarConcept(sleutel: string, c: Concept | null): void {
  try {
    if (c) window.localStorage.setItem(sleutel, JSON.stringify(c))
    else window.localStorage.removeItem(sleutel)
  } catch {
    // Niet bewaard op het toestel; de training gaat gewoon door.
  }
}

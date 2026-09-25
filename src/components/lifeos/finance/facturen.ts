// ─── LifeOS — Finance: facturen (client, puur) ──────────────────────────────
// De systeemgrens voor `/finance/facturen` (unknown → smalle view) plus de pure
// afleidingen die de lijst toont: welke facturen staan nog open, in welke
// volgorde, en wat de vervaltekst is. Geen fetch, geen React.
//
// "Te laat" volgt exact de server (`isVerlopen` in lib/lifeos/finance): handmatig
// op 'verlopen' gezet, of 'open' en over de vervaldatum. Zo zeggen de lijst en de
// Openstaand-tegel hetzelfde.

import { getalOfNull, isObject, tekstOfNull } from '@/lib/lifeos/api/http'

export type FactuurStatus = 'open' | 'betaald' | 'verlopen'

export interface FactuurView {
  id: string
  klant: string
  bedrag: number
  status: FactuurStatus
  factuurdatum: string
  vervaldatum: string | null
}

/** Wat het formulier naar de server stuurt (status begint altijd 'open'). */
export interface NieuweFactuurInvoer {
  klant: string
  bedrag: number
  factuurdatum: string
  vervaldatum: string | null
}

const DAG = /^\d{4}-\d{2}-\d{2}$/

function isStatus(v: unknown): v is FactuurStatus {
  return v === 'open' || v === 'betaald' || v === 'verlopen'
}

function leesFactuur(ruw: unknown): FactuurView | null {
  if (!isObject(ruw)) return null
  const id = tekstOfNull(ruw.id)
  const klant = tekstOfNull(ruw.klant)
  const bedrag = getalOfNull(ruw.bedrag)
  const factuurdatum = tekstOfNull(ruw.factuurdatum)
  if (id === null || klant === null || bedrag === null || factuurdatum === null || !isStatus(ruw.status)) return null
  const verval = tekstOfNull(ruw.vervaldatum)
  return { id, klant, bedrag, status: ruw.status, factuurdatum, vervaldatum: verval && DAG.test(verval) ? verval : null }
}

/** `{ facturen: [...] }` → de lijst; een kapotte rij valt weg. `null` = onverwachte vorm. */
export function leesFacturen(ruw: unknown): FactuurView[] | null {
  if (!isObject(ruw) || !Array.isArray(ruw.facturen)) return null
  return ruw.facturen.map(leesFactuur).filter((f): f is FactuurView => f !== null)
}

export function isTeLaat(f: FactuurView, vandaag: string): boolean {
  if (f.status === 'verlopen') return true
  return f.status === 'open' && f.vervaldatum !== null && f.vervaldatum < vandaag
}

/** De nog-niet-betaalde facturen: te laat eerst, dan op vervaldatum (zonder datum achteraan). */
export function openFacturen(facturen: readonly FactuurView[], vandaag: string): FactuurView[] {
  return facturen
    .filter((f) => f.status !== 'betaald')
    .sort((a, b) => {
      const laat = Number(isTeLaat(b, vandaag)) - Number(isTeLaat(a, vandaag))
      if (laat !== 0) return laat
      const va = a.vervaldatum ?? '9999-12-31'
      const vb = b.vervaldatum ?? '9999-12-31'
      return va < vb ? -1 : va > vb ? 1 : a.klant.localeCompare(b.klant, 'nl')
    })
}

const DAG_KORT = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', timeZone: 'UTC' })

function dagLabel(dag: string): string {
  const [j, m, d] = dag.split('-').map(Number)
  return DAG_KORT.format(new Date(Date.UTC(j, m - 1, d)))
}

/** "te laat sinds 3 okt", "vervalt 12 okt", "vervalt vandaag" of "geen vervaldatum". */
export function vervalTekst(f: FactuurView, vandaag: string): string {
  if (f.vervaldatum === null) return f.status === 'verlopen' ? 'te laat' : 'geen vervaldatum'
  if (isTeLaat(f, vandaag)) return `te laat sinds ${dagLabel(f.vervaldatum)}`
  if (f.vervaldatum === vandaag) return 'vervalt vandaag'
  return `vervalt ${dagLabel(f.vervaldatum)}`
}

/** Dagsleutel `dagen` dagen na `dag` (UTC-rekenen, dus zomertijd doet niets). */
export function dagPlus(dag: string, dagen: number): string {
  const [j, m, d] = dag.split('-').map(Number)
  const t = new Date(Date.UTC(j, m - 1, d + dagen))
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`
}

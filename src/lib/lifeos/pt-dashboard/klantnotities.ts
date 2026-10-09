// ─── Fit Factory PT — logboek per klant (PUUR) ──────────────────────────────
// Gedateerde notities bij een klant: wat er in een training gebeurde, wat er
// in een gesprek is afgesproken, voeding, een no-show. Het verloop naast de
// cijfers (metingen). Geen gezondheidsgegevens: die horen in de intake.
// Opslag: pt_klantnotities (migratie 364), zie dossier-opslag.ts.

export const NOTITIE_SOORTEN = ['training', 'gesprek', 'voeding', 'no_show', 'overig'] as const
export type NotitieSoort = (typeof NOTITIE_SOORTEN)[number]

export const NOTITIE_SOORT_LABEL: Record<NotitieSoort, string> = {
  training: 'Training',
  gesprek: 'Gesprek',
  voeding: 'Voeding',
  no_show: 'No-show',
  overig: 'Overig',
}

/** Korte uitleg per soort, voor de keuze in het formulier. */
export const NOTITIE_SOORT_HINT: Record<NotitieSoort, string> = {
  training: 'Wat is er getraind, hoe ging het, wat volgende keer.',
  gesprek: 'Afspraken, doelen, wat de klant aangaf.',
  voeding: 'Voedingsdagboek, aanpassingen, wat lukt en wat niet.',
  no_show: 'Niet gekomen of binnen 24 uur afgezegd (telt als sessie).',
  overig: 'Al het andere.',
}

export const MAX_NOTITIE_TEKST = 2000

export function isNotitieSoort(v: unknown): v is NotitieSoort {
  return typeof v === 'string' && (NOTITIE_SOORTEN as readonly string[]).includes(v)
}

export interface KlantNotitie {
  id: string
  /** YYYY-MM-DD */
  datum: string
  soort: NotitieSoort
  tekst: string
  aangemaaktOp: string
}
export type KlantNotitieInvoer = Pick<KlantNotitie, 'datum' | 'soort' | 'tekst'>

type Lees<T> = { ok: true; waarde: T } | { ok: false; fout: string }
const DAG = /^\d{4}-\d{2}-\d{2}$/

/** Spaties samenvouwen (enters blijven), trimmen, inkorten. */
function tekst(v: unknown): string {
  if (typeof v !== 'string') return ''
  return v.replace(/[^\S\n]+/g, ' ').replace(/ \n/g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, MAX_NOTITIE_TEKST).trim()
}

/** Formulier → notitie, of een leesbare fout. `vandaag` weert datums in de toekomst. */
export function leesNotitieInvoer(body: unknown, vandaag?: string): Lees<KlantNotitieInvoer> {
  if (typeof body !== 'object' || body === null) return { ok: false, fout: 'Ongeldige invoer.' }
  const o = body as Record<string, unknown>
  if (typeof o.datum !== 'string' || !DAG.test(o.datum) || Number.isNaN(Date.parse(`${o.datum}T12:00:00Z`))) {
    return { ok: false, fout: 'Kies de datum.' }
  }
  if (vandaag && o.datum > vandaag) return { ok: false, fout: 'Een notitie kan niet in de toekomst liggen.' }
  if (!isNotitieSoort(o.soort)) return { ok: false, fout: 'Kies het soort notitie.' }
  const t = tekst(o.tekst)
  if (t.length === 0) return { ok: false, fout: 'Schrijf iets op.' }
  return { ok: true, waarde: { datum: o.datum, soort: o.soort, tekst: t } }
}

export function leesKlantNotitie(ruw: unknown): KlantNotitie | null {
  if (typeof ruw !== 'object' || ruw === null) return null
  const o = ruw as Record<string, unknown>
  if (typeof o.id !== 'string' || typeof o.aangemaaktOp !== 'string') return null
  const r = leesNotitieInvoer(o)
  return r.ok ? { id: o.id, aangemaaktOp: o.aangemaaktOp, ...r.waarde } : null
}

/** Nieuwste eerst; op dezelfde dag de laatst aangemaakte bovenaan. */
export function sorteerNotities(n: readonly KlantNotitie[]): KlantNotitie[] {
  return [...n].sort((a, b) => b.datum.localeCompare(a.datum) || b.aangemaaktOp.localeCompare(a.aangemaaktOp))
}

export interface NotitieTelling {
  totaal: number
  trainingen: number
  noShows: number
  /** Datum van de laatste training of no-show, of null. */
  laatsteSessie: string | null
}

/** Sessies = trainingen + no-shows (een no-show telt als sessie, zie de voorwaarden). */
export function telNotities(n: readonly KlantNotitie[]): NotitieTelling {
  const sessies = n.filter((x) => x.soort === 'training' || x.soort === 'no_show')
  return {
    totaal: n.length,
    trainingen: n.filter((x) => x.soort === 'training').length,
    noShows: n.filter((x) => x.soort === 'no_show').length,
    laatsteSessie: sessies.length === 0 ? null : sessies.map((x) => x.datum).sort().at(-1) ?? null,
  }
}

// ─── Club: wat telt als actief lid voor de staffelprijs (PUUR) ──────────────
// Besluit Kane (31-10-2026): de prijs van AI Your Gym per vestiging hangt af
// van het aantal actieve leden van die vestiging (src/lib/aiyourgym/staffel.ts).
// Een regel, hier, getest in actief-tellen.test.ts. Een lid telt op dag D als:
//   - het geen demolid is (demo = false), en
//   - het lidmaatschap op D al begonnen is (lid_sinds leeg of op of voor D), en
//   - de status actief of proef is, of opgezegd met een einddatum op of na D
//     (of zonder einddatum): opgezegd loopt door tot de einddatum.
// Telt nooit: gepauzeerd, gestopt (ook "wordt verwijderd", AVG), opgezegd met
// een einddatum voor D, demo.

export interface LidVoorTelling {
  vestiging: string
  status: string
  demo: boolean
  /** YYYY-MM-DD of null. */
  lidSinds: string | null
  /** YYYY-MM-DD of null. */
  einddatum: string | null
}

/** De kolommen die de telling uit club_leden leest. */
export const TEL_KOLOMMEN = 'vestiging, status, demo, lid_sinds, einddatum'

const DATUM = /^\d{4}-\d{2}-\d{2}/

function datum(v: unknown): string | null {
  return typeof v === 'string' && DATUM.test(v) ? v.slice(0, 10) : null
}

/** Systeemgrens: een rij uit club_leden, of null als hij onbruikbaar is. */
export function lidVoorTellingUitRij(rij: unknown): LidVoorTelling | null {
  if (typeof rij !== 'object' || rij === null) return null
  const r = rij as Record<string, unknown>
  if (typeof r.vestiging !== 'string' || typeof r.status !== 'string') return null
  return { vestiging: r.vestiging, status: r.status, demo: r.demo === true, lidSinds: datum(r.lid_sinds), einddatum: datum(r.einddatum) }
}

/** Telt dit lid op dag (YYYY-MM-DD) als actief lid? */
export function teltAlsActiefLid(lid: LidVoorTelling, dag: string): boolean {
  if (lid.demo) return false
  if (lid.lidSinds && lid.lidSinds > dag) return false
  if (lid.status === 'actief' || lid.status === 'proef') return true
  if (lid.status === 'opgezegd') return lid.einddatum === null || lid.einddatum >= dag
  return false
}

/** Het aantal actieve leden per vestiging (nieuw object, niets in place). */
export function telActieveLeden(leden: readonly LidVoorTelling[], dag: string): Readonly<Record<string, number>> {
  return leden.reduce<Record<string, number>>((tel, lid) => (teltAlsActiefLid(lid, dag) ? { ...tel, [lid.vestiging]: (tel[lid.vestiging] ?? 0) + 1 } : tel), {})
}

/** De dag van vandaag in Nederland als YYYY-MM-DD. */
export function dagInNederland(nu: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' }).format(nu)
}

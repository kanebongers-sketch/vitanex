// ─── Club, AVG: databaserijen naar een leesbaar bestand (PUUR) ──────────────
// Gedeeld door de inzage van leads en medewerkers. Een vaste lijst velden per
// tabel (nooit "alles"), zodat geheimen en interne ids nooit in het bestand
// komen. Een veld kan een omzetting hebben, bv. een vestiging-slug naar de naam.

import { waardeOpPad, type Rij } from '@/lib/club/leden/avg/export'

export type { Rij }

/** Kolom (of pad met punten door een ingesloten tabel) naar een Nederlandse sleutel. */
export type Velden = Readonly<Record<string, string>>

/** Per kolom een omzetting van de ruwe waarde (bv. medewerker-id naar naam). */
export type Omzettingen = Readonly<Partial<Record<string, (waarde: unknown) => unknown>>>

/** Een rij met alleen de gekozen velden, onder Nederlandse sleutels. */
export function vertaalRij(rij: Rij, velden: Velden, omzetten: Omzettingen = {}): Rij {
  const uit: Rij = {}
  for (const [pad, label] of Object.entries(velden)) {
    const waarde = waardeOpPad(rij, pad)
    const zet = omzetten[pad]
    uit[label] = zet ? zet(waarde) : waarde
  }
  return uit
}

/** Een id omzetten naar een naam uit een lijst; een onbekend id wordt nooit getoond. */
export function naamUit(namen: ReadonlyMap<string, string>, onbekend: string): (waarde: unknown) => unknown {
  return (waarde) => (typeof waarde === 'string' ? namen.get(waarde) ?? onbekend : null)
}

/** Een lijst slugs of sleutels omzetten naar namen ("budel" wordt "Budel"). */
export function namenUit(namen: ReadonlyMap<string, string>): (waarde: unknown) => unknown {
  return (waarde) => (Array.isArray(waarde) ? waarde.map((w) => (typeof w === 'string' ? namen.get(w) ?? w : w)) : waarde)
}

/** Een slug omzetten naar de naam, of de slug zelf als die onbekend is. */
export function naamOfZelf(namen: ReadonlyMap<string, string>): (waarde: unknown) => unknown {
  return (waarde) => (typeof waarde === 'string' ? namen.get(waarde) ?? waarde : waarde)
}

/** Een veilige bestandsnaam: <voorvoegsel>-<naam>-<datum>.json, zonder accenten of rare tekens. */
export function avgBestandsnaam(voorvoegsel: string, naam: string, op: Date, reserve: string): string {
  const schoon = naam
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return `${voorvoegsel}-${schoon || reserve}-${op.toISOString().slice(0, 10)}.json`
}

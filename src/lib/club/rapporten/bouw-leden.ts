// ─── Club: rapporten over leden en bezoek (PUUR) ────────────────────────────
// Van nagekeken rijen naar tabelrijen in de kolomvolgorde van definities.ts.

import { LID_STATUS_LABEL } from '@/lib/club/kern/lid'
import { dagSleutel } from '@/lib/club/cijfers/tijd'
import type { CsvWaarde } from './csv'
import { datumNl, momentDatum, vergelijkNaam } from './opmaak'
import type { CheckinRij, LidNaam, LidRij } from './rijen'

/** Een maand als hele dagen "YYYY-MM-DD", begin en eind inbegrepen. */
export interface Dagen {
  eerste: string
  laatste: string
}

export type VestigingNaam = (sleutel: string) => string

function opNaam(a: LidNaam, b: LidNaam): number {
  return vergelijkNaam(a.achternaam, b.achternaam) || vergelijkNaam(a.voornaam, b.voornaam)
}

/** Was dit lid in de maand lid? Zonder startdatum: ja, tenzij de einddatum ervoor ligt. */
export function lidInMaand(l: Pick<LidRij, 'lidSinds' | 'einddatum'>, d: Dagen): boolean {
  const begonnen = l.lidSinds === null || l.lidSinds <= d.laatste
  const nogLid = l.einddatum === null || l.einddatum >= d.eerste
  return begonnen && nogLid
}

export function ledenlijst(leden: readonly LidRij[], d: Dagen, vestiging: VestigingNaam): CsvWaarde[][] {
  return leden
    .filter((l) => lidInMaand(l, d))
    .sort(opNaam)
    .map((l) => [l.lidnummer, l.voornaam, l.achternaam, l.email, l.telefoon, vestiging(l.vestiging), l.abonnement, LID_STATUS_LABEL[l.status], datumNl(l.lidSinds), datumNl(l.einddatum)])
}

function inDagen(dag: string | null, d: Dagen): dag is string {
  return dag !== null && dag >= d.eerste && dag <= d.laatste
}

export function instroom(leden: readonly LidRij[], d: Dagen, vestiging: VestigingNaam): CsvWaarde[][] {
  const regels = leden.flatMap((l) => [
    ...(inDagen(l.lidSinds, d) ? [{ soort: 'Nieuw lid', dag: l.lidSinds, l }] : []),
    ...(inDagen(l.einddatum, d) ? [{ soort: 'Opzegging', dag: l.einddatum, l }] : []),
  ])
  return regels
    .sort((a, b) => a.dag.localeCompare(b.dag) || a.soort.localeCompare(b.soort) || opNaam(a.l, b.l))
    .map(({ soort, dag, l }) => [soort, datumNl(dag), l.lidnummer, l.voornaam, l.achternaam, vestiging(l.vestiging), l.abonnement, LID_STATUS_LABEL[l.status]])
}

interface BezoekTeller {
  lidId: string
  dagen: Set<string>
  checkins: number
  eerste: Date
  laatste: Date
  vestigingen: Set<string>
}

/** Groepeert rijen op een sleutel, in de volgorde waarin ze voorkomen. */
export function groepeer<T>(rijen: readonly T[], sleutel: (r: T) => string): Map<string, T[]> {
  const uit = new Map<string, T[]>()
  for (const r of rijen) {
    const k = sleutel(r)
    const lijst = uit.get(k)
    if (lijst) lijst.push(r)
    else uit.set(k, [r])
  }
  return uit
}

function telBezoekPerLid(checkins: readonly CheckinRij[]): BezoekTeller[] {
  return [...groepeer(checkins, (c) => c.lidId)].map(([lidId, eigen]) => {
    const tijden = eigen.map((c) => c.op.getTime())
    return {
      lidId,
      dagen: new Set(eigen.map((c) => dagSleutel(c.op))),
      checkins: eigen.length,
      eerste: new Date(Math.min(...tijden)),
      laatste: new Date(Math.max(...tijden)),
      vestigingen: new Set(eigen.map((c) => c.vestiging)),
    }
  })
}

/** Per lid: bezoekdagen, check-ins en eerste en laatste bezoek. Meeste bezoek eerst. */
export function bezoekPerLid(checkins: readonly CheckinRij[], leden: ReadonlyMap<string, LidNaam>, vestiging: VestigingNaam): CsvWaarde[][] {
  const leeg: LidNaam = { id: '', vestiging: '', lidnummer: null, voornaam: '', achternaam: '(onbekend lid)' }
  return telBezoekPerLid(checkins)
    .map((t) => ({ t, lid: leden.get(t.lidId) ?? leeg }))
    .sort((a, b) => b.t.dagen.size - a.t.dagen.size || b.t.checkins - a.t.checkins || opNaam(a.lid, b.lid))
    .map(({ t, lid }) => [
      lid.lidnummer,
      lid.voornaam,
      lid.achternaam,
      lid.vestiging ? vestiging(lid.vestiging) : null,
      t.dagen.size,
      t.checkins,
      momentDatum(t.eerste),
      momentDatum(t.laatste),
      [...t.vestigingen].map(vestiging).sort(vergelijkNaam).join(', '),
    ])
}

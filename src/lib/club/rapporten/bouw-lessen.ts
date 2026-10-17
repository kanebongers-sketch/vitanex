// ─── Club: rapporten over lessen, no-shows en leads (PUUR) ──────────────────

import { telPerLes } from '@/lib/club/cijfers/lessen'
import { LEAD_BRON_LABEL, LEAD_STATUS_LABEL } from '@/lib/club/leads/model'
import type { CsvWaarde } from './csv'
import { momentDatum, momentTijd, procent, vergelijkNaam } from './opmaak'
import type { VestigingNaam } from './bouw-leden'
import type { AfspraakRij, LeadRij, LesRij, LidNaam, ReserveringRij } from './rijen'

/** Elke les met capaciteit, bezet, aanwezig, no-show, wachtlijst en bezetting. Op begintijd. */
export function bezettingPerLes(lessen: readonly LesRij[], reserveringen: readonly ReserveringRij[], medewerkers: ReadonlyMap<string, string>, vestiging: VestigingNaam): CsvWaarde[][] {
  const instructeur = new Map(lessen.map((l) => [l.id, l.instructeurId]))
  return telPerLes(lessen, reserveringen)
    .sort((a, b) => a.start.getTime() - b.start.getTime() || vergelijkNaam(a.lestype, b.lestype))
    .map((l) => {
      const id = instructeur.get(l.id) ?? null
      return [
        momentDatum(l.start),
        momentTijd(l.start),
        l.lestype,
        id ? (medewerkers.get(id) ?? null) : null,
        vestiging(l.vestiging),
        l.capaciteit,
        l.bezet,
        l.aanwezig,
        l.noShow,
        l.wachtlijst,
        procent(l.bezet, l.capaciteit),
        l.geannuleerd ? 'Geannuleerd' : 'Gepland',
      ]
    })
}

interface Gemist {
  start: Date
  soort: string
  wat: string
  lidId: string | null
  vestiging: string
}

/** No-shows en te late afmeldingen bij lessen, plus afspraken waar het lid niet kwam. */
export function noShows(
  lessen: readonly LesRij[],
  reserveringen: readonly ReserveringRij[],
  afspraken: readonly AfspraakRij[],
  leden: ReadonlyMap<string, LidNaam>,
  vestiging: VestigingNaam,
): CsvWaarde[][] {
  const lesVan = new Map(lessen.map((l) => [l.id, l]))
  const vanLessen: Gemist[] = reserveringen.flatMap((r) => {
    const les = lesVan.get(r.lesId)
    if (!les) return []
    if (r.status === 'no_show') return [{ start: les.start, soort: 'Les: no-show', wat: les.lestype, lidId: r.lidId, vestiging: les.vestiging }]
    if (r.status === 'geannuleerd' && r.teLaat) return [{ start: les.start, soort: 'Les: te laat afgemeld', wat: les.lestype, lidId: r.lidId, vestiging: les.vestiging }]
    return []
  })
  const vanAfspraken: Gemist[] = afspraken
    .filter((a) => a.status === 'niet_gekomen')
    .map((a) => ({ start: a.start, soort: 'Afspraak: niet gekomen', wat: a.type, lidId: a.lidId, vestiging: a.vestiging }))
  return [...vanLessen, ...vanAfspraken]
    .sort((a, b) => a.start.getTime() - b.start.getTime() || a.soort.localeCompare(b.soort))
    .map((g) => {
      const lid = g.lidId ? leden.get(g.lidId) : undefined
      return [momentDatum(g.start), momentTijd(g.start), g.soort, g.wat, lid?.lidnummer ?? null, lid?.voornaam ?? null, lid?.achternaam ?? null, vestiging(g.vestiging)]
    })
}

/** Leads van de maand, oudste eerst. */
export function leadsLijst(leads: readonly LeadRij[], medewerkers: ReadonlyMap<string, string>, vestiging: VestigingNaam): CsvWaarde[][] {
  return [...leads]
    .sort((a, b) => a.aangemaakt.getTime() - b.aangemaakt.getTime())
    .map((l) => [
      momentDatum(l.aangemaakt),
      l.naam,
      l.email,
      l.telefoon,
      vestiging(l.vestiging),
      LEAD_BRON_LABEL[l.bron],
      l.interesse,
      LEAD_STATUS_LABEL[l.status],
      l.proeflesOp ? `${momentDatum(l.proeflesOp)} ${momentTijd(l.proeflesOp)}` : null,
      l.verlorenReden,
      l.medewerkerId ? (medewerkers.get(l.medewerkerId) ?? null) : null,
    ])
}

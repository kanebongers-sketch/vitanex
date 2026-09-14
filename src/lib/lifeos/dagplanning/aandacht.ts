// ─── LifeOS — dagplanning: "Vraagt je aandacht" (puur) ──────────────────────
// De ochtendmail toonde je dag (agenda + taken) en Vita's observaties. Maar een
// stafchef ziet méér dan je agenda: wie je vandaag zou opvolgen (CRM) en welke
// facturen open of te laat staan (finance). Dit bestand leidt die aandachtspunten
// puur af — data in → regels uit, geen fetch, geen DB — zodat de route ze
// best-effort ophaalt en de mail ze rendert.
//
// EERLIJK: elk punt steunt op een écht feit uit je eigen data (een follow-up-datum
// die jij zette, een factuurstatus). We verzinnen hier niets bij; een lege bron
// levert gewoon geen regel op.

import type { Persoon } from '@/lib/lifeos/crm/crm'
import type { Factuur } from '@/lib/lifeos/finance/finance'
import { naarCenten, naarEuro } from '@/lib/lifeos/finance/finance'

/** Eén regel voor de "Vraagt je aandacht"-sectie. */
export interface Aandachtspunt {
  tekst: string
  /** Vraagt nú iets van je (vandaag of te laat) → cyaan accent in de mail. */
  dringend: boolean
}

/**
 * Zoveel op te volgen mensen tonen we bij naam. Daarboven één samenvattende regel:
 * een ochtendmail met veertig namen is geen overzicht meer maar een tweede takenlijst.
 */
const CRM_LIMIET = 8

const EURO_FMT = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' })

/** Centen → '€ 1.234,56'. Sommeren gebeurt in centen om float-drift te vermijden. */
function euroTekst(centen: number): string {
  return EURO_FMT.format(naarEuro(centen))
}

/**
 * Wie moet je vandaag (of eerder) opvolgen? Puur op de follow-up-datum die jij zelf
 * zette — een expliciete afspraak met jezelf, niet een afgeleide gok. Dagsleutels
 * (YYYY-MM-DD) vergelijken lexicografisch gelijk aan chronologisch, dus `<`/`<=` zijn
 * hier echte datumtests.
 *
 * Te laat eerst (oudste follow-up bovenaan), daarna op naam. Alles hier is `dringend`:
 * de datum is vandaag of al verstreken.
 */
export function crmOpvolging(personen: readonly Persoon[], vandaagKey: string): Aandachtspunt[] {
  const teDoen = personen
    .filter((p) => p.followUpDatum !== null && p.followUpDatum <= vandaagKey)
    .sort((a, b) => {
      const da = a.followUpDatum as string
      const db = b.followUpDatum as string
      if (da !== db) return da < db ? -1 : 1
      return a.naam.localeCompare(b.naam, 'nl')
    })

  const punten: Aandachtspunt[] = teDoen.slice(0, CRM_LIMIET).map((p) => ({
    tekst: `${p.naam} opvolgen (${(p.followUpDatum as string) < vandaagKey ? 'te laat' : 'vandaag'})`,
    dringend: true,
  }))

  const rest = teDoen.length - CRM_LIMIET
  if (rest > 0) {
    punten.push({ tekst: `en nog ${rest} ${rest === 1 ? 'contact' : 'contacten'} om op te volgen`, dringend: false })
  }
  return punten
}

/**
 * Eén samenvattende factuurregel, of `null` als er niets openstaat.
 *
 * "Te laat" is hier bewust breder dan finance's interne `isVerlopen` (die telt
 * alleen status 'open' over de vervaldatum): voor een ochtend-nudge is óók een
 * factuur die jij handmatig op 'verlopen' zette te laat. Openstaand = niet 'betaald',
 * gelijk aan finance's eigen definitie. Te laat wint van gewoon-open: dat is de regel
 * die actie vraagt.
 */
export function factuurAandacht(facturen: readonly Factuur[], vandaagKey: string): Aandachtspunt | null {
  const openstaand = facturen.filter((f) => f.status !== 'betaald')
  if (openstaand.length === 0) return null

  const somCenten = (lijst: readonly Factuur[]): number =>
    lijst.reduce((som, f) => som + naarCenten(f.bedrag), 0)

  const teLaat = openstaand.filter(
    (f) => f.status === 'verlopen' || (f.vervaldatum !== null && f.vervaldatum < vandaagKey),
  )

  if (teLaat.length > 0) {
    const n = teLaat.length
    return {
      tekst: `${n} ${n === 1 ? 'factuur' : 'facturen'} over de vervaldatum — ${euroTekst(somCenten(teLaat))}`,
      dringend: true,
    }
  }

  const n = openstaand.length
  return {
    tekst: `${n} openstaande ${n === 1 ? 'factuur' : 'facturen'} — ${euroTekst(somCenten(openstaand))}`,
    dringend: false,
  }
}

/**
 * Alle aandachtspunten voor vandaag: CRM-opvolging eerst (mensen boven cijfers),
 * dan de factuurregel. Leeg = de mail laat de hele sectie weg.
 */
export function bouwAandacht(
  personen: readonly Persoon[],
  facturen: readonly Factuur[],
  vandaagKey: string,
): Aandachtspunt[] {
  const factuur = factuurAandacht(facturen, vandaagKey)
  return [...crmOpvolging(personen, vandaagKey), ...(factuur ? [factuur] : [])]
}

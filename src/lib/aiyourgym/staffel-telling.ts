// ─── AI Your Gym: de dagelijkse telling per vestiging (logica, getest) ──────
// Besluit Kane (31-10-2026): eens per dag tellen we per vestiging de actieve
// leden (src/lib/club/leden/actief-tellen.ts) en zetten we die als hoeveelheid
// op elke eigen regel van het Stripe-abonnement van die vestiging, met
// proration_behavior=none: de nieuwe staffel geldt vanaf de volgende factuur.
//
// Idempotent en controleerbaar:
//   - Een logregel per abonnement per dag (ayg_staffel_log, uniek). Staat er
//     vandaag al een regel die niet 'fout' is, dan doen we niets.
//   - Stripe krijgt een vaste Idempotency-Key per abonnement, dag en aantal.
//   - Staat de hoeveelheid al goed, dan sturen we niets naar Stripe ('gelijk').
// Boven 5000 leden: nooit automatisch, een melding voor Kane (prijs op maat).
// Een andere staffel: een mail aan de eigenaar (als er een afzender is) en de
// wijziging staat altijd op de abonnementspagina in Club (uit het logboek).
// Afhankelijkheden komen binnen (TelDeps), zodat dit zonder database te testen is.

import { staffelVoor, stripeHoeveelheid, zelfdeStaffel } from './staffel'
import type { AbonnementRegel } from './pakket-wijziging'
import { abonnementLoopt, hoeveelheidSleutel } from './vestiging-abonnement'

/** Een rij uit ayg_vestiging_abonnementen die we tellen. */
export interface TelAbonnement {
  id: string
  organisatieId: string
  vestiging: string
  abonnementId: string
}

export type TelUitkomst = 'gelijk' | 'bijgewerkt' | 'op_maat' | 'opgezegd' | 'fout'

export interface TelLog {
  organisatieId: string
  vestiging: string
  abonnementId: string
  dag: string
  actieveLeden: number
  hoeveelheidOud: number | null
  hoeveelheidNieuw: number | null
  staffelOud: number | null
  staffelNieuw: number | null
  uitkomst: TelUitkomst
  gemaild: boolean
}

export interface StaffelWissel {
  abonnement: TelAbonnement
  actieveLeden: number
  oud: number
  nieuw: number
}

export interface TelDeps {
  /** De dag (YYYY-MM-DD, Nederlandse tijd). */
  dag: string
  /** Onze eigen prijs-id's (eigenPrijzen()): alleen die regels krijgen een hoeveelheid. */
  eigen: readonly string[]
  /** Is er vandaag al een logregel die niet 'fout' is? null = databasefout. */
  alGeteld: (abonnementId: string, dag: string) => Promise<boolean | null>
  /** Het aantal actieve leden van de vestiging op die dag, of null bij een fout. */
  telLeden: (organisatieId: string, vestiging: string, dag: string) => Promise<number | null>
  /** Status en regels van het abonnement bij Stripe, of null als Stripe niet antwoordt. */
  haalRegels: (abonnementId: string) => Promise<{ status: string | null; regels: AbonnementRegel[] } | null>
  /** Zet de hoeveelheid van alle eigen regels op n (proration none). */
  zetHoeveelheid: (abonnementId: string, regels: readonly AbonnementRegel[], n: number, sleutel: string) => Promise<boolean>
  /** Een logregel opslaan (upsert op abonnement en dag). */
  schrijfLog: (log: TelLog) => Promise<boolean>
  /** De rij bijwerken met de laatste telling (en status). */
  werkRijBij: (rijId: string, velden: { hoeveelheid?: number; actieveLeden: number; status?: 'opgezegd' }) => Promise<void>
  /** Een melding voor Kane: prijs op maat (zonder persoonsgegevens). */
  meldOpMaat: (a: TelAbonnement, actieveLeden: number) => Promise<void>
  /** De eigenaar mailen over een andere staffel; true als de mail weg is. */
  mailWissel: (w: StaffelWissel) => Promise<boolean>
}

/** De bovengrens van de staffel van een aantal, of null bij prijs op maat. */
export function grensVan(aantal: number | null): number | null {
  if (aantal === null) return null
  const s = staffelVoor(aantal)
  return s && s.soort === 'staffel' ? s.grens : null
}

/** De hoeveelheid die nu op de eigen regels staat: alleen als die allemaal gelijk zijn, anders null. */
export function huidigeHoeveelheid(regels: readonly AbonnementRegel[], eigen: readonly string[]): number | null {
  const eigenRegels = regels.filter((r) => eigen.includes(r.prijsId))
  const eerste = eigenRegels[0]?.aantal ?? null
  return eerste !== null && eigenRegels.every((r) => r.aantal === eerste) ? eerste : null
}

export type TelBesluit = { soort: 'gelijk'; n: number } | { soort: 'bijwerken'; n: number } | { soort: 'op_maat' }

/**
 * Wat er moet gebeuren (PUUR): boven 5000 nooit automatisch; anders de
 * hoeveelheid naar het aantal actieve leden (minimaal 1), tenzij die er al staat.
 */
export function besluitTelling(actieveLeden: number, huidig: number | null): TelBesluit {
  const n = stripeHoeveelheid(actieveLeden)
  if (n === null) return { soort: 'op_maat' }
  return huidig === n ? { soort: 'gelijk', n } : { soort: 'bijwerken', n }
}

function log(a: TelAbonnement, dag: string, leden: number, oud: number | null, nieuw: number | null, uitkomst: TelUitkomst, gemaild = false): TelLog {
  return { organisatieId: a.organisatieId, vestiging: a.vestiging, abonnementId: a.abonnementId, dag, actieveLeden: leden, hoeveelheidOud: oud, hoeveelheidNieuw: nieuw, staffelOud: grensVan(oud), staffelNieuw: grensVan(nieuw), uitkomst, gemaild }
}

/** Een abonnement tellen en zo nodig bijwerken. 'overgeslagen' = vandaag al gedaan. */
export async function telAbonnement(a: TelAbonnement, d: TelDeps): Promise<TelUitkomst | 'overgeslagen'> {
  const gedaan = await d.alGeteld(a.abonnementId, d.dag)
  if (gedaan === null) return 'fout'
  if (gedaan) return 'overgeslagen'

  const leden = await d.telLeden(a.organisatieId, a.vestiging, d.dag)
  if (leden === null) return 'fout'
  const stripe = await d.haalRegels(a.abonnementId)
  if (!stripe) {
    await d.schrijfLog(log(a, d.dag, leden, null, null, 'fout'))
    return 'fout'
  }
  if (!abonnementLoopt(stripe.status)) {
    await d.schrijfLog(log(a, d.dag, leden, null, null, 'opgezegd'))
    await d.werkRijBij(a.id, { actieveLeden: leden, status: 'opgezegd' })
    return 'opgezegd'
  }

  const oud = huidigeHoeveelheid(stripe.regels, d.eigen)
  const besluit = besluitTelling(leden, oud)
  if (besluit.soort === 'op_maat') {
    // Boven de laatste staffel: niets automatisch, Kane spreekt een prijs op maat af.
    await d.meldOpMaat(a, leden)
    await d.schrijfLog(log(a, d.dag, leden, oud, oud, 'op_maat'))
    await d.werkRijBij(a.id, { actieveLeden: leden })
    return 'op_maat'
  }
  if (besluit.soort === 'gelijk') {
    await d.schrijfLog(log(a, d.dag, leden, oud, besluit.n, 'gelijk'))
    await d.werkRijBij(a.id, { hoeveelheid: besluit.n, actieveLeden: leden })
    return 'gelijk'
  }

  const gelukt = await d.zetHoeveelheid(a.abonnementId, stripe.regels, besluit.n, hoeveelheidSleutel(a.abonnementId, d.dag, besluit.n))
  if (!gelukt) {
    await d.schrijfLog(log(a, d.dag, leden, oud, null, 'fout'))
    return 'fout'
  }
  const anders = oud !== null && !zelfdeStaffel(oud, besluit.n)
  const gemaild = anders ? await d.mailWissel({ abonnement: a, actieveLeden: leden, oud, nieuw: besluit.n }).catch(() => false) : false
  await d.schrijfLog(log(a, d.dag, leden, oud, besluit.n, 'bijgewerkt', gemaild))
  await d.werkRijBij(a.id, { hoeveelheid: besluit.n, actieveLeden: leden })
  return 'bijgewerkt'
}

export type TelVerslag = Record<TelUitkomst | 'overgeslagen', number>

/** Alle abonnementen een voor een (Stripe-limieten); een fout bij een stopt de rest niet. */
export async function telAlles(abonnementen: readonly TelAbonnement[], d: TelDeps): Promise<TelVerslag> {
  const verslag: TelVerslag = { gelijk: 0, bijgewerkt: 0, op_maat: 0, opgezegd: 0, fout: 0, overgeslagen: 0 }
  for (const a of abonnementen) {
    const uit = await telAbonnement(a, d).catch(() => 'fout' as const)
    verslag[uit] += 1
  }
  return verslag
}


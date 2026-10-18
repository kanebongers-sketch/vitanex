// ─── Club, betalen: wat mag wanneer (PUUR) ──────────────────────────────────
// Welke producten een lid ziet, welk tegoed bruikbaar is, en wanneer een lid
// een groepsles met de strippenkaart boekt.
//
// Strippenkaart en lidmaatschapsregels: het lid boekt eerst gewoon. Staat de
// vorm van het lid geen groepslessen toe (magLesBoeken geeft 'groepslessen'),
// dan kiest het lid zelf "Boek met strippenkaart". Dan telt de vorm niet voor
// deze les (het lid betaalt hem met een strip); wel de vestigingen van de
// strippenkaart en alle gewone regels van het rooster (vol, boekvenster,
// no-shows). Mag de vorm de les wel, dan is er geen strip nodig.

import type { ToegangUitslag } from '@/lib/club/lidmaatschappen/regels'
import type { Product, Tegoed, TegoedSoort } from './model'

/** Is dit product te koop voor een lid van deze vestiging? */
export function productVoorVestiging(p: Pick<Product, 'actief' | 'vestigingen'>, vestiging: string): boolean {
  return p.actief && (p.vestigingen === null || p.vestigingen.includes(vestiging))
}

/** Kan dit tegoed nu gebruikt worden in deze vestiging? */
export function tegoedBruikbaar(t: Pick<Tegoed, 'saldo' | 'geldigTot' | 'vestigingen'>, vestiging: string, nu: Date): boolean {
  if (t.saldo <= 0) return false
  if (t.geldigTot && Date.parse(t.geldigTot) <= nu.getTime()) return false
  return t.vestigingen === null || t.vestigingen.includes(vestiging)
}

/** Het totaal aantal bruikbare lessen of sessies van een soort in deze vestiging. */
export function bruikbaarSaldo(tegoeden: readonly Tegoed[], soort: TegoedSoort, vestiging: string, nu: Date): number {
  return tegoeden.filter((t) => t.soort === soort && tegoedBruikbaar(t, vestiging, nu)).reduce((som, t) => som + t.saldo, 0)
}

export type StripBesluit =
  /** De vorm laat de les toe (of er is geen vorm): gewoon boeken, geen strip. */
  | { soort: 'niet_nodig' }
  /** De vorm heeft geen groepslessen: met een strip mag het. */
  | { soort: 'strip' }
  /** Een andere weigering (vestiging, daluren, maximum): ook een strip helpt niet. */
  | { soort: 'nee'; reden: string }

/**
 * Mag deze les met een strippenkaart? Alleen als de vorm van het lid geen
 * groepslessen toestaat. Andere weigeringen blijven gelden: een lid dat buiten
 * zijn daluren wil sporten of zijn weekmaximum haalt, boekt dat niet om met een
 * strip (houd het simpel en eerlijk tegenover de vorm die de sportschool koos).
 */
export function stripBesluit(uitslag: ToegangUitslag): StripBesluit {
  if (uitslag.mag) return { soort: 'niet_nodig' }
  if (uitslag.waarom === 'groepslessen') return { soort: 'strip' }
  return { soort: 'nee', reden: uitslag.reden }
}

const PT_NAAM = /(personal\s*training|\bpt\b|personal\s*coaching)/i

/** Is dit afspraaktype personal training (daar boekt de trainer een PT-tegoed op af)? */
export function isPtAfspraakType(naam: string | null | undefined): boolean {
  return typeof naam === 'string' && PT_NAAM.test(naam)
}

/** Een terugbetaling kan alleen bij een betaalde verkoop die nog niet terugbetaald of aangevraagd is. */
export function magTerugbetalen(v: { status: string; terugbetalingAangevraagd: boolean; terugbetaaldCent: number }): boolean {
  return v.status === 'betaald' && !v.terugbetalingAangevraagd && v.terugbetaaldCent === 0
}

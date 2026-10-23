// ─── Club: eerst de startwizard, dan de rest (PUUR) ─────────────────────────
// Besluit Kane (23-10-2026): een nieuwe sportschool loopt eerst de wizard af
// voordat de rest van Club open gaat. De Club-layout vraagt hier of dat geldt,
// en welke pagina's tot die tijd wel open zijn (de wizard, hulp en het
// abonnement). De API's houden we buiten de poort: de wizard heeft ze nodig.
//
// De regel (veilig: bij twijfel gaat Club open, nooit iemand buitengesloten):
// 1. Het master account (platform-eigenaar) ziet altijd alles.
// 2. Een demo (Voorbeeld Gym, Test Gym) en de eigen omgeving (Fit Factory,
//    id = beheerder_id) hebben nooit een poort.
// 3. Kon de voortgang niet worden gelezen: open.
// 4. Afgerond: open.
// 5. Geen voortgang: alleen een poort als de sportschool nog niets heeft
//    (geen lestypen, vaste lessen, medewerkers of leden). Een sportschool van
//    voor de wizard heeft data en blijft dus gewoon open.
// 6. Wel voortgang, nog niet afgerond: poort.

import type { StartVoortgang, WizardOrg } from './stappen'

export interface PoortInvoer {
  isPlatformEigenaar: boolean
  organisatie: WizardOrg
  beheerderId: string
  gelezen: { ok: true; voortgang: StartVoortgang | null } | { ok: false }
  /** Alleen nodig zonder voortgang: heeft de sportschool al lestypen, lessen, medewerkers of leden? */
  heeftData: () => Promise<boolean>
}

/** Moet deze sportschool eerst de wizard afronden? */
export async function wizardVerplicht(i: PoortInvoer): Promise<boolean> {
  if (i.isPlatformEigenaar) return false
  if (i.organisatie.demo || i.organisatie.id === i.beheerderId) return false
  if (!i.gelezen.ok) return false
  const v = i.gelezen.voortgang
  if (v === null) return !(await i.heeftData())
  return v.afgerondOp === null
}

/** De pagina's die tijdens de wizard open zijn (met alles eronder). */
export const OPEN_TIJDENS_WIZARD = ['/club/start', '/club/hulp', '/club/beheer/abonnement'] as const

/**
 * Het pad binnen Club, ook als het adres een sportschool ervoor heeft
 * (aiyourgym.com/<slug>/club/...) of op een subdomein zonder /club begint.
 */
export function clubDeel(pad: string): string {
  const schoon = pad.split(/[?#]/)[0].replace(/\/+$/, '') || '/'
  const delen = schoon.split('/').filter(Boolean)
  const i = delen.indexOf('club')
  if (i === 0 || i === 1) return `/${delen.slice(i).join('/')}`
  return schoon === '/' ? '/club' : `/club${schoon}`
}

/** Is deze pagina open terwijl de wizard nog loopt? */
export function openTijdensWizard(pad: string): boolean {
  const deel = clubDeel(pad)
  return OPEN_TIJDENS_WIZARD.some((open) => deel === open || deel.startsWith(`${open}/`))
}

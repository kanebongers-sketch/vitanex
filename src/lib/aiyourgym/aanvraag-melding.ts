// ─── AI Your Gym: mail aan de platform-eigenaar bij een nieuwe aanvraag (PUUR) ──
// Een demo-aanvraag, een prijsaanvraag of een hulpmelding uit Club kwam tot nu
// toe alleen in de database. De website belooft een antwoord binnen een
// werkdag, dus de platform-eigenaar krijgt meteen een kort mailtje. De inhoud
// staat in de mail (die is voor de eigenaar zelf); de volledige rij blijft op
// /club/platform en /club/hulp/meldingen. Alleen Nederlands: de ontvanger is
// het platform, niet de klant.

import { DEMO_MOMENTEN, DEMO_SOORTEN, type DemoAanvraag } from './demo-aanvraag'
import { SOORT_LABEL, type MeldingInvoer } from '@/lib/club/hulp/melding'

export interface PlatformMail {
  onderwerp: string
  tekst: string
}

/** Een regel voor in een onderwerp: zonder regeleinden of stuurtekens, ingekort. */
export function onderwerpDeel(v: string, max = 60): string {
  const schoon = v.replace(/[\u0000-\u001F\u007F]+/g, ' ').replace(/\s+/g, ' ').trim()
  return schoon.length > max ? `${schoon.slice(0, max - 3).trimEnd()}...` : schoon
}

function labelVan<T extends { sleutel: string; label: string }>(lijst: readonly T[], sleutel: string): string {
  return lijst.find((x) => x.sleutel === sleutel)?.label ?? sleutel
}

/** De mail bij een demo- of prijsaanvraag van de website. */
export function demoMeldingMail(a: DemoAanvraag, isPrijs: boolean, overzichtUrl: string): PlatformMail {
  const soortAanvraag = isPrijs ? 'Prijsaanvraag' : 'Demo-aanvraag'
  const regels = [
    `${soortAanvraag} via aiyourgym.com`,
    '',
    `Sportschool: ${a.sportschool}`,
    `Naam: ${a.naam}`,
    `E-mail: ${a.email}`,
    `Telefoon: ${a.telefoon}`,
    `Vestigingen: ${a.vestigingen}`,
    `Soort: ${labelVan(DEMO_SOORTEN, a.soort)}`,
    ...(isPrijs ? [] : [`Voorkeur: ${labelVan(DEMO_MOMENTEN, a.moment)}`]),
    ...(a.opmerking ? ['', a.opmerking] : []),
    '',
    'De website belooft een reactie binnen een werkdag.',
    `Alle aanvragen: ${overzichtUrl}`,
  ]
  return { onderwerp: `${soortAanvraag}: ${onderwerpDeel(a.sportschool)}`, tekst: regels.join('\n') }
}

export interface HulpAfzender {
  sportschool: string
  melder: string
}

/** De mail bij een vraag, probleem of wens uit Club. */
export function hulpMeldingMail(m: MeldingInvoer, van: HulpAfzender, overzichtUrl: string): PlatformMail {
  const soort = SOORT_LABEL[m.soort]
  const regels = [
    `${soort} uit Club`,
    '',
    `Sportschool: ${van.sportschool}`,
    `Van: ${van.melder}`,
    ...(m.pagina ? [`Pagina: ${m.pagina}`] : []),
    `Onderwerp: ${m.onderwerp}`,
    '',
    m.beschrijving,
    '',
    `Beantwoorden: ${overzichtUrl}`,
  ]
  return { onderwerp: `${soort} van ${onderwerpDeel(van.sportschool, 40)}: ${onderwerpDeel(m.onderwerp)}`, tekst: regels.join('\n') }
}

const EMAIL = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/

/**
 * Naar wie de mail gaat. AIYOURGYM_MELDINGEN_AAN (een of meer adressen,
 * gescheiden door komma's) gaat voor; zonder die instelling de actieve
 * platform-accounts. Ongeldige adressen vallen weg, dubbele ook.
 */
export function meldingOntvangers(env: Record<string, string | undefined>, platformAdressen: readonly string[]): string[] {
  const eigen = (env.AIYOURGYM_MELDINGEN_AAN ?? '').split(',').map((v) => v.trim().toLowerCase()).filter((v) => EMAIL.test(v))
  const bron = eigen.length > 0 ? eigen : platformAdressen.map((v) => v.trim().toLowerCase()).filter((v) => EMAIL.test(v))
  return [...new Set(bron)].slice(0, 5)
}

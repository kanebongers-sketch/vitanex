// ─── AI Your Gym: de twee talen (PUUR) ──────────────────────────────────────
// Besluit Kane (24-10-2026): heel AI Your Gym in Nederlands en Engels. Nederlands
// is de bron. Puur en zonder Next, zodat het overal te gebruiken en te testen is
// (proxy, server, client, mails). Staat volledig los van de MentaForce-i18n.
// Werkwijze en regels: docs/aiyourgym/TALEN.md.

export type Taal = 'nl' | 'en'

export const TALEN: readonly Taal[] = ['nl', 'en']
export const STANDAARD_TAAL: Taal = 'nl'

/** De locale voor datums, getallen en bedragen per taal. */
export const LOCALE: Readonly<Record<Taal, string>> = { nl: 'nl-NL', en: 'en-GB' }

/** Voor <html lang>. */
export const HTML_LANG: Readonly<Record<Taal, string>> = { nl: 'nl', en: 'en' }

/** Voor og:locale. */
export const OG_LOCALE: Readonly<Record<Taal, string>> = { nl: 'nl_NL', en: 'en_GB' }

/**
 * De gekozen taal, overal in AI Your Gym (website, Club, ledenapp), gezet door
 * de taalkeuze NL | EN. Besluit Kane (24-10-2026): geen /en in adressen en geen
 * browsertaal; zonder cookie altijd Nederlands.
 */
export const TAAL_COOKIE = 'ayg-taal'
/** Een jaar bewaren. */
export const TAAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

/**
 * De opties van de cookie als de server hem zet (de oude /en-links). Niet
 * httpOnly: de taalkeuze in de browser moet hem kunnen overschrijven.
 */
export const TAAL_COOKIE_OPTIES = {
  path: '/',
  sameSite: 'lax',
  secure: true,
  httpOnly: false,
  maxAge: TAAL_COOKIE_MAX_AGE,
} as const

/** De kop met het publieke pad van een websitepagina ('/functies'), voor de canonical. */
export const SITE_PAD_KOP = 'x-ayg-site-pad'

export function isTaal(waarde: unknown): waarde is Taal {
  return waarde === 'nl' || waarde === 'en'
}

/**
 * De taal voor de hele groep (website, Club, ledenapp): de gekozen taal uit de
 * cookie, anders Nederlands. Bewust niet de taal van de browser.
 */
export function kiesTaal(voorkeur: string | null | undefined): Taal {
  return isTaal(voorkeur) ? voorkeur : STANDAARD_TAAL
}

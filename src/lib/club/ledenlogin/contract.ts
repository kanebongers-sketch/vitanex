// ─── Club, ledenlogin: het contract tussen de inlog en de web-app (PUUR) ────
// Leden loggen zelf in op de ledenapp (de web-app op het beginscherm). Dit
// bestand legt vast wat beide kanten van elkaar weten, zodat de inlog
// (src/lib/club/ledenlogin/**) en de schil van de web-app (src/app/(hoofd)/mijn/**,
// manifest, service worker) los van elkaar gebouwd kunnen worden.
//
// Schakelaar CLUB_LEDEN_LOGIN (src/lib/club/ledenlogin/schakelaar.ts) staat UIT
// tot de presentatie: dan bestaat /mijn alleen als voorvertoning voor Kane.

/** Het pad van de web-app voor leden. Op een subdomein: <slug>.aiyourgym.com/mijn. */
export const LEDENAPP_PAD = '/mijn'

/** De tabbladen van de web-app, gelijk aan de ledenapp in Club. */
export const LEDENAPP_TABBLADEN = ['home', 'lessen', 'afspraken', 'schema', 'voeding', 'voortgang', 'profiel'] as const
export type LedenappTabblad = (typeof LEDENAPP_TABBLADEN)[number]

/** Wat de web-app over de sportschool nodig heeft voor manifest, icoon en kleuren. */
export interface LedenappMerk {
  /** club_organisaties.id (= user_id van alle club_*-tabellen). */
  organisatieId: string
  naam: string
  slug: string | null
  kleurAccent: string
  thema: 'donker' | 'licht'
  /** URL van het logo (via /api/club/organisatie/logo) of null. */
  logoUrl: string | null
}

import { cache } from 'react'
import { cookies, headers } from 'next/headers'
import { SITE_PAD_KOP, TAAL_COOKIE, kiesTaal, type Taal } from './taal'
import { tekst, type Woordenboek } from './woordenboek'

// ─── AI Your Gym: de taal in servercomponenten ──────────────────────────────
// Besluit Kane (24-10-2026): overal dezelfde bron. De taal komt uit de cookie
// ayg-taal (gezet door de taalkeuze NL | EN), anders Nederlands. Geen /en in
// het adres en geen browsertaal.

/** De taal van een pagina van de verkoopwebsite. */
export const getSiteTaal = cache(async (): Promise<Taal> => kiesTaal((await cookies()).get(TAAL_COOKIE)?.value))

/**
 * Het publieke pad van de websitepagina ('/functies'), voor de canonical. null
 * als de proxy het niet meegaf (bijvoorbeeld op fitfactorypt.nl).
 */
export const getSitePad = cache(async (): Promise<string | null> => {
  const pad = (await headers()).get(SITE_PAD_KOP)
  return pad && pad.startsWith('/') ? pad : null
})

/** De taal voor Club en de ledenapp: dezelfde regel als de website. */
export const getTaal = getSiteTaal

/** De teksten van een woordenboek in de taal van de website. */
export async function siteTekst<T>(boek: Woordenboek<T>): Promise<T> {
  return tekst(boek, await getSiteTaal())
}

/** De teksten van een woordenboek in de taal van Club of de ledenapp. */
export async function clubTekst<T>(boek: Woordenboek<T>): Promise<T> {
  return tekst(boek, await getTaal())
}

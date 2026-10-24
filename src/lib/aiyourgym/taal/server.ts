import { cache } from 'react'
import { cookies, headers } from 'next/headers'
import { SITE_PAD_KOP, STANDAARD_TAAL, TAAL_COOKIE, TAAL_KOP, isTaal, kiesTaal, type Taal } from './taal'
import { tekst, type Woordenboek } from './woordenboek'

// ─── AI Your Gym: de taal in servercomponenten ──────────────────────────────
// Twee bronnen, bewust apart:
// - De website: de taal staat in het adres (/en/...). De proxy geeft hem mee
//   als kop TAAL_KOP; zonder kop Nederlands. Een cookie telt hier niet, zodat
//   een adres altijd dezelfde taal laat zien (ook voor zoekmachines).
// - Club en de ledenapp: de voorkeur van de gebruiker (cookie ayg-taal, later
//   per account), dan de browser (Accept-Language), dan Nederlands.

/** De taal van een pagina van de verkoopwebsite. */
export const getSiteTaal = cache(async (): Promise<Taal> => {
  const kop = (await headers()).get(TAAL_KOP)
  return isTaal(kop) ? kop : STANDAARD_TAAL
})

/**
 * Het publieke pad van de websitepagina zonder taal ('/functies'), voor
 * hreflang. null als de proxy het niet meegaf (bijvoorbeeld op fitfactorypt.nl).
 */
export const getSitePad = cache(async (): Promise<string | null> => {
  const pad = (await headers()).get(SITE_PAD_KOP)
  return pad && pad.startsWith('/') ? pad : null
})

/** De taal voor Club en de ledenapp. */
export const getTaal = cache(async (): Promise<Taal> => {
  const [koekjes, koppen] = await Promise.all([cookies(), headers()])
  return kiesTaal(koekjes.get(TAAL_COOKIE)?.value, koppen.get('accept-language'))
})

/** De teksten van een woordenboek in de taal van de website. */
export async function siteTekst<T>(boek: Woordenboek<T>): Promise<T> {
  return tekst(boek, await getSiteTaal())
}

/** De teksten van een woordenboek in de taal van Club of de ledenapp. */
export async function clubTekst<T>(boek: Woordenboek<T>): Promise<T> {
  return tekst(boek, await getTaal())
}

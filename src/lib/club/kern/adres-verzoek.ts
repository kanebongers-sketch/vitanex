// ─── Club: welke sportschool noemt het adres van dit verzoek (SERVER-ONLY) ──
// Met subdomeinen aan het subdomein (<slug>.aiyourgym.com); anders het pad
// aiyourgym.com/<slug> (kop van de proxy) of de cookie van de laatst geopende
// omgeving. De regels staan, getest, in pad-adres.ts.

import { cookies, headers } from 'next/headers'
import { isAygHost } from '@/lib/aiyourgym/host'
import { slugUitHost } from './subdomein'
import { ADRES_COOKIE, SLUG_KOP, kiesAdres, type VerzoekAdres } from './pad-adres'

/** Staan de subdomeinen per sportschool aan (CLUB_SUBDOMEINEN_ACTIEF)? */
export function subdomeinenActief(): boolean {
  return process.env.CLUB_SUBDOMEINEN_ACTIEF === '1'
}

export async function adresVanVerzoek(): Promise<VerzoekAdres | null> {
  const [h, c] = await Promise.all([headers(), cookies()])
  const host = h.get('host')
  const aan = subdomeinenActief()
  return kiesAdres({
    subdomein: aan ? slugUitHost(host) : null,
    subdomeinenAan: aan,
    websiteHost: isAygHost(host),
    kop: h.get(SLUG_KOP),
    cookie: c.get(ADRES_COOKIE)?.value,
  })
}

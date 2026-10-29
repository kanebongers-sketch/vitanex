// ─── Club: de handleidingen in de gekozen taal (PUUR) ───────────────────────
// Los van artikelen.ts, omdat het woordenboek de Nederlandse bron daaruit leest.

import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { HULP_ARTIKELEN, type ArtikelTekst } from '@/lib/aiyourgym/taal/woorden/club/hulp-artikelen'
import type { Module } from '@/lib/club/kern/organisatie'
import { ARTIKELEN, zichtbareArtikelen, type Artikel } from './artikelen'

/** Een handleiding met titel, samenvatting, stappen en linklabels in de gekozen taal. */
export function artikelInTaal(a: Artikel, taal: Taal): Artikel {
  const t = (HULP_ARTIKELEN[taal] as Readonly<Record<string, ArtikelTekst | undefined>>)[a.sleutel]
  if (!t) return a
  const bron = ARTIKELEN.find((x) => x.sleutel === a.sleutel)
  // De links kunnen gefilterd zijn: zoek het label op via de plek in de bron.
  const links = a.links.map((l) => {
    const i = bron ? bron.links.findIndex((b) => b.pad === l.pad) : -1
    return i >= 0 && t.links[i] ? { ...l, label: t.links[i] } : l
  })
  return { ...a, titel: t.titel, samenvatting: t.samenvatting, stappen: t.stappen, links }
}

/** De handleidingen die deze persoon ziet (zie zichtbareArtikelen), in de gekozen taal. */
export function zichtbareArtikelenIn(uit: readonly Module[], toegestaan: readonly string[] | null, taal: Taal): Artikel[] {
  return zichtbareArtikelen(uit, toegestaan).map((a) => artikelInTaal(a, taal))
}

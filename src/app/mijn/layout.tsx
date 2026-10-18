import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { lidToegang } from '@/lib/club/ledenlogin/toegang'
import { ledenappMerkVoorVerzoek } from '@/lib/club/ledenapp-pwa/merk-server'
import { ledenappMetadata, ledenappViewport } from '@/lib/club/ledenapp-pwa/metadata'
import type { LedenappMerk } from '@/lib/club/ledenlogin/contract'
import { RegistreerSw } from '@/components/club/ledenapp-pwa/RegistreerSw'

// /mijn: de ledenapp voor leden van een sportschool (web-app op het
// beginscherm). Elke pagina controleert zelf wie er is (src/lib/club/ledenlogin/
// toegang.ts) en zet de huisstijl van de sportschool. Hier alleen de schil van
// de web-app: manifest, icoon en kleur van de sportschool en de service worker.
// Nooit in zoekmachines en nooit een referrer: de inloglink staat in de URL.

/** Het merk van dit verzoek: de sportschool van het ingelogde lid, Kane, of het subdomein. */
async function merkVoorVerzoek(): Promise<LedenappMerk | null> {
  const lid = await lidToegang(null)
  const uitslag = await ledenappMerkVoorVerzoek({ lidOrganisatieId: lid?.userId ?? null })
  return uitslag.soort === 'merk' ? uitslag.bron.merk : null
}

export async function generateMetadata(): Promise<Metadata> {
  return { ...ledenappMetadata(await merkVoorVerzoek()), referrer: 'no-referrer' }
}

export async function generateViewport(): Promise<Viewport> {
  return ledenappViewport(await merkVoorVerzoek())
}

// De installeerhulp staat in de app zelf (src/app/mijn/page.tsx), binnen de
// huisstijl van de sportschool en pas na het inloggen.
export default function MijnLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <RegistreerSw />
    </>
  )
}

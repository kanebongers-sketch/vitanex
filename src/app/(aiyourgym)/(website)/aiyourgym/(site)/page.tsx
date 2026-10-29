import type { Metadata } from 'next'
import { Feiten } from '@/components/aiyourgym/voorpagina/Feiten'
import { HeldMozaiek } from '@/components/aiyourgym/voorpagina/HeldMozaiek'
import { Onthul } from '@/components/aiyourgym/voorpagina/Onthul'
import { Oproep } from '@/components/aiyourgym/voorpagina/Oproep'
import { OverKane } from '@/components/aiyourgym/voorpagina/OverKane'
import { Producten } from '@/components/aiyourgym/voorpagina/Producten'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { SITE_META } from '@/lib/aiyourgym/taal/woorden/website/meta'

export async function generateMetadata(): Promise<Metadata> {
  const t = SITE_META[await getSiteTaal()]
  return { title: { absolute: t.titel }, description: t.homeOmschrijving }
}

// De voorpagina in kleurhoofdstukken: elk hoofdstuk een eigen vol merkvlak, tegen
// elkaar aan, zonder lijnen ertussen. Kort en gericht op aanmelden (besluit Kane
// 21-10-2026): de held (papier), vier productblokken met echte schermen van Club
// (lagen obsidiaan), een band met feiten uit het product (diep), wie het bouwt en
// de oproep (de hoogste laag). Details op de
// subpagina's.
export default function AiYourGymHome() {
  return (
    <div className="vp">
      <HeldMozaiek />
      <Producten />
      <Feiten />
      <OverKane />
      <Oproep />
      <Onthul />
    </div>
  )
}

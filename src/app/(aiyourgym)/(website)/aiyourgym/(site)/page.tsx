import type { Metadata } from 'next'
import { Anders } from '@/components/aiyourgym/voorpagina/Anders'
import { Bouwer } from '@/components/aiyourgym/voorpagina/Bouwer'
import { Coaching } from '@/components/aiyourgym/voorpagina/Coaching'
import { HeldMozaiek } from '@/components/aiyourgym/voorpagina/HeldMozaiek'
import { Onthul } from '@/components/aiyourgym/voorpagina/Onthul'
import { Oproep } from '@/components/aiyourgym/voorpagina/Oproep'
import { Overstap } from '@/components/aiyourgym/voorpagina/Overstap'
import { Plekken } from '@/components/aiyourgym/voorpagina/Plekken'
import { Product } from '@/components/aiyourgym/voorpagina/Product'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { SITE_META } from '@/lib/aiyourgym/taal/woorden/website/meta'

export async function generateMetadata(): Promise<Metadata> {
  const t = SITE_META[await getSiteTaal()]
  return { title: { absolute: t.titel }, description: t.homeOmschrijving }
}

// De voorpagina in de richting "Obsidian Luxury" (besluit Kane 28-10-2026). Een
// ritme van obsidiaan, ivoor en antraciet: held (obsidiaan), vijf plekken (ivoor),
// het product (obsidiaan), coaching bij elke oefening (antraciet), wat we wel en
// niet doen (ivoor), overstappen (obsidiaan), wie het bouwt (antraciet) en de
// oproep (ivoor). Kort en gericht op aanmelden (besluit Kane 21-10-2026); de details
// staan op de subpagina's.
export default function AiYourGymHome() {
  return (
    <div className="vp">
      <HeldMozaiek />
      <Plekken />
      <Product />
      <Coaching />
      <Anders />
      <Overstap />
      <Bouwer />
      <Oproep />
      <Onthul />
    </div>
  )
}

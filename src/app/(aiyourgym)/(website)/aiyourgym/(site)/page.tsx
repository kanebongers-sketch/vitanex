import type { Metadata } from 'next'
import { Bouwer } from '@/components/aiyourgym/voorpagina/Bouwer'
import { HeldMozaiek } from '@/components/aiyourgym/voorpagina/HeldMozaiek'
import { Inchecken } from '@/components/aiyourgym/voorpagina/Inchecken'
import { Onthul } from '@/components/aiyourgym/voorpagina/Onthul'
import { Oproep } from '@/components/aiyourgym/voorpagina/Oproep'
import { Plekken } from '@/components/aiyourgym/voorpagina/Plekken'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { SITE_META } from '@/lib/aiyourgym/taal/woorden/website/meta'

export async function generateMetadata(): Promise<Metadata> {
  const t = SITE_META[await getSiteTaal()]
  return { title: { absolute: t.titel }, description: t.homeOmschrijving }
}

// De voorpagina in kleurhoofdstukken (richting 28-10-2026, ontwerp in Figma): elk
// hoofdstuk een eigen vol merkvlak, tegen elkaar aan, zonder lijnen ertussen.
// Kort en gericht op aanmelden (besluit Kane 21-10-2026): held (creme), inchecken
// (racegroen), in een oogopslag (creme), wie het bouwt (flessengroen paneel) en de
// oproep (salie). De voet sluit af in tegels (inkt). Details op de subpagina's.
export default function AiYourGymHome() {
  return (
    <div className="vp">
      <HeldMozaiek />
      <Inchecken />
      <Plekken />
      <Bouwer />
      <Oproep />
      <Onthul />
    </div>
  )
}

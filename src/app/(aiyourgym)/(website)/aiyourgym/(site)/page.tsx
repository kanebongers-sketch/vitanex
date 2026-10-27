import type { Metadata } from 'next'
import { Dagklok } from '@/components/aiyourgym/dag/Dagklok'
import { momentTijd } from '@/components/aiyourgym/dag/momenten'
import { Held } from '@/components/aiyourgym/home/Held'
import { Oogopslag } from '@/components/aiyourgym/home/Oogopslag'
import { Praktijk } from '@/components/aiyourgym/home/Praktijk'
import { Schemas } from '@/components/aiyourgym/home/Schemas'
import { AanmeldBand } from '@/components/aiyourgym/site/AanmeldBand'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { DAG } from '@/lib/aiyourgym/taal/woorden/website/dag'
import { SITE_META } from '@/lib/aiyourgym/taal/woorden/website/meta'

export async function generateMetadata(): Promise<Metadata> {
  const t = SITE_META[await getSiteTaal()]
  return { title: { absolute: t.titel }, description: t.homeOmschrijving }
}

// De voorpagina als werkdag in een sportschool (grammatica "Werkdag", zie
// docs/aiyourgym/scroll-craft/BRIEF.md). Kort en gericht op aanmelden (besluit
// Kane 21-10-2026): 06:00 de held, 07:00 alles in een oogopslag, 10:30 de
// schemabouw (de piek), 21:30 Kane kort, 22:00 de afsluitende oproep. Details
// staan op de subpagina's. De dagklok (pc) loopt met de scroll door de dag.
export default async function AiYourGymHome() {
  const d = DAG[await getSiteTaal()]
  return (
    <div className="ayg-home dag">
      <Held />
      <Oogopslag />
      <Schemas />
      <Praktijk />
      <AanmeldBand titel={d.bandTitel} moment={{ id: 'dicht', minuten: momentTijd('dicht'), naam: d.momenten.dicht }} />
      <Dagklok />
    </div>
  )
}

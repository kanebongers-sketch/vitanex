import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { eisClubToegang } from '@/lib/club/toegang'
import { ONDERDELEN, isZichtbaar } from '@/components/club/shell/onderdelen'
import { RechtenMatrix } from '@/components/club/beheer/RechtenMatrix'
import '@/components/club/beheer/beheer.css'

export const metadata: Metadata = { title: 'Rechten per rol' }

// Wat elke rol ziet. De onderdelen voor beheer (instellingencentrum, huisstijl,
// instellingen) horen bij de eigenaar en clubmanagers met beheerrechten.

const ALLEEN_BEHEER = new Set(['beheer', 'bedrijf', 'sluiting', 'huisstijl'])

export default async function RechtenPagina() {
  const t = await eisClubToegang()
  const onderdelen = ONDERDELEN.filter((o) => !ALLEEN_BEHEER.has(o.sleutel) && isZichtbaar(o, t.organisatie.uit)).map((o) => ({ sleutel: o.sleutel, label: o.label, uitleg: o.uitleg }))
  return (
    <>
      <Link href="/clubkane/beheer" className="club-terug">
        <ArrowLeft size={16} aria-hidden /> Instellingencentrum
      </Link>
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{t.organisatie.naam}</p>
          <h1>Rechten per rol</h1>
          <p>
            Vink aan welke onderdelen elke rol ziet. De eigenaar ziet altijd alles. Deze rechten gelden zodra medewerkers met een eigen
            account inloggen; nu werk jij nog als enige in Club.
          </p>
        </div>
      </header>
      <RechtenMatrix begin={t.organisatie.instellingen.rechten} onderdelen={onderdelen} />
    </>
  )
}

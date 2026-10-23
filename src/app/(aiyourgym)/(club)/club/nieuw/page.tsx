import type { Metadata } from 'next'
import { eisClubToegang } from '@/lib/club/toegang'
import { aantalNieuw } from '@/lib/aiyourgym/nieuw'
import { NieuwLijst } from '@/components/club/shell/NieuwLijst'
import { kijkerSleutel } from '@/components/club/shell/hulpbalk'

export const metadata: Metadata = { title: 'Wat is nieuw' }

// Wat is nieuw (hulpbalk onderaan): wat er per datum echt bij is gekomen in
// Club. Dezelfde bron als de website (src/lib/aiyourgym/nieuw.ts): alleen wat
// live is, nooit beloftes. Iedereen die binnen is mag dit zien.

export default async function NieuwPagina() {
  const t = await eisClubToegang()
  const persoon = kijkerSleutel(t)
  return (
    <>
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{t.organisatie.naam}</p>
          <h1>Wat is nieuw</h1>
          <p>Wat er in Club is bijgekomen en nu werkt, met de datum waarop het live ging. {aantalNieuw()} updates tot nu toe.</p>
        </div>
      </header>
      <NieuwLijst persoon={persoon} />
    </>
  )
}

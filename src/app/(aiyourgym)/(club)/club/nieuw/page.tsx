import type { Metadata } from 'next'
import { eisClubToegang } from '@/lib/club/toegang'
import { aantalNieuw } from '@/lib/aiyourgym/nieuw'
import { NieuwLijst } from '@/components/club/shell/NieuwLijst'
import { kijkerSleutel } from '@/components/club/shell/hulpbalk-items'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { MENU } from '@/lib/aiyourgym/taal/woorden/club/menu'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(MENU)).nieuw.titel }
}

// Wat is nieuw (hulpbalk onderaan): wat er per datum echt bij is gekomen in
// Club. Dezelfde bron als de website (src/lib/aiyourgym/nieuw.ts): alleen wat
// live is, nooit beloftes. Iedereen die binnen is mag dit zien.

export default async function NieuwPagina() {
  const t = await eisClubToegang()
  const persoon = kijkerSleutel(t)
  const tekst = (await clubTekst(MENU)).nieuw
  return (
    <>
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{t.organisatie.naam}</p>
          <h1>{tekst.titel}</h1>
          <p>{tekst.intro(aantalNieuw())}</p>
        </div>
      </header>
      <NieuwLijst persoon={persoon} />
    </>
  )
}

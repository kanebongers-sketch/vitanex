import type { Metadata } from 'next'
import { eisBeheerdersBeheer } from '@/lib/club/toegang'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { RechtenMatrix } from '@/components/club/beheer/RechtenMatrix'
import { rechtenGroepen } from '@/components/club/beheer/rechten-groepen'
import '@/components/club/beheer/beheer.css'
import { InstelKruimel } from '@/components/club/beheer/InstelKruimel'
import { instelKop, instelMetadata } from '@/components/club/beheer/instel-metadata'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { BEHEER } from '@/lib/aiyourgym/taal/woorden/club/beheer'

export async function generateMetadata(): Promise<Metadata> {
  return instelMetadata('rechten')
}

// Wat elke rol ziet, gegroepeerd zoals het menu (zie rechten-groepen.ts).

export default async function RechtenPagina() {
  // Alleen Kane en de eigenaar: een clubmanager mag nooit zijn eigen rechten verruimen.
  const t = await eisBeheerdersBeheer()
  const kop = await instelKop('rechten')
  const tekst = (await clubTekst(BEHEER)).rechten
  return (
    <>
      <InstelKruimel id="rechten" />
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{t.organisatie.naam}</p>
          <h1>{kop.titel}</h1>
          <p>{tekst.intro}</p>
        </div>
      </header>
      <RechtenMatrix begin={t.organisatie.instellingen.rechten} groepen={rechtenGroepen(t.organisatie.uit, await getTaal())} />
    </>
  )
}

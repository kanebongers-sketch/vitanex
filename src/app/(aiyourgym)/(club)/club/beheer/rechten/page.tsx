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
import { rollenV2Aan } from '@/lib/club/rollen/schakelaar'
import { rolrechtenVan } from '@/lib/club/rollen/profiel'
import { RechtenV2 } from '@/components/club/rollen/RechtenV2'
import { ROLLEN_TEKST } from '@/lib/aiyourgym/taal/woorden/club/rollen'

export async function generateMetadata(): Promise<Metadata> {
  return instelMetadata('rechten')
}

// Wat elke rol ziet, gegroepeerd zoals het menu (zie rechten-groepen.ts).

export default async function RechtenPagina() {
  // Alleen Kane en de eigenaar: een clubmanager mag nooit zijn eigen rechten verruimen.
  const t = await eisBeheerdersBeheer()
  const kop = await instelKop('rechten')
  const tekst = (await clubTekst(BEHEER)).rechten
  // Rollen v2: vier niveaus per rol, slotjes voor de eigenaar, startpagina en voorvertoning.
  const v2 = rollenV2Aan(t.organisatie.id)
  const intro = v2 ? (await clubTekst(ROLLEN_TEKST)).rechten.intro : tekst.intro
  return (
    <>
      <InstelKruimel id="rechten" />
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{t.organisatie.naam}</p>
          <h1>{kop.titel}</h1>
          <p>{intro}</p>
        </div>
      </header>
      {v2 ? (
        <RechtenV2 begin={rolrechtenVan(t.organisatie)} uit={t.organisatie.uit} />
      ) : (
        <RechtenMatrix begin={t.organisatie.instellingen.rechten} groepen={rechtenGroepen(t.organisatie.uit, await getTaal())} />
      )}
    </>
  )
}

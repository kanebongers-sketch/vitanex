import type { Metadata } from 'next'
import { eisBeheerdersBeheer } from '@/lib/club/toegang'
import { RechtenMatrix } from '@/components/club/beheer/RechtenMatrix'
import { rechtenGroepen } from '@/components/club/beheer/rechten-groepen'
import '@/components/club/beheer/beheer.css'
import { InstelKruimel } from '@/components/club/beheer/InstelKruimel'

export const metadata: Metadata = { title: 'Rechten per rol' }

// Wat elke rol ziet, gegroepeerd zoals het menu (zie rechten-groepen.ts).

export default async function RechtenPagina() {
  // Alleen Kane en de eigenaar: een clubmanager mag nooit zijn eigen rechten verruimen.
  const t = await eisBeheerdersBeheer()
  return (
    <>
      <InstelKruimel id="rechten" />
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
      <RechtenMatrix begin={t.organisatie.instellingen.rechten} groepen={rechtenGroepen(t.organisatie.uit)} />
    </>
  )
}

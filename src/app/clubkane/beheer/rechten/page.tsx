import type { Metadata } from 'next'
import { eisBeheerdersBeheer } from '@/lib/club/toegang'
import { GROEPEN, ONDERDELEN, inMenu, isZichtbaar } from '@/components/club/shell/onderdelen'
import { RechtenMatrix, type RechtenGroep } from '@/components/club/beheer/RechtenMatrix'
import { NOOIT_VOOR_CLUBMANAGER } from '@/lib/club/beheerders/rechten'
import type { Module } from '@/lib/club/kern/organisatie'
import '@/components/club/beheer/beheer.css'
import { InstelKruimel } from '@/components/club/beheer/InstelKruimel'

export const metadata: Metadata = { title: 'Rechten per rol' }

// Wat elke rol ziet, gegroepeerd zoals het menu, plus de groep Instellingen
// voor wat alleen via het instellingencentrum gaat. Niet in de lijst: wat
// alleen de eigenaar heeft (NOOIT_VOOR_CLUBMANAGER) en Hulp (heeft iedereen).

const NIET_IN_LIJST: ReadonlySet<string> = new Set([...NOOIT_VOOR_CLUBMANAGER, 'hulp'])

function rechtenGroepen(uit: readonly Module[]): RechtenGroep[] {
  const kort = (o: (typeof ONDERDELEN)[number]) => ({ sleutel: o.sleutel, label: o.label, uitleg: o.uitleg })
  const telt = ONDERDELEN.filter((o) => !NIET_IN_LIJST.has(o.sleutel) && isZichtbaar(o, uit))
  const menu = GROEPEN.map((g) => ({ label: g.label, onderdelen: telt.filter((o) => inMenu(o) && o.groep === g.sleutel).map(kort) }))
  const instellingen = { label: 'Instellingen', onderdelen: telt.filter((o) => !inMenu(o)).map(kort) }
  return [...menu, instellingen].filter((g) => g.onderdelen.length > 0)
}

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

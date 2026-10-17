import type { Metadata } from 'next'
import { eisModule } from '@/lib/club/toegang'
import { kiesVestiging, VESTIGING_LABEL, type ZoekParams } from '@/lib/club/kern/vestiging'
import { haalTaken } from '@/lib/club/taken/opslag'
import { BeheerLijst } from '@/components/club/taken/BeheerLijst'
import { KopieerLijsten, NieuweLijst } from '@/components/club/taken/LijstActies'
import { TakenKop } from '@/components/club/taken/TakenKop'
import '@/components/club/taken/taken.css'

export const metadata: Metadata = { title: 'Taken beheren' }

// Lijsten en taken per vestiging: toevoegen, hernoemen, verplaatsen, frequentie
// wijzigen, uitzetten, en kopieren naar een andere vestiging.

export default async function TakenBeheerPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisModule('taken')
  const params = await searchParams
  const vestiging = kiesVestiging(params.v)
  const data = await haalTaken(t.admin, t.userId, vestiging)

  return (
    <div className="club-taken-pagina">
      <TakenKop
        vestiging={vestiging}
        vestigingNaam={VESTIGING_LABEL[vestiging]}
        weergave="beheer"
        titel="Lijsten beheren"
        sub="Uitgezette taken verdwijnen van de lijsten maar blijven in de geschiedenis staan."
      />
      {!data ? (
        <p className="club-melding club-melding--fout" role="alert">
          De lijsten konden niet worden geladen. Ververs de pagina om het opnieuw te proberen.
        </p>
      ) : (
        <div className="club-raster">
          <div className="club-k8 club-taken-beheerkolom">
            {data.lijsten.length === 0 && <p className="club-leeg">Nog geen lijsten. Maak er een of kopieer ze van een andere vestiging.</p>}
            {data.lijsten.map((l, i) => (
              <BeheerLijst key={l.id} lijst={l} taken={data.taken.filter((x) => x.lijstId === l.id)} eerste={i === 0} laatste={i === data.lijsten.length - 1} />
            ))}
          </div>
          <aside className="club-k4 club-taken-beheerkolom">
            <NieuweLijst vestiging={vestiging} />
            <KopieerLijsten vestiging={vestiging} />
          </aside>
        </div>
      )}
    </div>
  )
}

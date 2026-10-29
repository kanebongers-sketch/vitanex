import type { Metadata } from 'next'
import { eisModule } from '@/lib/club/toegang'
import { type ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { GeenVestigingen } from '@/components/club/shell/GeenVestigingen'
import { haalTaken } from '@/lib/club/taken/opslag'
import { BeheerLijst } from '@/components/club/taken/BeheerLijst'
import { KopieerLijsten, NieuweLijst } from '@/components/club/taken/LijstActies'
import { TakenKop } from '@/components/club/taken/TakenKop'
import '@/components/club/taken/taken.css'
import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import { TAKEN } from '@/lib/aiyourgym/taal/woorden/club/taken'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(TAKEN)).pagina.metaBeheer }
}

// Lijsten en taken per vestiging: toevoegen, hernoemen, verplaatsen, frequentie
// wijzigen, uitzetten, en kopieren naar een andere vestiging.

export default async function TakenBeheerPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisModule('taken')
  const params = await searchParams
  const vestiging = kiesUit(t.vestigingen, params.v)
  if (!vestiging) return <GeenVestigingen />
  const data = await haalTaken(t.admin, t.userId, vestiging)
  const tp = TAKEN[await getTaal()]

  return (
    <div className="club-taken-pagina">
      <TakenKop
        vestiging={vestiging}
        vestigingNaam={naamVan(t.vestigingen, vestiging)}
        weergave="beheer"
        titel={tp.pagina.beheer}
        sub={tp.pagina.beheerSub}
      />
      {!data ? (
        <p className="club-melding club-melding--fout" role="alert">
          {tp.pagina.beheerFout}
        </p>
      ) : (
        <div className="club-raster">
          <div className="club-k8 club-taken-beheerkolom">
            {data.lijsten.length === 0 && <p className="club-leeg">{tp.beheer.geenLijsten}</p>}
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

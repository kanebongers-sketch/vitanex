import type { Metadata } from 'next'
import { eisClubToegang } from '@/lib/club/toegang'
import { type ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { GeenVestigingen } from '@/components/club/shell/GeenVestigingen'
import { haalKladblok } from '@/lib/club/kladblok/data'
import { Kladblok } from '@/components/club/kladblok/Kladblok'
import '@/components/club/kladblok/kladblok.css'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { NOTITIES } from '@/lib/aiyourgym/taal/woorden/club/notities'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(NOTITIES)).pagina.titel }
}

// Notities à la Evernote: overdracht, afspraken, kennis en ideeën per vestiging
// (of voor alle vestigingen). De open notitie staat in de URL (?n=<id>).
export default async function NotitiesPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisClubToegang()
  const zoek = await searchParams
  const vestiging = kiesUit(t.vestigingen, zoek.v)
  if (!vestiging) return <GeenVestigingen />
  const notities = await haalKladblok(t.admin, t.userId, vestiging)
  const n = Array.isArray(zoek.n) ? zoek.n[0] : zoek.n
  const tekst = (await clubTekst(NOTITIES)).pagina

  return (
    <>
      <section className="club-paginakop">
        <div>
          <p className="club-boventitel">{naamVan(t.vestigingen, vestiging)}</p>
          <h1>{tekst.titel}</h1>
          <p>{tekst.intro}</p>
        </div>
      </section>
      {notities === null ? (
        <p className="club-melding club-melding--fout" role="alert">{tekst.fout}</p>
      ) : (
        <Kladblok key={vestiging} vestiging={vestiging} begin={notities} startId={n ?? null} />
      )}
    </>
  )
}

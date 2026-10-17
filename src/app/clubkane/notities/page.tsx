import type { Metadata } from 'next'
import { eisClubToegang } from '@/lib/club/toegang'
import { type ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { GeenVestigingen } from '@/components/club/shell/GeenVestigingen'
import { haalKladblok } from '@/lib/club/kladblok/data'
import { Kladblok } from '@/components/club/kladblok/Kladblok'
import '@/components/club/kladblok/kladblok.css'

export const metadata: Metadata = { title: 'Notities' }

// Notities à la Evernote: overdracht, afspraken, kennis en ideeën per vestiging
// (of voor alle vestigingen). De open notitie staat in de URL (?n=<id>).
export default async function NotitiesPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisClubToegang()
  const zoek = await searchParams
  const vestiging = kiesUit(t.vestigingen, zoek.v)
  if (!vestiging) return <GeenVestigingen />
  const notities = await haalKladblok(t.admin, t.userId, vestiging)
  const n = Array.isArray(zoek.n) ? zoek.n[0] : zoek.n

  return (
    <>
      <section className="club-paginakop">
        <div>
          <p className="club-boventitel">{naamVan(t.vestigingen, vestiging)}</p>
          <h1>Notities</h1>
          <p>Overdracht tussen diensten, afspraken, kennis en ideeën. Alles op een plek, voor deze vestiging of voor alle vestigingen.</p>
        </div>
      </section>
      {notities === null ? (
        <p className="club-melding club-melding--fout" role="alert">De notities konden niet geladen worden. Vernieuw de pagina.</p>
      ) : (
        <Kladblok key={vestiging} vestiging={vestiging} begin={notities} startId={n ?? null} />
      )}
    </>
  )
}

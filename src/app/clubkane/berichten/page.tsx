import type { Metadata } from 'next'
import { eisClubToegang } from '@/lib/club/toegang'
import type { ZoekParams } from '@/lib/club/kern/vestiging'
import { hoortBij } from '@/lib/club/kern/vestigingen'
import { haalBerichten, haalLidTags } from '@/lib/club/berichten/data'
import { isSoort } from '@/lib/club/berichten/model'
import type { BeheerFilters, BerichtStatus } from '@/lib/club/berichten/regels'
import { GeenVestigingen } from '@/components/club/shell/GeenVestigingen'
import { BerichtenWerkvlak } from '@/components/club/berichten/BerichtenWerkvlak'
import '@/components/club/berichten/berichten.css'

export const metadata: Metadata = { title: 'Berichten' }

function eerste(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

function isStatus(v: unknown): v is BerichtStatus {
  return v === 'actief' || v === 'gepland' || v === 'verlopen'
}

// Nieuws en berichten voor leden: wat er nu in de ledenapp op Home staat, wat
// gepland is en wat verlopen is. Berichten gelden voor de hele sportschool of
// voor gekozen vestigingen, dus deze pagina toont alle vestigingen samen.
export default async function BerichtenPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisClubToegang()
  if (t.vestigingen.length === 0) return <GeenVestigingen />
  const zoek = await searchParams
  const status = eerste(zoek.status)
  const soort = eerste(zoek.soort)
  const voor = eerste(zoek.voor)
  const filters: BeheerFilters = {
    status: isStatus(status) ? status : 'alle',
    soort: isSoort(soort) ? soort : 'alle',
    vestiging: hoortBij(t.vestigingen, voor) ? voor : null,
  }
  const [berichten, tags] = await Promise.all([haalBerichten(t.admin, t.userId), haalLidTags(t.admin, t.userId)])

  return (
    <>
      <section className="club-paginakop">
        <div>
          <p className="club-boventitel">{t.organisatie.naam} · ledenapp</p>
          <h1>Berichten</h1>
          <p>Nieuws, acties en belangrijke mededelingen voor je leden. Ze staan in de ledenapp op Home, voor iedereen of alleen voor een vestiging, status of tag.</p>
        </div>
      </section>

      {berichten === null ? (
        <p className="club-melding club-melding--fout" role="alert">
          De berichten konden niet worden geladen. Ververs de pagina of probeer het later opnieuw.
        </p>
      ) : (
        <BerichtenWerkvlak begin={berichten} vestigingen={t.vestigingen} tags={tags} startFilters={filters} nuIso={new Date().toISOString()} />
      )}
    </>
  )
}

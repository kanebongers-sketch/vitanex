import type { Metadata } from 'next'
import { eisModule } from '@/lib/club/toegang'
import { type ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { GeenVestigingen } from '@/components/club/shell/GeenVestigingen'
import { haalDagPaneel } from '@/lib/club/checkin/data'
import { CheckinBalie } from '@/components/club/checkin/CheckinBalie'
import { NuBinnen } from '@/components/club/checkin/NuBinnen'
import { Verversen } from '@/components/club/checkin/Verversen'
import '@/components/club/checkin/checkin.css'

export const metadata: Metadata = { title: 'Check-in' }

export default async function CheckinPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisModule('checkin')
  const vestiging = kiesUit(t.vestigingen, (await searchParams).v)
  if (!vestiging) return <GeenVestigingen />
  const samenvatting = await haalDagPaneel(t.admin, t.userId, vestiging, new Date())
  return (
    <>
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{naamVan(t.vestigingen, vestiging)} · balie</p>
          <h1>Check-in</h1>
        </div>
      </header>
      <div className="club-checkin-raster">
        <CheckinBalie key={vestiging} vestiging={vestiging} />
        <NuBinnen samenvatting={samenvatting} vestiging={vestiging} />
      </div>
      <Verversen />
    </>
  )
}

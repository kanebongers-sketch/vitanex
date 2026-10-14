import type { Metadata } from 'next'
import { eisClubToegang } from '@/lib/club/toegang'
import { kiesVestiging, VESTIGING_LABEL, type ZoekParams } from '@/lib/club/gedeeld/vestiging'
import { haalDagPaneel } from '@/lib/club/checkin/data'
import { CheckinBalie } from '@/components/club/checkin/CheckinBalie'
import { NuBinnen } from '@/components/club/checkin/NuBinnen'
import { Verversen } from '@/components/club/checkin/Verversen'
import '@/components/club/checkin/checkin.css'

export const metadata: Metadata = { title: 'Check-in' }

export default async function CheckinPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisClubToegang()
  const vestiging = kiesVestiging((await searchParams).v)
  const samenvatting = await haalDagPaneel(t.admin, t.userId, vestiging, new Date())
  return (
    <>
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{VESTIGING_LABEL[vestiging]} · balie</p>
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

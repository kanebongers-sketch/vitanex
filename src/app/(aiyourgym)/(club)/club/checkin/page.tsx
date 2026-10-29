import type { Metadata } from 'next'
import Link from 'next/link'
import { MonitorSmartphone } from 'lucide-react'
import { eisModule } from '@/lib/club/toegang'
import { type ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { qrCheckinAan } from '@/lib/club/kern/org-instellingen'
import { GeenVestigingen } from '@/components/club/shell/GeenVestigingen'
import { haalDagPaneel } from '@/lib/club/checkin/data'
import { CheckinBalie } from '@/components/club/checkin/CheckinBalie'
import { NuBinnen } from '@/components/club/checkin/NuBinnen'
import { Verversen } from '@/components/club/checkin/Verversen'
import { magOnderdeel } from '@/lib/club/beheerders/rechten'
import { moduleAan } from '@/lib/club/kern/organisatie'
import '@/components/club/checkin/checkin.css'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { CHECKIN } from '@/lib/aiyourgym/taal/woorden/club/checkin'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(CHECKIN)).pagina.titel }
}

export default async function CheckinPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisModule('checkin')
  const vestiging = kiesUit(t.vestigingen, (await searchParams).v)
  if (!vestiging) return <GeenVestigingen />
  const samenvatting = await haalDagPaneel(t.admin, t.userId, vestiging, new Date())
  const { checkin } = t.organisatie.instellingen
  const tp = (await clubTekst(CHECKIN)).pagina
  // Vanuit het lid werken: namen linken naar de ledenkaart, alleen voor wie Leden mag zien.
  const magLeden = moduleAan(t.organisatie, 'leden') && magOnderdeel(t.onderdelen, 'leden')
  return (
    <>
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{tp.boventitel(naamVan(t.vestigingen, vestiging))}</p>
          <h1>{tp.titel}</h1>
        </div>
        {qrCheckinAan(checkin) && (
          <Link href={`/club/checkin/kiosk?v=${encodeURIComponent(vestiging)}`} className="club-knop club-knop--stil">
            <MonitorSmartphone aria-hidden size={17} /> {tp.kiosk}
          </Link>
        )}
      </header>
      <div className="club-checkin-raster">
        <CheckinBalie key={vestiging} vestiging={vestiging} methode={checkin.methode} magLeden={magLeden} />
        <NuBinnen samenvatting={samenvatting} vestiging={vestiging} magLeden={magLeden} />
      </div>
      <Verversen />
    </>
  )
}

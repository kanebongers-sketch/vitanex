import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { eisModule } from '@/lib/club/toegang'
import { type ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { qrCheckinAan } from '@/lib/club/kern/org-instellingen'
import { GeenVestigingen } from '@/components/club/shell/GeenVestigingen'
import { CheckinKiosk } from '@/components/club/checkin/CheckinKiosk'
import '@/components/club/checkin/checkin.css'

// Zelf-check-in voor een tablet bij de ingang: leden houden de QR-code uit hun
// app voor de camera. Alleen voor wie de check-in mag (layout: eisOnderdeel).
// De tablet blijft ingelogd als medewerker; het scherm kan zelf niets anders
// dan een app-code inchecken.

export const metadata: Metadata = { title: 'Zelf inchecken' }

export default async function KioskPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisModule('checkin')
  const vestiging = kiesUit(t.vestigingen, (await searchParams).v)
  if (!vestiging) return <GeenVestigingen />
  const terug = `/club/checkin?v=${encodeURIComponent(vestiging)}`
  if (!qrCheckinAan(t.organisatie.instellingen.checkin)) {
    return (
      <section className="club-paginakop">
        <div>
          <h1>Zelf inchecken staat uit</h1>
          <p>Deze sportschool checkt alleen aan de balie in. Zet de QR-code aan bij Instellingen, Check-in.</p>
          <Link href={terug} className="club-terug">
            <ArrowLeft size={16} aria-hidden /> Terug naar de balie
          </Link>
        </div>
      </section>
    )
  }
  return <CheckinKiosk vestiging={vestiging} vestigingNaam={naamVan(t.vestigingen, vestiging)} sportschool={t.organisatie.naam} terug={terug} />
}

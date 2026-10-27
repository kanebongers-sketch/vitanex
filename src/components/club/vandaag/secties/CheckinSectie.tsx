import { Suspense } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'
import type { CheckinMethode } from '@/lib/club/kern/org-instellingen'
import { haalDagPaneel } from '@/lib/club/checkin/data'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { VANDAAG_SECTIES } from '@/lib/aiyourgym/taal/woorden/club/vandaag'
import { CheckinBalie } from '@/components/club/checkin/CheckinBalie'
import { NuBinnen } from '@/components/club/checkin/NuBinnen'
import { SectieKop } from './SectieKop'
import '@/components/club/checkin/checkin.css'

// Bovenaan Vandaag: snel inchecken (zoeken en de QR-camera) en wie er nu binnen
// is. Het zoekveld staat meteen klaar; "Nu binnen" laadt los, zodat de balie
// nooit op de lijst hoeft te wachten. De vaste balie (scanner, tablet) en het
// zelf-check-in scherm blijven bereikbaar via de links in de kop.

interface Props {
  admin: SupabaseClient
  userId: string
  vestiging: Vestiging
  methode: CheckinMethode
  /** Staat zelf inchecken met QR aan? Dan de link naar het zelf-check-in scherm. */
  qrAan: boolean
  magLeden: boolean
}

async function NuBinnenLader({ admin, userId, vestiging, magLeden }: Pick<Props, 'admin' | 'userId' | 'vestiging' | 'magLeden'>) {
  const samenvatting = await haalDagPaneel(admin, userId, vestiging, new Date())
  return <NuBinnen samenvatting={samenvatting} vestiging={vestiging} magLeden={magLeden} tellers={false} />
}

export async function CheckinSectie({ admin, userId, vestiging, methode, qrAan, magLeden }: Props) {
  const w = (await clubTekst(VANDAAG_SECTIES)).checkin
  const links = [
    { href: clubPad('/checkin', vestiging), label: w.balie },
    ...(qrAan ? [{ href: clubPad('/checkin/kiosk', vestiging), label: w.kiosk }] : []),
  ]
  return (
    <section id="checkin" className="club-vandaag-sectie" aria-labelledby="vandaag-checkin">
      <SectieKop id="vandaag-checkin" titel={w.titel} sub={w.sub} links={links} />
      <div className="club-checkin-raster club-vandaag-checkin">
        <CheckinBalie key={vestiging} vestiging={vestiging} methode={methode} magLeden={magLeden} compact />
        <Suspense fallback={<div className="club-skelet" style={{ minHeight: 160 }} aria-hidden />}>
          <NuBinnenLader admin={admin} userId={userId} vestiging={vestiging} magLeden={magLeden} />
        </Suspense>
      </div>
    </section>
  )
}

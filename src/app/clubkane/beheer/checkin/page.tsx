import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { eisModule } from '@/lib/club/toegang'
import { CheckinMethodeFormulier } from '@/components/club/beheer/CheckinMethodeFormulier'
import '@/components/club/beheer/beheer.css'

export const metadata: Metadata = { title: 'Check-in instellen' }

export default async function CheckinInstellenPagina() {
  const t = await eisModule('checkin')
  return (
    <>
      <Link href="/clubkane/beheer" className="club-terug">
        <ArrowLeft size={16} aria-hidden /> Instellingencentrum
      </Link>
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{t.organisatie.naam}</p>
          <h1>Check-in</h1>
          <p>Kies hoe je leden binnenkomen. De QR-code in de app wisselt elke 30 seconden en werkt alleen bij jouw sportschool.</p>
        </div>
      </header>
      <CheckinMethodeFormulier key={t.organisatie.instellingen.checkin.methode} begin={t.organisatie.instellingen.checkin.methode} />
    </>
  )
}

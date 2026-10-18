import type { Metadata } from 'next'
import { eisModule, eisOnderdeel } from '@/lib/club/toegang'
import { CheckinMethodeFormulier } from '@/components/club/beheer/CheckinMethodeFormulier'
import '@/components/club/beheer/beheer.css'
import { InstelKruimel } from '@/components/club/beheer/InstelKruimel'

export const metadata: Metadata = { title: 'Check-in instellen' }

export default async function CheckinInstellenPagina() {
  await eisOnderdeel('beheer')
  const t = await eisModule('checkin')
  return (
    <>
      <InstelKruimel id="checkin" />
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

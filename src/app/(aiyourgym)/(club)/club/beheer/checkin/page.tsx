import type { Metadata } from 'next'
import { eisModule, eisOnderdeel } from '@/lib/club/toegang'
import { CheckinMethodeFormulier } from '@/components/club/beheer/CheckinMethodeFormulier'
import '@/components/club/beheer/beheer.css'
import { InstelKruimel } from '@/components/club/beheer/InstelKruimel'
import { instelKop, instelMetadata } from '@/components/club/beheer/instel-metadata'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { BEHEER } from '@/lib/aiyourgym/taal/woorden/club/beheer'

export async function generateMetadata(): Promise<Metadata> {
  return instelMetadata('checkin')
}

export default async function CheckinInstellenPagina() {
  await eisOnderdeel('beheer')
  const t = await eisModule('checkin')
  const kop = await instelKop('checkin')
  const tekst = (await clubTekst(BEHEER)).checkin
  return (
    <>
      <InstelKruimel id="checkin" />
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{t.organisatie.naam}</p>
          <h1>{kop.titel}</h1>
          <p>{tekst.intro}</p>
        </div>
      </header>
      <CheckinMethodeFormulier key={t.organisatie.instellingen.checkin.methode} begin={t.organisatie.instellingen.checkin.methode} />
    </>
  )
}

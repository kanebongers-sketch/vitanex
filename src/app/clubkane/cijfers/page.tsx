import type { Metadata } from 'next'
import { eisClubToegang } from '@/lib/club/toegang'
import { kiesVestiging, type ZoekParams } from '@/lib/club/gedeeld/vestiging'
import { haalRapport } from '@/lib/club/cijfers/haal-rapport'
import { kiesBereik, kiesPeriode } from '@/lib/club/cijfers/periode'
import { CijferKop } from '@/components/club/cijfers/CijferKop'
import { Kerncijfers } from '@/components/club/cijfers/Kerncijfers'
import { LedenHoofdstuk } from '@/components/club/cijfers/LedenHoofdstuk'
import { BezoekHoofdstuk } from '@/components/club/cijfers/BezoekHoofdstuk'
import { LessenHoofdstuk } from '@/components/club/cijfers/LessenHoofdstuk'
import { LeadsHoofdstuk, Vergelijking } from '@/components/club/cijfers/LeadsEnVergelijking'
import type { CijferContext } from '@/components/club/cijfers/context'
import '@/components/club/cijfers/cijfers.css'

// Cijfers: rapportages per vestiging of voor alle acht samen. Periode en
// bereik staan in de URL. Bij elk cijfer staat hoe het geteld is.

export const metadata: Metadata = { title: 'Cijfers' }

export default async function ClubCijfers({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisClubToegang()
  const zoek = await searchParams
  const vestiging = kiesVestiging(zoek.v)
  const weken = kiesPeriode(zoek.weken)
  const bereik = kiesBereik(zoek.bereik)
  const { rapport, maandagen, vandaag, meldingen } = await haalRapport(t.admin, t.userId, vestiging, weken, bereik)
  const c: CijferContext = { rapport, maandagen, vestiging, bereik, weken, vandaag }
  return (
    <>
      <CijferKop vestiging={vestiging} weken={weken} bereik={bereik} van={maandagen[0]} vandaag={vandaag} />
      {meldingen.map((m) => (
        <p key={m} className="club-melding club-melding--fout" role="status">
          {m}
        </p>
      ))}
      <Kerncijfers c={c} />
      <LedenHoofdstuk c={c} />
      <BezoekHoofdstuk c={c} />
      <LessenHoofdstuk c={c} />
      <LeadsHoofdstuk c={c} />
      <Vergelijking c={c} />
    </>
  )
}

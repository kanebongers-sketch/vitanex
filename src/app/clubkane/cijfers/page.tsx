import type { Metadata } from 'next'
import { eisModule } from '@/lib/club/toegang'
import { kiesVestiging, type ZoekParams } from '@/lib/club/kern/vestiging'
import { haalRapport } from '@/lib/club/cijfers/haal-rapport'
import { kiesMaand } from '@/lib/club/cijfers/maand'
import { kiesBereik } from '@/lib/club/cijfers/periode'
import { dagSleutel } from '@/lib/club/cijfers/tijd'
import { CijferKop } from '@/components/club/cijfers/CijferKop'
import { Kerncijfers } from '@/components/club/cijfers/Kerncijfers'
import { LedenHoofdstuk } from '@/components/club/cijfers/LedenHoofdstuk'
import { BezoekHoofdstuk } from '@/components/club/cijfers/BezoekHoofdstuk'
import { LessenHoofdstuk } from '@/components/club/cijfers/LessenHoofdstuk'
import { LeadsHoofdstuk, Vergelijking } from '@/components/club/cijfers/LeadsEnVergelijking'
import { Maandoverzicht } from '@/components/club/cijfers/Maandoverzicht'
import type { CijferContext } from '@/components/club/cijfers/context'
import '@/components/club/cijfers/cijfers.css'

// Cijfers: een maandrapport per vestiging of voor alle acht samen. Altijd per
// kalendermaand (de 1e tot en met de laatste dag, besluit Kane), vergeleken
// met de vorige maand en dezelfde maand vorig jaar. Maand en bereik staan in
// de URL (?maand=2026-10&bereik=alle). Bij elk cijfer staat hoe het geteld is.

export const metadata: Metadata = { title: 'Cijfers' }

export default async function ClubCijfers({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisModule('cijfers')
  const zoek = await searchParams
  const nu = new Date()
  const vestiging = kiesVestiging(zoek.v)
  const maand = kiesMaand(zoek.maand, dagSleutel(nu))
  const bereik = kiesBereik(zoek.bereik)
  const { rapport, vandaag, meldingen } = await haalRapport(t.admin, t.userId, vestiging, maand, bereik, nu)
  const c: CijferContext = { rapport, maand, vestiging, bereik, vandaag }
  return (
    <>
      <CijferKop vestiging={vestiging} maand={maand} bereik={bereik} venster={rapport.huidig.venster} vandaag={vandaag} />
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
      <Maandoverzicht c={c} />
    </>
  )
}

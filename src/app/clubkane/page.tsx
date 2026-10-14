import type { Metadata } from 'next'
import { eisClubToegang } from '@/lib/club/toegang'
import { clubPad, kiesVestiging, VESTIGING_LABEL, type ZoekParams } from '@/lib/club/kern/vestiging'
import { haalVandaag } from '@/lib/club/cijfers/haal-vandaag'
import { dagLang, tijdNl } from '@/lib/club/cijfers/tijd'
import { VandaagHero } from '@/components/club/vandaag/VandaagHero'
import { LesTijdlijn } from '@/components/club/vandaag/LesTijdlijn'
import { LeadsOpvolgen, RisicoLeden } from '@/components/club/vandaag/Opvolgen'
import { JarigVandaag, NieuwDezeWeek } from '@/components/club/vandaag/NieuwEnJarig'
import '@/components/club/vandaag/vandaag.css'

// Vandaag: het eerste scherm van de clubsoftware. Wat er nu speelt in de
// gekozen vestiging, in een keer server-side opgehaald (zie haal-vandaag.ts).

export const metadata: Metadata = { title: 'Vandaag' }

export default async function ClubVandaag({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisClubToegang()
  const vestiging = kiesVestiging((await searchParams).v)
  const data = await haalVandaag(t.admin, t.userId, vestiging)
  const [weekdag, ...rest] = dagLang(data.vandaag).split(' ')
  return (
    <>
      <header className="club-vandaag-kop">
        <div>
          <p className="club-boventitel">{VESTIGING_LABEL[vestiging]} · vandaag</p>
          <h1 className="club-vandaag-dag">
            {weekdag} <span>{rest.join(' ')}</span>
          </h1>
        </div>
        <p className="club-vandaag-stand">Stand van {tijdNl(data.nu)}</p>
      </header>

      {data.meldingen.map((m) => (
        <p key={m} className="club-melding club-melding--fout" role="status">
          {m}
        </p>
      ))}

      <VandaagHero data={data} />

      <div className="club-raster">
        <div className="club-k7">
          <LesTijdlijn lessen={data.lessen} nu={data.nu} roosterPad={clubPad('/rooster', vestiging)} />
        </div>
        <div className="club-k5 club-vandaag-stapel">
          <LeadsOpvolgen leads={data.opvolgen} totaal={data.opvolgenTotaal} vandaag={data.vandaag} vestiging={vestiging} />
          <RisicoLeden leden={data.risico} vandaag={data.vandaag} vestiging={vestiging} />
        </div>
        <div className="club-k8">
          <NieuwDezeWeek leden={data.nieuw} vestiging={vestiging} />
        </div>
        <div className="club-k4">
          <JarigVandaag jarigen={data.jarig} vestiging={vestiging} />
        </div>
      </div>
    </>
  )
}

import type { Metadata } from 'next'
import { eisClubToegang } from '@/lib/club/toegang'
import { clubPad, type ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { GeenVestigingen } from '@/components/club/shell/GeenVestigingen'
import { haalVandaag } from '@/lib/club/cijfers/haal-vandaag'
import { dagLang, tijdNl } from '@/lib/club/cijfers/tijd'
import { VandaagHero } from '@/components/club/vandaag/VandaagHero'
import { LesTijdlijn } from '@/components/club/vandaag/LesTijdlijn'
import { LeadsOpvolgen } from '@/components/club/vandaag/Opvolgen'
import { RisicoLeden } from '@/components/club/vandaag/RisicoLeden'
import { TakenVandaag, WieWerkt } from '@/components/club/vandaag/Werkvloer'
import { JarigVandaag, NieuwDezeWeek } from '@/components/club/vandaag/NieuwEnJarig'
import { AgendaVandaag, OverdrachtVandaag } from '@/components/club/vandaag/AgendaEnOverdracht'
import { haalAgendaWeek } from '@/lib/club/agenda/data'
import { perDag } from '@/lib/club/agenda/model'
import { haalKladblok } from '@/lib/club/kladblok/data'
import { overdrachtVoorVandaag } from '@/lib/club/kladblok/model'
import { maandagVan } from '@/lib/club/rooster/tijd'
import { magOnderdeel } from '@/lib/club/beheerders/rechten'
import { beperkVandaag } from '@/lib/club/beheerders/vandaag-filter'
import '@/components/club/vandaag/vandaag.css'
import { SluitingenBinnenkort } from '@/components/club/sluiting/SluitingenBinnenkort'

// Vandaag: het eerste scherm van de clubsoftware. Wat er nu speelt in de
// gekozen vestiging, in een keer server-side opgehaald (zie haal-vandaag.ts).
// Een clubmanager ziet alleen de blokken van onderdelen die de eigenaar hem gaf.

export const metadata: Metadata = { title: 'Vandaag' }

export default async function ClubVandaag({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisClubToegang()
  const vestiging = kiesUit(t.vestigingen, (await searchParams).v)
  if (!vestiging) return <GeenVestigingen />
  const mag = (onderdeel: string) => magOnderdeel(t.onderdelen, onderdeel)
  const data = beperkVandaag(await haalVandaag(t.admin, t.userId, vestiging), mag)
  // Agenda en overdracht naast de rest; een fout hier breekt het scherm niet (null = melding in het blok).
  const maandag = maandagVan(data.vandaag)
  const [week, kladblok] = await Promise.all([
    mag('agenda') ? haalAgendaWeek(t.admin, t.userId, vestiging, maandag) : null,
    mag('notities') ? haalKladblok(t.admin, t.userId, vestiging) : null,
  ])
  const agendaVandaag = week ? (perDag(week, maandag).find((d) => d.datum === data.vandaag)?.items ?? []) : null
  const overdracht = kladblok ? overdrachtVoorVandaag(kladblok, data.nu) : null
  const [weekdag, ...rest] = dagLang(data.vandaag).split(' ')
  return (
    <>
      <header className="club-vandaag-kop">
        <div>
          <p className="club-boventitel">{naamVan(t.vestigingen, vestiging)} · vandaag</p>
          <h1 className="club-vandaag-dag">
            {weekdag} <span>{rest.join(' ')}</span>
          </h1>
        </div>
        <p className="club-vandaag-stand">
          Stand van <time dateTime={data.nu.toISOString()}>{tijdNl(data.nu)}</time>
        </p>
      </header>

      <SluitingenBinnenkort admin={t.admin} userId={t.userId} vestiging={vestiging} />

      {data.meldingen.map((m) => (
        <p key={m} className="club-melding club-melding--fout" role="status">
          {m}
        </p>
      ))}

      <VandaagHero data={data} />

      <div className="club-raster club-vandaag-raster">
        <div className="club-k7">
          {mag('rooster') && <LesTijdlijn lessen={data.lessen} nu={data.nu} roosterPad={clubPad('/rooster', vestiging)} />}
        </div>
        <div className="club-k5 club-vandaag-stapel">
          {mag('personeel') && <WieWerkt diensten={data.werkvloer.diensten} vestiging={vestiging} />}
          {mag('notities') && <OverdrachtVandaag notities={overdracht} vestiging={vestiging} />}
          {mag('agenda') && <AgendaVandaag items={agendaVandaag} vestiging={vestiging} />}
          {mag('taken') && <TakenVandaag stand={data.werkvloer.taken} heeftTaken={data.werkvloer.heeftTaken} vestiging={vestiging} />}
        </div>
        <div className="club-k7">
          {mag('leden') && <RisicoLeden leden={data.risico} laatsteOoit={data.laatsteOoit} vandaag={data.vandaag} vestiging={vestiging} />}
        </div>
        <div className="club-k5 club-vandaag-stapel">
          {mag('leads') && <LeadsOpvolgen leads={data.opvolgen} totaal={data.opvolgenTotaal} vandaag={data.vandaag} vestiging={vestiging} />}
          {mag('leden') && <JarigVandaag jarigen={data.jarig} vestiging={vestiging} />}
        </div>
        {mag('leden') && (
          <div className="club-vandaag-vol">
            <NieuwDezeWeek leden={data.nieuw} vestiging={vestiging} />
          </div>
        )}
      </div>
    </>
  )
}

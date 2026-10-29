import type { Metadata } from 'next'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { eisClubToegang, type ClubToegang } from '@/lib/club/toegang'
import { clubPad, type ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { GeenVestigingen } from '@/components/club/shell/GeenVestigingen'
import { haalVandaag } from '@/lib/club/cijfers/haal-vandaag'
import { dagLang, dagSleutel, tijdNl } from '@/lib/club/cijfers/tijd'
import { VandaagHero } from '@/components/club/vandaag/VandaagHero'
import { LesTijdlijn } from '@/components/club/vandaag/LesTijdlijn'
import { LeadsOpvolgen } from '@/components/club/vandaag/Opvolgen'
import { RisicoLeden } from '@/components/club/vandaag/RisicoLeden'
import { WieWerkt } from '@/components/club/vandaag/Werkvloer'
import { JarigVandaag, NieuwDezeWeek } from '@/components/club/vandaag/NieuwEnJarig'
import { AgendaVandaag, OverdrachtVandaag } from '@/components/club/vandaag/AgendaEnOverdracht'
import { haalAgendaWeek } from '@/lib/club/agenda/data'
import { perDag } from '@/lib/club/agenda/model'
import { haalKladblok } from '@/lib/club/kladblok/data'
import { overdrachtVoorVandaag } from '@/lib/club/kladblok/model'
import { maandagVan, nlDelen } from '@/lib/club/rooster/tijd'
import { magBeheerdersBeheren, magOnderdeel } from '@/lib/club/beheerders/rechten'
import { moetNaarWizard } from '@/lib/club/start/stappen'
import { haalStartVoorPagina } from '@/lib/club/start/opslag'
import { StartKaart } from '@/components/club/start/StartKaart'
import { beperkVandaag } from '@/lib/club/beheerders/vandaag-filter'
import '@/components/club/vandaag/vandaag.css'
import { SluitingenBinnenkort } from '@/components/club/sluiting/SluitingenBinnenkort'
import { CheckinSectie } from '@/components/club/vandaag/secties/CheckinSectie'
import { TakenSectie } from '@/components/club/vandaag/secties/TakenSectie'
import { OpvolgSectie } from '@/components/club/vandaag/secties/OpvolgSectie'
import { AutoVerversen } from '@/components/club/taken/Hulpjes'
import { isZichtbaar, ONDERDELEN } from '@/components/club/shell/onderdelen'
import { qrCheckinAan } from '@/lib/club/kern/org-instellingen'
import { VandaagStrook } from '@/components/club/vandaag/VandaagStrook'
import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import { VANDAAG } from '@/lib/aiyourgym/taal/woorden/club/vandaag-scherm'

// Vandaag: het eerste scherm van de clubsoftware en het ene dagscherm voor de
// vloer (besluit Kane 27-10-2026, minder tabbladen). Van boven naar beneden:
// een strook met de taken van vandaag (link naar Taken, dat sinds 28-10-2026
// weer een eigen tab heeft) en de bezetting, check-in (#checkin), de cijfers van nu, de lessen met wie er werkt, de taken
// van vandaag (#taken), opvolgen met leads en jarigen (#opvolgen), en de leden
// om op te letten. Check-in, taken en opvolgen laden los in een Suspense, zodat
// de pagina snel in beeld staat. Een clubmanager ziet alleen de secties van
// onderdelen die de eigenaar hem gaf en die aan staan.

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(VANDAAG)).titel }
}

/** Een nieuwe sportschool (geen voortgang in de startwizard) gaat eerst naar de wizard; Fit Factory en een demo nooit. */
async function naarStartwizard(t: ClubToegang): Promise<boolean> {
  if (!magBeheerdersBeheren(t) || t.organisatie.demo || t.organisatie.id === t.beheerderId) return false
  const start = await haalStartVoorPagina(t)
  return start.ok && moetNaarWizard(t.organisatie, t.beheerderId, start.voortgang)
}

export default async function ClubVandaag({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisClubToegang()
  const vestiging = kiesUit(t.vestigingen, (await searchParams).v)
  if (!vestiging) {
    if (await naarStartwizard(t)) redirect('/club/start')
    return (
      <>
        <StartKaart t={t} vestiging={null} />
        <GeenVestigingen />
      </>
    )
  }
  const mag = (onderdeel: string) => magOnderdeel(t.onderdelen, onderdeel)
  /** Mag deze persoon het onderdeel en staat het aan bij de sportschool? */
  const zie = (sleutel: string) => {
    const o = ONDERDELEN.find((x) => x.sleutel === sleutel)
    return o !== undefined && isZichtbaar(o, t.organisatie.uit, t.onderdelen)
  }
  // Alles tegelijk: de doorverwijzing naar de wizard, de cijfers, de agenda en de overdracht.
  // Agenda en overdracht hangen alleen af van de dag, niet van de cijfers; een fout daarin
  // breekt het scherm niet (null = melding in het blok).
  const nu = new Date()
  const taal = await getTaal()
  const tv = VANDAAG[taal]
  const maandag = maandagVan(dagSleutel(nu))
  const [wizard, ruweData, week, kladblok] = await Promise.all([
    naarStartwizard(t),
    haalVandaag(t.admin, t.userId, vestiging, nu, taal),
    mag('agenda') ? haalAgendaWeek(t.admin, t.userId, vestiging, maandag) : null,
    mag('notities') ? haalKladblok(t.admin, t.userId, vestiging) : null,
  ])
  if (wizard) redirect('/club/start')
  const data = beperkVandaag(ruweData, mag)
  const agendaVandaag = week ? (perDag(week, maandag).find((d) => d.datum === data.vandaag)?.items ?? []) : null
  const overdracht = kladblok ? overdrachtVoorVandaag(kladblok, data.nu) : null
  const [weekdag, ...rest] = dagLang(data.vandaag, taal).split(' ')
  const vestigingNaam = naamVan(t.vestigingen, vestiging)
  const { checkin } = t.organisatie.instellingen
  const leadsOfJarig = zie('leads') || zie('leden')
  return (
    <>
      <header className="club-vandaag-kop">
        <div>
          <p className="club-boventitel">{tv.boventitel(vestigingNaam)}</p>
          <h1 className="club-vandaag-dag">
            {weekdag} <span>{rest.join(' ')}</span>
          </h1>
        </div>
        <p className="club-vandaag-stand">
          {tv.standVan} <time dateTime={data.nu.toISOString()}>{tijdNl(data.nu)}</time>
        </p>
      </header>

      <VandaagStrook admin={t.admin} userId={t.userId} vestiging={vestiging} vandaag={nlDelen(nu).datum} lessen={data.lessen} taken={zie('taken')} rooster={mag('rooster')} />

      <Suspense fallback={null}>
        <StartKaart t={t} vestiging={vestiging} />
      </Suspense>

      <Suspense fallback={null}>
        <SluitingenBinnenkort admin={t.admin} userId={t.userId} vestiging={vestiging} />
      </Suspense>

      {data.meldingen.map((m) => (
        <p key={m} className="club-melding club-melding--fout" role="status">
          {m}
        </p>
      ))}

      <AutoVerversen />

      {zie('checkin') && <CheckinSectie admin={t.admin} userId={t.userId} vestiging={vestiging} methode={checkin.methode} qrAan={qrCheckinAan(checkin)} magLeden={zie('leden')} />}

      <VandaagHero data={data} />

      <div className="club-raster club-vandaag-raster">
        <div className="club-k7">
          {mag('rooster') && <LesTijdlijn lessen={data.lessen} nu={data.nu} roosterPad={clubPad('/rooster', vestiging)} />}
        </div>
        <div className="club-k5 club-vandaag-stapel">
          {mag('personeel') && <WieWerkt diensten={data.werkvloer.diensten} vestiging={vestiging} />}
          {mag('notities') && <OverdrachtVandaag notities={overdracht} vestiging={vestiging} />}
          {mag('agenda') && <AgendaVandaag items={agendaVandaag} vestiging={vestiging} />}
        </div>
      </div>

      {zie('taken') && <TakenSectie admin={t.admin} userId={t.userId} vestiging={vestiging} vandaag={nlDelen(nu).datum} />}

      {(zie('opvolgen') || leadsOfJarig) && (
        <OpvolgSectie admin={t.admin} userId={t.userId} vestiging={vestiging} vestigingNaam={vestigingNaam} magLeden={zie('opvolgen')} magRegels={mag('beheer')}>
          {leadsOfJarig ? (
            <>
              {zie('leads') && <LeadsOpvolgen leads={data.opvolgen} totaal={data.opvolgenTotaal} vandaag={data.vandaag} vestiging={vestiging} />}
              {zie('leden') && <JarigVandaag jarigen={data.jarig} vestiging={vestiging} />}
            </>
          ) : null}
        </OpvolgSectie>
      )}

      {mag('leden') && (
        <div className="club-raster club-vandaag-raster">
          <div className="club-k7">
            <RisicoLeden leden={data.risico} laatsteOoit={data.laatsteOoit} vandaag={data.vandaag} vestiging={vestiging} />
          </div>
          <div className="club-k5 club-vandaag-stapel">
            <NieuwDezeWeek leden={data.nieuw} vestiging={vestiging} />
          </div>
        </div>
      )}
    </>
  )
}

import { zichtbaar } from '@/lib/club/kern/pakketten'
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
import { startDoorverwijzing } from '@/lib/club/rollen/model'
import { WelkomVoorRol } from '@/components/club/welkom/WelkomVoorRol'
import { ikAlsAfvinker } from '@/lib/club/taken/ik'
import { isLeiding, kanBewerken, v2Minstens } from '@/lib/club/rollen/wie'
import { NieuweLedenSectie } from '@/components/club/nieuwe-leden/NieuweLedenSectie'
import { alleenActief, haalTaken } from '@/lib/club/taken/opslag'
import { VANDAAG_SECTIES } from '@/lib/aiyourgym/taal/woorden/club/vandaag'
import Link from 'next/link'
import { ScanLine } from 'lucide-react'
import type { ReactNode } from 'react'
import { PrikbordRegel } from '@/components/club/prikbord/PrikbordRegel'

// Vandaag: het eerste scherm van de clubsoftware en het ene dagscherm voor de
// vloer (besluit Kane 27-10-2026, minder tabbladen). Van boven naar beneden:
// een strook met de taken van vandaag (link naar Taken, dat sinds 28-10-2026
// weer een eigen tab heeft) en de bezetting, check-in (#checkin), de cijfers van nu, de lessen met wie er werkt, de taken
// van vandaag (#taken), opvolgen met leads en jarigen (#opvolgen), en de leden
// om op te letten. Check-in, taken en opvolgen laden los in een Suspense, zodat
// de pagina snel in beeld staat. Een clubmanager ziet alleen de secties van
// onderdelen die de eigenaar hem gaf en die aan staan.
// Ontwerp "Club in 10 minuten" (03-11-2026): een hoofdactie bovenaan (Inchecken),
// direct daaronder de regel met open mededelingen van het Prikbord, en alleen wat
// vandaag aandacht vraagt: een leeg blok staat er niet (een leesfout wel, met
// melding). Opvolgen heet Bellen vandaag; zonder takenlijst een knop om er een te maken.

/** Een vestiging met een actieve takenlijst? null bij een leesfout (dan gewoon de tabel). */
async function heeftTakenlijst(t: ClubToegang, vestiging: string): Promise<boolean | null> {
  const data = await haalTaken(t.admin, t.userId, vestiging)
  return data ? alleenActief(data).lijsten.length > 0 : null
}

/** Twee kolommen als beide iets hebben, anders een over de volle breedte; niets = niets. */
function Duo({ links, rechts }: { links: ReactNode[]; rechts: ReactNode[] }) {
  const l = links.filter(Boolean)
  const r = rechts.filter(Boolean)
  if (l.length === 0 && r.length === 0) return null
  if (l.length === 0 || r.length === 0) return <div className="club-vandaag-stapel club-vandaag-enkel">{l.length > 0 ? l : r}</div>
  return (
    <div className="club-raster club-vandaag-raster">
      <div className="club-k7 club-vandaag-stapel">{l}</div>
      <div className="club-k5 club-vandaag-stapel">{r}</div>
    </div>
  )
}

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
  const zp = await searchParams
  // Rollen v2: na het inloggen, of zonder Vandaag, naar de startpagina van de rol.
  const naar = startDoorverwijzing(t.profiel, zp.start)
  if (naar) redirect(naar)
  const vestiging = kiesUit(t.vestigingen, zp.v)
  if (!vestiging) {
    if (await naarStartwizard(t)) redirect('/club/start')
    return (
      <>
        <StartKaart t={t} vestiging={null} />
        <GeenVestigingen />
      </>
    )
  }
  // Mag deze persoon het onderdeel, staat het aan en is het pakket afgenomen (kern/pakketten.ts)?
  const mag = (onderdeel: string) => magOnderdeel(t.onderdelen, onderdeel) && zichtbaar(t.organisatie.uit, { sleutel: onderdeel, module: ONDERDELEN.find((x) => x.sleutel === onderdeel)?.module })
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
  const [wizard, ruweData, week, kladblok, takenlijst] = await Promise.all([
    naarStartwizard(t),
    haalVandaag(t.admin, t.userId, vestiging, nu, taal),
    mag('agenda') ? haalAgendaWeek(t.admin, t.userId, vestiging, maandag) : null,
    mag('notities') ? haalKladblok(t.admin, t.userId, vestiging) : null,
    zie('taken') ? heeftTakenlijst(t, vestiging) : null,
  ])
  if (wizard) redirect('/club/start')
  const data = beperkVandaag(ruweData, mag)
  const agendaVandaag = week ? (perDag(week, maandag).find((d) => d.datum === data.vandaag)?.items ?? []) : null
  const overdracht = kladblok ? overdrachtVoorVandaag(kladblok, data.nu) : null
  const [weekdag, ...rest] = dagLang(data.vandaag, taal).split(' ')
  const vestigingNaam = naamVan(t.vestigingen, vestiging)
  const { checkin } = t.organisatie.instellingen
  const leadsOfJarig = zie('leads') || zie('leden')
  // Trainer en andere vloerrollen: kort scherm, Nu in de club en Leden met risico onder Meer.
  const leiding = isLeiding(t)
  const sw = VANDAAG_SECTIES[taal]
  const risicoBlok = mag('leden') ? (
    <Duo
      links={[data.risico.length > 0 && <RisicoLeden key="risico" leden={data.risico} laatsteOoit={data.laatsteOoit} vandaag={data.vandaag} vestiging={vestiging} />]}
      rechts={[data.nieuw.length > 0 && <NieuwDezeWeek key="nieuw" leden={data.nieuw} vestiging={vestiging} />]}
    />
  ) : null
  // Lessen, wie er werkt, overdracht en agenda: alleen als er vandaag iets staat (of een leesfout).
  const diensten = data.werkvloer.diensten
  const dagBlokken = (
    <Duo
      links={[mag('rooster') && data.lessen.length > 0 && <LesTijdlijn key="lessen" lessen={data.lessen} nu={data.nu} roosterPad={clubPad('/rooster', vestiging)} />]}
      rechts={[
        mag('personeel') && (diensten === null || diensten.length > 0) && <WieWerkt key="werkt" diensten={diensten} vestiging={vestiging} />,
        mag('notities') && (overdracht === null || overdracht.length > 0) && <OverdrachtVandaag key="overdracht" notities={overdracht} vestiging={vestiging} />,
        mag('agenda') && (agendaVandaag === null || agendaVandaag.length > 0) && <AgendaVandaag key="agenda" items={agendaVandaag} vestiging={vestiging} />,
      ]}
    />
  )
  // Bellen vandaag, rechts: wie er jarig is (de leads kiest de sectie zelf, hoogstens vijf gesprekken samen).
  const jarigBlok = zie('leden') && data.jarig.length > 0 ? <JarigVandaag key="jarig" jarigen={data.jarig} vestiging={vestiging} /> : null
  // Takenlijsten maken: wie Taken mag beheren (zonder rollen v2: wie Taken mag zien).
  const magLijstMaken = v2Minstens(t, 'taken', 'beheren') ?? true
  return (
    <>
      <header className="club-vandaag-kop">
        <div>
          <p className="club-boventitel">{tv.boventitel(vestigingNaam)}</p>
          <h1 className="club-vandaag-dag">
            {weekdag} <span>{rest.join(' ')}</span>
          </h1>
        </div>
        <div className="club-vandaag-kopacties">
          <p className="club-vandaag-stand">
            {tv.standVan} <time dateTime={data.nu.toISOString()}>{tijdNl(data.nu)}</time>
          </p>
          {zie('checkin') && (
            <Link href={clubPad('/checkin', vestiging)} className="club-knop club-vandaag-hoofdactie" aria-label={sw.checkin.hoofdactieUitleg}>
              <ScanLine aria-hidden size={17} /> {sw.checkin.hoofdactie}
            </Link>
          )}
        </div>
      </header>

      <Suspense fallback={null}>
        <PrikbordRegel vestiging={vestiging} />
      </Suspense>

      <WelkomVoorRol t={t} vestiging={vestiging} pagina="vandaag" />

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

      {/* Leiding ziet de drukte meteen; de vloer houdt het scherm kort en klapt hem open onder Meer. */}
      {leiding && <VandaagHero data={data} />}

      {dagBlokken}

      {/* Nieuwe leden: toevoegen, aanmeldlink en wat leden zelf deden (aanmelding via link, intake). */}
      {zie('leden') && (
        <Suspense fallback={null}>
          <NieuweLedenSectie t={t} vestiging={vestiging} />
        </Suspense>
      )}

      {zie('taken') && <TakenSectie admin={t.admin} userId={t.userId} vestiging={vestiging} vandaag={nlDelen(nu).datum} ik={ikAlsAfvinker(t)} heeftLijst={takenlijst} magMaken={magLijstMaken} />}

      {(zie('opvolgen') || leadsOfJarig) && (
        <OpvolgSectie
          admin={t.admin}
          userId={t.userId}
          vestiging={vestiging}
          vestigingNaam={vestigingNaam}
          vandaag={data.vandaag}
          magLeden={zie('opvolgen')}
          magBewerken={kanBewerken(t, 'opvolgen')}
          magRegels={mag('beheer')}
          leads={zie('leads') ? data.opvolgen : null}
          leadsTotaal={data.opvolgenTotaal}
        >
          {jarigBlok}
        </OpvolgSectie>
      )}

      {leiding ? (
        risicoBlok
      ) : (
        <details className="club-vandaag-meer">
          <summary className="club-knop club-knop--stil">{tv.meer}</summary>
          <VandaagHero data={data} />
          {risicoBlok}
        </details>
      )}
    </>
  )
}

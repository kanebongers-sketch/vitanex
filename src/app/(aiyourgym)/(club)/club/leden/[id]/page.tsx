import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { eisModule, type ClubToegang } from '@/lib/club/toegang'
import { type Vestiging, type ZoekParams } from '@/lib/club/kern/vestiging'
import { binnenVestigingen, hoortBij, naamVan } from '@/lib/club/kern/vestigingen'
import type { Medewerker } from '@/lib/club/kern/medewerker'
import { haalLidKaart, type LidKaart } from '@/lib/club/leden/kaart'
import { datumKort, laatsteBezoekTekst, tijdNl } from '@/lib/club/leden/tijd'
import { isUuid } from '@/lib/club/kern/organisatie'
import { magLidVerwijderen, verzoekTekst } from '@/lib/club/leden/avg/verwijderen'
import { haalVerwijderverzoek } from '@/lib/club/leden/avg/opslag'
import { healthActief } from '@/lib/club/health/schakelaar'
import { lidgeldOpen } from '@/lib/club/betalen/plannen/toegang'
import { kaartRechten, type KaartRechten } from '@/lib/club/leden/hub/rechten'
import { kiesLidTab, lidKaartPad, type LidTab } from '@/lib/club/leden/hub/tabs'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { tekst } from '@/lib/aiyourgym/taal/woordenboek'
import { LEDENKAART } from '@/lib/aiyourgym/taal/woorden/club/ledenkaart'
import { LidKop } from '@/components/club/leden/LidKop'
import { BehoudKaart } from '@/components/club/leden/BehoudKaart'
import { Bezoekpatroon } from '@/components/club/leden/Bezoekpatroon'
import { LidGegevens } from '@/components/club/leden/LidGegevens'
import { AvgKaart } from '@/components/club/leden/AvgKaart'
import { LedenappLink } from '@/components/club/ledenlogin/LedenappLink'
import { LidTabs } from '@/components/club/leden/hub/LidTabs'
import { LaatsteBezoeken } from '@/components/club/leden/hub/LaatsteBezoeken'
import { BezoekCijfers } from '@/components/club/leden/hub/BezoekCijfers'
import { TrainingTab } from '@/components/club/leden/hub/TrainingTab'
import { LidmaatschapTab } from '@/components/club/leden/hub/LidmaatschapTab'
import { PlanningTab } from '@/components/club/leden/hub/PlanningTab'
import { ContactTab } from '@/components/club/leden/hub/ContactTab'
import '@/components/club/leden/leden.css'
import '@/components/club/leden/hub/hub.css'

export const metadata: Metadata = { title: 'Ledenkaart' }

// De ledenkaart is de plek voor alles van een lid (besluit Kane 27-10-2026):
// een kop met de belangrijkste acties en zes tabbladen (?tab=). Elk tabblad
// haalt alleen zijn eigen gegevens op; elk blok alleen met het recht erop.

function geenBehoudTekst(kaart: LidKaart): string {
  if (kaart.lid.status === 'gepauzeerd') return 'Gepauzeerd: we verwachten nu geen bezoek, dus geen score.'
  if (kaart.lid.status === 'opgezegd') return 'Opgezegd: geen score meer. Wel een kans voor een gesprek voor de einddatum.'
  if (kaart.lid.status === 'gestopt') return 'Gestopt: geen score.'
  return 'De bezoeken konden niet worden geladen, dus er is nu geen score.'
}

/** Trainers om uit te kiezen, plus de huidige coach als die geen trainer is. */
function coachKeuzes(medewerkers: Medewerker[], coachId: string | null): { id: string; naam: string }[] {
  const trainers = medewerkers.filter((m) => m.rollen.includes('trainer'))
  const huidig = medewerkers.find((m) => m.id === coachId)
  const lijst = huidig && !trainers.includes(huidig) ? [...trainers, huidig] : trainers
  return lijst.map((m) => ({ id: m.id, naam: m.naam }))
}

interface TabInhoud {
  t: ClubToegang
  kaart: LidKaart
  vestiging: Vestiging
  rechten: KaartRechten
  nu: Date
}

async function Overzicht({ kaart, vestiging, nu, t }: TabInhoud) {
  const alle = tekst(LEDENKAART, await getTaal())
  const w = alle.overzicht
  const volgende = kaart.aankomend.find((r) => !r.lesGeannuleerd && r.status !== 'geannuleerd') ?? null
  const notitie = kaart.notities[0] ?? null
  const { lid } = kaart
  return (
    <div className="club-lidhub-tab">
      <BezoekCijfers kaart={kaart} nu={nu} />
      <div className="club-leden-tweekolom">
        <BehoudKaart behoud={kaart.behoud} geenTekst={geenBehoudTekst(kaart)} />
        <section className="club-kaart club-lidhub-kort" aria-labelledby="kort-kop">
          <h2 id="kort-kop">{w.kort}</h2>
          <dl className="club-lidhub-feiten">
            <div>
              <dt>{w.vorm}</dt>
              <dd><Link href={lidKaartPad(lid.id, vestiging, 'lidmaatschap')}>{lid.abonnement ?? alle.kop.geenVorm}</Link></dd>
            </div>
            <div>
              <dt>{w.volgendeLes}</dt>
              <dd>{volgende ? <Link href={lidKaartPad(lid.id, vestiging, 'planning')}>{volgende.lesNaam}, {datumKort(volgende.start, nu)} {tijdNl(volgende.start)}</Link> : <span className="club-zacht">{w.geenLes}</span>}</dd>
            </div>
            <div>
              <dt>{w.laatsteNotitie}</dt>
              <dd>{notitie ? <Link href={`${lidKaartPad(lid.id, vestiging, 'contact')}#notities`} className="club-lidhub-tweeregels">{notitie.tekst}</Link> : <span className="club-zacht">{w.geenNotitie}</span>}</dd>
            </div>
          </dl>
        </section>
      </div>
      <section className="club-kaart" aria-labelledby="patroon-kop">
        <div className="club-sectiekop">
          <h2 id="patroon-kop">Bezoekpatroon</h2>
          <span>Laatste 12 weken · {kaart.laatsteBezoek ? `laatste bezoek ${laatsteBezoekTekst(kaart.laatsteBezoek, nu).toLowerCase()}` : 'nog nooit geweest'}</span>
        </div>
        <Bezoekpatroon bezoeken={kaart.bezoeken.map((b) => b.op)} nu={nu} />
      </section>
      <LaatsteBezoeken kaart={kaart} nu={nu} vestigingen={t.vestigingen} />
    </div>
  )
}

async function Privacy({ t, kaart, rechten, verzoek, nu }: TabInhoud & { verzoek: Awaited<ReturnType<typeof haalVerwijderverzoek>> }) {
  const w = tekst(LEDENKAART, await getTaal()).privacy
  const { lid } = kaart
  return (
    <div className="club-lidhub-tab club-lidhub-twee">
      <LidGegevens lidId={lid.id} coachId={lid.coachId} trainers={coachKeuzes(kaart.medewerkers, lid.coachId)} tags={lid.tags} />
      <div className="club-leden-kolom">
        {rechten.ledenapp && (
          <section className="club-lidhub-blok" aria-label={w.ledenapp}>
            <LedenappLink lidId={lid.id} voornaam={lid.voornaam} />
          </section>
        )}
        <div id="privacy">
          <AvgKaart
            lidId={lid.id}
            voornaam={lid.voornaam}
            achternaam={lid.achternaam}
            magVerwijderen={magLidVerwijderen(t)}
            verzoekTekst={verzoek ? verzoekTekst(verzoek, nu) : null}
          />
        </div>
      </div>
    </div>
  )
}

export default async function LidPagina({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: ZoekParams }) {
  const t = await eisModule('leden')
  const [{ id }, ruw] = await Promise.all([params, searchParams])
  // Geen geldig id: meteen 404, zonder queries met onzin.
  if (!isUuid(id)) notFound()
  const nu = new Date()
  const [gelezen, verzoek, betalen] = await Promise.all([
    haalLidKaart(t.admin, t.userId, id, nu),
    haalVerwijderverzoek(t.admin, t.userId, id),
    lidgeldOpen(t),
  ])
  // Een lid van een vestiging die niet van deze persoon is: dezelfde 404 als een onbekend lid.
  const kaart = gelezen && binnenVestigingen(t.vestigingen, gelezen.lid) ? gelezen : null
  if (!kaart) notFound()
  const { lid } = kaart
  // De vestiging uit de URL als die bij deze sportschool hoort, anders die van het lid.
  const vestiging = typeof ruw.v === 'string' && hoortBij(t.vestigingen, ruw.v) ? ruw.v : lid.vestiging
  const rechten = kaartRechten({ onderdelen: t.onderdelen, modulesUit: t.organisatie.uit, healthAan: healthActief(), lidgeldOpen: betalen })
  const tab: LidTab = kiesLidTab(ruw.tab)
  const coach = kaart.medewerkers.find((m) => m.id === lid.coachId)
  const inhoud: TabInhoud = { t, kaart, vestiging, rechten, nu }

  return (
    <div className="club-lidhub">
      <LidKop lid={lid} vestiging={vestiging} vestigingNaam={naamVan(t.vestigingen, lid.vestiging)} coachNaam={coach?.naam ?? null} rechten={rechten} />
      <LidTabs lidId={lid.id} vestiging={vestiging} actief={tab} />
      {verzoek ? (
        <p className="club-melding club-melding--fout" role="status">
          {verzoekTekst(verzoek, nu)} Dit lid kan niet meer inloggen, inchecken of boeken.{magLidVerwijderen(t) ? <> <Link href={`${lidKaartPad(lid.id, vestiging, 'privacy')}#privacy`}>Terugdraaien</Link></> : null}
        </p>
      ) : null}
      {kaart.fouten.length ? (
        <p className="club-melding club-melding--fout" role="alert">Niet alles kon worden geladen ({kaart.fouten.join(', ')}). Ververs de pagina om het opnieuw te proberen.</p>
      ) : null}
      {tab === 'overzicht' && <Overzicht {...inhoud} />}
      {tab === 'training' && <TrainingTab t={t} lid={lid} vestiging={vestiging} medewerkers={kaart.medewerkers} rechten={rechten} maakOpen={ruw.maak === 'schema'} nu={nu} />}
      {tab === 'lidmaatschap' && <LidmaatschapTab t={t} lid={lid} vestiging={vestiging} rechten={rechten} statusVast={Boolean(verzoek)} nu={nu} />}
      {tab === 'planning' && <PlanningTab {...inhoud} />}
      {tab === 'contact' && <ContactTab {...inhoud} />}
      {tab === 'privacy' && <Privacy {...inhoud} verzoek={verzoek} />}
    </div>
  )
}

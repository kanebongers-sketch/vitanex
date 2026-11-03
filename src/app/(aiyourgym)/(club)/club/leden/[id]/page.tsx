import { kanBewerken } from '@/lib/club/rollen/wie'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { eisModule, type ClubToegang } from '@/lib/club/toegang'
import { type Vestiging, type ZoekParams } from '@/lib/club/kern/vestiging'
import { binnenVestigingen, hoortBij, naamVan } from '@/lib/club/kern/vestigingen'
import type { Medewerker } from '@/lib/club/kern/medewerker'
import { haalLidKaart, type LidKaart } from '@/lib/club/leden/kaart'
import { isUuid } from '@/lib/club/kern/organisatie'
import { magLidVerwijderen, verzoekTekst } from '@/lib/club/leden/avg/verwijderen'
import { haalVerwijderverzoek } from '@/lib/club/leden/avg/opslag'
import { healthActief } from '@/lib/club/health/schakelaar'
import { lidgeldOpen } from '@/lib/club/betalen/plannen/toegang'
import { kaartRechten, zichtbareLidTabs, type KaartRechten } from '@/lib/club/leden/hub/rechten'
import { isOudAdres, kiesKaartPlek, kiesLidTab, lidKaartPad, type KaartTab } from '@/lib/club/leden/hub/tabs'
import { haalLaatsteIntake } from '@/lib/club/nieuwe-leden/intake-opslag'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { tekst } from '@/lib/aiyourgym/taal/woordenboek'
import { LEDENKAART, LIDKAART_BLOKKEN } from '@/lib/aiyourgym/taal/woorden/club/ledenkaart'
import { LEDEN } from '@/lib/aiyourgym/taal/woorden/club/leden'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { KaartKop } from '@/components/club/leden/hub/KaartKop'
import { haalAanmeldInfo } from '@/lib/club/nieuwe-leden/meldingen'
import { LidGegevens } from '@/components/club/leden/LidGegevens'
import { AvgKaart } from '@/components/club/leden/AvgKaart'
import { LedenappLink } from '@/components/club/ledenlogin/LedenappLink'
import { LidTabs } from '@/components/club/leden/hub/LidTabs'
import { TrainingTab } from '@/components/club/leden/hub/TrainingTab'
import { LidmaatschapTab } from '@/components/club/leden/hub/LidmaatschapTab'
import { OverzichtTab } from '@/components/club/leden/hub/OverzichtTab'
import { GegevensSectie } from '@/components/club/leden/hub/Gegevens'
import '@/components/club/leden/leden.css'
import '@/components/club/leden/hub/hub.css'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(LEDEN)).pagina.kaartTitel }
}

// De ledenkaart is de plek voor alles van een lid (besluit Kane 27-10-2026).
// Sinds 03-11-2026 (EENVOUD-10-MINUTEN.md, hoofdstuk 4): een kop met een
// hoofdactie per tabblad en Meer acties, en drie tabbladen (?tab=): Overzicht,
// Training en Lidmaatschap. Oude ?tab= (planning, contact, privacy) sturen door
// naar het nieuwe tabblad op de juiste sectie. Elk tabblad haalt alleen zijn
// eigen gegevens op; elk blok alleen met het recht erop.

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

/** Tabblad Lidmaatschap: lidmaatschap en betalen, gegevens, ledenapp en privacy (#privacy). */
async function Lidmaatschap({ t, kaart, vestiging, rechten, verzoek, nu }: TabInhoud & { verzoek: Awaited<ReturnType<typeof haalVerwijderverzoek>> }) {
  const taal = await getTaal()
  const w = tekst(LEDENKAART, taal).privacy
  const { lid } = kaart
  return (
    <div className="club-lidhub-tab">
      {rechten.lidmaatschap || rechten.betalen ? <LidmaatschapTab t={t} lid={lid} vestiging={vestiging} rechten={rechten} statusVast={Boolean(verzoek)} nu={nu} /> : null}
      <GegevensSectie
        t={t}
        kaart={kaart}
        vestiging={vestiging}
        rechten={rechten}
        nu={nu}
        coach={<LidGegevens lidId={lid.id} coachId={lid.coachId} trainers={coachKeuzes(kaart.medewerkers, lid.coachId)} tags={lid.tags} alleenLezen={!rechten.bewerk.leden} />}
      />
      <section className="club-lidhub-sectie" id="privacy" aria-labelledby="privacy-sectie-kop">
        <h2 id="privacy-sectie-kop" className="club-lidhub-sectiekop">{w.kop}</h2>
        <div className="club-lidhub-twee">
          <AvgKaart
            lidId={lid.id}
            voornaam={lid.voornaam}
            achternaam={lid.achternaam}
            magVerwijderen={magLidVerwijderen(t)}
            verzoekTekst={verzoek ? verzoekTekst(verzoek, nu, taal) : null}
          />
          {rechten.ledenapp && (
            <div className="club-lidhub-blok" aria-label={w.ledenapp}>
              <LedenappLink lidId={lid.id} voornaam={lid.voornaam} />
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default async function LidPagina({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: ZoekParams }) {
  const t = await eisModule('leden')
  const [{ id }, ruw] = await Promise.all([params, searchParams])
  // Geen geldig id: meteen 404, zonder queries met onzin.
  if (!isUuid(id)) notFound()
  const nu = new Date()
  const taal = await getTaal()
  const kb = LIDKAART_BLOKKEN[taal].kaart
  const [gelezen, verzoek, betalen, aanmelding] = await Promise.all([
    haalLidKaart(t.admin, t.userId, id, nu, taal),
    haalVerwijderverzoek(t.admin, t.userId, id),
    lidgeldOpen(t),
    haalAanmeldInfo(t.admin, t.userId, id),
  ])
  // Een lid van een vestiging die niet van deze persoon is: dezelfde 404 als een onbekend lid.
  const kaart = gelezen && binnenVestigingen(t.vestigingen, gelezen.lid) ? gelezen : null
  if (!kaart) notFound()
  const { lid } = kaart
  // De vestiging uit de URL als die bij deze sportschool hoort, anders die van het lid.
  const vestiging = typeof ruw.v === 'string' && hoortBij(t.vestigingen, ruw.v) ? ruw.v : lid.vestiging
  // Rollen v2: wie een onderdeel alleen mag zien, krijgt dat deel van de kaart in leesmodus.
  const rechten = kaartRechten({ onderdelen: t.onderdelen, modulesUit: t.organisatie.uit, healthAan: healthActief(), lidgeldOpen: betalen, bewerkbaar: (s) => kanBewerken(t, s) })
  const tabs = zichtbareLidTabs(rechten)
  // Een oud adres (?tab=planning, contact, privacy): door naar het nieuwe tabblad op de juiste sectie.
  if (isOudAdres(ruw.tab)) {
    const plek = kiesKaartPlek(ruw.tab, tabs)
    redirect(lidKaartPad(lid.id, vestiging, plek.tab, plek.anker ?? undefined))
  }
  const tab: KaartTab = kiesLidTab(ruw.tab, tabs)
  const coach = kaart.medewerkers.find((m) => m.id === lid.coachId)
  const inhoud: TabInhoud = { t, kaart, vestiging, rechten, nu }
  // Training zonder intake: de hoofdactie is Intake starten. Bij een leesfout (undefined): Schema maken.
  const heeftIntake = tab === 'training' && rechten.bewerk.training ? (await haalLaatsteIntake(t.admin, t.userId, lid.id)) !== null : true

  return (
    <div className="club-lidhub">
      <KaartKop lid={lid} vestiging={vestiging} vestigingNaam={naamVan(t.vestigingen, lid.vestiging)} coachNaam={coach?.naam ?? null} rechten={rechten} tab={tab} heeftIntake={heeftIntake} aangemeldOp={aanmelding?.op ?? null} />
      <LidTabs lidId={lid.id} vestiging={vestiging} actief={tab} zichtbaar={tabs} />
      {verzoek ? (
        <p className="club-melding club-melding--fout" role="status">
          {verzoekTekst(verzoek, nu, taal)} {kb.verzoekVast}{magLidVerwijderen(t) ? <> <Link href={lidKaartPad(lid.id, vestiging, 'privacy')}>{kb.terugdraaien}</Link></> : null}
        </p>
      ) : null}
      {kaart.fouten.length ? (
        <p className="club-melding club-melding--fout" role="alert">{kb.nietAlles(kaart.fouten.map((f) => (kb.onderdelen as Record<string, string>)[f] ?? f).join(', '))}</p>
      ) : null}
      {tab === 'overzicht' && <OverzichtTab {...inhoud} />}
      {tab === 'training' && <TrainingTab t={t} lid={lid} vestiging={vestiging} medewerkers={kaart.medewerkers} rechten={rechten} maakOpen={ruw.maak === 'schema'} nu={nu} />}
      {tab === 'lidmaatschap' && <Lidmaatschap {...inhoud} verzoek={verzoek} />}
    </div>
  )
}

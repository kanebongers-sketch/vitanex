import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, ClipboardPlus } from 'lucide-react'
import { eisModule } from '@/lib/club/toegang'
import { haalLid, initialen, volledigeNaam } from '@/lib/club/kern/lid'
import { haalMedewerkers } from '@/lib/club/kern/medewerker'
import { type ZoekParams } from '@/lib/club/kern/vestiging'
import { binnenVestigingen, kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { GeenVestigingen } from '@/components/club/shell/GeenVestigingen'
import { filterUitParams } from '@/lib/club/training/filter'
import { LidFilter } from '@/components/club/training/LidFilter'
import { NieuwSchemaKnop } from '@/components/club/training/SchemaActies'
import { IntakesDezeWeek, TabIntakes, TabOefeningen, TabSchemas, TabSjablonen, TabVoedingSjablonen } from '@/components/club/training/TabInhoud'
import { balkVan, BibliotheekDelen, isDeel, kiesTab, TrainingTabs, trainingPad, trainingPaden } from '@/components/club/training/TrainingTabs'
import { magOnderdeel } from '@/lib/club/beheerders/rechten'
import { onderdeelAfgenomen } from '@/lib/club/kern/pakketten'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { CLUB_TRAINING } from '@/lib/aiyourgym/taal/woorden/club/training'
import '@/components/club/training/training.css'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(CLUB_TRAINING)).pagina.titel }
}

// Training (ontwerp "Club in 10 minuten", 03-11-2026): tabbladen Schema's en
// Bibliotheek. Schema's heeft bovenaan Intakes deze week (alle intakes via
// ?tab=intakes); de Bibliotheek heeft de delen Sjablonen, Oefeningen en Voeding
// (de voedingssjablonen). Tabblad en lid staan in de URL (?tab=schemas&lid=...),
// zodat de ledenkaart direct naar alles van een lid kan linken.

export default async function TrainingPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisModule('training')
  const zoek = await searchParams
  const vestiging = kiesUit(t.vestigingen, zoek.v)
  if (!vestiging) return <GeenVestigingen />
  const metVoeding = magOnderdeel(t.onderdelen, 'voeding') && onderdeelAfgenomen(t.organisatie.afgenomen, 'voeding')
  const gevraagd = kiesTab(zoek.tab)
  const tab = gevraagd === 'voedingsjablonen' && !metVoeding ? 'sjablonen' : gevraagd
  const balk = balkVan(tab)
  const lidParam = typeof zoek.lid === 'string' ? zoek.lid : null

  const [gelezenLid, medewerkers] = await Promise.all([
    lidParam ? haalLid(t.admin, t.userId, lidParam) : Promise.resolve(null),
    haalMedewerkers(t.admin, t.userId, vestiging, 'trainer'),
  ])
  // Een lid uit een andere vestiging dan die van deze persoon telt niet (geen schema's of intakes van anderen).
  const lidRij = binnenVestigingen(t.vestigingen, gelezenLid)
  const lid = lidRij ? { id: lidRij.id, naam: volledigeNaam(lidRij), initialen: initialen(lidRij) } : null
  const trainers = Object.fromEntries((medewerkers ?? []).map((m) => [m.id, m.naam]))
  const paden = trainingPaden(vestiging)
  const props = { t, vestiging, lid, trainers }
  const tp = (await clubTekst(CLUB_TRAINING)).pagina

  // Een hoofdactie per scherm. Schema's: Schema maken (met een lid gekozen),
  // anders Intake afnemen. Alle intakes: Intake afnemen. Sjablonen: Nieuw sjabloon.
  const intro = balk === 'bibliotheek' ? tp.introBibliotheek : tab === 'intakes' ? tp.introIntakes : tp.intro
  return (
    <>
      <section className="club-paginakop">
        <div>
          {tab === 'intakes' ? (
            <Link href={trainingPad(vestiging, 'schemas', lid?.id ?? null)} className="club-training-terug"><ChevronLeft size={15} aria-hidden /> {tp.terugSchemas}</Link>
          ) : (
            <p className="club-boventitel">{naamVan(t.vestigingen, vestiging)}</p>
          )}
          <h1>{tab === 'intakes' ? tp.tabs.intakes : tp.titel}</h1>
          <p>{intro}</p>
        </div>
        {(balk === 'schemas' || tab === 'sjablonen') && (
          <div className="club-acties">
            {tab === 'schemas' && lid && <NieuwSchemaKnop lidId={lid.id} editorHref={paden.editor} label={tp.schemaMaken} primair />}
            {balk === 'schemas' && (
              <Link className={`club-knop${lid && tab === 'schemas' ? '' : ' club-knop--primair'}`} href={paden.nieuweIntake(lid?.id ?? null)}>
                <ClipboardPlus aria-hidden size={16} /> {tp.intakeAfnemen}
              </Link>
            )}
            {tab === 'sjablonen' && <NieuwSchemaKnop lidId={null} editorHref={paden.editor} label={tp.nieuwSjabloon} primair={!lid} />}
          </div>
        )}
      </section>

      <div className="club-training-balk">
        {tab !== 'intakes' && <TrainingTabs vestiging={vestiging} actief={tab} lidId={lid?.id ?? null} />}
        {(tab === 'schemas' || tab === 'intakes' || tab === 'sjablonen') && (
          <LidFilter
            vestiging={vestiging}
            lid={lid}
            zonderLidHref={trainingPad(vestiging, tab, null)}
            metLidHref={trainingPad(vestiging, tab, '__lid__')}
          />
        )}
      </div>
      {isDeel(tab) && <BibliotheekDelen vestiging={vestiging} actief={tab} lidId={lid?.id ?? null} metVoeding={metVoeding} />}
      {lidParam && !lid && <p className="club-melding">{tp.lidNietGevonden}</p>}

      {tab === 'intakes' && <TabIntakes {...props} />}
      {tab === 'schemas' && (
        <>
          <IntakesDezeWeek {...props} />
          <TabSchemas {...props} />
        </>
      )}
      {tab === 'sjablonen' && <TabSjablonen {...props} />}
      {tab === 'oefeningen' && <TabOefeningen t={t} filter={filterUitParams(zoek)} />}
      {tab === 'voedingsjablonen' && <TabVoedingSjablonen t={t} vestiging={vestiging} />}
    </>
  )
}

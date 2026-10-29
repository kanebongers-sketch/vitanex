import type { Metadata } from 'next'
import Link from 'next/link'
import { ClipboardPlus } from 'lucide-react'
import { eisModule } from '@/lib/club/toegang'
import { haalLid, initialen, volledigeNaam } from '@/lib/club/kern/lid'
import { haalMedewerkers } from '@/lib/club/kern/medewerker'
import { type ZoekParams } from '@/lib/club/kern/vestiging'
import { binnenVestigingen, kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { GeenVestigingen } from '@/components/club/shell/GeenVestigingen'
import { filterUitParams } from '@/lib/club/training/filter'
import { LidFilter } from '@/components/club/training/LidFilter'
import { NieuwSchemaKnop } from '@/components/club/training/SchemaActies'
import { TabIntakes, TabOefeningen, TabSchemas, TabSjablonen } from '@/components/club/training/TabInhoud'
import { kiesTab, TrainingTabs, trainingPad, trainingPaden } from '@/components/club/training/TrainingTabs'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { CLUB_TRAINING } from '@/lib/aiyourgym/taal/woorden/club/training'
import '@/components/club/training/training.css'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(CLUB_TRAINING)).pagina.titel }
}

// Training: intakes, schema's, sjablonen en de oefeningenbibliotheek.
// Tabblad en lid staan in de URL (?tab=schemas&lid=...), zodat het Leden-onderdeel
// direct naar alles van een lid kan linken.

export default async function TrainingPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisModule('training')
  const zoek = await searchParams
  const vestiging = kiesUit(t.vestigingen, zoek.v)
  if (!vestiging) return <GeenVestigingen />
  const tab = kiesTab(zoek.tab)
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

  // Een hoofdactie per tabblad: intake afnemen (Intakes) of een nieuw sjabloon (Sjablonen).
  // Bij Schema's is de lijst of de lege staat de hoofdzaak; daar is de intake een gewone knop.
  // De bibliotheek heeft een eigen knop voor een nieuwe oefening.
  const metIntake = tab === 'intakes' || tab === 'schemas'
  const tp = (await clubTekst(CLUB_TRAINING)).pagina
  return (
    <>
      <section className="club-paginakop">
        <div>
          <p className="club-boventitel">{naamVan(t.vestigingen, vestiging)}</p>
          <h1>{tp.titel}</h1>
          <p>{tp.intro}</p>
        </div>
        {(metIntake || tab === 'sjablonen') && (
          <div className="club-acties">
            {metIntake && lid && <NieuwSchemaKnop lidId={lid.id} editorHref={paden.editor} label={tp.leegSchema} primair={false} />}
            {metIntake && (
              <Link className={`club-knop${tab === 'intakes' ? ' club-knop--primair' : ''}`} href={paden.nieuweIntake(lid?.id ?? null)}>
                <ClipboardPlus aria-hidden size={16} /> {tp.intakeAfnemen}
              </Link>
            )}
            {tab === 'sjablonen' && <NieuwSchemaKnop lidId={null} editorHref={paden.editor} label={tp.nieuwSjabloon} primair={!lid} />}
          </div>
        )}
      </section>

      <div className="club-training-balk">
        <TrainingTabs vestiging={vestiging} actief={tab} lidId={lid?.id ?? null} tellers={{}} />
        {tab !== 'oefeningen' && (
          <LidFilter
            vestiging={vestiging}
            lid={lid}
            zonderLidHref={trainingPad(vestiging, tab, null)}
            metLidHref={trainingPad(vestiging, tab, '__lid__')}
          />
        )}
      </div>
      {lidParam && !lid && <p className="club-melding">{tp.lidNietGevonden}</p>}

      {tab === 'intakes' && <TabIntakes {...props} />}
      {tab === 'schemas' && <TabSchemas {...props} />}
      {tab === 'sjablonen' && <TabSjablonen {...props} />}
      {tab === 'oefeningen' && <TabOefeningen t={t} filter={filterUitParams(zoek)} />}
    </>
  )
}

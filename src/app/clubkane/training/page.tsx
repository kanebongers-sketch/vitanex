import type { Metadata } from 'next'
import Link from 'next/link'
import { ClipboardPlus } from 'lucide-react'
import { eisModule } from '@/lib/club/toegang'
import { haalLid, initialen, volledigeNaam } from '@/lib/club/kern/lid'
import { haalMedewerkers } from '@/lib/club/kern/medewerker'
import { kiesVestiging, VESTIGING_LABEL, type ZoekParams } from '@/lib/club/kern/vestiging'
import { filterUitParams } from '@/lib/club/training/filter'
import { LidFilter } from '@/components/club/training/LidFilter'
import { NieuwSchemaKnop } from '@/components/club/training/SchemaActies'
import { TabIntakes, TabOefeningen, TabSchemas, TabSjablonen } from '@/components/club/training/TabInhoud'
import { kiesTab, TrainingTabs, trainingPad, trainingPaden } from '@/components/club/training/TrainingTabs'
import '@/components/club/training/training.css'

export const metadata: Metadata = { title: 'Training' }

// Training: intakes, schema's, sjablonen en de oefeningenbibliotheek.
// Tabblad en lid staan in de URL (?tab=schemas&lid=...), zodat het Leden-onderdeel
// direct naar alles van een lid kan linken.

export default async function TrainingPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisModule('training')
  const zoek = await searchParams
  const vestiging = kiesVestiging(zoek.v)
  const tab = kiesTab(zoek.tab)
  const lidParam = typeof zoek.lid === 'string' ? zoek.lid : null

  const [lidRij, medewerkers] = await Promise.all([
    lidParam ? haalLid(t.admin, t.userId, lidParam) : Promise.resolve(null),
    haalMedewerkers(t.admin, t.userId, vestiging, 'trainer'),
  ])
  const lid = lidRij ? { id: lidRij.id, naam: volledigeNaam(lidRij), initialen: initialen(lidRij) } : null
  const trainers = Object.fromEntries((medewerkers ?? []).map((m) => [m.id, m.naam]))
  const paden = trainingPaden(vestiging)
  const props = { t, vestiging, lid, trainers }

  return (
    <>
      <section className="club-paginakop">
        <div>
          <p className="club-boventitel">{VESTIGING_LABEL[vestiging]}</p>
          <h1>Training</h1>
          <p>Intakes, schema&apos;s en oefeningen. Van intake naar een voorstel en een schema op maat in een paar minuten.</p>
        </div>
        <div className="club-acties">
          <Link className="club-knop" href={paden.nieuweIntake(lid?.id ?? null)}>
            <ClipboardPlus aria-hidden size={16} /> Intake afnemen
          </Link>
          {lid && <NieuwSchemaKnop lidId={lid.id} editorHref={paden.editor} label="Leeg schema" />}
          {tab === 'sjablonen' && <NieuwSchemaKnop lidId={null} editorHref={paden.editor} label="Nieuw sjabloon" />}
        </div>
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
      {lidParam && !lid && <p className="club-melding">Dit lid is niet gevonden. Je ziet alles van de vestiging.</p>}

      {tab === 'intakes' && <TabIntakes {...props} />}
      {tab === 'schemas' && <TabSchemas {...props} />}
      {tab === 'sjablonen' && <TabSjablonen {...props} />}
      {tab === 'oefeningen' && <TabOefeningen t={t} filter={filterUitParams(zoek)} />}
    </>
  )
}

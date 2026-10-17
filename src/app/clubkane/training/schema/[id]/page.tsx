import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { eisModule } from '@/lib/club/toegang'
import { haalMedewerkers } from '@/lib/club/kern/medewerker'
import { kiesVestiging, VESTIGING_LABEL, type ZoekParams } from '@/lib/club/kern/vestiging'
import { haalOefeningen, haalSchema, haalTrainingslog } from '@/lib/club/training/data'
import { uitOpgeslagen } from '@/lib/club/training/editor'
import { SchemaEditor } from '@/components/club/training/SchemaEditor'
import { TrainingslogKaart } from '@/components/club/training/TrainingslogKaart'
import { trainingPad, trainingPaden } from '@/components/club/training/TrainingTabs'
import '@/components/club/training/training.css'

export const metadata: Metadata = { title: 'Schema' }

// De schema-editor. Werkt voor schema's van leden en voor sjablonen (lid_id null).
// Rechts: wat het lid in de app heeft afgevinkt (alleen lezen).

export default async function SchemaPagina({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: ZoekParams }) {
  const t = await eisModule('training')
  const [{ id }, zoek] = await Promise.all([params, searchParams])
  const vestiging = kiesVestiging(zoek.v)

  const [schema, oefeningen, medewerkers, log] = await Promise.all([
    haalSchema(t.admin, t.userId, id),
    haalOefeningen(t.admin, t.userId),
    haalMedewerkers(t.admin, t.userId, vestiging, 'trainer'),
    haalTrainingslog(t.admin, t.userId, [id]),
  ])
  if (!schema) notFound()
  const { kop } = schema
  const isSjabloon = kop.lidId === null
  const terug = isSjabloon ? trainingPad(vestiging, 'sjablonen', null) : trainingPad(vestiging, 'schemas', kop.lidId)
  const beginStaat = uitOpgeslagen(schema.regels, kop.dagTitels)

  return (
    <div className="club-training-printpagina">
      <section className="club-paginakop">
        <div>
          <p className="club-boventitel">{isSjabloon ? 'Sjabloon' : `${kop.lidNaam ?? 'Lid'} · ${VESTIGING_LABEL[vestiging]}`}</p>
          <h1>{kop.naam}</h1>
          {!isSjabloon && kop.status === 'concept' && <p>Concept: zet het op actief zodra het klaar is voor het lid.</p>}
        </div>
        <Link className="club-knop club-knop--stil" href={terug}>
          <ArrowLeft aria-hidden size={16} /> {isSjabloon ? 'Sjablonen' : "Schema's van dit lid"}
        </Link>
      </section>
      {!oefeningen && <p className="club-melding club-melding--fout">De oefeningen konden niet worden geladen.</p>}
      <SchemaEditor
        key={kop.bijgewerktOp}
        schemaId={kop.id}
        isSjabloon={isSjabloon}
        lidNaam={kop.lidNaam}
        vestiging={vestiging}
        beginKop={{
          naam: kop.naam, doel: kop.doel, niveau: kop.niveau, weken: kop.weken ? String(kop.weken) : '', status: kop.status,
          medewerkerId: kop.medewerkerId ?? '', notitie: kop.notitie ?? '',
        }}
        beginStaat={beginStaat}
        oefeningen={oefeningen ?? []}
        trainers={(medewerkers ?? []).map((m) => ({ id: m.id, naam: m.naam }))}
        editorHref={trainingPaden(vestiging).editor}
        terugHref={terug}
        zijkant={isSjabloon ? null : <TrainingslogKaart log={log ?? []} dagTitels={beginStaat.dagTitels} nu={new Date()} />}
      />
    </div>
  )
}

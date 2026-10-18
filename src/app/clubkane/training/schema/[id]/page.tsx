import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { eisModule } from '@/lib/club/toegang'
import { haalMedewerkers } from '@/lib/club/kern/medewerker'
import { recordInEigenVestiging } from '@/lib/club/kern/vestiging-toegang'
import { type ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { GeenVestigingen } from '@/components/club/shell/GeenVestigingen'
import { haalOefeningen, haalSchema, haalSetLogs, haalTrainingslog } from '@/lib/club/training/data'
import { progressieOverzicht } from '@/lib/club/training/progressie'
import { uitOpgeslagen } from '@/lib/club/training/editor'
import { SchemaEditor } from '@/components/club/training/SchemaEditor'
import { TrainingslogKaart } from '@/components/club/training/TrainingslogKaart'
import { trainingPad, trainingPaden } from '@/components/club/training/TrainingTabs'
import '@/components/club/training/training.css'

export const metadata: Metadata = { title: 'Schema' }

// De schema-editor. Werkt voor schema's van leden en voor sjablonen (lid_id null).
// Rechts: de progressie per oefening en wat het lid in de app heeft afgevinkt.

export default async function SchemaPagina({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: ZoekParams }) {
  const t = await eisModule('training')
  const [{ id }, zoek] = await Promise.all([params, searchParams])
  const vestiging = kiesUit(t.vestigingen, zoek.v)
  if (!vestiging) return <GeenVestigingen />

  const [schema, eigen, oefeningen, medewerkers, log] = await Promise.all([
    haalSchema(t.admin, t.userId, id),
    // Het schema van een lid uit een andere vestiging: 404 (een sjabloon is sportschoolbreed).
    recordInEigenVestiging(t, 'club_schemas', id),
    haalOefeningen(t.admin, t.userId),
    haalMedewerkers(t.admin, t.userId, vestiging, 'trainer'),
    haalTrainingslog(t.admin, t.userId, [id]),
  ])
  if (!schema || !eigen) notFound()
  const { kop } = schema
  const isSjabloon = kop.lidId === null
  const terug = isSjabloon ? trainingPad(vestiging, 'sjablonen', null) : trainingPad(vestiging, 'schemas', kop.lidId)
  const beginStaat = uitOpgeslagen(schema.regels, kop.dagTitels)
  // Progressie: wat het lid per set logde, met de volgende stap volgens de vaste vakregel.
  const sets = kop.lidId ? await haalSetLogs(t.admin, t.userId, kop.lidId, schema.regels.map((r) => r.oefeningId)) : null
  const progressie = sets && oefeningen ? progressieOverzicht(schema.regels, new Map(oefeningen.map((o) => [o.id, o])), sets) : null

  return (
    <div className="club-training-printpagina">
      <section className="club-paginakop">
        <div>
          <p className="club-boventitel">{isSjabloon ? 'Sjabloon' : `${kop.lidNaam ?? 'Lid'} · ${naamVan(t.vestigingen, vestiging)}`}</p>
          <h1>{kop.naam}</h1>
          {!isSjabloon && kop.status === 'concept' && <p>Concept: pas aan waar nodig en kies Activeren zodra het klaar is voor het lid.</p>}
        </div>
        <Link className="club-knop club-knop--stil" href={terug}>
          <ArrowLeft aria-hidden size={16} /> {isSjabloon ? 'Sjablonen' : `Schema's van ${kop.lidNaam?.split(' ')[0] ?? 'dit lid'}`}
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
        progressie={progressie}
        zijkant={isSjabloon ? null : <TrainingslogKaart log={log ?? []} dagTitels={beginStaat.dagTitels} nu={new Date()} />}
      />
    </div>
  )
}

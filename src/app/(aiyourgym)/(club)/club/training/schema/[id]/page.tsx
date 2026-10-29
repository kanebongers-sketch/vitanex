import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import { CLUB_TRAINING } from '@/lib/aiyourgym/taal/woorden/club/training'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { eisModule } from '@/lib/club/toegang'
import { haalMedewerkers } from '@/lib/club/kern/medewerker'
import { recordInEigenVestiging } from '@/lib/club/kern/vestiging-toegang'
import { type ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { GeenVestigingen } from '@/components/club/shell/GeenVestigingen'
import { ClubKruimel, stappenNaarLid, type KruimelStap } from '@/components/club/shell/ClubKruimel'
import { magOnderdeel } from '@/lib/club/beheerders/rechten'
import { moduleAan } from '@/lib/club/kern/organisatie'
import { haalOefeningen, haalSchema, haalSetLogs, haalTrainingslog } from '@/lib/club/training/data'
import { progressieOverzicht } from '@/lib/club/training/progressie'
import { uitOpgeslagen } from '@/lib/club/training/editor'
import { SchemaEditor } from '@/components/club/training/SchemaEditor'
import { TrainingslogKaart } from '@/components/club/training/TrainingslogKaart'
import { trainingPad, trainingPaden } from '@/components/club/training/TrainingTabs'
import { kwamVanLid, lidKaartPad, metVanLid, terugNaar } from '@/lib/club/leden/hub/tabs'
import '@/components/club/training/training.css'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(CLUB_TRAINING)).schemaPagina.titel }
}

// De schema-editor. Werkt voor schema's van leden en voor sjablonen (lid_id null).
// Rechts: de progressie per oefening en wat het lid in de app heeft afgevinkt.

export default async function SchemaPagina({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: ZoekParams }) {
  const t = await eisModule('training')
  const taal = await getTaal()
  const tt = await clubTekst(CLUB_TRAINING)
  const ts = tt.schemaPagina
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
  const magLeden = moduleAan(t.organisatie, 'leden') && magOnderdeel(t.onderdelen, 'leden')
  // Begon het op de ledenkaart (?van=lid), dan gaat terug (ook na verwijderen) naar het tabblad Training van het lid.
  const vanLid = kwamVanLid(zoek.van) && !isSjabloon
  const anders = isSjabloon ? trainingPad(vestiging, 'sjablonen', null) : trainingPad(vestiging, 'schemas', kop.lidId)
  const terug = terugNaar({ vanLid, magLeden, lidId: kop.lidId, vestiging, tab: 'training', anders })
  const editorHref = vanLid && magLeden ? metVanLid(trainingPaden(vestiging).editor) : trainingPaden(vestiging).editor
  const beginStaat = uitOpgeslagen(schema.regels, kop.dagTitels)
  // Progressie: wat het lid per set logde, met de volgende stap volgens de vaste vakregel.
  const sets = kop.lidId ? await haalSetLogs(t.admin, t.userId, kop.lidId, schema.regels.map((r) => r.oefeningId)) : null
  const progressie = sets && oefeningen ? progressieOverzicht(schema.regels, new Map(oefeningen.map((o) => [o.id, o])), sets, taal) : null
  // De weg terug: bij een lid via de ledenkaart (daar komt de trainer vandaan), anders via Training.
  const lidId = kop.lidId
  const naarLid = lidId ? stappenNaarLid(magLeden, { id: lidId, naam: kop.lidNaam ?? ts.lid }, vestiging, taal).map((st, i) => (i === 1 ? { ...st, href: lidKaartPad(lidId, vestiging, 'training') } : st)) : []
  const kruimel: KruimelStap[] = naarLid.length
    ? naarLid
    : [{ label: tt.pagina.titel, href: trainingPad(vestiging, isSjabloon ? 'sjablonen' : 'schemas', null) }, { label: isSjabloon ? ts.sjablonen : ts.schemasVan(kop.lidNaam?.split(' ')[0] ?? ts.ditLid), href: anders }]

  return (
    <div className="club-training-printpagina">
      <ClubKruimel stappen={kruimel} huidig={kop.naam} />
      <section className="club-paginakop">
        <div>
          <p className="club-boventitel">{isSjabloon ? ts.sjabloon : `${kop.lidNaam ?? ts.lid} · ${naamVan(t.vestigingen, vestiging)}`}</p>
          <h1>{kop.naam}</h1>
          {!isSjabloon && kop.status === 'concept' && <p>{ts.concept}</p>}
        </div>
      </section>
      {!oefeningen && <p className="club-melding club-melding--fout">{ts.oefeningenFout}</p>}
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
        editorHref={editorHref}
        terugHref={terug}
        progressie={progressie}
        zijkant={isSjabloon ? null : <TrainingslogKaart log={log ?? []} dagTitels={beginStaat.dagTitels} nu={new Date()} />}
      />
    </div>
  )
}

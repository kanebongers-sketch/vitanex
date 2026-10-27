import Link from 'next/link'
import { Suspense } from 'react'
import { ClipboardPlus, PencilLine } from 'lucide-react'
import type { ClubToegang } from '@/lib/club/toegang'
import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'
import type { Lid } from '@/lib/club/kern/lid'
import { volledigeNaam } from '@/lib/club/kern/lid'
import type { Medewerker } from '@/lib/club/kern/medewerker'
import { dagSleutelNl } from '@/lib/club/kern/datum'
import { haalIntakes, haalSchemas, haalTrainingslog } from '@/lib/club/training/data'
import type { SchemaKop } from '@/lib/club/training/rijen'
import { haalVoortgang } from '@/lib/club/voortgang/data'
import { haalPlan } from '@/lib/club/voeding/lezen'
import { metVanLid } from '@/lib/club/leden/hub/tabs'
import type { KaartRechten } from '@/lib/club/leden/hub/rechten'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { tekst } from '@/lib/aiyourgym/taal/woordenboek'
import { formatDatum } from '@/lib/aiyourgym/taal/formaat'
import { LEDENKAART } from '@/lib/aiyourgym/taal/woorden/club/ledenkaart'
import { IntakeLijst } from '@/components/club/training/IntakeLijst'
import { MetingVerloop } from '@/components/club/training/MetingVerloop'
import { SchemaLijst } from '@/components/club/training/SchemaLijst'
import { Voortgangskaart } from '@/components/club/voortgang/Voortgangskaart'
import { VoedingOpKaart } from '@/components/club/voeding/VoedingOpKaart'
import { MetingenUitApps } from '@/components/club/health/MetingenUitApps'
import { SchemaMaken } from './SchemaMaken'
import '@/components/club/training/training.css'

// Tabblad Training: intake starten of bekijken, schema maken of aanpassen, alle
// schema's en intakes van het lid, en de voortgang en metingen. Alles wat hier
// begint, gaat met ?van=lid naar het bestaande scherm en komt daarna terug.

interface TrainingTabProps {
  t: ClubToegang
  lid: Lid
  vestiging: Vestiging
  medewerkers: Medewerker[]
  rechten: KaartRechten
  /** ?maak=schema: het paneel Schema maken staat meteen open. */
  maakOpen: boolean
  nu: Date
}

function huidigSchema(schemas: readonly SchemaKop[]): SchemaKop | null {
  return schemas.find((s) => s.status === 'actief') ?? schemas.find((s) => s.status === 'concept') ?? null
}

async function SchemasEnIntakes({ t, lid, vestiging, medewerkers, maakOpen }: Omit<TrainingTabProps, 'rechten' | 'nu'>) {
  const taal = await getTaal()
  const w = tekst(LEDENKAART, taal).training
  const [schemas, intakes, sjablonen] = await Promise.all([
    haalSchemas(t.admin, t.userId, { vestiging, lidId: lid.id, sjablonen: false }),
    haalIntakes(t.admin, t.userId, { vestiging, lidId: lid.id }),
    haalSchemas(t.admin, t.userId, { vestiging, lidId: null, sjablonen: true }),
  ])
  const log = schemas ? ((await haalTrainingslog(t.admin, t.userId, schemas.map((s) => s.id))) ?? []) : []
  const editorHref = metVanLid(clubPad('/training/schema/__id__', vestiging))
  const intakeHref = metVanLid(clubPad('/training/intake', vestiging, { lid: lid.id }))
  const lidHref = clubPad('/training', vestiging, { tab: 'intakes', lid: '__lid__' })
  const trainers = Object.fromEntries(medewerkers.map((m) => [m.id, m.naam]))
  const laatste = intakes?.[0] ?? null
  const huidig = schemas ? huidigSchema(schemas) : null
  const datum = (d: string) => formatDatum(d, taal, 'kort')

  return (
    <>
      {schemas === null || intakes === null ? <p className="club-melding club-melding--fout" role="alert">{w.fout}</p> : null}
      <section className="club-kaart club-kaart--accent club-lidhub-huidig" aria-labelledby="huidig-kop">
        <div className="club-sectiekop">
          <h2 id="huidig-kop">{w.huidig}</h2>
          <span>{laatste ? w.laatsteIntake(datum(laatste.datum)) : null}</span>
        </div>
        {huidig ? (
          <p className="club-lidhub-huidig-naam">
            <strong>{huidig.naam}</strong>
            <span className="club-rij-sub">{w.dagen(huidig.dagTitels.length || 1)} · {w.bijgewerkt(datum(huidig.bijgewerktOp))}</span>
          </p>
        ) : (
          <p className="club-hint">{w.geenSchema(lid.voornaam)}</p>
        )}
        <div className="club-acties">
          {huidig && (
            <Link className="club-knop club-knop--primair" href={editorHref.replace('__id__', huidig.id)}>
              <PencilLine aria-hidden size={16} /> {w.schemaAanpassen}
            </Link>
          )}
          <SchemaMaken
            lid={{ id: lid.id, naam: volledigeNaam(lid) }}
            vestiging={vestiging}
            editorHref={editorHref}
            intake={laatste ? { id: laatste.id, datum: datum(laatste.datum) } : null}
            sjablonen={(sjablonen ?? []).map((s) => ({ id: s.id, naam: s.naam }))}
            beginOpen={maakOpen}
            primair={!huidig}
          />
          <Link className="club-knop" href={intakeHref}>
            <ClipboardPlus aria-hidden size={16} /> {laatste ? w.nieuweIntake : w.intakeStarten}
          </Link>
        </div>
      </section>

      <section className="club-lidhub-blok" aria-labelledby="schemas-kop">
        <h2 id="schemas-kop" className="club-training-tussenkop">{w.geschiedenis}</h2>
        {schemas && schemas.length > 0
          ? <SchemaLijst schemas={schemas} log={log} trainers={trainers} editorHref={editorHref} toonLid={false} />
          : <p className="club-hint">{w.geenGeschiedenis}</p>}
      </section>

      <section className="club-lidhub-blok" aria-labelledby="intakes-kop">
        <h2 id="intakes-kop" className="club-training-tussenkop">{w.intakes}</h2>
        {intakes && intakes.length > 0 ? (
          <div className="club-training-stapel">
            <MetingVerloop intakes={intakes} />
            <IntakeLijst intakes={intakes} trainers={trainers} editorHref={editorHref} lidHref={lidHref} toonLid={false} />
          </div>
        ) : (
          <p className="club-hint">{w.geenIntake(lid.voornaam)}</p>
        )}
      </section>
    </>
  )
}

export async function TrainingTab(props: TrainingTabProps) {
  const { t, lid, vestiging, medewerkers, rechten, nu } = props
  const w = tekst(LEDENKAART, await getTaal()).training
  const [voortgang, voeding] = await Promise.all([
    haalVoortgang(t.admin, t.userId, lid.id, nu),
    rechten.voeding ? haalPlan(t.admin, t.userId, lid.id) : Promise.resolve(null),
  ])
  return (
    <div className="club-lidhub-tab">
      {rechten.training && (
        <Suspense fallback={<div className="club-skelet" style={{ minHeight: 180 }} aria-hidden />}>
          <SchemasEnIntakes t={t} lid={lid} vestiging={vestiging} medewerkers={medewerkers} maakOpen={props.maakOpen} />
        </Suspense>
      )}
      <section className="club-lidhub-blok" id="voortgang" aria-label={w.metingen}>
        <Voortgangskaart begin={voortgang} medewerkers={medewerkers.map((m) => ({ id: m.id, naam: m.naam }))} vandaag={dagSleutelNl(nu)} nu={nu.toISOString()} />
        {rechten.apps && (
          <Suspense fallback={null}>
            <MetingenUitApps t={t} lidId={lid.id} naam={volledigeNaam(lid)} vestiging={lid.vestiging} />
          </Suspense>
        )}
        {rechten.voeding && <VoedingOpKaart lidId={lid.id} vestiging={vestiging} plan={voeding} />}
      </section>
    </div>
  )
}

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { ClubToegang } from '@/lib/club/toegang'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { haalIntakes, haalSchemas } from '@/lib/club/training/data'
import type { SchemaKop } from '@/lib/club/training/rijen'
import { SCHEMA_STATUS_LABEL, type SchemaStatus } from '@/lib/club/training/typen'
import { toonDatum } from '@/lib/club/training/weergave'
import { trainingPad, trainingPaden } from './TrainingTabs'
import { VoorstelKnop } from './VoorstelKnop'
import './training.css'

// Training op de ledenkaart: de schema's van het lid en de snelste volgende stap.
// Een schema openen kost een klik; zonder schema staat het voorstel uit de laatste
// intake (of de intake zelf) klaar als hoofdactie.

interface LidTrainingProps {
  t: ClubToegang
  lidId: string
  voornaam: string
  vestiging: Vestiging
}

const VOLGORDE: Record<SchemaStatus, number> = { actief: 0, concept: 1, afgerond: 2 }
const STATUS_CHIP: Record<SchemaStatus, string> = { concept: 'club-chip--info', actief: 'club-chip--ok', afgerond: 'club-chip--uit' }
const MAX = 3

function SchemaRij({ s, href }: { s: SchemaKop; href: string }) {
  const dagen = s.dagTitels.length || 1
  return (
    <li>
      <Link href={href} className="club-training-lidrij">
        <span className="club-rij-hoofd">
          <span className="club-rij-titel">{s.naam}</span>
          <span className="club-rij-sub">{dagen} {dagen === 1 ? 'dag' : 'dagen'} · bijgewerkt {toonDatum(s.bijgewerktOp)}</span>
        </span>
        <span className={`club-chip ${STATUS_CHIP[s.status]}`}>{SCHEMA_STATUS_LABEL[s.status]}</span>
        <ChevronRight aria-hidden size={16} className="club-training-schemarij-pijl" />
      </Link>
    </li>
  )
}

export async function LidTraining({ t, lidId, voornaam, vestiging }: LidTrainingProps) {
  const [schemas, intakes] = await Promise.all([
    haalSchemas(t.admin, t.userId, { vestiging, lidId, sjablonen: false }),
    haalIntakes(t.admin, t.userId, { vestiging, lidId }, 1),
  ])
  const paden = trainingPaden(vestiging)
  const laatste = intakes?.[0] ?? null
  const gesorteerd = [...(schemas ?? [])].sort((a, b) => VOLGORDE[a.status] - VOLGORDE[b.status])
  const meer = gesorteerd.length - MAX

  return (
    <section className="club-kaart club-training-lidkaart" id="training" aria-labelledby="lidtraining-kop">
      <div className="club-sectiekop">
        <h2 id="lidtraining-kop">Training</h2>
        <span>{laatste ? `Intake ${toonDatum(laatste.datum)}` : intakes ? 'Nog geen intake' : ''}</span>
      </div>
      {schemas === null || intakes === null ? (
        <p className="club-melding club-melding--fout" role="alert">De training van {voornaam} kon niet worden geladen. Ververs de pagina.</p>
      ) : null}
      {gesorteerd.length > 0 ? (
        <ul className="club-lijst">
          {gesorteerd.slice(0, MAX).map((s) => <SchemaRij key={s.id} s={s} href={paden.editor.replace('__id__', s.id)} />)}
        </ul>
      ) : schemas ? (
        <div className="club-training-lidleeg">
          <p>
            Nog geen schema. {laatste ? 'Maak er een vanuit de intake' : 'Neem een intake af'} of kies een startschema.
          </p>
          <div className="club-acties">
            {laatste ? (
              <VoorstelKnop intakeId={laatste.id} editorHref={paden.editor} label="Schemavoorstel" />
            ) : (
              <Link className="club-knop club-knop--primair" href={paden.nieuweIntake(lidId)}>Intake afnemen</Link>
            )}
            <Link className="club-knop" href={trainingPad(vestiging, 'sjablonen', lidId)}>Startschema</Link>
          </div>
        </div>
      ) : null}
      {meer > 0 && (
        <Link className="club-training-lidmeer" href={trainingPad(vestiging, 'schemas', lidId)}>
          Alle {gesorteerd.length} schema&apos;s van {voornaam}
        </Link>
      )}
    </section>
  )
}

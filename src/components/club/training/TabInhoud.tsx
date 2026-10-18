import Link from 'next/link'
import type { ClubToegang } from '@/lib/club/toegang'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { haalIntakes, haalOefeningen, haalSchemas, haalTrainingslog } from '@/lib/club/training/data'
import type { OefeningFilter } from '@/lib/club/training/filter'
import { BasisSjablonen } from './BasisSjablonen'
import { IntakeLijst } from './IntakeLijst'
import { MetingVerloop } from './MetingVerloop'
import { OefeningenBeheer } from './OefeningenBeheer'
import { SchemaLijst, SjabloonLijst } from './SchemaLijst'
import { trainingPad, trainingPaden } from './TrainingTabs'
import { VoorstelKnop } from './VoorstelKnop'
import { toonDatum } from '@/lib/club/training/weergave'

// De inhoud van de vier tabbladen. Server Components: ze halen alleen de data
// van het tabblad dat open staat.

interface TabProps {
  t: ClubToegang
  vestiging: Vestiging
  lid: { id: string; naam: string } | null
  trainers: Record<string, string>
}

function Fout({ wat }: { wat: string }) {
  return <p className="club-melding club-melding--fout" role="alert">{wat} konden niet worden geladen. Ververs de pagina of probeer het later opnieuw.</p>
}

export async function TabIntakes({ t, vestiging, lid, trainers }: TabProps) {
  const intakes = await haalIntakes(t.admin, t.userId, { vestiging, lidId: lid?.id ?? null })
  if (!intakes) return <Fout wat="De intakes" />
  const paden = trainingPaden(vestiging)
  if (intakes.length === 0) {
    return (
      <div className="club-leeg club-training-leeg">
        <p>
          <strong>{lid ? `Nog geen intake voor ${lid.naam}.` : 'Nog geen intakes in deze vestiging.'}</strong>{' '}
          Neem er een af met de knop bovenaan. Daarna maak je in een klik een schemavoorstel.
        </p>
      </div>
    )
  }
  return (
    <div className="club-training-stapel">
      {lid && <MetingVerloop intakes={intakes} />}
      <IntakeLijst intakes={intakes} trainers={trainers} editorHref={paden.editor} lidHref={paden.intakesVanLid} toonLid={!lid} />
    </div>
  )
}

/** Nog geen schema: de twee snelste wegen naar een schema, met de intake voorop als die er is. */
async function GeenSchema({ t, vestiging, lid }: Omit<TabProps, 'trainers'>) {
  const paden = trainingPaden(vestiging)
  const sjablonen = trainingPad(vestiging, 'sjablonen', lid?.id ?? null)
  // De knop "Intake afnemen" staat al bovenaan; hier alleen wat daar niet staat.
  const intakes = lid ? await haalIntakes(t.admin, t.userId, { vestiging, lidId: lid.id }, 1) : null
  const laatste = intakes?.[0] ?? null
  const tekst = !lid
    ? 'Maak er een vanuit een intake (tabblad Intakes) of kies een startschema.'
    : laatste
      ? `Maak er een vanuit de intake van ${toonDatum(laatste.datum)} of kies een startschema.`
      : 'Neem eerst een intake af, of kies direct een startschema.'
  return (
    <div className="club-leeg club-training-leeg">
      <p>
        <strong>{lid ? `Nog geen schema voor ${lid.naam}.` : "Nog geen schema's in deze vestiging."}</strong> {tekst}
      </p>
      <div className="club-acties">
        {laatste && <VoorstelKnop intakeId={laatste.id} editorHref={paden.editor} label="Schemavoorstel uit intake" />}
        <Link className={`club-knop${laatste ? '' : ' club-knop--primair'}`} href={sjablonen}>Startschema kiezen</Link>
      </div>
    </div>
  )
}

export async function TabSchemas({ t, vestiging, lid, trainers }: TabProps) {
  const schemas = await haalSchemas(t.admin, t.userId, { vestiging, lidId: lid?.id ?? null, sjablonen: false })
  if (!schemas) return <Fout wat="De schema's" />
  if (schemas.length === 0) return <GeenSchema t={t} vestiging={vestiging} lid={lid} />
  const log = (await haalTrainingslog(t.admin, t.userId, schemas.map((s) => s.id))) ?? []
  return <SchemaLijst schemas={schemas} log={log} trainers={trainers} editorHref={trainingPaden(vestiging).editor} toonLid={!lid} />
}

export async function TabSjablonen({ t, vestiging, lid }: TabProps) {
  const sjablonen = await haalSchemas(t.admin, t.userId, { vestiging, lidId: null, sjablonen: true })
  if (!sjablonen) return <Fout wat="De sjablonen" />
  const editorHref = trainingPaden(vestiging).editor
  const alOpgeslagen = sjablonen.map((s) => s.basisSleutel).filter((k): k is string => k !== null)
  return (
    <div className="club-training-stapel">
      <section className="club-training-stapel" aria-labelledby="eigen-kop">
        <h2 id="eigen-kop" className="club-training-tussenkop">Eigen sjablonen</h2>
        {sjablonen.length === 0 ? (
          <p className="club-leeg">Nog geen eigen sjablonen. Bewaar een startschema hieronder, of sla een goed schema op als sjabloon.</p>
        ) : (
          <SjabloonLijst sjablonen={sjablonen} vestiging={vestiging} lid={lid} editorHref={editorHref} />
        )}
      </section>
      <BasisSjablonen vestiging={vestiging} lid={lid} alOpgeslagen={alOpgeslagen} editorHref={editorHref} />
    </div>
  )
}

export async function TabOefeningen({ t, filter }: { t: ClubToegang; filter: OefeningFilter }) {
  const oefeningen = await haalOefeningen(t.admin, t.userId)
  if (!oefeningen) return <Fout wat="De oefeningen" />
  return <OefeningenBeheer oefeningen={oefeningen} beginFilter={filter} />
}

import Link from 'next/link'
import type { ClubToegang } from '@/lib/club/toegang'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { haalIntakes, haalOefeningen, haalSchemas, haalTrainingslog } from '@/lib/club/training/data'
import type { OefeningFilter } from '@/lib/club/training/filter'
import { IntakeLijst } from './IntakeLijst'
import { MetingVerloop } from './MetingVerloop'
import { OefeningenBeheer } from './OefeningenBeheer'
import { SchemaLijst, SjabloonLijst } from './SchemaLijst'
import { trainingPaden } from './TrainingTabs'

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
      <div className="club-leeg">
        <p>{lid ? `${lid.naam} heeft nog geen intake.` : 'Nog geen intakes in deze vestiging.'}</p>
        <Link className="club-knop club-knop--primair" href={paden.nieuweIntake(lid?.id ?? null)}>Intake afnemen</Link>
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

export async function TabSchemas({ t, vestiging, lid, trainers }: TabProps) {
  const schemas = await haalSchemas(t.admin, t.userId, { vestiging, lidId: lid?.id ?? null, sjablonen: false })
  if (!schemas) return <Fout wat="De schema's" />
  if (schemas.length === 0) {
    return <p className="club-leeg">{lid ? `${lid.naam} heeft nog geen schema. Maak er een vanuit de intake, een sjabloon of leeg.` : "Nog geen schema's in deze vestiging."}</p>
  }
  const log = (await haalTrainingslog(t.admin, t.userId, schemas.map((s) => s.id))) ?? []
  return <SchemaLijst schemas={schemas} log={log} trainers={trainers} editorHref={trainingPaden(vestiging).editor} toonLid={!lid} />
}

export async function TabSjablonen({ t, vestiging, lid }: TabProps) {
  const sjablonen = await haalSchemas(t.admin, t.userId, { vestiging, lidId: null, sjablonen: true })
  if (!sjablonen) return <Fout wat="De sjablonen" />
  if (sjablonen.length === 0) {
    return <p className="club-leeg">Nog geen sjablonen. Maak er een, of sla een goed schema op als sjabloon.</p>
  }
  return <SjabloonLijst sjablonen={sjablonen} vestiging={vestiging} lid={lid} editorHref={trainingPaden(vestiging).editor} />
}

export async function TabOefeningen({ t, filter }: { t: ClubToegang; filter: OefeningFilter }) {
  const oefeningen = await haalOefeningen(t.admin, t.userId)
  if (!oefeningen) return <Fout wat="De oefeningen" />
  return <OefeningenBeheer oefeningen={oefeningen} beginFilter={filter} />
}

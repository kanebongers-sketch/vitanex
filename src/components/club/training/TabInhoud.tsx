import Link from 'next/link'
import { ArrowRight, Plus } from 'lucide-react'
import { clubPad } from '@/lib/club/kern/vestiging'
import { maandagVan, nlDelen } from '@/lib/club/rooster/tijd'
import { haalSjablonen } from '@/lib/club/voeding/lezen'
import { SjablonenLijst } from '@/components/club/voeding/Lijsten'
import '@/components/club/voeding/voeding.css'
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
import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import { CLUB_TRAINING } from '@/lib/aiyourgym/taal/woorden/club/training'

// De inhoud van Schema's (met Intakes deze week en de lijst met alle intakes)
// en de delen van de Bibliotheek. Server Components: ze halen alleen de data
// van wat open staat.

interface TabProps {
  t: ClubToegang
  vestiging: Vestiging
  lid: { id: string; naam: string } | null
  trainers: Record<string, string>
}

async function Fout({ wat }: { wat: 'deIntakes' | 'deSchemas' | 'deSjablonen' | 'deOefeningen' }) {
  const t = (await clubTekst(CLUB_TRAINING)).tab
  return <p className="club-melding club-melding--fout" role="alert">{t.laadfout(t[wat])}</p>
}

export async function TabIntakes({ t, vestiging, lid, trainers }: TabProps) {
  const intakes = await haalIntakes(t.admin, t.userId, { vestiging, lidId: lid?.id ?? null })
  if (!intakes) return <Fout wat="deIntakes" />
  const paden = trainingPaden(vestiging)
  if (intakes.length === 0) {
    const tt = (await clubTekst(CLUB_TRAINING)).tab
    return (
      <div className="club-leeg club-training-leeg">
        <p>
          <strong>{lid ? tt.geenIntakeLid(lid.naam) : tt.geenIntakes}</strong> {tt.intakeUitleg}
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
  const taal = await getTaal()
  const tt = (await clubTekst(CLUB_TRAINING)).tab
  const tekst = !lid ? tt.vanuitIntakeTab : laatste ? tt.vanuitIntake(toonDatum(laatste.datum, taal)) : tt.eerstIntake
  return (
    <div className="club-leeg club-training-leeg">
      <p>
        <strong>{lid ? tt.geenSchemaLid(lid.naam) : tt.geenSchemas}</strong> {tekst}
      </p>
      <div className="club-acties">
        {laatste && <VoorstelKnop intakeId={laatste.id} editorHref={paden.editor} label={tt.voorstelUitIntake} />}
        <Link className={`club-knop${laatste ? '' : ' club-knop--primair'}`} href={sjablonen}>{tt.startschemaKiezen}</Link>
      </div>
    </div>
  )
}

export async function TabSchemas({ t, vestiging, lid, trainers }: TabProps) {
  const schemas = await haalSchemas(t.admin, t.userId, { vestiging, lidId: lid?.id ?? null, sjablonen: false })
  if (!schemas) return <Fout wat="deSchemas" />
  if (schemas.length === 0) return <GeenSchema t={t} vestiging={vestiging} lid={lid} />
  const log = (await haalTrainingslog(t.admin, t.userId, schemas.map((s) => s.id))) ?? []
  return <SchemaLijst schemas={schemas} log={log} trainers={trainers} editorHref={trainingPaden(vestiging).editor} toonLid={!lid} />
}

export async function TabSjablonen({ t, vestiging, lid }: TabProps) {
  const sjablonen = await haalSchemas(t.admin, t.userId, { vestiging, lidId: null, sjablonen: true })
  if (!sjablonen) return <Fout wat="deSjablonen" />
  const tt = (await clubTekst(CLUB_TRAINING)).tab
  const editorHref = trainingPaden(vestiging).editor
  const alOpgeslagen = sjablonen.map((s) => s.basisSleutel).filter((k): k is string => k !== null)
  return (
    <div className="club-training-stapel">
      <section className="club-training-stapel" aria-labelledby="eigen-kop">
        <h2 id="eigen-kop" className="club-training-tussenkop">{tt.eigenSjablonen}</h2>
        {sjablonen.length === 0 ? (
          <p className="club-leeg">{tt.geenEigen}</p>
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
  if (!oefeningen) return <Fout wat="deOefeningen" />
  return <OefeningenBeheer oefeningen={oefeningen} beginFilter={filter} />
}

/**
 * Bovenaan Schema's: de intakes van deze week (maandag tot nu en later),
 * hoogstens zes. Geen intakes deze week: het blok staat er niet.
 */
export async function IntakesDezeWeek({ t, vestiging, lid, trainers }: TabProps) {
  const intakes = await haalIntakes(t.admin, t.userId, { vestiging, lidId: lid?.id ?? null }, 20)
  if (!intakes) return null
  const maandag = maandagVan(nlDelen(new Date()).datum)
  const week = intakes.filter((i) => i.datum >= maandag).slice(0, 6)
  if (week.length === 0) return null
  const tp = (await clubTekst(CLUB_TRAINING)).pagina
  const paden = trainingPaden(vestiging)
  return (
    <section className="club-training-weekintakes" aria-labelledby="intakes-week-kop">
      <header className="club-sectiekop">
        <h2 id="intakes-week-kop" className="club-training-tussenkop">{tp.intakesWeek} <span className="club-training-teller">{week.length}</span></h2>
        <Link href={trainingPad(vestiging, 'intakes', lid?.id ?? null)} className="club-training-meer">{tp.alleIntakes} <ArrowRight size={14} aria-hidden /></Link>
      </header>
      <IntakeLijst intakes={week} trainers={trainers} editorHref={paden.editor} lidHref={paden.intakesVanLid} toonLid={!lid} />
    </section>
  )
}

/** Bibliotheek, deel Voeding: de voedingssjablonen; openen en wijzigen op het volledige scherm bij Voeding. */
export async function TabVoedingSjablonen({ t, vestiging }: Pick<TabProps, 't' | 'vestiging'>) {
  const [sjablonen, tp] = await Promise.all([haalSjablonen(t.admin, t.userId), clubTekst(CLUB_TRAINING)])
  const w = tp.pagina.voeding
  return (
    <section className="club-training-stapel" aria-labelledby="voeding-sjablonen-kop">
      <header className="club-sectiekop">
        <h2 id="voeding-sjablonen-kop" className="club-training-tussenkop">{w.titel}</h2>
        <Link href={clubPad('/voeding', vestiging, { tab: 'sjablonen', nieuw: '1' })} className="club-knop club-knop--klein"><Plus size={15} aria-hidden /> {w.nieuw}</Link>
      </header>
      {sjablonen === null ? (
        <p className="club-melding club-melding--fout" role="alert">{w.fout}</p>
      ) : sjablonen.length === 0 ? (
        <p className="club-leeg">{w.leeg}</p>
      ) : (
        <SjablonenLijst sjablonen={sjablonen} gekozen={null} vestiging={vestiging} />
      )}
    </section>
  )
}

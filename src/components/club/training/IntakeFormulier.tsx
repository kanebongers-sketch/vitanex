'use client'

import Link from 'next/link'
import { useState, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import { DOEL_LABEL, DOELEN, NIVEAU_LABEL, NIVEAUS, VOORKEUR_LABEL, VOORKEUREN } from '@/lib/club/training/typen'
import { idUit, stuur } from './api'
import { beginStaat, naarVerzoek, stappenKlaar, type IntakeStaat } from './intake-staat'
import { IntakeGezondheid } from './IntakeGezondheid'
import { IntakeMetingen } from './IntakeMetingen'
import { KeuzeChips, wissel } from './KeuzeChips'
import { LidKiezer, type GekozenLid } from './LidKiezer'
import { VoorstelKnop } from './VoorstelKnop'

interface IntakeFormulierProps {
  vestiging: string
  beginLid: GekozenLid | null
  trainers: { id: string; naam: string }[]
  vandaag: string
  /** Pad naar de intakes van een lid ({lid}) en naar de editor ({id}). */
  lidHref: string
  editorHref: string
}

function Stap({ nr, titel, children }: { nr: number; titel: string; children: ReactNode }) {
  return (
    <section className="club-training-stap" aria-labelledby={`stap-${nr}`}>
      <h2 id={`stap-${nr}`}><span className="club-training-stapnr">{nr}</span>{titel}</h2>
      {children}
    </section>
  )
}

/** De intake: vijf stappen op een scherm, met de voortgang ernaast. */
export function IntakeFormulier({ vestiging, beginLid, trainers, vandaag, lidHref, editorHref }: IntakeFormulierProps) {
  const [lid, setLid] = useState<GekozenLid | null>(beginLid)
  const [s, setS] = useState<IntakeStaat>(() => beginStaat(vandaag, trainers[0]?.id ?? ''))
  const [fout, setFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)
  const [opgeslagen, setOpgeslagen] = useState<string | null>(null)
  const zet = (deel: Partial<IntakeStaat>) => setS((oud) => ({ ...oud, ...deel }))
  const klaar = stappenKlaar(s, lid !== null)

  async function bewaar(e: React.FormEvent) {
    e.preventDefault()
    if (!lid) return setFout('Kies eerst een lid.')
    setBezig(true)
    setFout(null)
    const u = await stuur('/intakes', 'POST', naarVerzoek(s, lid.id))
    setBezig(false)
    const id = u.ok ? idUit(u.data) : null
    if (!id) return setFout(u.ok ? 'Opslaan lukte niet.' : u.fout)
    setOpgeslagen(id)
  }

  if (opgeslagen && lid) {
    return (
      <section className="club-kaart club-kaart--accent club-training-klaar" aria-live="polite">
        <p className="club-boventitel">Intake opgeslagen</p>
        <h2>{lid.naam}</h2>
        <p className="club-hint">Maak direct een schemavoorstel op basis van deze intake. Je past het daarna aan in de editor.</p>
        <div className="club-acties">
          <VoorstelKnop intakeId={opgeslagen} editorHref={editorHref} />
          <Link className="club-knop" href={lidHref.replace('__lid__', lid.id)}>Naar de intakes van {lid.naam.split(' ')[0]}</Link>
        </div>
      </section>
    )
  }

  return (
    <form className="club-training-intake" onSubmit={bewaar} noValidate>
      <div className="club-training-stappen">
        <Stap nr={1} titel="Lid en afname">
          {lid ? (
            <div className="club-training-lidfilter">
              <span className="club-training-lidfilter-naam">{lid.naam}</span>
              {lid.lidnummer && <span className="club-zacht">{lid.lidnummer}</span>}
              <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={() => setLid(null)}>Ander lid</button>
            </div>
          ) : (
            <LidKiezer vestiging={vestiging} onKies={setLid} autoFocus />
          )}
          <div className="club-formrij">
            <label className="club-veld">
              <span>Datum</span>
              <input type="date" className="club-invoer" value={s.datum} max={vandaag} onChange={(e) => zet({ datum: e.target.value })} />
            </label>
            <label className="club-veld">
              <span>Trainer</span>
              <select className="club-invoer" value={s.medewerkerId} onChange={(e) => zet({ medewerkerId: e.target.value })}>
                <option value="">Geen</option>
                {trainers.map((t) => <option key={t.id} value={t.id}>{t.naam}</option>)}
              </select>
            </label>
          </div>
        </Stap>

        <Stap nr={2} titel="Doel en ervaring">
          <KeuzeChips legend="Doelen" opties={DOELEN} labels={DOEL_LABEL} gekozen={s.doelen} onWissel={(d) => zet({ doelen: wissel(s.doelen, d) })} />
          <KeuzeChips legend="Ervaring met krachttraining" opties={NIVEAUS} labels={NIVEAU_LABEL} gekozen={s.niveau ? [s.niveau] : []} onWissel={(n) => zet({ niveau: n })} enkel />
          <label className="club-veld">
            <span>Motivatie in eigen woorden</span>
            <input className="club-invoer" value={s.motivatie} maxLength={500} onChange={(e) => zet({ motivatie: e.target.value })} placeholder="Waarom nu, wat wil het lid over drie maanden kunnen?" />
          </label>
        </Stap>

        <Stap nr={3} titel="Beschikbaarheid en voorkeur">
          <div className="club-formrij">
            <label className="club-veld">
              <span>Dagen per week: <strong className="club-training-waarde">{s.dagenPerWeek}</strong></span>
              <input type="range" min={1} max={7} value={s.dagenPerWeek} onChange={(e) => zet({ dagenPerWeek: Number(e.target.value) })} className="club-training-schuif" />
            </label>
            <label className="club-veld">
              <span>Minuten per training: <strong className="club-training-waarde">{s.minutenPerSessie}</strong></span>
              <input type="range" min={15} max={180} step={15} value={s.minutenPerSessie} onChange={(e) => zet({ minutenPerSessie: Number(e.target.value) })} className="club-training-schuif" />
            </label>
          </div>
          <KeuzeChips legend="Voorkeur" opties={VOORKEUREN} labels={VOORKEUR_LABEL} gekozen={s.voorkeuren} onWissel={(v) => zet({ voorkeuren: wissel(s.voorkeuren, v) })} />
        </Stap>

        <Stap nr={4} titel="Gezondheid">
          <IntakeGezondheid s={s} zet={zet} />
        </Stap>

        <Stap nr={5} titel="Metingen">
          <IntakeMetingen s={s} zet={zet} />
          <label className="club-veld">
            <span>Notitie van de trainer</span>
            <textarea className="club-invoer" value={s.notitie} maxLength={2000} onChange={(e) => zet({ notitie: e.target.value })} rows={3} />
          </label>
        </Stap>
      </div>

      <aside className="club-training-voortgang" aria-label="Voortgang">
        <ol>
          {([['lid', 'Lid gekozen'], ['doel', 'Doel en ervaring'], ['beschikbaarheid', 'Beschikbaarheid'], ['gezondheid', 'Gezondheid'], ['metingen', 'Metingen']] as const).map(([k, label]) => (
            <li key={k} data-klaar={klaar[k]}>
              <span className="club-training-vinkje" aria-hidden>{klaar[k] ? <Check size={14} /> : null}</span>
              {label}
              <span className="club-sr">{klaar[k] ? ' (klaar)' : ' (nog open)'}</span>
            </li>
          ))}
        </ol>
        <p className="club-hint">{s.toestemming ? 'Gezondheidsgegevens worden opgeslagen met toestemming.' : 'Zonder toestemming: geen gezondheidsgegevens.'}</p>
        {fout && <p className="club-melding club-melding--fout" role="alert">{fout}</p>}
        <button type="submit" className="club-knop club-knop--primair club-knop--groot" disabled={bezig || !klaar.lid || !klaar.doel}>
          {bezig ? 'Opslaan...' : 'Intake opslaan'}
        </button>
      </aside>
    </form>
  )
}

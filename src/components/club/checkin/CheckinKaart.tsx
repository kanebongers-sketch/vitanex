import { CircleCheck, CircleAlert, Clock3 } from 'lucide-react'
import type { BalieLid, CheckinAntwoord } from '@/lib/club/checkin/types'

// De grote kaarten van het baliescherm: het gevonden lid (met Inchecken) en
// de uitkomst na het inchecken. Gemaakt om vanaf een meter afstand te lezen.

const TIJD = new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' })

export function tijd(iso: string): string {
  return TIJD.format(new Date(iso))
}

function LesRegel({ lid }: { lid: BalieLid }) {
  if (!lid.les) return <p className="club-checkin-les club-zacht">Vandaag geen les geboekt.</p>
  const wacht = lid.les.status === 'wachtlijst' ? ' (wachtlijst)' : lid.les.status === 'aanwezig' ? ' (al aanwezig)' : ''
  return (
    <p className="club-checkin-les">
      <Clock3 aria-hidden size={18} />
      <span>
        Vandaag <strong>{lid.les.naam}</strong> om {tijd(lid.les.start)}{wacht}
        {lid.les.inVenster ? <em> · telt nu als aanwezig</em> : null}
      </span>
    </p>
  )
}

interface LidKaartProps {
  lid: BalieLid
  bezig: boolean
  onInchecken: () => void
}

export function BalieLidKaart({ lid, bezig, onInchecken }: LidKaartProps) {
  return (
    <article className={`club-checkin-kaart ${lid.magTrainen ? 'club-checkin-kaart--mag' : 'club-checkin-kaart--niet'}`} aria-live="polite">
      <div className="club-checkin-kaart-kop">
        <span className="club-avatar club-avatar--groot" aria-hidden>{lid.initialen}</span>
        <div className="club-checkin-kaart-naam">
          <h2>{lid.naam}</h2>
          <p className="club-zacht">
            {[lid.lidnummer, lid.abonnement, lid.andereVestiging ? `Lid van ${lid.vestigingLabel}` : null].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>
      {lid.magTrainen ? (
        <p className="club-checkin-oordeel club-checkin-oordeel--mag"><CircleCheck aria-hidden size={22} /> {lid.statusLabel}: mag trainen</p>
      ) : (
        <p className="club-checkin-oordeel club-checkin-oordeel--niet">
          <CircleAlert aria-hidden size={22} /> Niet actief: {lid.statusLabel.toLowerCase()}. Verwijs naar Sportivity.
        </p>
      )}
      <LesRegel lid={lid} />
      {lid.dubbelSinds ? <p className="club-checkin-dubbel">Al ingecheckt om {tijd(lid.dubbelSinds)}. Nog een keer telt niet mee.</p> : null}
      <button type="button" className="club-knop club-knop--primair club-knop--groot club-checkin-knop" onClick={onInchecken} disabled={bezig || !lid.magTrainen}>
        Inchecken <kbd aria-hidden>Enter</kbd>
      </button>
    </article>
  )
}

interface UitkomstProps {
  lid: BalieLid
  antwoord: CheckinAntwoord
}

export function Uitkomst({ lid, antwoord }: UitkomstProps) {
  if (antwoord.soort === 'niet_actief') {
    return (
      <article className="club-checkin-uitkomst club-checkin-uitkomst--niet" role="status">
        <p className="club-checkin-uitkomst-woord">Niet actief</p>
        <h2>{lid.naam}</h2>
        <p>Status {antwoord.statusLabel.toLowerCase()}. Niet ingecheckt: verwijs naar Sportivity voor het abonnement.</p>
      </article>
    )
  }
  if (antwoord.soort === 'dubbel') {
    return (
      <article className="club-checkin-uitkomst club-checkin-uitkomst--dubbel" role="status">
        <p className="club-checkin-uitkomst-woord">Al binnen</p>
        <h2>{lid.naam}</h2>
        <p>Ingecheckt om {tijd(antwoord.op)}. Deze keer telt niet opnieuw mee.</p>
      </article>
    )
  }
  return (
    <article className="club-checkin-uitkomst club-checkin-uitkomst--welkom" role="status">
      <p className="club-checkin-uitkomst-woord">Welkom</p>
      <h2>{lid.naam}</h2>
      <p>
        Ingecheckt om {tijd(antwoord.op)}.
        {antwoord.les ? ` Aanwezig gezet bij ${antwoord.les.naam} van ${tijd(antwoord.les.start)}.` : lid.les ? ` Vandaag ${lid.les.naam} om ${tijd(lid.les.start)}.` : ''}
      </p>
    </article>
  )
}

interface ResultatenProps {
  leden: BalieLid[]
  gekozen: number
  onKies: (index: number) => void
}

export function Resultaten({ leden, gekozen, onKies }: ResultatenProps) {
  return (
    <ul className="club-checkin-resultaten" role="listbox" aria-label="Gevonden leden">
      {leden.map((l, i) => (
        <li key={l.id} role="option" aria-selected={i === gekozen}>
          <button type="button" onClick={() => onKies(i)} className="club-checkin-resultaat">
            <span className="club-avatar" aria-hidden>{l.initialen}</span>
            <span className="club-rij-hoofd">
              <span className="club-rij-titel">{l.naam}</span>
              <span className="club-rij-sub">{[l.lidnummer, l.les ? `${l.les.naam} ${tijd(l.les.start)}` : null].filter(Boolean).join(' · ')}</span>
            </span>
            <span className={`club-chip ${l.magTrainen ? 'club-chip--ok' : 'club-chip--let-op'}`}>{l.statusLabel}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

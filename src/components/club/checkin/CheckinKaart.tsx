import { CircleCheck, CircleAlert, Clock3, MapPin, TriangleAlert } from 'lucide-react'
import type { BalieLes, BalieLid, CheckinAntwoord } from '@/lib/club/checkin/types'

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

/** "Lid van Bergeijk" als het lid uit een andere vestiging komt. */
function VestigingChip({ lid }: { lid: BalieLid }) {
  if (!lid.andereVestiging) return null
  return (
    <span className={`club-chip ${lid.geenToegang ? 'club-chip--let-op' : 'club-chip--info'} club-checkin-elders`}>
      <MapPin aria-hidden size={13} /> Lid van {lid.vestigingLabel}
    </span>
  )
}

function Oordeel({ lid }: { lid: BalieLid }) {
  if (lid.geenToegang) {
    return (
      <p className="club-checkin-oordeel club-checkin-oordeel--niet">
        <CircleAlert aria-hidden size={22} />
        <span>Geen toegang in Eersel. <span className="club-checkin-oordeel-regel">Alleen leden van Eersel sporten bij alle clubs; leden van {lid.vestigingLabel} overal behalve Eersel.</span></span>
      </p>
    )
  }
  if (!lid.magTrainen) {
    return (
      <p className="club-checkin-oordeel club-checkin-oordeel--niet">
        <CircleAlert aria-hidden size={22} /> <span>Niet actief: {lid.statusLabel.toLowerCase()}. Verwijs naar Sportivity.</span>
      </p>
    )
  }
  return (
    <p className="club-checkin-oordeel club-checkin-oordeel--mag">
      <CircleCheck aria-hidden size={22} />
      <span>
        {`${lid.statusLabel}: mag ${lid.andereVestiging ? 'hier ' : ''}trainen`}
        {lid.andereVestiging ? <span className="club-checkin-oordeel-regel">Lid van {lid.vestigingLabel}, sporten hier zit in het lidmaatschap.</span> : null}
      </span>
    </p>
  )
}

/** Lidmaatschap laat dit niet toe (vestiging of daluren): waarschuwen, niet blokkeren. */
function VormWaarschuwing({ reden }: { reden: string }) {
  return (
    <p className="club-checkin-vorm" role="note">
      <TriangleAlert aria-hidden size={20} />
      <span>
        Let op het lidmaatschap. <span className="club-checkin-oordeel-regel">{reden} Check in als de balie dat goedvindt.</span>
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
    <article className={`club-checkin-kaart ${!lid.magTrainen ? 'club-checkin-kaart--niet' : lid.vormWaarschuwing ? 'club-checkin-kaart--let' : 'club-checkin-kaart--mag'}`} aria-live="polite">
      <div className="club-checkin-kaart-kop">
        <span className="club-avatar club-avatar--groot" aria-hidden>{lid.initialen}</span>
        <div className="club-checkin-kaart-naam">
          <h2>{lid.naam}</h2>
          <p className="club-zacht club-getal">{[lid.lidnummer, lid.abonnement].filter(Boolean).join(' · ')}</p>
          <VestigingChip lid={lid} />
        </div>
      </div>
      <Oordeel lid={lid} />
      {lid.magTrainen && lid.vormWaarschuwing ? <VormWaarschuwing reden={lid.vormWaarschuwing} /> : null}
      <LesRegel lid={lid} />
      {lid.dubbelSinds ? <p className="club-checkin-dubbel">Al ingecheckt om {tijd(lid.dubbelSinds)}. Nog een keer telt niet mee.</p> : null}
      <button type="button" className="club-knop club-knop--primair club-knop--groot club-checkin-knop" onClick={onInchecken} disabled={bezig || !lid.magTrainen}>
        {lid.vormWaarschuwing ? 'Toch inchecken' : <>Inchecken <kbd aria-hidden>Enter</kbd></>}
      </button>
    </article>
  )
}

/** Genoeg van een lid voor de uitkomst: uit het zoeken (BalieLid) of uit een QR-scan. */
export interface UitkomstLid {
  id: string
  naam: string
  andereVestiging: boolean
  vestigingLabel: string
  les?: BalieLes | null
}

interface UitkomstProps {
  lid: UitkomstLid
  antwoord: CheckinAntwoord
  bezig: boolean
  /** Bij een waarschuwing van het lidmaatschap: toch inchecken of laten. */
  onToch: () => void
  onNiet: () => void
  /** Zo lang blijft de uitkomst staan; een dunne balk telt af. Leeg = geen balk. */
  duurMs?: number
}

/** De balk onderaan die laat zien dat de uitkomst zo verdwijnt (alleen transform). */
function Aftellen({ duurMs }: { duurMs?: number }) {
  if (!duurMs) return null
  return <span className="club-checkin-aftellen" style={{ animationDuration: `${duurMs}ms` }} aria-hidden />
}

export function Uitkomst({ lid, antwoord, bezig, onToch, onNiet, duurMs }: UitkomstProps) {
  if (antwoord.soort === 'vorm_waarschuwing') {
    return (
      <article className="club-checkin-uitkomst club-checkin-uitkomst--let-op" role="alert">
        <p className="club-checkin-uitkomst-woord">Let op</p>
        <h2>{lid.naam}</h2>
        <p>{antwoord.reden} Nog niet ingecheckt.</p>
        <div className="club-checkin-uitkomst-knoppen">
          <button type="button" className="club-knop club-knop--primair" onClick={onToch} disabled={bezig}>
            Toch inchecken
          </button>
          <button type="button" className="club-knop club-knop--stil" onClick={onNiet} disabled={bezig}>
            Niet inchecken
          </button>
        </div>
      </article>
    )
  }
  if (antwoord.soort === 'niet_actief') {
    return (
      <article className="club-checkin-uitkomst club-checkin-uitkomst--niet" role="status">
        <p className="club-checkin-uitkomst-woord">Niet actief</p>
        <h2>{lid.naam}</h2>
        <p>Status {antwoord.statusLabel.toLowerCase()}. Niet ingecheckt: verwijs naar Sportivity voor het abonnement.</p>
        <Aftellen duurMs={duurMs} />
      </article>
    )
  }
  if (antwoord.soort === 'geen_toegang') {
    return (
      <article className="club-checkin-uitkomst club-checkin-uitkomst--niet" role="status">
        <p className="club-checkin-uitkomst-woord">Geen toegang</p>
        <h2>{lid.naam}</h2>
        <p>Lid van {antwoord.vestigingLabel}: niet ingecheckt. Alleen leden van Eersel sporten bij alle clubs; andere leden overal behalve Eersel.</p>
        <Aftellen duurMs={duurMs} />
      </article>
    )
  }
  if (antwoord.soort === 'dubbel') {
    return (
      <article className="club-checkin-uitkomst club-checkin-uitkomst--dubbel" role="status">
        <p className="club-checkin-uitkomst-woord">Al binnen</p>
        <h2>{lid.naam}</h2>
        <p>Ingecheckt om {tijd(antwoord.op)}. Deze keer telt niet opnieuw mee.</p>
        <Aftellen duurMs={duurMs} />
      </article>
    )
  }
  return (
    <article className="club-checkin-uitkomst club-checkin-uitkomst--welkom" role="status">
      <p className="club-checkin-uitkomst-woord">Welkom</p>
      <h2>{lid.naam}</h2>
      <p>
        Ingecheckt om {tijd(antwoord.op)}.
        {lid.andereVestiging ? ` Lid van ${lid.vestigingLabel}.` : ''}
        {antwoord.les ? ` Aanwezig gezet bij ${antwoord.les.naam} van ${tijd(antwoord.les.start)}.` : lid.les ? ` Vandaag ${lid.les.naam} om ${tijd(lid.les.start)}.` : ''}
      </p>
      <Aftellen duurMs={duurMs} />
    </article>
  )
}

interface ResultatenProps {
  id: string
  leden: BalieLid[]
  gekozen: number
  onKies: (index: number) => void
}

/** De treffers als keuzelijst bij het zoekveld (combobox): pijltjes of klikken. */
export function Resultaten({ id, leden, gekozen, onKies }: ResultatenProps) {
  return (
    <ul id={id} className="club-checkin-resultaten" role="listbox" aria-label="Gevonden leden">
      {leden.map((l, i) => (
        <li
          key={l.id}
          id={`checkin-optie-${i}`}
          role="option"
          aria-selected={i === gekozen}
          className="club-checkin-resultaat"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onKies(i)}
        >
          <span className="club-avatar" aria-hidden>{l.initialen}</span>
          <span className="club-rij-hoofd">
            <span className="club-rij-titel">{l.naam}</span>
            <span className="club-rij-sub">
              {[l.lidnummer, l.andereVestiging ? `Lid van ${l.vestigingLabel}` : null, l.les ? `${l.les.naam} ${tijd(l.les.start)}` : null].filter(Boolean).join(' · ')}
            </span>
          </span>
          <span className={`club-chip ${l.magTrainen ? 'club-chip--ok' : 'club-chip--let-op'}`}>{l.geenToegang ? 'Geen toegang' : l.statusLabel}</span>
        </li>
      ))}
    </ul>
  )
}

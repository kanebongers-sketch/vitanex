'use client'

import { Check, UserX, X } from 'lucide-react'
import { initialen, volledigeNaam } from '@/lib/club/gedeeld/lid'
import type { Deelnemer } from '@/lib/club/rooster/lesbeheer-opslag'
import type { AfvinkStatus } from '@/lib/club/rooster/regels'
import { stuur, useClubActie } from './vraag'

// Deelnemers afvinken (instructeur), reserveringen annuleren (balie) en de
// wachtlijst. Elke actie gaat via de rooster-API en ververst daarna het paneel.

function naamVan(d: Deelnemer): string {
  return d.lid ? volledigeNaam(d.lid) : 'Onbekend lid'
}

function Avatar({ d }: { d: Deelnemer }) {
  return <span className="club-avatar" aria-hidden>{d.lid ? initialen(d.lid) : '?'}</span>
}

interface RijProps {
  d: Deelnemer
  kanAfvinken: boolean
  kanAnnuleren: boolean
}

function DeelnemerRij({ d, kanAfvinken, kanAnnuleren }: RijProps) {
  const { bezig, fout, voerUit } = useClubActie()
  const status = d.reservering.status
  const naam = naamVan(d)

  const zet = (nieuw: AfvinkStatus) =>
    voerUit(() => stuur(`/api/club/rooster/reserveringen/${d.reservering.id}`, 'PATCH', { status: status === nieuw ? 'geboekt' : nieuw }))
  const annuleer = () => voerUit(() => stuur(`/api/club/rooster/reserveringen/${d.reservering.id}/annuleren`, 'POST'))

  return (
    <li className="club-rij club-rooster-deelnemer" data-status={status}>
      <Avatar d={d} />
      <span className="club-rij-hoofd">
        <span className="club-rij-titel">{naam}</span>
        <span className="club-rij-sub">
          {d.lid?.status === 'proef' ? 'Proeflid · ' : ''}
          {d.reservering.bron === 'app' ? 'Via de app' : d.reservering.bron === 'balie' ? 'Via de balie' : 'Door instructeur'}
        </span>
        {fout && <span className="club-fout" role="alert">{fout}</span>}
      </span>
      {kanAfvinken && (
        <span className="club-rooster-afvink" role="group" aria-label={`Aanwezigheid van ${naam}`}>
          <button type="button" className="club-rooster-afvinkknop" data-soort="aanwezig" aria-pressed={status === 'aanwezig'} disabled={bezig} onClick={() => zet('aanwezig')}>
            <Check aria-hidden size={15} />
            <span>Aanwezig</span>
          </button>
          <button type="button" className="club-rooster-afvinkknop" data-soort="no_show" aria-pressed={status === 'no_show'} disabled={bezig} onClick={() => zet('no_show')}>
            <UserX aria-hidden size={15} />
            <span>No-show</span>
          </button>
        </span>
      )}
      {kanAnnuleren && status === 'geboekt' && (
        <button type="button" className="club-knop club-knop--stil club-knop--klein" aria-label={`Reservering van ${naam} annuleren`} disabled={bezig} onClick={annuleer}>
          <X aria-hidden size={15} />
        </button>
      )}
    </li>
  )
}

interface Props {
  deelnemers: Deelnemer[]
  kanAfvinken: boolean
  kanAnnuleren: boolean
}

export function DeelnemerLijst({ deelnemers, kanAfvinken, kanAnnuleren }: Props) {
  if (deelnemers.length === 0) return <p className="club-leeg">Nog niemand ingeschreven.</p>
  return (
    <ul className="club-lijst">
      {deelnemers.map((d) => (
        <DeelnemerRij key={d.reservering.id} d={d} kanAfvinken={kanAfvinken} kanAnnuleren={kanAnnuleren} />
      ))}
    </ul>
  )
}

function WachtRij({ d, kanAnnuleren }: { d: Deelnemer; kanAnnuleren: boolean }) {
  const { bezig, fout, voerUit } = useClubActie()
  const naam = naamVan(d)
  return (
    <li className="club-rij">
      <span className="club-rooster-positie club-getal" aria-label={`Positie ${d.reservering.wachtpositie ?? ''}`}>
        {d.reservering.wachtpositie ?? '·'}
      </span>
      <span className="club-rij-hoofd">
        <span className="club-rij-titel">{naam}</span>
        {fout && <span className="club-fout" role="alert">{fout}</span>}
      </span>
      {kanAnnuleren && (
        <button
          type="button"
          className="club-knop club-knop--stil club-knop--klein"
          aria-label={`${naam} van de wachtlijst halen`}
          disabled={bezig}
          onClick={() => voerUit(() => stuur(`/api/club/rooster/reserveringen/${d.reservering.id}/annuleren`, 'POST'))}
        >
          <X aria-hidden size={15} />
        </button>
      )}
    </li>
  )
}

export function Wachtlijst({ wachtlijst, kanAnnuleren }: { wachtlijst: Deelnemer[]; kanAnnuleren: boolean }) {
  if (wachtlijst.length === 0) return <p className="club-hint">Niemand op de wachtlijst. Is de les vol, dan komen nieuwe boekingen hier en schuiven ze vanzelf door als er een plek vrijkomt.</p>
  return (
    <ol className="club-lijst">
      {wachtlijst.map((d) => (
        <WachtRij key={d.reservering.id} d={d} kanAnnuleren={kanAnnuleren} />
      ))}
    </ol>
  )
}

export function Afmeldingen({ geannuleerd }: { geannuleerd: Deelnemer[] }) {
  if (geannuleerd.length === 0) return null
  return (
    <details className="club-rooster-uitklap">
      <summary>Afgemeld ({geannuleerd.length})</summary>
      <ul className="club-lijst">
        {geannuleerd.map((d) => (
          <li key={d.reservering.id} className="club-rij">
            <Avatar d={d} />
            <span className="club-rij-hoofd">
              <span className="club-rij-titel">{naamVan(d)}</span>
            </span>
            {d.reservering.teLaat && <span className="club-chip club-chip--let-op">Te laat</span>}
          </li>
        ))}
      </ul>
    </details>
  )
}

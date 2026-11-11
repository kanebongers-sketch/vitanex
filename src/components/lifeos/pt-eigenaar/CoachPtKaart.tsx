import Link from 'next/link'
import {
  afspraakLabel,
  coachFase,
  datumLabel,
  laatsteContactOp,
  opTePakkenTotaal,
  type CoachFase,
  type CoachRij,
} from '@/lib/lifeos/pt-coaching/coach-overzicht'
import type { VerloopPunt } from '@/lib/lifeos/pt-gesprek/team'
import { ScoreVerloop } from '@/components/lifeos/pt/ScoreVerloop'
import { CoachRijOpbouw } from './CoachRijOpbouw'
import { OpTePakkenLijst } from './OpTePakkenLijst'
import { VerslagenLijst } from './VerslagenLijst'

// Een PT'er in het coach-overzicht van eigenaar en beheerder. Zichtbaar: naam,
// laatste gesprek en de stand (verslag open, inplannen of de volgende afspraak).
// Achter de uitklap: open punten, op te pakken leads, scoreverloop en verslagen.
// Puur; de beheerder zet er met `CoachRijBeheer` zijn acties bij.

const VERLOOP_GESPREKKEN = 8

function Stand({ fase, r }: { fase: CoachFase; r: CoachRij }) {
  if (fase === 'verslag') return <span className="ptd-badge ptd-badge--let-op">Verslag open</span>
  if (fase === 'inplannen') return <span className="ptd-badge ptd-badge--accent">Inplannen</span>
  return <span className="ptd-coachrij-volgende">Volgende {afspraakLabel(r.volgendeOp as string)}</span>
}

/** Naam, laatste gesprek en stand: de regel die altijd zichtbaar is. */
export function CoachRijKop({ code, r, nu }: { code: string; r: CoachRij; nu: Date }) {
  const laatste = laatsteContactOp(r)
  return (
    <>
      <div className="ptd-coachrij-wie">
        <Link className="ptd-naam ptd-link" href={`/${code}/team/${r.id}`}>{r.naam}</Link>
        <span className="ptd-coachrij-sub">{laatste ? `Laatste gesprek ${datumLabel(laatste)}` : 'Nog geen gesprek'}</span>
      </div>
      <Stand fase={coachFase(r, nu)} r={r} />
    </>
  )
}

/** De regel op de uitklap: wat erachter zit, in getallen. */
export function coachRijSamenvatting(r: CoachRij): string {
  const leads = opTePakkenTotaal(r.opTePakken)
  const delen = [
    r.openPunten.length > 0 ? `${r.openPunten.length} open ${r.openPunten.length === 1 ? 'punt' : 'punten'}` : null,
    leads > 0 ? `${leads} ${leads === 1 ? 'lead' : 'leads'} oppakken` : null,
    r.verslagen.length > 0 ? `${r.verslagen.length} ${r.verslagen.length === 1 ? 'verslag' : 'verslagen'}` : 'nog geen verslag',
  ].filter((d): d is string => d !== null)
  return ['Details', ...delen].join(' · ')
}

function verloopVan(r: CoachRij): VerloopPunt[] {
  return r.verslagen.slice(0, VERLOOP_GESPREKKEN).reverse().map((v) => ({ op: v.aangemaaktOp, scores: v.scores }))
}

/** Alles achter de uitklap. */
export function CoachRijInhoud({ code, r }: { code: string; r: CoachRij }) {
  return (
    <>
      {r.openPunten.length > 0 ? (
        <div>
          <p className="ptd-label">Open aandachtspunten</p>
          <ul className="ptd-punten">
            {r.openPunten.map((x) => (
              <li key={x.id} className="ptd-tekst">
                {x.laatsteOordeel === 'erger' ? <span className="ptd-badge ptd-badge--let-op">Erger</span> : null} {x.tekst}
                {x.keerOpen > 0 ? <span className="ptd-coachrij-sub"> · {x.keerOpen}× open</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <OpTePakkenLijst code={code} ptId={r.id} opTePakken={r.opTePakken} />
      <ScoreVerloop verloop={verloopVan(r)} />
      <div>
        <p className="ptd-label">Verslagen</p>
        <VerslagenLijst code={code} verslagen={r.verslagen} />
      </div>
    </>
  )
}

/** De rij zonder acties (eigenaren). */
export function CoachPtKaart({ code, r, nu }: { code: string; r: CoachRij; nu: Date }) {
  return (
    <CoachRijOpbouw
      fase={coachFase(r, nu)}
      kop={<CoachRijKop code={code} r={r} nu={nu} />}
      samenvatting={coachRijSamenvatting(r)}
      inhoud={<CoachRijInhoud code={code} r={r} />}
    />
  )
}

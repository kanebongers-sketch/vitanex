import type { SportschoolRegel } from '@/lib/club/platform/opslag'
import { STATUS_WEERGAVE, pakketNaam, type StartStand } from '@/lib/club/platform/tellingen'
import { OpenKnop } from './OpenKnop'
import { nlDatum, nlMoment } from './datum'
import { adresVan } from '@/lib/club/kern/subdomein'
import { subdomeinenActief } from '@/lib/club/kern/adres-verzoek'

interface SportscholenProps {
  sportscholen: SportschoolRegel[]
  maand: string
  afgekapt: boolean
}

function getal(n: number | null): string {
  return n === null ? '?' : n.toLocaleString('nl-NL')
}

function startTekst(s: StartStand | null): string {
  if (!s) return 'Niet te lezen'
  if (s.soort === 'af') return `Afgerond op ${nlDatum(s.afgerondOp)}`
  if (s.soort === 'niet') return 'Nog niet gestart'
  return `${s.klaar} van ${s.totaal} stappen klaar`
}

function Startwizard({ start }: { start: StartStand | null }) {
  const deel = start ? (start.soort === 'af' ? 1 : start.klaar / start.totaal) : 0
  return (
    <div className="club-platform-start">
      <span className="club-platform-klein">Startwizard</span>
      <span
        className="club-platform-meter"
        role="meter"
        aria-label="Voortgang van de startwizard"
        aria-valuemin={0}
        aria-valuemax={start?.totaal ?? 9}
        aria-valuenow={start ? (start.soort === 'af' ? start.totaal : start.klaar) : 0}
        aria-valuetext={startTekst(start)}
        data-af={start?.soort === 'af' || undefined}
      >
        <span style={{ transform: `scaleX(${deel})` }} />
      </span>
      <span className="club-platform-sub">{startTekst(start)}</span>
    </div>
  )
}

function Abonnement({ s }: { s: SportschoolRegel }) {
  const a = s.aanmelding
  if (!a) return <span className="club-platform-sub">{s.eigen ? 'Eigen sportschool, geen abonnement' : 'Geen aanmelding'}</span>
  const w = STATUS_WEERGAVE[a.status]
  return (
    <>
      <span>
        <span className={`club-chip club-chip--${w.toon}`}>{w.label}</span> <span className="club-platform-pakket">{pakketNaam(a.pakket)}</span>
      </span>
      <span className="club-platform-sub">
        {typeof s.proefTot === 'string' ? `Proef tot ${nlDatum(s.proefTot)}` : s.proefTot === undefined ? 'Proefperiode niet te lezen' : `Sinds ${nlDatum(a.aangemaaktOp)}`}
      </span>
    </>
  )
}

function Regel({ s, maand }: { s: SportschoolRegel; maand: string }) {
  const cijfers: [string, number | null][] = [
    ['Vestigingen', s.vestigingen],
    ['Leden', s.leden],
    ['Medewerkers', s.medewerkers],
    [`Check-ins ${maand}`, s.checkins],
  ]
  return (
    <li className="club-platform-school" aria-current={s.actief ? 'true' : undefined}>
      <div className="club-platform-naam">
        <h3>{s.naam}</h3>
        <p className="club-platform-sub">
          {s.slug ? <span className="club-platform-adres">{adresVan(s.slug, subdomeinenActief())}</span> : 'Nog geen eigen adres'}
        </p>
        <p className="club-platform-chips">
          {s.eigen && <span className="club-chip club-chip--merk">Eigen</span>}
          {s.demo && <span className="club-chip club-chip--info">Demo</span>}
          {s.aanmelding?.status === 'test' && <span className="club-chip club-chip--info">Test</span>}
          {s.actief && <span className="club-chip club-chip--ok">Staat open</span>}
        </p>
      </div>
      <dl className="club-platform-cijfers">
        {cijfers.map(([label, n]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{getal(n)}</dd>
          </div>
        ))}
      </dl>
      <Startwizard start={s.start} />
      <div className="club-platform-info">
        <span className="club-platform-klein">Abonnement</span>
        <Abonnement s={s} />
      </div>
      <div className="club-platform-info">
        <span className="club-platform-klein">Laatste activiteit</span>
        {s.laatste === undefined ? (
          <span className="club-platform-sub">Niet te lezen</span>
        ) : s.laatste === null ? (
          <span className="club-platform-sub">Nog niets in het logboek</span>
        ) : (
          <>
            <span className="club-platform-actie">{s.laatste.actie}</span>
            <span className="club-platform-sub">
              <time dateTime={s.laatste.op}>{nlMoment(s.laatste.op)}</time>
              {s.laatste.wie ? ` · ${s.laatste.wie}` : ''}
            </span>
          </>
        )}
      </div>
      <OpenKnop id={s.id} naam={s.naam} actief={s.actief} />
    </li>
  )
}

// Alle sportscholen van Kane, elk als een regel met tellingen, voortgang,
// abonnement en laatste activiteit. Op de pc een strakke rij, op de telefoon een kaart.
export function Sportscholen({ sportscholen, maand, afgekapt }: SportscholenProps) {
  return (
    <section aria-labelledby="platform-scholen-kop">
      <div className="club-sectiekop">
        <h2 id="platform-scholen-kop">Sportscholen</h2>
        <span>{sportscholen.length} in totaal{afgekapt ? ', de eerste getoond' : ''}</span>
      </div>
      {sportscholen.length === 0 ? (
        <p className="club-leeg">Nog geen sportscholen.</p>
      ) : (
        <ul className="club-platform-scholen">
          {sportscholen.map((s) => (
            <Regel key={s.id} s={s} maand={maand} />
          ))}
        </ul>
      )}
    </section>
  )
}

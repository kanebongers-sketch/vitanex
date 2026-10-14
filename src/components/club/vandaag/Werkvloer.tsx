import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { DienstVandaag, TakenStand } from '@/lib/club/cijfers/werkvloer'
import { aantal } from '@/lib/club/cijfers/opmaak'
import { tijdNl } from '@/lib/club/cijfers/tijd'
import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'
import { takenHref } from '@/lib/club/taken/url'

// De werkvloer van vandaag: wie er staat (uit het personeelsrooster) en hoe
// ver de dagtaken en de afsluitronde zijn (uit Taken). Alleen lezen.

const FASE_LABEL: Record<DienstVandaag['fase'], string> = { nu: 'Nu', straks: 'Straks', geweest: 'Geweest' }

function DienstRij({ d }: { d: DienstVandaag }) {
  return (
    <li className="club-vandaag-dienst" data-fase={d.fase} data-open={d.naam === null || undefined}>
      <span className="club-vandaag-stip" data-kleur={d.kleur ?? undefined} aria-hidden />
      <span className="club-rij-hoofd">
        <span className="club-rij-titel">{d.naam ?? 'Open dienst'}</span>
        <span className="club-rij-sub">
          {d.begin} tot {d.eind}
          {d.naam === null ? ' · nog niemand ingepland' : ''}
        </span>
      </span>
      <span className={`club-chip ${d.fase === 'nu' ? 'club-chip--ok' : d.fase === 'straks' ? 'club-chip--info' : 'club-chip--uit'}`}>{FASE_LABEL[d.fase]}</span>
    </li>
  )
}

export function WieWerkt({ diensten, vestiging }: { diensten: DienstVandaag[] | null; vestiging: Vestiging }) {
  const nu = diensten?.filter((d) => d.fase === 'nu' && d.naam !== null).length ?? 0
  return (
    <section className="club-kaart club-vandaag-kaart" aria-labelledby="vandaag-team">
      <header className="club-sectiekop club-vandaag-sectiekop">
        <h2 id="vandaag-team">Wie werkt er</h2>
        <Link href={clubPad('/personeel', vestiging)} className="club-vandaag-meer">
          Personeelsrooster <ArrowUpRight aria-hidden size={14} />
        </Link>
      </header>
      {diensten === null ? (
        <p className="club-melding club-melding--fout" role="status">
          Het personeelsrooster kon niet worden geladen.
        </p>
      ) : diensten.length === 0 ? (
        <p className="club-leeg">Vandaag staan er geen diensten op het personeelsrooster.</p>
      ) : (
        <>
          <p className="club-hint club-vandaag-uitleg">{nu === 0 ? 'Op dit moment staat niemand ingeroosterd.' : `${aantal(nu, 'collega', 'collega’s')} nu aan het werk.`}</p>
          <ul className="club-lijst club-vandaag-lijst">
            {diensten.map((d) => (
              <DienstRij key={d.id} d={d} />
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

function AfsluitRegel({ stand }: { stand: TakenStand }) {
  const r = stand.afsluitronde
  if (r) {
    return (
      <span className="club-chip club-chip--ok">
        Afsluitronde gemeld door {r.wie} om {tijdNl(new Date(r.op))}
      </span>
    )
  }
  if (stand.afsluiten === 0) return <span className="club-chip club-chip--uit">Afsluitronde nog niet gemeld</span>
  return (
    <span className="club-chip club-chip--uit">
      Afsluiten: {stand.afsluitenGedaan} van {stand.afsluiten} gedaan, ronde nog niet gemeld
    </span>
  )
}

function TakenInhoud({ stand }: { stand: TakenStand }) {
  const deel = stand.verplicht > 0 ? stand.gedaan / stand.verplicht : 1
  const klaar = stand.verplicht > 0 && stand.gedaan === stand.verplicht
  return (
    <>
      <p className="club-vandaag-taakstand">
        <strong className="club-getal">{stand.gedaan}</strong>
        <span>
          van {aantal(stand.verplicht, 'taak', 'taken')} gedaan{klaar ? ', alles af' : ''}
        </span>
      </p>
      <span className="club-vandaag-balk club-vandaag-balk--breed" role="img" aria-label={`${Math.round(deel * 100)}% van de taken van vandaag gedaan`}>
        <span style={{ transform: `scaleX(${deel})` }} data-klaar={klaar || undefined} />
      </span>
      {stand.open.length > 0 && <p className="club-hint club-vandaag-open">Nog open: {stand.open.join(', ')}{stand.verplicht - stand.gedaan > stand.open.length ? ' en meer' : ''}.</p>}
      <AfsluitRegel stand={stand} />
    </>
  )
}

export function TakenVandaag({ stand, heeftTaken, vestiging }: { stand: TakenStand | null; heeftTaken: boolean; vestiging: Vestiging }) {
  return (
    <section className="club-kaart club-vandaag-kaart" aria-labelledby="vandaag-taken">
      <header className="club-sectiekop club-vandaag-sectiekop">
        <h2 id="vandaag-taken">Taken vandaag</h2>
        <Link href={takenHref(heeftTaken ? '' : 'beheer', vestiging)} className="club-vandaag-meer">
          {heeftTaken ? 'Afvinken' : 'Lijsten maken'} <ArrowUpRight aria-hidden size={14} />
        </Link>
      </header>
      {stand === null ? (
        <p className="club-melding club-melding--fout" role="status">
          De taken konden niet worden geladen.
        </p>
      ) : !heeftTaken ? (
        <p className="club-leeg">Deze vestiging heeft nog geen takenlijsten.</p>
      ) : (
        <TakenInhoud stand={stand} />
      )}
    </section>
  )
}

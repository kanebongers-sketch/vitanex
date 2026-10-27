import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { DienstVandaag } from '@/lib/club/cijfers/werkvloer'
import { aantal } from '@/lib/club/cijfers/opmaak'
import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'

// De werkvloer van vandaag: wie er staat (uit het personeelsrooster). Alleen
// lezen. De taken van vandaag staan als eigen sectie op Vandaag (TakenSectie).

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

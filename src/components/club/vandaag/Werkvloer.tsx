import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { DienstVandaag } from '@/lib/club/cijfers/werkvloer'
import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { VANDAAG } from '@/lib/aiyourgym/taal/woorden/club/vandaag-scherm'

type WerkTekst = (typeof VANDAAG)['nl']['werkvloer']

// De werkvloer van vandaag: wie er staat (uit het personeelsrooster). Alleen
// lezen. De taken van vandaag staan als eigen sectie op Vandaag (TakenSectie).

function DienstRij({ d, t }: { d: DienstVandaag; t: WerkTekst }) {
  return (
    <li className="club-vandaag-dienst" data-fase={d.fase} data-open={d.naam === null || undefined}>
      <span className="club-vandaag-stip" data-kleur={d.kleur ?? undefined} aria-hidden />
      <span className="club-rij-hoofd">
        <span className="club-rij-titel">{d.naam ?? t.openDienst}</span>
        <span className="club-rij-sub">
          {t.tijd(d.begin, d.eind)}
          {d.naam === null ? t.nogNiemand : ''}
        </span>
      </span>
      <span className={`club-chip ${d.fase === 'nu' ? 'club-chip--ok' : d.fase === 'straks' ? 'club-chip--info' : 'club-chip--uit'}`}>{t.fase[d.fase]}</span>
    </li>
  )
}

export async function WieWerkt({ diensten, vestiging }: { diensten: DienstVandaag[] | null; vestiging: Vestiging }) {
  const t = (await clubTekst(VANDAAG)).werkvloer
  const nu = diensten?.filter((d) => d.fase === 'nu' && d.naam !== null).length ?? 0
  return (
    <section className="club-kaart club-vandaag-kaart" aria-labelledby="vandaag-team">
      <header className="club-sectiekop club-vandaag-sectiekop">
        <h2 id="vandaag-team">{t.titel}</h2>
        <Link href={clubPad('/personeel', vestiging)} className="club-vandaag-meer">
          {t.rooster} <ArrowUpRight aria-hidden size={14} />
        </Link>
      </header>
      {diensten === null ? (
        <p className="club-melding club-melding--fout" role="status">
          {t.fout}
        </p>
      ) : diensten.length === 0 ? (
        <p className="club-leeg">{t.leeg}</p>
      ) : (
        <>
          <p className="club-hint club-vandaag-uitleg">{nu === 0 ? t.niemand : t.aanHetWerk(nu)}</p>
          <ul className="club-lijst club-vandaag-lijst">
            {diensten.map((d) => (
              <DienstRij key={d.id} d={d} t={t} />
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

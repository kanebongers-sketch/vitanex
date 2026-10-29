import type { Metadata } from 'next'
import Link from 'next/link'
import { eisOnderdeel } from '@/lib/club/toegang'
import type { ZoekParams } from '@/lib/club/kern/vestiging'
import { nlDelen } from '@/lib/club/rooster/tijd'
import { MAX_JAAR, MIN_JAAR } from '@/lib/club/sluiting/feestdagen'
import { jaarUitParam } from '@/lib/club/sluiting/invoer'
import { haalSluitingen, haalToekomstigeLessen } from '@/lib/club/sluiting/lezen'
import { geraaktPerSluiting } from '@/lib/club/sluiting/regels'
import { SluitingBeheer } from '@/components/club/sluiting/SluitingBeheer'
import '@/components/club/sluiting/sluiting.css'
import { InstelKruimel } from '@/components/club/beheer/InstelKruimel'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { SLUITING } from '@/lib/aiyourgym/taal/woorden/club/sluiting'

export async function generateMetadata(): Promise<Metadata> {
  return { title: SLUITING[await getTaal()].pagina.titel }
}

// Sluitingsdagen, feestdagen en afwijkende openingstijden, per jaar (?jaar=2027).
// Het rooster maakt op een gesloten dag geen lessen en op een afwijkende dag
// alleen lessen binnen de tijden; lessen die er al staan krijgen een waarschuwing.

export default async function SluitingsdagenPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisOnderdeel('sluiting')
  const w = SLUITING[await getTaal()].pagina
  const nu = new Date()
  const vandaag = nlDelen(nu).datum
  const huidig = Number(vandaag.slice(0, 4))
  const jaar = jaarUitParam((await searchParams).jaar, huidig)
  const van = `${jaar}-01-01`
  const tot = `${jaar}-12-31`
  const [sluitingen, lessen] = await Promise.all([haalSluitingen(t.admin, t.userId, van, tot), haalToekomstigeLessen(t.admin, t.userId, van, tot, nu)])
  const geraakt = sluitingen && lessen ? geraaktPerSluiting(sluitingen, lessen) : {}
  const jaren = [jaar - 1, jaar, jaar + 1].filter((j) => j >= MIN_JAAR && j <= MAX_JAAR)

  return (
    <>
      <InstelKruimel id="sluiting" />
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{t.organisatie.naam}</p>
          <h1>{w.titel}</h1>
          <p>{w.intro}</p>
        </div>
        <nav className="club-sluiting-jaren" aria-label={w.kiesJaar}>
          <div className="club-segment">
            {jaren.map((j) => (
              <Link key={j} href={`/club/beheer/sluiting?jaar=${j}`} aria-current={j === jaar ? 'page' : undefined} scroll={false}>
                {j}
              </Link>
            ))}
          </div>
        </nav>
      </header>
      {!sluitingen && <p className="club-melding club-melding--fout" role="status">{w.leesFout}</p>}
      {sluitingen && !lessen && <p className="club-melding club-melding--fout" role="status">{w.lessenFout}</p>}
      <SluitingBeheer jaar={jaar} vandaag={vandaag} sluitingen={sluitingen ?? []} geraakt={geraakt} />
    </>
  )
}

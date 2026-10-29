import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { eisPlatformEigenaar } from '@/lib/club/toegang'
import { STATUSSEN, isStatus, telPerStatus } from '@/lib/club/hulp/melding'
import { alleMeldingen } from '@/lib/club/hulp/opslag'
import { MeldingAfhandelen } from '@/components/club/hulp/MeldingAfhandelen'
import { StatusChip, meldMoment } from '@/components/club/hulp/MeldingKaart'
import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import { HULP } from '@/lib/aiyourgym/taal/woorden/club/hulp'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(HULP)).beheer.titel }
}
export const dynamic = 'force-dynamic'

// Alleen Kane: alle vragen, problemen en wensen uit het helpcentrum van al zijn
// sportscholen, met status wijzigen en een antwoord (?status=open|bezig|klaar).

export default async function MeldingenPagina({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const t = await eisPlatformEigenaar()
  const taal = await getTaal()
  const tekst = await clubTekst(HULP)
  const tb = tekst.beheer
  const ruw = (await searchParams).status
  const filter = isStatus(ruw) ? ruw : null
  const alles = await alleMeldingen(t)
  const tel = alles ? telPerStatus(alles) : null
  const lijst = (alles ?? []).filter((m) => !filter || m.status === filter)
  const naamVan = new Map(t.organisaties.map((o) => [o.id, o.naam]))

  return (
    <>
      <Link href="/club/hulp" className="club-terug">
        <ArrowLeft size={16} aria-hidden /> {tb.terug}
      </Link>
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{tb.boventitel}</p>
          <h1>{tb.titel}</h1>
          <p>{tb.intro}</p>
        </div>
        <nav aria-label={tb.filter}>
          <div className="club-segment">
            <Link href="/club/hulp/meldingen" aria-current={filter === null ? 'page' : undefined} scroll={false}>
              {tb.alles}
              {alles ? ` ${alles.length}` : ''}
            </Link>
            {STATUSSEN.map((s) => (
              <Link key={s} href={`/club/hulp/meldingen?status=${s}`} aria-current={filter === s ? 'page' : undefined} scroll={false}>
                {tekst.status[s]}
                {tel ? ` ${tel[s]}` : ''}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {!alles && <p className="club-melding club-melding--fout" role="status">{tb.fout}</p>}
      {alles && lijst.length === 0 && <p className="club-hulp-leeg">{filter ? tb.leegMetStatus(tekst.status[filter].toLowerCase()) : tb.leeg}</p>}
      <ul className="club-hulp-meldingen club-hulp-meldingen--beheer" role="list">
        {lijst.map((m) => (
          <li key={m.id}>
            <article className="club-hulp-melding" aria-label={m.onderwerp}>
              <header className="club-hulp-meldingkop">
                <div>
                  <p className="club-hulp-meta">
                    {naamVan.get(m.userId) ?? tb.onbekendeSportschool} · {tekst.soort[m.soort]} · {meldMoment(m.aangemaaktOp, taal)}
                  </p>
                  <h3>{m.onderwerp}</h3>
                  <p className="club-hulp-meta">
                    {m.melderNaam} ({tekst.melderRol[m.melderRol]}){m.pagina ? ` · ${m.pagina}` : ''}
                  </p>
                </div>
                <StatusChip status={m.status} taal={taal} />
              </header>
              <p className="club-hulp-beschrijving">{m.beschrijving}</p>
              <MeldingAfhandelen key={`${m.id}-${m.bijgewerktOp}`} id={m.id} status={m.status} antwoord={m.antwoord} />
            </article>
          </li>
        ))}
      </ul>
    </>
  )
}

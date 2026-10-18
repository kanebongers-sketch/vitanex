import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { eisKane } from '@/lib/club/toegang'
import { SOORT_LABEL, STATUSSEN, STATUS_LABEL, isStatus, telPerStatus } from '@/lib/club/hulp/melding'
import { alleMeldingen } from '@/lib/club/hulp/opslag'
import { MeldingAfhandelen } from '@/components/club/hulp/MeldingAfhandelen'
import { StatusChip, nlMoment } from '@/components/club/hulp/MeldingKaart'

export const metadata: Metadata = { title: 'Meldingen' }
export const dynamic = 'force-dynamic'

// Alleen Kane: alle vragen, problemen en wensen uit het helpcentrum van al zijn
// sportscholen, met status wijzigen en een antwoord (?status=open|bezig|klaar).

const ROL_LABEL = { beheerder: 'Kane', eigenaar: 'Eigenaar', clubmanager: 'Clubmanager', medewerker: 'Medewerker' } as const

export default async function MeldingenPagina({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const t = await eisKane()
  const ruw = (await searchParams).status
  const filter = isStatus(ruw) ? ruw : null
  const alles = await alleMeldingen(t)
  const tel = alles ? telPerStatus(alles) : null
  const lijst = (alles ?? []).filter((m) => !filter || m.status === filter)
  const naamVan = new Map(t.organisaties.map((o) => [o.id, o.naam]))

  return (
    <>
      <Link href="/clubkane/hulp" className="club-terug">
        <ArrowLeft size={16} aria-hidden /> Hulp en support
      </Link>
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">Alle sportscholen</p>
          <h1>Meldingen</h1>
          <p>Vragen, problemen en wensen uit het helpcentrum. Je antwoord staat bij de melder in Club; er gaat geen mail naar buiten.</p>
        </div>
        <nav aria-label="Filter op status">
          <div className="club-segment">
            <Link href="/clubkane/hulp/meldingen" aria-current={filter === null ? 'page' : undefined} scroll={false}>
              Alles{alles ? ` ${alles.length}` : ''}
            </Link>
            {STATUSSEN.map((s) => (
              <Link key={s} href={`/clubkane/hulp/meldingen?status=${s}`} aria-current={filter === s ? 'page' : undefined} scroll={false}>
                {STATUS_LABEL[s]}
                {tel ? ` ${tel[s]}` : ''}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {!alles && <p className="club-melding club-melding--fout" role="status">De meldingen konden niet worden gelezen. Probeer het later opnieuw.</p>}
      {alles && lijst.length === 0 && <p className="club-hulp-leeg">Geen meldingen{filter ? ` met status ${STATUS_LABEL[filter].toLowerCase()}` : ''}.</p>}
      <ul className="club-hulp-meldingen club-hulp-meldingen--beheer" role="list">
        {lijst.map((m) => (
          <li key={m.id}>
            <article className="club-hulp-melding" aria-label={m.onderwerp}>
              <header className="club-hulp-meldingkop">
                <div>
                  <p className="club-hulp-meta">
                    {naamVan.get(m.userId) ?? 'Onbekende sportschool'} · {SOORT_LABEL[m.soort]} · {nlMoment(m.aangemaaktOp)}
                  </p>
                  <h3>{m.onderwerp}</h3>
                  <p className="club-hulp-meta">
                    {m.melderNaam} ({ROL_LABEL[m.melderRol]}){m.pagina ? ` · ${m.pagina}` : ''}
                  </p>
                </div>
                <StatusChip status={m.status} />
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

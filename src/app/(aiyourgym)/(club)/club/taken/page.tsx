import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { eisModule } from '@/lib/club/toegang'
import { clubPad, type ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { GeenVestigingen } from '@/components/club/shell/GeenVestigingen'
import { isDatum, nlDelen, plusDagen } from '@/lib/club/rooster/tijd'
import { dagLang } from '@/lib/club/taken/weergave'
import { AutoVerversen, PrintKnop } from '@/components/club/taken/Hulpjes'
import { TakenKop } from '@/components/club/taken/TakenKop'
import { TakenDag } from '@/components/club/taken/TakenDag'
import '@/components/club/taken/taken.css'

export const metadata: Metadata = { title: 'Taken' }

// De dag, in dezelfde tabel als de week (zoals de Excel van Budel, besluit Kane):
// per lijst de taken met een kolom voor deze dag, afvinken met een tik, de
// weekteller ernaast. Bladeren per dag (?dag=2026-10-14); standaard vandaag.
// Onderaan het notitieveld en "Afsluitronde klaar". De tabel zelf (TakenDag)
// staat voor vandaag ook als sectie op Vandaag (besluit Kane 27-10-2026).

function kiesDag(ruw: string | string[] | undefined, vandaag: string): string {
  const w = Array.isArray(ruw) ? ruw[0] : ruw
  return isDatum(w) ? w : vandaag
}

export default async function TakenDagPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisModule('taken')
  const params = await searchParams
  const vestiging = kiesUit(t.vestigingen, params.v)
  if (!vestiging) return <GeenVestigingen />
  const vandaag = nlDelen(new Date()).datum
  const dag = kiesDag(params.dag, vandaag)
  const naam = dagLang(dag)
  const dagHref = (d: string) => clubPad('/taken', vestiging, d === vandaag ? undefined : { dag: d })

  return (
    <div className="club-taken-pagina">
      {dag === vandaag && <AutoVerversen />}
      <TakenKop
        vestiging={vestiging}
        vestigingNaam={naamVan(t.vestigingen, vestiging)}
        weergave=""
        titel={`${naam.charAt(0).toUpperCase()}${naam.slice(1)}`}
        sub={dag === vandaag ? 'Vandaag. Tik op een vakje om af te vinken.' : dag < vandaag ? 'Een eerdere dag.' : 'Een dag die nog moet komen.'}
      >
        <nav className="club-taken-bladeren" aria-label="Dag kiezen">
          <Link href={dagHref(plusDagen(dag, -1))} className="club-knop club-knop--klein" aria-label="Vorige dag" scroll={false}>
            <ChevronLeft aria-hidden size={16} />
          </Link>
          <Link href={dagHref(vandaag)} className="club-knop club-knop--klein" aria-current={dag === vandaag ? 'page' : undefined} scroll={false}>
            Vandaag
          </Link>
          <Link href={dagHref(plusDagen(dag, 1))} className="club-knop club-knop--klein" aria-label="Volgende dag" scroll={false}>
            <ChevronRight aria-hidden size={16} />
          </Link>
        </nav>
        <PrintKnop />
      </TakenKop>
      <TakenDag admin={t.admin} userId={t.userId} vestiging={vestiging} dag={dag} vandaag={vandaag} />
    </div>
  )
}

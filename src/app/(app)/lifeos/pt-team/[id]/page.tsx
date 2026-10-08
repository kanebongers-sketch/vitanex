import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { FounderPoort } from '@/components/lifeos/auth/FounderPoort'
import { PtTeamDetail } from '@/components/lifeos/pt-team/PtTeamDetail'

// Eén PT'er: alle leads en klanten, alleen-lezen. Founder-only.

export const metadata = { title: 'PT-team' }

export default async function PtDetailPagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <FounderPoort>
      <div className="lifeos-root">
        <div className="os-sfeer" aria-hidden="true" />
        <main className="os-schil os-schil--breed">
          <header className="os-crm-kop">
            <Link href="/lifeos/pt-team" className="os-crm-terug">
              <ArrowLeft size={15} strokeWidth={2.2} aria-hidden="true" />
              Terug naar PT-team
            </Link>
          </header>
          <PtTeamDetail id={id} />
        </main>
      </div>
    </FounderPoort>
  )
}

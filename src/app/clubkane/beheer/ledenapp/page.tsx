import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { eisModule } from '@/lib/club/toegang'
import { LedenappFormulier } from '@/components/club/beheer/LedenappFormulier'
import '@/components/club/beheer/beheer.css'

export const metadata: Metadata = { title: 'Ledenapp instellen' }

export default async function LedenappInstellenPagina() {
  const t = await eisModule('app')
  return (
    <>
      <Link href="/clubkane/beheer" className="club-terug">
        <ArrowLeft size={16} aria-hidden /> Instellingencentrum
      </Link>
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{t.organisatie.naam}</p>
          <h1>Ledenapp</h1>
          <p>Wat je leden zien in de app: een eigen welkom, welke tabbladen er zijn en de check-in code.</p>
        </div>
      </header>
      <LedenappFormulier begin={t.organisatie.instellingen.ledenapp} />
    </>
  )
}

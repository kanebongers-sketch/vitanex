import type { Metadata } from 'next'
import Link from 'next/link'
import { Eye } from 'lucide-react'
import { magOnderdeel } from '@/lib/club/beheerders/rechten'
import { eisModule, eisOnderdeel } from '@/lib/club/toegang'
import { LedenappFormulier } from '@/components/club/beheer/LedenappFormulier'
import '@/components/club/beheer/beheer.css'
import { InstelKruimel } from '@/components/club/beheer/InstelKruimel'

export const metadata: Metadata = { title: 'Ledenapp instellen' }

export default async function LedenappInstellenPagina() {
  await eisOnderdeel('beheer')
  const t = await eisModule('app')
  return (
    <>
      <InstelKruimel id="ledenapp" />
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{t.organisatie.naam}</p>
          <h1>Ledenapp instellen</h1>
          <p>Wat je leden zien in de app: een eigen welkom, welke tabbladen er zijn en de check-in code.</p>
        </div>
        {magOnderdeel(t.onderdelen, 'app') && (
          <div className="club-acties">
            <Link href="/club/app" className="club-knop">
              <Eye size={16} aria-hidden /> Bekijken als lid
            </Link>
          </div>
        )}
      </header>
      <LedenappFormulier begin={t.organisatie.instellingen.ledenapp} />
    </>
  )
}

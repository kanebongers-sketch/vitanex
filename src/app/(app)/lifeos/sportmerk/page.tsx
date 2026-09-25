import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { FounderPoort } from '@/components/lifeos/auth/FounderPoort'
import { SportmerkKaart } from '@/components/lifeos/sportmerk/SportmerkKaart'

// Sportmerk: de strategie van Kane's nieuwe D2C-sportmerk, los van MentaForce
// zelf. Founder-only zoals de rest van LifeOS. Bewust GEEN inhoud in deze Server
// Component: alles wat hier gerenderd wordt, zit in de HTML van wie de URL opent
// — het plan komt via de gegate `/api/lifeos/sportmerk`.

export const metadata = { title: 'Sportmerk' }

export default function SportmerkPagina() {
  return (
    <FounderPoort>
      <div className="lifeos-root">
        <div className="os-sfeer" aria-hidden="true" />
        <main className="os-schil">
          <header className="os-crm-kop">
            <Link href="/lifeos" className="os-crm-terug">
              <ArrowLeft size={15} strokeWidth={2.2} aria-hidden="true" />
              Terug naar dashboard
            </Link>
            <h1 className="os-zone__kop">Sportmerk</h1>
            <p className="os-zone__intro">
              Het nieuwe sportmerk, van strategie tot lancering: de gekozen richting, de cijfers erachter en wat er nog open staat.
            </p>
          </header>
          <SportmerkKaart />
        </main>
      </div>
    </FounderPoort>
  )
}

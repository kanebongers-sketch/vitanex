import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { FounderPoort } from '@/components/lifeos/auth/FounderPoort'
import { AgendaCategorieBord } from '@/components/lifeos/agenda/AgendaCategorieBord'

// Je komende afspraken, verdeeld over categorieën (PT-klanten, PT-team, Management,
// Team Budel, Persoonlijk, Overig). Founder-only, net als de rest van LifeOS — de
// echte gate zit server-side op /api/lifeos/agenda/categorieen. De categorie komt
// uit de naam-koppeling; "Overig" is het wegfilter-vak.

export const metadata = { title: 'Categorieën' }

export default function AgendaCategoriePagina() {
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
            <h1 className="os-zone__kop">Categorieën</h1>
            <p className="os-zone__intro">
              Je afspraken van de komende twee weken, verdeeld over je categorieën. Klik een
              categorie aan of uit om die te tonen of weg te filteren, of kies per afspraak zelf
              een andere bak — LifeOS onthoudt dat en zet afspraken met dezelfde naam voortaan
              vanzelf goed.
            </p>
          </header>
          <AgendaCategorieBord />
        </main>
      </div>
    </FounderPoort>
  )
}

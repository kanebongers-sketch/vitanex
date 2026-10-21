import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { eisPlatformEigenaar } from '@/lib/club/toegang'
import { OEFENINGEN_3D } from '@/lib/club/training/3d'
import { coachingVoor } from '@/lib/club/training/coaching'
import { Vergelijk3dRij } from '@/components/club/training/drie/Vergelijk3dRij'
import '@/components/club/training/illustratie/illustratie.css'
import '@/components/club/training/illustratie/beelden.css'

export const metadata: Metadata = { title: 'Oefenbeelden' }

// Pagina voor Kane (besluit 20-10-2026): alleen de eigen 3D-oefenbeelden.
// Houdingen staan als data in src/lib/club/training/3d, het figuur en het
// materiaal worden getekend in src/components/club/training/drie.
// In de bibliotheek, de editor en de ledenapp verandert nog niets.

export default async function BeeldenPagina() {
  await eisPlatformEigenaar()
  return (
    <>
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">Training · prototype · alleen Kane</p>
          <h1>Oefenbeelden in 3D</h1>
          <p>
            {OEFENINGEN_3D.length} oefeningen, elk als lus van een herhaling in het tempo van een trainer. De werkende spieren krijgen de accentkleur van de sportschool.
          </p>
        </div>
        <nav aria-label="Training" className="club-acties">
          <Link href="/club/training" className="club-knop club-knop--klein">
            <ArrowLeft size={14} aria-hidden /> Training
          </Link>
        </nav>
      </header>

      <div className="club-beelden-raster3d">
        {OEFENINGEN_3D.map((o) => (
          <Vergelijk3dRij key={o.naam} naam={o.naam} toont={coachingVoor(o.naam)?.kernpunten.map((k) => k.punt) ?? []} />
        ))}
      </div>
    </>
  )
}

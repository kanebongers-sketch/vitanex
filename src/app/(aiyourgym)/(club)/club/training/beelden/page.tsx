import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { eisPlatformEigenaar } from '@/lib/club/toegang'
import { OEFENINGEN_3D } from '@/lib/club/training/3d'
import { coachingVoor } from '@/lib/club/training/coaching'
import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import { standaardCoachingIn } from '@/lib/aiyourgym/taal/woorden/club/coaching'
import { CLUB_TRAINING } from '@/lib/aiyourgym/taal/woorden/club/training'
import { Vergelijk3dRij } from '@/components/club/training/drie/Vergelijk3dRij'
import '@/components/club/training/illustratie/illustratie.css'
import '@/components/club/training/illustratie/beelden.css'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(CLUB_TRAINING)).beelden.titel }
}

// Pagina voor Kane (besluit 20-10-2026): alleen de eigen 3D-oefenbeelden.
// Houdingen staan als data in src/lib/club/training/3d, het figuur en het
// materiaal worden getekend in src/components/club/training/drie.
// In de bibliotheek, de editor en de ledenapp verandert nog niets.

export default async function BeeldenPagina() {
  await eisPlatformEigenaar()
  const taal = await getTaal()
  const t = (await clubTekst(CLUB_TRAINING)).beelden
  return (
    <>
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{t.boventitel}</p>
          <h1>{t.kop}</h1>
          <p>{t.intro(OEFENINGEN_3D.length)}</p>
        </div>
        <nav aria-label={t.terug} className="club-acties">
          <Link href="/club/training" className="club-knop club-knop--klein">
            <ArrowLeft size={14} aria-hidden /> {t.terug}
          </Link>
        </nav>
      </header>

      <div className="club-beelden-raster3d">
        {OEFENINGEN_3D.map((o) => (
          <Vergelijk3dRij key={o.naam} naam={o.naam} toont={standaardCoachingIn(o.naam, coachingVoor(o.naam), taal)?.kernpunten.map((k) => k.punt) ?? []} />
        ))}
      </div>
    </>
  )
}

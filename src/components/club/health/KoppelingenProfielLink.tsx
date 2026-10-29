import Link from 'next/link'
import { Activity, ChevronRight } from 'lucide-react'
import { healthActief } from '@/lib/club/health/schakelaar'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { HEALTH } from '@/lib/aiyourgym/taal/woorden/ledenapp/health'
import '@/components/club/community/community.css'

// In Profiel: de weg naar Koppelingen (weegschaal, horloge, sportapp). Alleen
// met de schakelaar CLUB_HEALTH_ACTIEF aan; anders niets.

interface KoppelingenProfielLinkProps {
  /** Alleen bij Kane in de voorvertoning: het lid waarmee hij meekijkt. */
  voorvertoningLid: string | null
}

export async function KoppelingenProfielLink({ voorvertoningLid }: KoppelingenProfielLinkProps) {
  if (!healthActief()) return null
  const t = (await clubTekst(HEALTH)).profiel
  const href = voorvertoningLid ? `/mijn/koppelingen?lid=${encodeURIComponent(voorvertoningLid)}` : '/mijn/koppelingen'
  return (
    <div className="club-mijn-blok club-cm-profiel">
      <Link href={href} className="club-cm-groep-link club-cm-profiel-link" prefetch={false}>
        <span className="club-cm-groep-icoon" aria-hidden>
          <Activity size={20} />
        </span>
        <span className="club-cm-groep-tekst">
          <strong>{t.titel}</strong>
          <span className="club-cm-groep-meta">{t.meta}</span>
        </span>
        <ChevronRight size={20} aria-hidden className="club-cm-groep-pijl" />
      </Link>
    </div>
  )
}

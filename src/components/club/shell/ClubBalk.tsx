'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Building2 } from 'lucide-react'
import { FfLogo } from '@/components/lifeos/pt-dashboard/FfLogo'
import { VESTIGINGEN, VESTIGING_LABEL, VESTIGING_PARAM, PILOT_VESTIGING, kiesVestiging } from '@/lib/club/gedeeld/vestiging'
import { ONDERDELEN, isActief } from './onderdelen'

// De bovenkant van de clubsoftware: logo, de vestiging waarin je werkt en de
// onderdelen. Anders dan een klassieke zijbalk: alles bovenin, zodat het
// werkvlak de volle breedte heeft (balie-pc, tablet aan de muur, telefoon).
// De vestiging staat in de URL; wisselen houdt je op hetzelfde onderdeel.

export function ClubBalk({ ptCode }: { ptCode: string }) {
  const pad = usePathname()
  const zoek = useSearchParams()
  const router = useRouter()
  const vestiging = kiesVestiging(zoek.get(VESTIGING_PARAM))

  function wissel(nieuw: string) {
    const params = new URLSearchParams(zoek.toString())
    params.set(VESTIGING_PARAM, nieuw)
    router.push(`${pad}?${params.toString()}`)
  }

  return (
    <header className="club-kop">
      <div className="club-balk">
        <Link href={`/clubkane?${VESTIGING_PARAM}=${vestiging}`} className="club-merk" aria-label="Fit Factory, naar Vandaag">
          <FfLogo />
          <span className="club-merk-woord">CLUB</span>
        </Link>
        <label className="club-vestiging">
          <Building2 aria-hidden size={16} />
          <span className="club-sr">Vestiging</span>
          <select value={vestiging} onChange={(e) => wissel(e.target.value)}>
            {VESTIGINGEN.map((v) => (
              <option key={v} value={v}>
                {VESTIGING_LABEL[v]}
                {v === PILOT_VESTIGING ? ' (pilot)' : ''}
              </option>
            ))}
          </select>
        </label>
        <span className="club-test" title="Alleen zichtbaar voor Kane tot de presentatie">
          Testomgeving
        </span>
        <Link href={`/${ptCode}`} className="club-terug" prefetch={false}>
          <ArrowLeft aria-hidden size={15} />
          <span>PT-app</span>
        </Link>
      </div>
      <nav className="club-nav" aria-label="Onderdelen">
        {ONDERDELEN.map((o) => {
          const actief = isActief(o, pad)
          const href = `/clubkane${o.pad}?${VESTIGING_PARAM}=${vestiging}`
          return (
            <Link key={o.sleutel} href={href} aria-current={actief ? 'page' : undefined} title={o.uitleg}>
              {o.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}

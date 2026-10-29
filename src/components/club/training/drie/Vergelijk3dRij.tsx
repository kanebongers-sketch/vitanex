'use client'

import { useTekst } from '@/lib/aiyourgym/taal/client'
import { CLUB_TRAINING } from '@/lib/aiyourgym/taal/woorden/club/training'
import { useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { Oefening3dLazy } from './Oefening3dLazy'
import type { Stand3d } from './Oefening3d'

// Een kaart op de pagina Oefenbeelden: het 3D-beeld van een oefening met de
// kernpunten uit de coaching en de bediening (afspelen, begin, eind).

interface Vergelijk3dRijProps {
  naam: string
  toont: readonly string[]
}

export function Vergelijk3dRij({ naam, toont }: Vergelijk3dRijProps) {
  const t = useTekst(CLUB_TRAINING).beeld
  const [stand, setStand] = useState<Stand3d>('speelt')
  const speelt = stand === 'speelt'
  const kopId = `ill-3d-${naam.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  return (
    <section className="club-beelden-kaart3d" aria-labelledby={kopId}>
      <div className="club-beelden-kaart3d-beeld">
        <Oefening3dLazy naam={naam} stand={stand} label={t.in3d(naam)} />
      </div>
      <div className="club-beelden-kaart3d-info">
        <h2 id={kopId}>{naam}</h2>
        {toont.length > 0 && (
          <ol className="club-beelden-toont">
            {toont.map((t) => <li key={t}>{t}</li>)}
          </ol>
        )}
        <div className="club-beelden-knoppen" role="group" aria-label={t.bediening(naam)}>
          <button type="button" className="club-knop club-knop--klein club-knop--primair" aria-pressed={speelt} onClick={() => setStand(speelt ? 'begin' : 'speelt')}>
            {speelt ? <Pause size={14} aria-hidden /> : <Play size={14} aria-hidden />}
            {speelt ? t.pauze : t.afspelen}
          </button>
          <button type="button" className="club-knop club-knop--klein" aria-pressed={stand === 'begin'} onClick={() => setStand('begin')}>{t.begin}</button>
          <button type="button" className="club-knop club-knop--klein" aria-pressed={stand === 'eind'} onClick={() => setStand('eind')}>{t.eind}</button>
        </div>
      </div>
    </section>
  )
}

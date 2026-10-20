'use client'

import { useMemo, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react'
import { Pause, Play } from 'lucide-react'
import { animatieVan, houdingVan, PROTOTYPE_OEFENINGEN } from '@/lib/club/training/illustratie'
import { oefening3dOpNaam } from '@/lib/club/training/3d'
import { Oefening3dLazy } from '../drie/Oefening3dLazy'
import { IllustratieBewegend, IllustratieStil } from './IllustratieSvg'

// Een rij op de vergelijkpagina: links wat het beeld moet laten zien, dan het
// huidige RepDB-beeld, dan het nieuwe beeld in vier varianten (donker en licht,
// twee accentkleuren). De knoppen werken voor alle vier tegelijk.
// Bij prefers-reduced-motion speelt niets af: dan staan begin en eind naast elkaar.
// Heeft de oefening ook een 3D-versie, dan staat die boven de tekeningen.

type Stand = 'begin' | 'eind' | 'speelt'

const VARIANTEN = [
  { thema: 'donker', accent: '#B58E5C', naam: 'Donker, brons' },
  { thema: 'licht', accent: '#B58E5C', naam: 'Licht, brons' },
  { thema: 'donker', accent: '#3D7BFF', naam: 'Donker, blauw' },
  { thema: 'licht', accent: '#3D7BFF', naam: 'Licht, blauw' },
] as const

const MINDER = '(prefers-reduced-motion: reduce)'

function abonneer(melding: () => void): () => void {
  const m = window.matchMedia(MINDER)
  m.addEventListener('change', melding)
  return () => m.removeEventListener('change', melding)
}

function useMinderBeweging(): boolean {
  return useSyncExternalStore(abonneer, () => window.matchMedia(MINDER).matches, () => false)
}

interface VergelijkRijProps {
  index: number
  /** Het huidige beeld (server-weergave van OefeningBeeld). */
  huidig: ReactNode
}

export function VergelijkRij({ index, huidig }: VergelijkRijProps) {
  const o = PROTOTYPE_OEFENINGEN[index]
  const [stand, setStand] = useState<Stand>('begin')
  const minder = useMinderBeweging()
  const a = useMemo(() => animatieVan(o), [o])
  const begin = useMemo(() => houdingVan(o, 'begin').lagen, [o])
  const eind = useMemo(() => houdingVan(o, 'eind').lagen, [o])
  const speelt = stand === 'speelt'
  const kopId = `ill-${index}`
  const heeft3d = oefening3dOpNaam(o.naam) !== undefined

  const tegel = (thema: string, accent: string, naam: string) => {
    const stijl = { '--ill-accent': accent } as CSSProperties
    const klasse = `club-ill${thema === 'licht' ? ' club-ill--licht' : ''}`
    if (speelt && minder) {
      return (
        <div className="club-ill-paar" aria-label={`${o.naam}, ${naam}`} role="group">
          <figure><div className={klasse} style={stijl}><IllustratieStil lagen={begin} kader={a.kader} label="Begin" /></div><figcaption>Begin</figcaption></figure>
          <figure><div className={klasse} style={stijl}><IllustratieStil lagen={eind} kader={a.kader} label="Eind" /></div><figcaption>Eind</figcaption></figure>
        </div>
      )
    }
    return (
      <div className={klasse} style={stijl}>
        {speelt ? (
          <IllustratieBewegend animatie={a} label={`${o.naam} in beweging, ${naam}`} />
        ) : (
          <IllustratieStil lagen={stand === 'begin' ? begin : eind} kader={a.kader} label={`${o.naam}, ${stand === 'begin' ? 'beginhouding' : 'eindhouding'}, ${naam}`} />
        )}
      </div>
    )
  }

  return (
    <section className="club-beelden-rij" aria-labelledby={kopId}>
      <div className="club-beelden-info">
        <h2 id={kopId}>{o.naam}</h2>
        <p className="club-beelden-meta">
          {o.begin.aanzicht === 'voor' ? 'Vooraanzicht' : 'Zijaanzicht'} · van begin naar eind {o.heen === 'concentrisch' ? 'de zware fase' : 'de zakkende fase'}
        </p>
        <ul className="club-beelden-toont">
          {o.toont.map((t) => <li key={t}>{t}</li>)}
        </ul>
        <div className="club-beelden-knoppen" role="group" aria-label={`Bediening ${o.naam}`}>
          <button type="button" className="club-knop club-knop--klein club-knop--primair" aria-pressed={speelt} onClick={() => setStand(speelt ? 'begin' : 'speelt')}>
            {speelt ? <Pause size={14} aria-hidden /> : <Play size={14} aria-hidden />}
            {speelt ? 'Pauze' : 'Afspelen'}
          </button>
          <button type="button" className="club-knop club-knop--klein" aria-pressed={stand === 'begin'} onClick={() => setStand('begin')}>Begin</button>
          <button type="button" className="club-knop club-knop--klein" aria-pressed={stand === 'eind'} onClick={() => setStand('eind')}>Eind</button>
        </div>
      </div>
      <div className="club-beelden-huidig">
        <p className="club-beelden-label">Nu (RepDB)</p>
        {huidig}
      </div>
      <div className="club-beelden-nieuw">
        {heeft3d && (
          <>
            <p className="club-beelden-label">Nieuw in 3D (prototype)</p>
            <div className="club-beelden-3d">
              <Oefening3dLazy naam={o.naam} stand={stand} label={`${o.naam} in 3D`} />
            </div>
          </>
        )}
        <p className="club-beelden-label">Nieuw (eigen tekening)</p>
        <div className="club-beelden-varianten">
          {VARIANTEN.map((v) => (
            <figure key={v.naam} className="club-beelden-variant">
              {tegel(v.thema, v.accent, v.naam)}
              <figcaption>{v.naam}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

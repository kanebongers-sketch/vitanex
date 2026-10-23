'use client'

import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react'
import { Pause, Play } from 'lucide-react'
import type { OefenRender } from '@/components/aiyourgym/inhoud/oefenrenders'

// Een oefening als onze eigen Blender-render. Eerst staat er een licht
// stilstaand beginbeeld (ruim 20 KB) met vaste maten, dus geen verspringen.
// Pas als het beeld in beeld komt laden we de bewegende lus erover en die
// vervaagt erin zodra hij binnen is; buiten beeld halen we de lus weer weg,
// zodat de browser niets doorrekent. Bij prefers-reduced-motion, of als de
// bezoeker op pauze drukt, blijft het stilstaande beeld staan.

export type OefenLusStand = 'speelt' | 'begin' | 'eind'

interface OefenLusProps {
  render: OefenRender
  /** Beschrijving voor schermlezers (alt). */
  label: string
  /** Afspelen, of stil op het begin of het zwaarste punt. */
  stand?: OefenLusStand
  /** Hoe breed het beeld op de pagina staat, voor de keuze tussen de kleine en de grote lus. */
  sizes?: string
  className?: string
  /** Een kleine knop om de beweging stil te zetten (WCAG 2.2.2). */
  bediening?: boolean
}

/** Hoe ver van het scherm we de lus alvast ophalen. */
const VOORLADEN = '200px 0px'

const MINDER = '(prefers-reduced-motion: reduce)'

function volgMinder(melding: () => void): () => void {
  const mq = window.matchMedia(MINDER)
  mq.addEventListener('change', melding)
  return () => mq.removeEventListener('change', melding)
}

/** Op de server en bij de eerste weergave: geen voorkeur bekend, dus het stille beeld blijft gewoon staan. */
function useMinderBeweging(): boolean {
  return useSyncExternalStore(volgMinder, () => window.matchMedia(MINDER).matches, () => false)
}

function useInBeeld<T extends Element>(): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null)
  const [inBeeld, setInBeeld] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const kijker = new IntersectionObserver(([e]) => setInBeeld(e.isIntersecting), { rootMargin: VOORLADEN })
    kijker.observe(el)
    return () => kijker.disconnect()
  }, [])
  return [ref, inBeeld]
}

export function OefenLus({ render, label, stand = 'speelt', sizes = '(max-width: 640px) 90vw, 560px', className, bediening = false }: OefenLusProps) {
  const [vak, inBeeld] = useInBeeld<HTMLDivElement>()
  const minder = useMinderBeweging()
  const [gepauzeerd, setGepauzeerd] = useState(false)
  const [geladen, setGeladen] = useState<string | null>(null)

  const still = stand === 'eind' ? render.piek : render.begin
  const speelt = stand === 'speelt' && !minder && !gepauzeerd
  const lusAan = speelt && inBeeld
  const lusSrc = render.lus.src
  const lusZichtbaar = lusAan && geladen === lusSrc

  return (
    <div ref={vak} className={className ? `ayg-lus ${className}` : 'ayg-lus'} data-speelt={lusZichtbaar || undefined}>
      <img
        className="ayg-lus-still"
        src={still.src}
        width={still.breedte}
        height={still.hoogte}
        alt={label}
        loading="lazy"
        decoding="async"
      />
      {lusAan && (
        <img
          className="ayg-lus-beweging"
          src={lusSrc}
          srcSet={`${render.lusKlein.src} ${render.lusKlein.breedte}w, ${render.lus.src} ${render.lus.breedte}w`}
          sizes={sizes}
          width={render.lus.breedte}
          height={render.lus.hoogte}
          alt=""
          aria-hidden
          decoding="async"
          onLoad={() => setGeladen(lusSrc)}
        />
      )}
      {bediening && stand === 'speelt' && !minder && (
        <button
          type="button"
          className="ayg-lus-knop"
          aria-pressed={gepauzeerd}
          onClick={() => setGepauzeerd((p) => !p)}
        >
          {gepauzeerd ? <Play size={14} aria-hidden /> : <Pause size={14} aria-hidden />}
          <span className="ayg-sr">Beweging pauzeren</span>
        </button>
      )}
    </div>
  )
}

'use client'

import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react'
import { Pause, Play } from 'lucide-react'
import { srcSetVan, type OefenRender } from '@/components/aiyourgym/inhoud/oefenrenders'

// Een oefening als onze eigen Blender-render, in HD. Eerst staat er een
// stilstaand beginbeeld met vaste maten, dus geen verspringen.
// Pas als het beeld in beeld komt laden we de bewegende lus erover en die
// vervaagt erin zodra hij binnen is; buiten beeld halen we de lus weer weg,
// zodat de browser niets doorrekent. Bij prefers-reduced-motion, of als de
// bezoeker op pauze drukt, blijft het stilstaande beeld staan.
//
// Welk bestand: op de telefoon (tot 640 px breed) kiest de browser alleen
// tussen de lus van 480 en 720 px, zodat een telefoon met 3x scherm geen
// HD-lus van een paar MB over mobiele data haalt. Daarboven kiest de browser met
// srcset en sizes zelf: 720 px op een gewoon scherm, de HD-lus op retina en
// op grote vlakken.

export type OefenLusStand = 'speelt' | 'begin' | 'eind'

interface OefenLusProps {
  render: OefenRender
  /** Beschrijving voor schermlezers (alt). */
  label: string
  /** Afspelen, of stil op het begin of het zwaarste punt. */
  stand?: OefenLusStand
  /** Hoe breed het beeld op de pagina staat (sizes): de browser kiest daarmee 720 px of HD. */
  sizes?: string
  className?: string
  /** Een kleine knop om de beweging stil te zetten (WCAG 2.2.2). */
  bediening?: boolean
}

/** Tot deze breedte telt het scherm als telefoon. */
const TELEFOON = '(max-width: 640px)'

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

  const eind = stand === 'eind'
  const still = eind ? render.piek : render.begin
  const stillKlein = eind ? render.piekKlein : render.beginKlein
  const speelt = stand === 'speelt' && !minder && !gepauzeerd
  const lusAan = speelt && inBeeld
  const lusSleutel = render.lusHd.src
  const lusZichtbaar = lusAan && geladen === lusSleutel

  return (
    <div ref={vak} className={className ? `ayg-lus ${className}` : 'ayg-lus'} data-speelt={lusZichtbaar || undefined}>
      <picture>
        <source media={TELEFOON} srcSet={srcSetVan([stillKlein, still])} sizes={sizes} />
        <img
          className="ayg-lus-still"
          src={still.src}
          srcSet={srcSetVan([stillKlein, still])}
          sizes={sizes}
          width={still.breedte}
          height={still.hoogte}
          alt={label}
          loading="lazy"
          decoding="async"
        />
      </picture>
      {lusAan && (
        <picture>
          <source media={TELEFOON} srcSet={srcSetVan([render.lusKlein, render.lus])} sizes={sizes} />
          <img
            className="ayg-lus-beweging"
            src={render.lus.src}
            srcSet={srcSetVan([render.lusKlein, render.lus, render.lusHd])}
            sizes={sizes}
            width={render.lusHd.breedte}
            height={render.lusHd.hoogte}
            alt=""
            aria-hidden
            decoding="async"
            onLoad={() => setGeladen(lusSleutel)}
          />
        </picture>
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

'use client'

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type RefObject } from 'react'
import { Pause, Play } from 'lucide-react'
import { srcSetVan, type OefenRender, type OefenRenderBestand } from '@/components/aiyourgym/inhoud/oefenrenders'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { OEFENLUS } from '@/lib/aiyourgym/taal/woorden/website/mockups/interactief'
import {
  kiesLus,
  lusFase,
  posterSleutel,
  posterVan,
  verhoudingVan,
  vloerVan,
  type OefenLusStand,
  type Poster,
} from './oefenlus-logica'

export type { OefenLusStand } from './oefenlus-logica'

// Een oefening als onze eigen Blender-render, in HD. Zo verloopt het, zonder
// haperen (regels en tests in oefenlus-logica.ts):
// 1. Eerst staat er een stilstaand beginbeeld (poster) in een vak met vaste
//    verhouding, dus geen verspringen.
// 2. Pas als de poster er staat en het vak bijna in beeld is, halen we de
//    bewegende lus op in een maat die bij het vak past (een keer gekozen, geen
//    srcset, dus nooit een ander bestand midden in het afspelen). De lus staat
//    onzichtbaar klaar tot img.decode() klaar is en vervaagt dan kort over de poster.
// 3. Een andere oefening of stand: het huidige beeld blijft staan tot de nieuwe
//    poster geladen en gedecodeerd is; dan pas wisselt het beeld.
// 4. Buiten beeld, bij pauze of bij prefers-reduced-motion: alleen de poster.
// De schaduw op de vloer staat per render precies onder de voeten (vloer_y).

interface OefenLusProps {
  render: OefenRender
  /** Beschrijving voor schermlezers (alt). */
  label: string
  /** Afspelen, of stil op het begin of het zwaarste punt. */
  stand?: OefenLusStand
  /** Hoe breed het beeld op de pagina staat (sizes), voor de keuze van de poster. */
  sizes?: string
  className?: string
  /** Een kleine knop om de beweging stil te zetten (WCAG 2.2.2). */
  bediening?: boolean
  /** Boven de vouw: poster meteen laden met voorrang. Anders lazy. */
  voorrang?: boolean
}

/** Tot deze breedte telt het scherm als telefoon. */
const TELEFOON = '(max-width: 640px)'
/** Hoe ver van het scherm we de lus alvast ophalen. */
const VOORLADEN = '200px 0px'
const MINDER = '(prefers-reduced-motion: reduce)'
const STANDAARD_SIZES = '(max-width: 640px) 90vw, 560px'

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

/**
 * Haalt een poster op en decodeert hem, met dezelfde srcset en sizes als op de
 * pagina, zodat de browser hetzelfde bestand kiest en het daarna uit het geheugen
 * komt. Lukt het niet, dan lost de belofte toch op: dan wisselen we gewoon.
 */
export function laadPoster(poster: Poster, sizes: string = STANDAARD_SIZES): Promise<void> {
  const img = new Image()
  img.decoding = 'async'
  img.sizes = sizes
  img.srcset = srcSetVan([poster.klein, poster.groot])
  img.src = poster.groot.src
  return img.decode().catch(() => undefined)
}

/** Houdt bij welke poster op het scherm echt geladen is (ook als dat al voor de hydratatie gebeurde). */
function usePosterKlaar(ref: RefObject<HTMLImageElement | null>, sleutel: string): boolean {
  const [klaar, setKlaar] = useState<string | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const meld = () => setKlaar(sleutel)
    if (el.complete) {
      meld()
      return
    }
    el.addEventListener('load', meld)
    el.addEventListener('error', meld)
    return () => {
      el.removeEventListener('load', meld)
      el.removeEventListener('error', meld)
    }
  }, [ref, sleutel])
  return klaar === sleutel
}

interface Getoond {
  render: OefenRender
  stand: OefenLusStand
}

/** Het beeld op het scherm wisselt pas als de nieuwe poster klaar is. */
function useGetoond(render: OefenRender, stand: OefenLusStand, sizes: string): Getoond {
  const [getoond, setGetoond] = useState<Getoond>({ render, stand })
  const doel = posterSleutel(render, stand)
  const nu = posterSleutel(getoond.render, getoond.stand)
  useEffect(() => {
    if (doel === nu) return
    let weg = false
    laadPoster(posterVan(render, stand), sizes).then(() => {
      if (!weg) setGetoond({ render, stand })
    })
    return () => {
      weg = true
    }
  }, [doel, nu, render, stand, sizes])
  return doel === nu ? { render, stand } : getoond
}

interface LusLaagProps {
  bestand: OefenRenderBestand
  onKlaar: (src: string | null) => void
}

/** De bewegende lus, onzichtbaar tot img.decode() klaar is. */
function LusLaag({ bestand, onKlaar }: LusLaagProps) {
  const ref = useRef<HTMLImageElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let weg = false
    el.decode()
      .then(() => {
        if (!weg) onKlaar(bestand.src)
      })
      .catch(() => {
        // Sommige browsers weigeren decode() bij grote bewegende beelden: dan telt het laden.
        if (!weg && el.complete && el.naturalWidth > 0) onKlaar(bestand.src)
      })
    return () => {
      weg = true
      onKlaar(null)
    }
  }, [bestand.src, onKlaar])
  return (
    <img
      ref={ref}
      className="ayg-lus-beweging"
      src={bestand.src}
      width={bestand.breedte}
      height={bestand.hoogte}
      alt=""
      aria-hidden
      decoding="async"
    />
  )
}

export function OefenLus({ render, label, stand = 'speelt', sizes = STANDAARD_SIZES, className, bediening = false, voorrang = false }: OefenLusProps) {
  const t = useTekst(OEFENLUS)
  const [vak, inBeeld] = useInBeeld<HTMLDivElement>()
  const still = useRef<HTMLImageElement>(null)
  const minder = useMinderBeweging()
  const [gepauzeerd, setGepauzeerd] = useState(false)
  const [lusKlaar, setLusKlaar] = useState<string | null>(null)
  const [lus, setLus] = useState<{ voor: string; bestand: OefenRenderBestand } | null>(null)

  const getoond = useGetoond(render, stand, sizes)
  const poster = posterVan(getoond.render, getoond.stand)
  const sleutel = posterSleutel(getoond.render, getoond.stand)
  const posterKlaar = usePosterKlaar(still, sleutel)
  const speelt = getoond.stand === 'speelt' && !minder && !gepauzeerd
  const nodig = speelt && inBeeld && posterKlaar
  const slug = getoond.render.slug

  // De maat van de lus een keer kiezen per oefening, op de echte maat van het vak.
  useEffect(() => {
    const el = vak.current
    if (!nodig || !el || lus?.voor === slug) return
    const { width, height } = el.getBoundingClientRect()
    const telefoon = window.matchMedia(TELEFOON).matches
    setLus({ voor: slug, bestand: kiesLus(getoond.render, { breedte: width, hoogte: height, dpr: window.devicePixelRatio, telefoon }) })
  }, [nodig, slug, lus, getoond.render, vak])

  const lusBestand = lus?.voor === slug ? lus.bestand : null
  const fase = lusFase({ speelt, inBeeld, posterKlaar, lusSleutel: lusBestand?.src ?? null, lusKlaar })
  const stijl = { '--lus-ratio': verhoudingVan(getoond.render), '--lus-vloer': vloerVan(getoond.render) } as CSSProperties

  return (
    <div ref={vak} className={className ? `ayg-lus ${className}` : 'ayg-lus'} data-speelt={fase === 'speelt' || undefined} style={stijl}>
      <div className="ayg-lus-vlak">
        <img
          key={sleutel}
          ref={still}
          className="ayg-lus-still"
          src={poster.groot.src}
          srcSet={srcSetVan([poster.klein, poster.groot])}
          sizes={sizes}
          width={poster.groot.breedte}
          height={poster.groot.hoogte}
          alt={label}
          loading={voorrang ? 'eager' : 'lazy'}
          fetchPriority={voorrang ? 'high' : undefined}
          decoding="async"
        />
        {fase !== 'stil' && lusBestand && <LusLaag key={lusBestand.src} bestand={lusBestand} onKlaar={setLusKlaar} />}
      </div>
      {bediening && getoond.stand === 'speelt' && !minder && (
        <button type="button" className="ayg-lus-knop" aria-pressed={gepauzeerd} onClick={() => setGepauzeerd((p) => !p)}>
          {gepauzeerd ? <Play size={14} aria-hidden /> : <Pause size={14} aria-hidden />}
          <span className="ayg-sr">{t.pauzeren}</span>
        </button>
      )}
    </div>
  )
}

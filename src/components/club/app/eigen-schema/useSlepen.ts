'use client'

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

// Slepen met de vinger of de muis aan het handvat van een oefening. Werkt ook
// op een telefoon (HTML-slepen doet dat niet): pointer-events, het element
// onder de vinger bepaalt waar de oefening komt. Tijdens het slepen scrolt de
// pagina niet mee (touch-action: none op het handvat).

export interface SleepDoel {
  sleutel: string
  /** Komt de oefening voor of na het doel? */
  plek: 'voor' | 'na'
}

export interface Slepen {
  sleept: string | null
  doel: SleepDoel | null
  start: (sleutel: string, e: ReactPointerEvent<HTMLElement>) => void
}

/** onLos(sleutel, doel): de oefening is losgelaten boven een andere oefening. */
export function useSlepen(onLos: (sleutel: string, doel: SleepDoel) => void): Slepen {
  const [sleept, setSleept] = useState<string | null>(null)
  const [doel, setDoel] = useState<SleepDoel | null>(null)
  const staat = useRef<{ sleutel: string; doel: SleepDoel | null } | null>(null)
  const los = useRef(onLos)

  useEffect(() => {
    los.current = onLos
  }, [onLos])

  const beweeg = useCallback((e: PointerEvent) => {
    const s = staat.current
    if (!s) return
    const onder = document.elementFromPoint(e.clientX, e.clientY)
    const kaart = onder instanceof Element ? onder.closest<HTMLElement>('[data-regel]') : null
    const sleutel = kaart?.dataset.regel
    if (!kaart || !sleutel || sleutel === s.sleutel) return
    const vak = kaart.getBoundingClientRect()
    const nieuw: SleepDoel = { sleutel, plek: e.clientY < vak.top + vak.height / 2 ? 'voor' : 'na' }
    if (s.doel?.sleutel !== nieuw.sleutel || s.doel.plek !== nieuw.plek) {
      s.doel = nieuw
      setDoel(nieuw)
    }
  }, [])

  const stop = useCallback(() => {
    const s = staat.current
    staat.current = null
    setSleept(null)
    setDoel(null)
    window.removeEventListener('pointermove', beweeg)
    window.removeEventListener('pointerup', stop)
    window.removeEventListener('pointercancel', stop)
    if (s?.doel) los.current(s.sleutel, s.doel)
  }, [beweeg])

  const start = useCallback(
    (sleutel: string, e: ReactPointerEvent<HTMLElement>) => {
      if (e.button !== 0) return
      e.preventDefault()
      staat.current = { sleutel, doel: null }
      setSleept(sleutel)
      window.addEventListener('pointermove', beweeg)
      window.addEventListener('pointerup', stop)
      window.addEventListener('pointercancel', stop)
    },
    [beweeg, stop],
  )

  useEffect(() => () => {
    window.removeEventListener('pointermove', beweeg)
    window.removeEventListener('pointerup', stop)
    window.removeEventListener('pointercancel', stop)
  }, [beweeg, stop])

  return { sleept, doel, start }
}

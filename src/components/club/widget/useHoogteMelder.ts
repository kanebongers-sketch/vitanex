'use client'

import { useEffect, type RefObject } from 'react'

// De widget staat in een iframe op de website van de sportschool. Het script
// daar (public/widget/aiyourgym-widget.js) past de hoogte van het iframe aan
// op dit bericht en accepteert alleen berichten van onze eigen origin en uit
// dit iframe. De hoogte is geen geheim, dus '*' als doel is veilig.

export const HOOGTE_BERICHT = 'ayg-widget-hoogte'

export function useHoogteMelder(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = ref.current
    if (!el || window.parent === window) return
    let vorige = 0
    const meld = () => {
      const hoogte = Math.ceil(el.getBoundingClientRect().height)
      if (hoogte === vorige) return
      vorige = hoogte
      window.parent.postMessage({ type: HOOGTE_BERICHT, hoogte }, '*')
    }
    meld()
    const kijker = new ResizeObserver(meld)
    kijker.observe(el)
    return () => kijker.disconnect()
  }, [ref])
}

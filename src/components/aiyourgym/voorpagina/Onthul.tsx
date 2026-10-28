'use client'

import { useEffect } from 'react'

// Laat de delen van elk hoofdstuk een keer opkomen als het in beeld schuift
// (kop, dan tekst, dan beeld, 70 ms na elkaar; de vertraging staat in voorpagina.css).
// Pas als dit script draait krijgt de pagina data-onthul en verstopt de CSS iets:
// zonder JavaScript, of als het script faalt, staat alles er gewoon. Wat al in beeld
// is bij het laden komt meteen. Met reduced motion doet de CSS niets.

export function Onthul() {
  useEffect(() => {
    const wortel = document.querySelector<HTMLElement>('.vp')
    const delen = Array.from(document.querySelectorAll<HTMLElement>('.vp-onthul'))
    if (!wortel || delen.length === 0 || !('IntersectionObserver' in window)) return
    const kijker = new IntersectionObserver(
      (items) => {
        for (const item of items) {
          if (!item.isIntersecting) continue
          item.target.setAttribute('data-in', '')
          kijker.unobserve(item.target)
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    )
    for (const deel of delen) kijker.observe(deel)
    wortel.setAttribute('data-onthul', '')
    return () => kijker.disconnect()
  }, [])
  return null
}

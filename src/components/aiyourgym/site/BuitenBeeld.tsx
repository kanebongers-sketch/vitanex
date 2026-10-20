'use client'

import { useEffect } from 'react'

// Twee dingen die de website licht houden bij scrollen en hover:
// 1. Doorlopende animaties (oefenbeelden die wisselen, de puls in het systeemplaatje)
//    lopen alleen als ze in beeld zijn. Buiten beeld krijgt het blok data-buiten,
//    waarop de css de animatie pauzeert; een SVG-animatie wordt stilgezet.
// 2. Productbeelden (.ayg-onthul) komen een keer rustig op als ze in beeld scrollen
//    (data-in), in plaats van een animatie die bij elke scrollstap meeloopt.
// Ook blokken die later verschijnen (andere pagina, andere tab) worden gevolgd.

const DOORLOPEND = ['.ayg-cd-speler', '.aygm-beeld', '.aygm-speler', '.ayg-ss-blad', '.ayg-sys-lijnen', '.aan-draai'].join(', ')

function zetBuiten(el: Element, buiten: boolean) {
  if (buiten) el.setAttribute('data-buiten', '')
  else el.removeAttribute('data-buiten')
  if (el instanceof SVGSVGElement) {
    if (buiten) el.pauseAnimations()
    else el.unpauseAnimations()
  }
}

export function BuitenBeeld() {
  useEffect(() => {
    const wortel = document.querySelector('.ayg')
    if (!wortel || typeof IntersectionObserver === 'undefined') return

    const pauze = new IntersectionObserver((items) => items.forEach((i) => zetBuiten(i.target, !i.isIntersecting)), { rootMargin: '200px 0px' })
    const onthul = new IntersectionObserver(
      (items) =>
        items.forEach((i) => {
          if (!i.isIntersecting) return
          i.target.setAttribute('data-in', '')
          onthul.unobserve(i.target)
        }),
      { rootMargin: '0px 0px -8% 0px' },
    )
    const gevolgd = new WeakSet<Element>()
    const volg = () => {
      wortel.querySelectorAll(DOORLOPEND).forEach((el) => {
        if (gevolgd.has(el)) return
        gevolgd.add(el)
        pauze.observe(el)
      })
      wortel.querySelectorAll('.ayg-onthul:not([data-in])').forEach((el) => {
        if (gevolgd.has(el)) return
        gevolgd.add(el)
        onthul.observe(el)
      })
    }
    volg()
    wortel.setAttribute('data-onthul', '')
    const wijziging = new MutationObserver(volg)
    wijziging.observe(wortel, { childList: true, subtree: true })
    return () => {
      pauze.disconnect()
      onthul.disconnect()
      wijziging.disconnect()
      wortel.removeAttribute('data-onthul')
    }
  }, [])
  return null
}

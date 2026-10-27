'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { volgScroll } from '@/components/aiyourgym/site/scrollpositie'
import { demp, heldVoortgang, pointerAs } from './diepte'

// Zet de diepte van de held aan: --hs (hoe ver de held uit beeld is) bij scrollen
// en --px/--py (waar de muis is, -1 tot 1) bij een fijne aanwijzer. De vlakken in
// dag.css rekenen daar elk hun eigen verschuiving mee uit. Geen React-state per
// beeld: alleen CSS-variabelen op het element. Bij minder beweging doet dit niets
// en blijft de gelaagde compositie stil staan. Buiten beeld rust alles.

interface HeldDiepteProps {
  children: ReactNode
  className: string
}

function zet(el: HTMLElement, naam: string, waarde: number) {
  el.style.setProperty(naam, waarde.toFixed(4))
}

export function HeldDiepte({ children, className }: HeldDiepteProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const muisOk = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const stand = { x: 0, y: 0, doelX: 0, doelY: 0, vorige: 0 }
    let muisFrame = 0

    const tik = (t: number) => {
      const dt = stand.vorige ? (t - stand.vorige) / 1000 : 1 / 60
      stand.vorige = t
      stand.x = demp(stand.x, stand.doelX, dt)
      stand.y = demp(stand.y, stand.doelY, dt)
      zet(el, '--px', stand.x)
      zet(el, '--py', stand.y)
      const klaar = Math.abs(stand.x - stand.doelX) < 0.001 && Math.abs(stand.y - stand.doelY) < 0.001
      muisFrame = klaar ? 0 : requestAnimationFrame(tik)
      if (klaar) stand.vorige = 0
    }
    const volg = () => {
      if (!muisFrame) muisFrame = requestAnimationFrame(tik)
    }
    const muis = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const r = el.getBoundingClientRect()
      stand.doelX = pointerAs(e.clientX - r.left, r.width)
      stand.doelY = pointerAs(e.clientY - r.top, r.height)
      volg()
    }
    const weg = () => {
      stand.doelX = 0
      stand.doelY = 0
      volg()
    }
    const meetScroll = () => {
      const r = el.getBoundingClientRect()
      zet(el, '--hs', heldVoortgang(r.top, r.height))
    }

    meetScroll()
    el.setAttribute('data-diepte', '')
    const stopScroll = volgScroll(meetScroll)
    if (muisOk) {
      el.addEventListener('pointermove', muis)
      el.addEventListener('pointerleave', weg)
    }
    return () => {
      stopScroll()
      el.removeEventListener('pointermove', muis)
      el.removeEventListener('pointerleave', weg)
      cancelAnimationFrame(muisFrame)
      el.removeAttribute('data-diepte')
    }
  }, [])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

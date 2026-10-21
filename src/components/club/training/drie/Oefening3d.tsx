'use client'

import { useEffect, useRef, useState } from 'react'
import { oefening3dOpNaam, standTijdVan } from '@/lib/club/training/3d'
import { maakScene3d, type Scene3d, type Thema } from './scene'

// Een oefening als 3D-animatie in een canvas. Alleen in de browser (WebGL);
// laad dit bestand via Oefening3dLazy (dynamic, ssr: false).
// Loopt alleen zolang het beeld in zicht is. Bij prefers-reduced-motion staat
// het beeld stil op de gekozen houding. Het WebGL-doek bestaat alleen als het
// beeld in of vlak bij beeld is: een browser houdt maar ongeveer 16 doeken
// tegelijk vast, en de vergelijkpagina heeft er veel meer.

export type Stand3d = 'begin' | 'eind' | 'speelt'

export interface Oefening3dProps {
  naam: string
  stand: Stand3d
  thema?: Thema
  /** Accentkleur als #rrggbb; standaard de accentkleur van het vlak (--ill-accent). */
  accent?: string
  label: string
}

const STANDAARD_ACCENT = '#B58E5C'
const HEX = /^#[0-9a-f]{6}$/i

function accentVan(el: HTMLElement, gekozen?: string): string {
  if (gekozen && HEX.test(gekozen)) return gekozen
  const css = getComputedStyle(el).getPropertyValue('--ill-accent').trim()
  return HEX.test(css) ? css : STANDAARD_ACCENT
}

function minderBeweging(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function Oefening3d({ naam, stand, thema = 'donker', accent, label }: Oefening3dProps) {
  const vak = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const scene = useRef<Scene3d | null>(null)
  const oefening = oefening3dOpNaam(naam)
  const [dichtbij, setDichtbij] = useState(false)

  useEffect(() => {
    const el = vak.current
    if (!el) return
    const kijker = new IntersectionObserver(([e]) => setDichtbij(e.isIntersecting), { rootMargin: '400px 0px' })
    kijker.observe(el)
    return () => kijker.disconnect()
  }, [])

  useEffect(() => {
    const el = vak.current
    const doek = canvas.current
    if (!el || !doek || !oefening || !dichtbij) return
    let s: Scene3d
    try {
      s = maakScene3d(doek, oefening, { accent: accentVan(el, accent), thema })
    } catch {
      // Geen WebGL (oud apparaat, uitgezet): het vlak toont de melding.
      el.classList.add('club-ill-3d--leeg')
      return
    }
    scene.current = s
    const maat = () => {
      const r = el.getBoundingClientRect()
      if (r.width > 0) s.grootte(r.width, r.height)
    }
    maat()
    const meter = new ResizeObserver(maat)
    meter.observe(el)
    return () => {
      meter.disconnect()
      scene.current = null
      s.ruimOp()
    }
  }, [oefening, thema, accent, dichtbij])

  useEffect(() => {
    const el = vak.current
    const s = scene.current
    if (!el || !s || !oefening || !dichtbij) return
    const stil = stand !== 'speelt' || minderBeweging()
    if (stil) {
      s.teken(standTijdVan(oefening, stand === 'eind' ? 'eind' : 'begin'))
      const opnieuw = new ResizeObserver(() => s.teken(standTijdVan(oefening, stand === 'eind' ? 'eind' : 'begin')))
      opnieuw.observe(el)
      return () => opnieuw.disconnect()
    }
    let frame = 0
    let zichtbaar = false
    let tijd = 0
    let vorige = 0
    const lus = (nu: number) => {
      tijd += Math.min(0.1, (nu - (vorige || nu)) / 1000)
      vorige = nu
      s.teken(tijd)
      frame = requestAnimationFrame(lus)
    }
    const kijker = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !zichtbaar) {
        zichtbaar = true
        vorige = 0
        frame = requestAnimationFrame(lus)
      } else if (!e.isIntersecting && zichtbaar) {
        zichtbaar = false
        cancelAnimationFrame(frame)
      }
    })
    kijker.observe(el)
    return () => {
      kijker.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [oefening, stand, thema, accent, dichtbij])

  const klasse = `club-ill club-ill-3d${thema === 'licht' ? ' club-ill--licht' : ''}${oefening ? '' : ' club-ill-3d--leeg'}`
  return (
    <div ref={vak} className={klasse} role="img" aria-label={label}>
      {dichtbij && <canvas ref={canvas} aria-hidden />}
      <p className="club-ill-3d-melding">3D-beeld is op dit apparaat niet beschikbaar.</p>
    </div>
  )
}

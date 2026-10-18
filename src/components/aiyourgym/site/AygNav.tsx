'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { ArrowRight, ArrowUpRight, Menu, X } from 'lucide-react'
import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'
import { AANMELDEN, DEMO, DEMO_AANVRAGEN, NAV_LINKS, isHuidig } from './paden'

// De links in de kop, met de huidige pagina gemarkeerd, en het menupaneel voor
// de telefoon: over het hele scherm, de pagina eronder staat stil. Het paneel
// sluit bij elke paginawissel, met Escape en als het scherm breed wordt; de
// focus gaat dan terug naar de menuknop.

const BREED = '(min-width: 900px)'

function useMenuPaneel(open: boolean, sluit: () => void) {
  const knop = useRef<HTMLButtonElement>(null)
  const eersteLink = useRef<HTMLAnchorElement>(null)
  const paneel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    // Het paneel begint precies onder de kop (bovenaan de pagina staat de contactbalk erboven).
    const onderKop = knop.current?.closest('.ayg-kop')?.getBoundingClientRect().bottom
    if (onderKop !== undefined) paneel.current?.style.setProperty('--ayg-paneel-top', `${Math.max(0, Math.round(onderKop))}px`)
    const vorige = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    eersteLink.current?.focus()
    const opEscape = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      sluit()
      knop.current?.focus()
    }
    const breed = window.matchMedia(BREED)
    const opBreed = () => breed.matches && sluit()
    window.addEventListener('keydown', opEscape)
    breed.addEventListener('change', opBreed)
    return () => {
      document.body.style.overflow = vorige
      window.removeEventListener('keydown', opEscape)
      breed.removeEventListener('change', opBreed)
    }
  }, [open, sluit])

  return { knop, eersteLink, paneel }
}

export function AygNav() {
  const pad = usePathname()
  const [open, setOpen] = useState(false)
  const [vorigPad, setVorigPad] = useState(pad)
  if (pad !== vorigPad) {
    setVorigPad(pad)
    setOpen(false)
  }
  const sluit = useCallback(() => setOpen(false), [])
  const { knop, eersteLink, paneel } = useMenuPaneel(open, sluit)

  return (
    <>
      <nav className="ayg-nav" aria-label="Hoofdmenu">
        <ul>
          {NAV_LINKS.map((l) => (
            <li key={l.pad}>
              <Link href={l.pad} aria-current={isHuidig(l.pad, pad) ? 'page' : undefined}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="ayg-kop-acties">
        <Link href={DEMO} className="ayg-kop-demo" aria-current={isHuidig(DEMO, pad) ? 'page' : undefined}>
          Live demo
        </Link>
        <Link
          href={DEMO_AANVRAGEN}
          className="ayg-knop ayg-knop--rand ayg-knop--klein"
          aria-current={isHuidig(DEMO_AANVRAGEN, pad) ? 'page' : undefined}
        >
          <span>
            Plan <span className="ayg-kop-lang">een gratis </span>demo
          </span>
        </Link>
        <Link href={AANMELDEN} className="ayg-knop ayg-knop--accent ayg-knop--klein">
          Probeer gratis <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
      <button
        ref={knop}
        type="button"
        className="ayg-menuknop"
        aria-expanded={open}
        aria-controls="ayg-menupaneel"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="ayg-menuknop-icoon" aria-hidden>
          {open ? <X size={18} /> : <Menu size={18} />}
        </span>
        {open ? 'Sluit' : 'Menu'}
      </button>
      <div ref={paneel} id="ayg-menupaneel" className="ayg-menupaneel" data-open={open ? '' : undefined} hidden={!open}>
        <nav aria-label="Menu">
          <ol className="ayg-menupaneel-lijst">
            {NAV_LINKS.map((l, i) => (
              <li key={l.pad} style={{ '--i': i } as CSSProperties}>
                <Link ref={i === 0 ? eersteLink : undefined} href={l.pad} aria-current={isHuidig(l.pad, pad) ? 'page' : undefined}>
                  <span className="ayg-menupaneel-nr" aria-hidden>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="ayg-menupaneel-naam">{l.label}</span>
                  <span className="ayg-menupaneel-uitleg">{l.uitleg}</span>
                  <ArrowUpRight className="ayg-menupaneel-pijl" size={22} aria-hidden />
                </Link>
              </li>
            ))}
          </ol>
        </nav>
        <div className="ayg-menupaneel-onder">
          <Link href={AANMELDEN} className="ayg-knop ayg-knop--accent">
            Probeer {PROEFDAGEN} dagen gratis <ArrowRight size={16} aria-hidden />
          </Link>
          <Link href={DEMO_AANVRAGEN} className="ayg-knop ayg-knop--rand">
            Plan een gratis demo
          </Link>
          <Link href={DEMO} className="ayg-menupaneel-live">
            Of bekijk de live demo <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </div>
    </>
  )
}

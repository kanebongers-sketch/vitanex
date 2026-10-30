'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { ArrowRight, ArrowUpRight, Menu, X } from 'lucide-react'
import { TaalKeuze } from '@/components/aiyourgym/taal/TaalKeuze'
import { useTaal } from '@/lib/aiyourgym/taal/client'
import { KOP } from '@/lib/aiyourgym/taal/woorden/website/kop'
import { isHuidig, navLinks, SITE_PADEN } from './paden'

// De links in de kop, met de huidige pagina gemarkeerd, en het menupaneel voor
// de telefoon: over het hele scherm, de pagina eronder staat stil. Het paneel
// sluit bij elke paginawissel, met Escape en als het scherm breed wordt; de
// focus gaat dan terug naar de menuknop. De taalkeuze (NL | EN) staat naast de
// knoppen en op de telefoon onderaan het paneel.

const BREED = '(min-width: 1024px)'

/** Tab blijft binnen de menuknop en het open paneel: de pagina eronder staat stil en is niet te bereiken. */
function houdFocusInPaneel(e: KeyboardEvent, knop: HTMLButtonElement | null, paneel: HTMLDivElement | null) {
  if (!knop || !paneel) return
  const binnen = [knop, ...paneel.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')]
  const eerste = binnen[0]
  const laatste = binnen[binnen.length - 1]
  const huidig = document.activeElement
  if (!binnen.includes(huidig as HTMLElement)) {
    e.preventDefault()
    eerste.focus()
  } else if (!e.shiftKey && huidig === laatste) {
    e.preventDefault()
    eerste.focus()
  } else if (e.shiftKey && huidig === eerste) {
    e.preventDefault()
    laatste.focus()
  }
}

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
    const opToets = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        sluit()
        knop.current?.focus()
        return
      }
      if (e.key === 'Tab') houdFocusInPaneel(e, knop.current, paneel.current)
    }
    const breed = window.matchMedia(BREED)
    const opBreed = () => breed.matches && sluit()
    window.addEventListener('keydown', opToets)
    breed.addEventListener('change', opBreed)
    return () => {
      document.body.style.overflow = vorige
      window.removeEventListener('keydown', opToets)
      breed.removeEventListener('change', opBreed)
    }
  }, [open, sluit])

  return { knop, eersteLink, paneel }
}

export function AygNav() {
  const taal = useTaal()
  const t = KOP[taal]
  const links = navLinks(taal)
  const { AANMELDEN, DEMO, DEMO_AANVRAGEN } = SITE_PADEN
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
      <nav className="ayg-nav" aria-label={t.hoofdmenu}>
        <ul>
          {links.map((l) => (
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
          {t.liveDemo}
        </Link>
        <Link
          href={DEMO_AANVRAGEN}
          className="ayg-knop ayg-knop--rand ayg-knop--klein"
          aria-current={isHuidig(DEMO_AANVRAGEN, pad) ? 'page' : undefined}
        >
          <span>
            {t.planDemo.voor}
            <span className="ayg-kop-lang">{t.planDemo.lang}</span>
            {t.planDemo.na}
          </span>
        </Link>
        <Link href={AANMELDEN} className="ayg-knop ayg-knop--accent ayg-knop--klein">
          {t.aanmelden} <ArrowRight size={16} aria-hidden />
        </Link>
        <TaalKeuze />
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
        {open ? t.sluit : t.menu}
      </button>
      <div ref={paneel} id="ayg-menupaneel" className="ayg-menupaneel" data-open={open ? '' : undefined} hidden={!open}>
        <nav aria-label={t.menuPaneel}>
          <ol className="ayg-menupaneel-lijst">
            {links.map((l, i) => (
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
            {t.start} <ArrowRight size={16} aria-hidden />
          </Link>
          <Link href={DEMO_AANVRAGEN} className="ayg-knop ayg-knop--rand">
            {t.planDemoVol}
          </Link>
          <Link href={DEMO} className="ayg-menupaneel-live">
            {t.ofLiveDemo} <ArrowRight size={16} aria-hidden />
          </Link>
          <TaalKeuze className="ayg-taalkeuze--paneel" />
        </div>
      </div>
    </>
  )
}

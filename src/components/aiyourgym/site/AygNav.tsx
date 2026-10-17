'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowRight, Menu, X } from 'lucide-react'
import { AANMELDEN, NAV_LINKS, isHuidig } from './paden'

// De links in de kop, met de huidige pagina gemarkeerd, en het menupaneel voor
// de telefoon. Het paneel sluit bij elke paginawissel en met Escape.

export function AygNav() {
  const pad = usePathname()
  const [open, setOpen] = useState(false)
  const [vorigPad, setVorigPad] = useState(pad)
  if (pad !== vorigPad) {
    setVorigPad(pad)
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    const opEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', opEscape)
    return () => window.removeEventListener('keydown', opEscape)
  }, [open])

  const links = NAV_LINKS.map((l) => (
    <li key={l.pad}>
      <Link href={l.pad} aria-current={isHuidig(l.pad, pad) ? 'page' : undefined}>
        {l.label}
      </Link>
    </li>
  ))

  return (
    <>
      <nav className="ayg-nav" aria-label="Hoofdmenu">
        <ul>{links}</ul>
      </nav>
      <div className="ayg-kop-acties">
        <Link href={AANMELDEN} className="ayg-knop ayg-knop--accent ayg-knop--klein">
          Probeer gratis <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
      <button
        type="button"
        className="ayg-menuknop"
        aria-expanded={open}
        aria-controls="ayg-menupaneel"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
        Menu
      </button>
      {open && (
        <nav id="ayg-menupaneel" className="ayg-menupaneel" aria-label="Menu">
          <ul>{links}</ul>
          <Link href={AANMELDEN} className="ayg-knop ayg-knop--accent">
            Probeer gratis <ArrowRight size={16} aria-hidden />
          </Link>
        </nav>
      )}
    </>
  )
}

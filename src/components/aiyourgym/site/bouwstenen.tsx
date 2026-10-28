import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowRight, FileWarning, Plus } from 'lucide-react'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { JURIDISCH } from '@/lib/aiyourgym/taal/woorden/website/juridisch'
import { aygPad } from './paden'

// Kleine gedeelde bouwstenen van de verkoopwebsite: knop, sectiekop,
// paginakop, vragen en de conceptmelding.

interface KnopProps {
  href: string
  children: ReactNode
  soort?: 'accent' | 'inkt' | 'rand'
  pijl?: boolean
}

export function Knop({ href, children, soort = 'inkt', pijl = false }: KnopProps) {
  const klasse = soort === 'inkt' ? 'ayg-knop' : `ayg-knop ayg-knop--${soort}`
  return (
    <Link href={href} className={klasse}>
      {children}
      {pijl && <ArrowRight size={17} aria-hidden />}
    </Link>
  )
}

interface SectieKopProps {
  /** Naam van de sectie: klein en gespatieerd in champagne boven de kop (Obsidian Luxury). */
  label: string
  titel: ReactNode
  tekst?: ReactNode
  /** Kop links, tekst rechts op brede schermen. */
  naast?: boolean
  id?: string
}

export function SectieKop({ label, titel, tekst, naast = false, id }: SectieKopProps) {
  return (
    <div className={naast ? 'ayg-sectiekop ayg-sectiekop--naast' : 'ayg-sectiekop'}>
      <p className="ayg-label">{label}</p>
      <h2 className="ayg-h2" id={id}>
        {titel}
      </h2>
      {tekst && <p className="ayg-lead">{tekst}</p>}
    </div>
  )
}

interface PaginaKopProps {
  label: string
  titel: ReactNode
  tekst: ReactNode
  children?: ReactNode
}

/**
 * De opening van een subpagina (Obsidian Luxury): obsidiaan met een zacht champagne
 * licht, de paginanaam klein in champagne, links de grote kop (de enige h1) en op de
 * tweede kolom de inleiding, zoals de voorpagina.
 */
export function PaginaKop({ label, titel, tekst, children }: PaginaKopProps) {
  return (
    <header className="ayg-paginakop" aria-label={label}>
      <div className="ayg-wrap ayg-paginakop-raster">
        <p className="ayg-label ayg-paginakop-oog">{label}</p>
        <h1 className="ayg-display">{titel}</h1>
        <div className="ayg-paginakop-tekst">
          <p className="ayg-lead">{tekst}</p>
          {children && <div className="ayg-paginakop-extra">{children}</div>}
        </div>
      </div>
    </header>
  )
}

export interface Vraag {
  vraag: string
  antwoord: string
  /** Optioneel: een pad op de website (zonder /aiyourgym) om verder te lezen. */
  link?: { label: string; pad: string }
}

/** Veelgestelde vragen als uitklapbare blokken (werkt zonder JavaScript). */
export function Vragen({ vragen }: { vragen: readonly Vraag[] }) {
  return (
    <div className="ayg-vragen">
      {vragen.map((v) => (
        <details key={v.vraag}>
          <summary>
            {v.vraag}
            <Plus size={20} aria-hidden />
          </summary>
          <p>{v.antwoord}</p>
          {v.link && (
            <Link href={aygPad(v.link.pad)} className="ayg-pijllink ayg-vragen-link">
              {v.link.label} <ArrowRight size={16} aria-hidden />
            </Link>
          )}
        </details>
      ))}
    </div>
  )
}

/** Melding boven de juridische conceptteksten, in de taal van de pagina (de tekst eronder blijft Nederlands). */
export async function Concept() {
  const taal = await getSiteTaal()
  const t = JURIDISCH[taal].concept
  return (
    <p className="ayg-concept" role="note" lang={taal}>
      <FileWarning size={22} aria-hidden className="ayg-concept-icoon" />
      <span>
        <strong>{t.kop}</strong> {t.tekst}
      </span>
    </p>
  )
}

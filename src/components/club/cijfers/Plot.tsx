import type { ReactNode } from 'react'

// Gedeelde bouwstenen voor de grafieken. Het tekenvlak heeft een vaste hoogte
// (CSS) en de SVG staat absoluut in dat vlak met overflow verborgen, dus een
// grafiek kan nooit buiten zijn kaart lopen. De y-as en de x-as zijn gewone
// HTML, zodat tekst nooit wordt uitgerekt. Coordinaten: 0 tot 100 in beide
// richtingen, met een kleine binnenrand zodat de buitenste lijnen niet half wegvallen.

export const H = 100
const RAND = 3

/** Hoogte in het tekenvlak voor een fractie 0 (onder) tot 1 (boven). */
export function yVan(fractie: number): number {
  const f = Math.max(0, Math.min(1, fractie))
  return RAND + (1 - f) * (H - 2 * RAND)
}

export interface Streepje {
  label: string
  /** 0 = onderkant, 1 = bovenkant. */
  fractie: number
}

interface PlotProps {
  id: string
  titel: string
  beschrijving: string
  streepjes: Streepje[]
  /** Kleinere hoogte voor een tweede, ondersteunende grafiek. */
  laag?: boolean
  children: ReactNode
}

export function Plot({ id, titel, beschrijving, streepjes, laag, children }: PlotProps) {
  return (
    <div className={laag ? 'club-cijfers-plot club-cijfers-plot--laag' : 'club-cijfers-plot'}>
      <div className="club-cijfers-yas" aria-hidden>
        {streepjes.map((s) => (
          <span key={`${s.label}-${s.fractie}`} style={{ top: `${yVan(s.fractie)}%` }}>
            {s.label}
          </span>
        ))}
      </div>
      <div className="club-cijfers-doek">
        <svg className="club-cijfers-svg" viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" role="img" aria-labelledby={`${id}-t ${id}-d`}>
          <title id={`${id}-t`}>{titel}</title>
          <desc id={`${id}-d`}>{beschrijving}</desc>
          {streepjes.map((s) => (
            <line key={`r-${s.fractie}`} x1={0} x2={100} y1={yVan(s.fractie)} y2={yVan(s.fractie)} className="club-cijfers-raster" vectorEffect="non-scaling-stroke" />
          ))}
          {children}
        </svg>
      </div>
    </div>
  )
}

/** Labels onder de grafiek, in dezelfde kolommen als de staven. Geteld vanaf de laatste week, zodat die altijd een label heeft en labels nooit botsen. */
export function XAs({ labels, sleutels, labelElke }: { labels: string[]; sleutels: string[]; labelElke: number }) {
  const n = Math.max(labels.length, 1)
  return (
    <div className="club-cijfers-xas" aria-hidden style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
      {labels.map((l, i) => (
        <span key={sleutels[i]}>{(n - 1 - i) % labelElke === 0 ? l : ''}</span>
      ))}
    </div>
  )
}

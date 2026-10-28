import type { ReactNode } from 'react'

// Een blok van het designsysteem: een kop met titel en (rechts, grijs) de
// periode of een link, dan de inhoud. Hierarchie binnen een blok: eerst het
// hoofdcijfer, dan de rest. Oppervlak, randlicht en diepte komen uit de
// tokens in ontwerp.css, zodat elk blok in elke huisstijl hetzelfde voelt.

interface BlokProps {
  id: string
  titel: string
  /** Rechts in de kop: de periode, een telling of een link. */
  extra?: ReactNode
  children: ReactNode
  /** verhoogd: een laag hoger (voor het blok dat de vraag van het scherm beantwoordt). */
  niveau?: 'vlak' | 'kaart' | 'verhoogd'
  className?: string
}

export function Blok({ id, titel, extra, children, niveau = 'kaart', className }: BlokProps) {
  return (
    <section className={`club-blok club-blok--${niveau} ${className ?? ''}`} aria-labelledby={id}>
      <header className="club-blok-kop">
        <h2 id={id}>{titel}</h2>
        {extra ? <div className="club-blok-extra">{extra}</div> : null}
      </header>
      {children}
    </section>
  )
}

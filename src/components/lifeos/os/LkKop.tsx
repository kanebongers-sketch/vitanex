import type { ReactNode } from 'react'

// De koppen van LifeOS in de Fit Factory PT-stijl. Twee vormen:
//   LkHero      de teamfoto met donkere overloop en een grote condensed kop, net
//               als FfHero op het overzicht van de PT-app (alleen het dashboard).
//   LkPaginaKop de kop van een gewone pagina: amber boventitel, grote kop in
//               Barlow-kapitalen, amber streep en een korte uitleg.
// Puur presentatie: geen state, dus ook bruikbaar in Server Components.

/** De hero van het dashboard. `children` levert boventitel + h1 (bv. CockpitKop). */
export function LkHero({ children }: { children: ReactNode }) {
  return (
    <div className="lk-hero">
      <picture>
        <source
          srcSet="/fitfactory/team-800.webp 800w, /fitfactory/team-1257.webp 1257w"
          sizes="100vw"
          type="image/webp"
        />
        {/* Sfeerbeeld: het Fit Factory PT-team. Puur decoratief, dus een lege alt. */}
        <img src="/fitfactory/team-800.jpg" alt="" width={800} height={533} loading="eager" decoding="async" />
      </picture>
      <div className="lk-hero-tekst">{children}</div>
    </div>
  )
}

interface PaginaKopProps {
  titel: string
  intro?: ReactNode
  boventitel?: string
}

/** De kop van een LifeOS-pagina, met precies een h1. */
export function LkPaginaKop({ titel, intro, boventitel = 'LifeOS' }: PaginaKopProps) {
  return (
    <header className="lk-kop">
      <p className="lk-boventitel">{boventitel}</p>
      <h1 className="lk-titel">{titel}</h1>
      {intro ? <p className="lk-intro">{intro}</p> : null}
    </header>
  )
}

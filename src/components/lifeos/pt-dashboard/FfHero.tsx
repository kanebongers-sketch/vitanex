import type { ReactNode } from 'react'

// De teamfoto met donkere overloop en een grote kop — dezelfde opbouw als de
// covers van de Fit Factory PT-documenten (Fit Guide, PT Protocol).

export function FfHero({ boventitel, titel, children }: { boventitel: string; titel: string; children?: ReactNode }) {
  return (
    <section className="ff-hero" aria-label={titel}>
      <picture>
        <source srcSet="/fitfactory/team-800.webp 800w, /fitfactory/team-1257.webp 1257w" sizes="(min-width: 960px) 928px, 100vw" type="image/webp" />
        {/* Sfeerbeeld: het Fit Factory PT-team. Puur decoratief → lege alt. */}
        <img src="/fitfactory/team-800.jpg" alt="" width={800} height={533} loading="eager" decoding="async" />
      </picture>
      <div className="ff-hero-tekst">
        <p className="ff-boventitel">{boventitel}</p>
        <h1>{titel}</h1>
        <hr className="ff-streep" />
        {children}
      </div>
    </section>
  )
}

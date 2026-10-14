import type { ReactNode } from 'react'
import { CsvKnop, type CsvTabel } from './CsvKnop'

// Een blok op de cijferpagina: kop, inhoud, en onderaan altijd in gewone taal
// hoe het cijfer geteld is. Met een CSV-knop voor de tabel erachter.

interface Props {
  id: string
  titel: string
  /** Een korte samenvatting naast de kop (bv. "piek: di 19:00"). */
  kern?: ReactNode
  definitie: string
  csv?: CsvTabel
  children: ReactNode
  className?: string
}

export function CijferBlok({ id, titel, kern, definitie, csv, children, className }: Props) {
  return (
    <section className={`club-kaart club-cijfers-blok ${className ?? ''}`} aria-labelledby={id}>
      <header className="club-cijfers-blokkop">
        <h3 id={id}>{titel}</h3>
        {kern && <p className="club-cijfers-kern">{kern}</p>}
      </header>
      {children}
      <footer className="club-cijfers-blokvoet">
        <p className="club-cijfers-definitie">{definitie}</p>
        {csv && <CsvKnop tabel={csv} label={titel} />}
      </footer>
    </section>
  )
}

/** Een hoofdstukkop op de pagina ("Leden", "Bezoek", ...). */
export function Hoofdstuk({ nummer, titel, children }: { nummer: string; titel: string; children: ReactNode }) {
  const id = `hoofdstuk-${nummer}`
  return (
    <section className="club-cijfers-hoofdstuk" aria-labelledby={id}>
      <h2 id={id} className="club-cijfers-hoofdstukkop">
        <span aria-hidden>{nummer}</span>
        {titel}
      </h2>
      <div className="club-raster">{children}</div>
    </section>
  )
}

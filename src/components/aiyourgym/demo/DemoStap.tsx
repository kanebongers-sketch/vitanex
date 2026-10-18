import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { AANMELDEN } from '@/components/aiyourgym/site/paden'

// Een stap van de rondleiding: uitleg links, het echte scherm rechts (of om
// en om), met de oproep om een eigen proefperiode te starten.

export interface DemoStapInfo {
  sleutel: string
  label: string
  titel: string
  uitleg: string
  punten: readonly string[]
}

interface Props {
  stap: DemoStapInfo
  nr: number
  /** De beschrijving van het scherm voor schermlezers. */
  beeldLabel: string
  /** CSS-variabelen van de huisstijl van de demo-sportschool. */
  huisstijl: CSSProperties
  donker?: boolean
  children: ReactNode
}

export function DemoStap({ stap, nr, beeldLabel, huisstijl, donker = false, children }: Props) {
  return (
    <section id={stap.sleutel} className={donker ? 'ayg-sectie ayg-podium aygd-stap' : 'ayg-sectie aygd-stap'} aria-labelledby={`${stap.sleutel}-titel`}>
      <div className="ayg-wrap aygd-stap-raster" data-om={nr % 2 === 0 ? '' : undefined}>
        <div className="aygd-stap-tekst">
          <p className="aygd-stap-nr" aria-hidden>
            {String(nr).padStart(2, '0')}
          </p>
          <p className="ayg-label ayg-label--accent">{stap.label}</p>
          <h2 className="ayg-h2" id={`${stap.sleutel}-titel`}>
            {stap.titel}
          </h2>
          <p className="ayg-lead">{stap.uitleg}</p>
          <ul className="ayg-vinklijst">
            {stap.punten.map((p) => (
              <li key={p}>
                <Check size={16} aria-hidden />
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <p>
            <Link href={AANMELDEN} className="ayg-pijllink">
              Start je eigen proefperiode <ArrowRight size={16} aria-hidden />
            </Link>
          </p>
        </div>
        <figure className="aygm-figuur aygd-beeld ayg-onthul">
          <div role="img" aria-label={beeldLabel} className="aygm" style={huisstijl}>
            {children}
          </div>
          <figcaption className="aygm-bijschrift">
            <span>Echt scherm van de Voorbeeld Gym, met voorbeeldgegevens</span>
          </figcaption>
        </figure>
      </div>
    </section>
  )
}

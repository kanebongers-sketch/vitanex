import type { ReactNode } from 'react'
import { FfLogo } from '@/components/lifeos/pt-dashboard/FfLogo'

// Het vlak van de inlogpagina's van de ledenapp: merk, kop, uitleg, formulier.

interface Props {
  merkNaam: string
  fitFactory: boolean
  boven: string
  kop: string
  uitleg: ReactNode
  children?: ReactNode
}

export function InlogKaart({ merkNaam, fitFactory, boven, kop, uitleg, children }: Props) {
  return (
    <main className="club-mijn-inlog">
      <div className="club-mijn-merk">{fitFactory ? <FfLogo /> : <span>{merkNaam}</span>}</div>
      <section className="club-mijn-inlog-kaart" aria-labelledby="mijn-inlog-kop">
        <p className="club-mijn-inlog-boven">{boven}</p>
        <h1 id="mijn-inlog-kop">{kop}</h1>
        <p>{uitleg}</p>
        {children}
      </section>
    </main>
  )
}

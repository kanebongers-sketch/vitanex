import type { CSSProperties } from 'react'
import { CalendarDays, Dumbbell, Home, QrCode, User } from 'lucide-react'
import { HEX, huisstijlVariabelen, type Thema } from '@/lib/club/kern/huisstijl'

// Een levend voorbeeld van de ledenapp op een telefoon, met precies dezelfde
// CSS-variabelen als de echte app. Elke wijziging in logo, kleur of thema is
// meteen te zien. Alles erin is voorbeeldtekst.

interface LedenappVoorbeeldProps {
  naam: string
  kleur: string
  thema: Thema
  /** Het logo (adres of tijdelijke voorvertoning), of null: dan de naam als woordmerk. */
  logo: string | null
  /** De les in het voorbeeld: het eerste lestype van de sportschool, of een die bij de soort past. */
  les?: string
}

export function LedenappVoorbeeld({ naam, kleur, thema, logo, les = 'Groepsles' }: LedenappVoorbeeldProps) {
  const stijl: CSSProperties = huisstijlVariabelen(HEX.test(kleur) ? kleur : '#B58E5C', thema) as CSSProperties
  return (
    <figure className="club-start-telefoon-wrap" aria-label="Voorbeeld van de ledenapp">
      <div className="club-start-telefoon" style={stijl}>
        <div className="club-start-tel-scherm">
          <div className="club-start-tel-balk">
            {logo ? <img src={logo} alt="" className="club-start-tel-logo" /> : <span className="club-start-tel-woordmerk">{naam || 'Je sportschool'}</span>}
          </div>
          <p className="club-start-tel-groet">Hoi Sanne</p>
          <p className="club-start-tel-sub">Fijn dat je er bent. Dit staat er vandaag voor je klaar.</p>
          <span className="club-start-tel-qr">
            <QrCode aria-hidden size={18} /> Inchecken
          </span>
          <div className="club-start-tel-kaart">
            <span className="club-start-tel-label">Volgende les</span>
            <strong>{les}</strong>
            <span className="club-start-tel-meta">Vandaag 19:00 · nog 6 plekken</span>
            <span className="club-start-tel-knop">Reserveren</span>
          </div>
          <div className="club-start-tel-kaart club-start-tel-kaart--rij">
            <Dumbbell aria-hidden size={18} />
            <span>
              <strong>Schema A</strong>
              <span className="club-start-tel-meta">6 oefeningen</span>
            </span>
          </div>
          <nav className="club-start-tel-tabs" aria-hidden>
            <span data-actief>
              <Home size={16} />
              Home
            </span>
            <span>
              <CalendarDays size={16} />
              Lessen
            </span>
            <span>
              <Dumbbell size={16} />
              Schema
            </span>
            <span>
              <User size={16} />
              Profiel
            </span>
          </nav>
        </div>
      </div>
      <figcaption className="club-hint">Zo ziet een lid de app op de telefoon.</figcaption>
    </figure>
  )
}

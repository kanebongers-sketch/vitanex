'use client'

import type { CSSProperties } from 'react'
import { CalendarDays, Dumbbell, Home, QrCode, User } from 'lucide-react'
import { HEX, huisstijlVariabelen, type HuisstijlExtra, type Thema } from '@/lib/club/kern/huisstijl'
import { NEUTRALE_LES } from '@/lib/club/start/soorten'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { START } from '@/lib/aiyourgym/taal/woorden/club/start'

// Een levend voorbeeld van de ledenapp op een telefoon, met precies dezelfde
// CSS-variabelen als de echte app. Elke wijziging in logo, kleur of thema is
// meteen te zien. Alles erin is voorbeeldtekst.

interface LedenappVoorbeeldProps {
  naam: string
  kleur: string
  thema: Thema
  /** Tweede kleur, achtergrondtint en thema (ongeldige kleuren tellen niet). */
  extra?: HuisstijlExtra
  /** Het logo (adres of tijdelijke voorvertoning), of null: dan de naam als woordmerk. */
  logo: string | null
  /** De les in het voorbeeld: het eerste lestype van de sportschool, of een die bij de soort past. */
  les?: string
}

export function LedenappVoorbeeld({ naam, kleur, thema, extra, logo, les }: LedenappVoorbeeldProps) {
  const t = useTekst(START).voorbeeldApp
  // Zonder eigen lestype de neutrale les in de taal van de pagina; een echt lestype blijft zijn eigen naam.
  const lesNaam = !les || les === NEUTRALE_LES ? t.neutraleLes : les
  const stijl: CSSProperties = huisstijlVariabelen(HEX.test(kleur) ? kleur : '#B58E5C', thema, {
    tweede: extra?.tweede && HEX.test(extra.tweede) ? extra.tweede : null,
    tint: extra?.tint && HEX.test(extra.tint) ? extra.tint : null,
    variant: extra?.variant ?? null,
  }) as CSSProperties
  return (
    <figure className="club-start-telefoon-wrap" aria-label={t.label}>
      <div className="club-start-telefoon" style={stijl}>
        <div className="club-start-tel-scherm">
          <div className="club-start-tel-balk">
            {logo ? <img src={logo} alt="" className="club-start-tel-logo" /> : <span className="club-start-tel-woordmerk">{naam || t.jeSportschool}</span>}
          </div>
          <p className="club-start-tel-groet">{t.groet}</p>
          <p className="club-start-tel-sub">{t.sub}</p>
          <span className="club-start-tel-qr">
            <QrCode aria-hidden size={18} /> {t.inchecken}
          </span>
          <div className="club-start-tel-kaart">
            <span className="club-start-tel-label">{t.volgendeLes}</span>
            <strong>{lesNaam}</strong>
            <span className="club-start-tel-meta">{t.meta}</span>
            <span className="club-start-tel-knop">{t.reserveren}</span>
          </div>
          <div className="club-start-tel-kaart club-start-tel-kaart--rij">
            <Dumbbell aria-hidden size={18} />
            <span>
              <strong>{t.schema}</strong>
              <span className="club-start-tel-meta">{t.oefeningen}</span>
            </span>
          </div>
          <nav className="club-start-tel-tabs" aria-hidden>
            <span data-actief>
              <Home size={16} />
              {t.tabs.home}
            </span>
            <span>
              <CalendarDays size={16} />
              {t.tabs.lessen}
            </span>
            <span>
              <Dumbbell size={16} />
              {t.tabs.schema}
            </span>
            <span>
              <User size={16} />
              {t.tabs.profiel}
            </span>
          </nav>
        </div>
      </div>
      <figcaption className="club-hint">{t.bijschrift}</figcaption>
    </figure>
  )
}

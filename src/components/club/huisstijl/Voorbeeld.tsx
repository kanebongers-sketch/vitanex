'use client'

import type { CSSProperties } from 'react'
import { Dumbbell, QrCode } from 'lucide-react'
import { FitFactoryLogo } from '@/components/club/shell/FitFactoryLogo'
import { HEX, huisstijlVariabelen } from '@/lib/club/kern/huisstijl'
import type { HuisstijlWaarden } from './HuisstijlPortaal'

// Een levend voorbeeld van de huisstijl: de balk van Club en het begin van de
// ledenapp, met precies dezelfde CSS-variabelen als de echte app.

interface VoorbeeldProps {
  waarden: HuisstijlWaarden
  logoUrl: string | null
  ingebouwdLogo: boolean
}

function Merk({ waarden, logoUrl, ingebouwdLogo }: VoorbeeldProps) {
  if (ingebouwdLogo) return <FitFactoryLogo />
  if (logoUrl) return <img src={logoUrl} alt="" className="club-merk-logo" />
  return <span className="club-merk-naam">{waarden.naam || 'Je sportschool'}</span>
}

export function Voorbeeld(props: VoorbeeldProps) {
  const { waarden } = props
  const stijl = huisstijlVariabelen(HEX.test(waarden.kleurAccent) ? waarden.kleurAccent : '#B58E5C', waarden.thema) as CSSProperties
  return (
    <aside className="club-huisstijl-voorbeeld" style={stijl} aria-label="Voorbeeld van de huisstijl">
      <p className="club-huisstijl-voorbeeldlabel">Voorbeeld</p>
      <div className="club-huisstijl-vb-balk">
        <span className="club-merk">
          <Merk {...props} />
          <span className="club-merk-woord">CLUB</span>
        </span>
        <span className="club-huisstijl-vb-groep" aria-hidden>Leden</span>
      </div>
      <div className="club-huisstijl-vb-inhoud">
        <p className="club-boventitel">Vandaag</p>
        <p className="club-huisstijl-vb-kop">Goedemorgen</p>
        <div className="club-huisstijl-vb-tegels">
          <span><strong className="club-getal">128</strong> check-ins</span>
          <span><strong className="club-getal">14</strong> lessen</span>
        </div>
        <div className="club-acties">
          <span className="club-knop club-knop--primair">Lid inchecken</span>
          <span className="club-chip club-chip--ok">Actief</span>
        </div>
      </div>
      <div className="club-huisstijl-vb-app">
        <div className="club-huisstijl-vb-telefoon">
          <p className="club-huisstijl-vb-groet">Hoi Sanne</p>
          {waarden.slogan && <p className="club-huisstijl-vb-slogan">{waarden.slogan}</p>}
          <span className="club-huisstijl-vb-qr"><QrCode aria-hidden size={22} /> Check-in code</span>
          <span className="club-huisstijl-vb-schema"><Dumbbell aria-hidden size={16} /> Schema A · 6 oefeningen</span>
        </div>
      </div>
    </aside>
  )
}

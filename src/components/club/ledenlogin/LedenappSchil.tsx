import type { CSSProperties, ReactNode } from 'react'
import { huisstijlVariabelen } from '@/lib/club/kern/huisstijl'
import type { Organisatie } from '@/lib/club/kern/organisatie'
import '@/app/(aiyourgym)/(club)/club/club.css'
import '@/components/club/ontwerp/ontwerp.css'
import '@/components/club/app/app.css'
import './ledenapp.css'

// De buitenste laag van /mijn: de huisstijl van de sportschool (kleuren met
// contrastcorrectie, thema) als CSS-variabelen, schermvullend.

interface Props {
  organisatie: Pick<Organisatie, 'kleurAccent' | 'thema'>
  children: ReactNode
}

export function LedenappSchil({ organisatie, children }: Props) {
  const stijl = huisstijlVariabelen(organisatie.kleurAccent, organisatie.thema) as CSSProperties
  return (
    <div className="club-app club-mijn" style={stijl} data-thema={organisatie.thema}>
      {children}
    </div>
  )
}

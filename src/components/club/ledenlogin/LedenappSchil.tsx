import type { CSSProperties, ReactNode } from 'react'
import { huisstijlVariabelen } from '@/lib/club/kern/huisstijl'
import type { Organisatie } from '@/lib/club/kern/organisatie'
import { HuisstijlAuto, autoAttribuut } from '@/components/club/shell/HuisstijlAuto'
import '@/app/(aiyourgym)/(club)/club/club.css'
import '@/components/club/ontwerp/ontwerp.css'
import '@/components/club/app/app.css'
import './ledenapp.css'

// De buitenste laag van /mijn: de huisstijl van de sportschool (kleuren met
// contrastcorrectie, thema) als CSS-variabelen, schermvullend.

interface Props {
  organisatie: Pick<Organisatie, 'kleurAccent' | 'thema'> & Partial<Pick<Organisatie, 'kleurTweede' | 'kleurTint' | 'variant'>>
  children: ReactNode
}

export function LedenappSchil({ organisatie, children }: Props) {
  const extra = { kleurTweede: organisatie.kleurTweede ?? null, kleurTint: organisatie.kleurTint ?? null, variant: organisatie.variant ?? organisatie.thema }
  const stijl = huisstijlVariabelen(organisatie.kleurAccent, organisatie.thema, { tweede: extra.kleurTweede, tint: extra.kleurTint, variant: extra.variant }) as CSSProperties
  return (
    <div className="club-app club-mijn" style={stijl} data-thema={organisatie.thema} {...autoAttribuut(extra)}>
      <HuisstijlAuto org={{ kleurAccent: organisatie.kleurAccent, ...extra }} />
      {children}
    </div>
  )
}

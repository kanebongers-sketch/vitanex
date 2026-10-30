import { huisstijlAutoCss } from '@/lib/club/kern/huisstijl'
import { huisstijlExtra, type Organisatie } from '@/lib/club/kern/organisatie'
import { AutoThema } from './AutoThema'

// Alleen voor het thema Automatisch: de lichte kleuren als het apparaat op
// licht staat. Zet op de wortel van het scherm ook autoAttribuut(org).
// De CSS komt uit onze eigen berekening (hex en rgba), nooit tekst van buiten.

export function HuisstijlAuto({ org }: { org: Pick<Organisatie, 'kleurAccent' | 'kleurTweede' | 'kleurTint' | 'variant'> }) {
  if (org.variant !== 'auto') return null
  return (
    <>
      <style>{huisstijlAutoCss(org.kleurAccent, huisstijlExtra(org))}</style>
      <AutoThema />
    </>
  )
}

/** Het attribuut voor de wortel: alleen bij Automatisch. */
export function autoAttribuut(org: Pick<Organisatie, 'variant'>): Record<string, string> {
  return org.variant === 'auto' ? { 'data-huisstijl-auto': '' } : {}
}

import type { CSSProperties } from 'react'
import { FIGUUR_PAD, LOGO_BREEDTE, LOGO_HOOGTE, MERK_KLEUR, TEGEL_PAD, WOORD_BREEDTE, WOORD_KAP, WOORD_ONDER, WOORD_PAD, WOORD_TRANSFORM } from './merk-paden'

// Het logo van AI Your Gym (merkgids: docs/aiyourgym/brand/). Beeldmerk: een
// figuur met de armen omhoog die ook een Y (Your) vormt, in een zachte tegel.
// Woordmerk: Bricolage Grotesque als paden, dus overal gelijk, ook zonder letters.
//
// Kleuren: de tegel en de figuur lezen --ayg-logo-vlak en --ayg-logo-figuur
// (gezet in aiyourgym.css: inkt met smaragd op licht, omgedraaid op donker en in
// de voet). Zonder die css de vaste merkkleuren. Het woord volgt currentColor.

export type AygLogoVorm = 'logo' | 'beeldmerk' | 'woordmerk'

interface Props {
  /** Liggend logo (standaard), alleen het beeldmerk, of alleen het woordmerk. */
  vorm?: AygLogoVorm
  /** Altijd de donkere versie (smaragd tegel), los van het kleurenschema. */
  opDonker?: boolean
  /** Puur sier naast zichtbare tekst: verborgen voor schermlezers. */
  sier?: boolean
  className?: string
}

const DONKER = {
  '--ayg-logo-vlak': `var(--ayg-logo-smaragd, ${MERK_KLEUR.smaragd})`,
  '--ayg-logo-figuur': `var(--ayg-logo-inkt, ${MERK_KLEUR.inkt})`,
} as CSSProperties

const VLAK = `var(--ayg-logo-vlak, ${MERK_KLEUR.inkt})`
const FIGUUR = `var(--ayg-logo-figuur, ${MERK_KLEUR.smaragd})`

function Tegel() {
  return (
    <>
      <path d={TEGEL_PAD} fill={VLAK} />
      <path d={FIGUUR_PAD} fill={FIGUUR} />
    </>
  )
}

const VIEWBOX: Record<AygLogoVorm, string> = {
  logo: `0 0 ${LOGO_BREEDTE} ${LOGO_HOOGTE}`,
  beeldmerk: '0 0 32 32',
  woordmerk: `0 0 ${WOORD_BREEDTE} ${Math.ceil(WOORD_KAP * WOORD_ONDER)}`,
}

export function AygLogo({ vorm = 'logo', opDonker = false, sier = false, className }: Props) {
  const toegankelijk = sier ? { 'aria-hidden': true } : { role: 'img', 'aria-label': 'AI Your Gym' }
  return (
    <svg
      viewBox={VIEWBOX[vorm]}
      className={['ayg-logo', className].filter(Boolean).join(' ')}
      data-vorm={vorm}
      style={opDonker ? DONKER : undefined}
      focusable="false"
      {...toegankelijk}
    >
      {vorm !== 'woordmerk' && <Tegel />}
      {vorm === 'logo' && <path d={WOORD_PAD} transform={WOORD_TRANSFORM} fill="currentColor" />}
      {vorm === 'woordmerk' && <path d={WOORD_PAD} fill="currentColor" />}
    </svg>
  )
}

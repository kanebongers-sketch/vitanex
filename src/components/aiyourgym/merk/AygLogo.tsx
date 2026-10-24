import type { CSSProperties } from 'react'
import { EMBLEEM_KRUIS_LIJN, EMBLEEM_LETTER_PAD, EMBLEEM_RASTER_PAD, EMBLEEM_Y_PAD, LOGO_BREEDTE, LOGO_HOOGTE, MERK_KLEUR, WOORD_BREEDTE, WOORD_HOOGTE, WOORD_PAD, WOORD_TRANSFORM } from './merk-paden'

// Het logo van AI Your Gym (merkgids: docs/aiyourgym/brand/). Beeldmerk: het
// embleem, een plaat in vier vakken met A I boven Y G, het vak van de Y gevuld.
// Woordmerk: Big Shoulders Bold als paden, dus overal gelijk, ook zonder letters.
//
// Het embleem is altijd tweekleurig: --ayg-logo-plaat (plaat en Y) en
// --ayg-logo-teken (kruis, vak Y en de letters A, I, G). Zonder die css de vaste
// merkkleuren: racegroen met creme op een licht kleurenschema, creme met racegroen
// op een donker kleurenschema (light-dark volgt color-scheme van de site). Het
// woord volgt currentColor.
//
// Scherp op elk scherm (ook 1,5x en retina): plaat, kruis en vak Y zonder
// anti-aliasing (crispEdges), zodat hun randen op hele pixels vallen en er geen
// grijze haarlijnen of naden zijn. Het kruis krijgt een ondergrens van 1
// schermpixel (non-scaling-stroke), anders valt het klein in de kop weg. De
// letters houden hun gladde randen.

export type AygLogoVorm = 'logo' | 'beeldmerk' | 'woordmerk'

interface Props {
  /** Liggend logo (standaard), alleen het beeldmerk, of alleen het woordmerk. */
  vorm?: AygLogoVorm
  /** Altijd de versie voor een donkere ondergrond (creme plaat), los van het kleurenschema. */
  opDonker?: boolean
  /** Puur sier naast zichtbare tekst: verborgen voor schermlezers. */
  sier?: boolean
  className?: string
}

const DONKER = {
  '--ayg-logo-plaat': MERK_KLEUR.creme,
  '--ayg-logo-teken': MERK_KLEUR.racegroen,
} as CSSProperties

const PLAAT = `var(--ayg-logo-plaat, light-dark(${MERK_KLEUR.racegroen}, ${MERK_KLEUR.creme}))`
const TEKEN = `var(--ayg-logo-teken, light-dark(${MERK_KLEUR.creme}, ${MERK_KLEUR.racegroen}))`

function Embleem() {
  return (
    <>
      <rect width="100" height="100" fill={PLAAT} shapeRendering="crispEdges" />
      <path d={EMBLEEM_RASTER_PAD} fill={TEKEN} shapeRendering="crispEdges" />
      <path d={EMBLEEM_KRUIS_LIJN} fill="none" stroke={TEKEN} strokeWidth={1} vectorEffect="non-scaling-stroke" shapeRendering="crispEdges" />
      <path d={EMBLEEM_LETTER_PAD} fill={TEKEN} />
      <path d={EMBLEEM_Y_PAD} fill={PLAAT} />
    </>
  )
}

const VIEWBOX: Record<AygLogoVorm, string> = {
  logo: `0 0 ${LOGO_BREEDTE} ${LOGO_HOOGTE}`,
  beeldmerk: '0 0 100 100',
  woordmerk: `0 0 ${WOORD_BREEDTE} ${WOORD_HOOGTE}`,
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
      {vorm !== 'woordmerk' && <Embleem />}
      {vorm === 'logo' && <path d={WOORD_PAD} transform={WOORD_TRANSFORM} fill="currentColor" />}
      {vorm === 'woordmerk' && <path d={WOORD_PAD} fill="currentColor" />}
    </svg>
  )
}

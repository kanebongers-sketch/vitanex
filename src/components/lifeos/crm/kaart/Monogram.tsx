import type { CSSProperties } from 'react'
import { initialen } from '@/lib/lifeos/crm/monogram'

// De avatar-cel op een persoon-kaart: de initialen van de naam in één rustige,
// uniforme cyan-op-navy behandeling. Bewust GÉÉN kleur-per-persoon — dat zou de
// strikt twee-tonige regel breken. Puur presentational, geen state.
//
// `aria-hidden`: de initialen zijn een decoratieve verkorting van de naam, die
// altijd als leesbare knop pal ernaast staat. Een screenreader hoort dus de
// echte naam, niet "K B".

interface MonogramProps {
  naam: string
  /** Zijde in px (het is een vierkante cel). Standaard 40. */
  size?: number
}

// React 19 de-dupliceert en hijst een <style> met dezelfde `href`, dus ook al
// rendert deze cel tientallen keren op het bord, de regels staan één keer in de
// <head>. Zo blijft de stijl co-located zonder de DOM te vervuilen.
const CSS = `
.crm-kaart__monogram {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: var(--crm-kaart-mono, 40px);
  height: var(--crm-kaart-mono, 40px);
  border-radius: calc(var(--crm-kaart-mono, 40px) * 0.3);
  background: var(--brand-soft);
  border: 1px solid color-mix(in srgb, var(--brand) 30%, transparent);
  color: var(--brand);
  font-size: calc(var(--crm-kaart-mono, 40px) * 0.36);
  font-weight: 600;
  letter-spacing: 0.01em;
  line-height: 1;
  user-select: none;
}
`

export function Monogram({ naam, size = 40 }: MonogramProps) {
  // De zijde als CSS-variabele: zo leidt de CSS er zelf border-radius en
  // font-size uit af, i.p.v. drie losse inline-waarden.
  const stijl = { '--crm-kaart-mono': `${size}px` } as CSSProperties

  return (
    <>
      <style href="crm-kaart-monogram" precedence="medium">
        {CSS}
      </style>
      <span className="crm-kaart__monogram" style={stijl} aria-hidden="true">
        {initialen(naam)}
      </span>
    </>
  )
}

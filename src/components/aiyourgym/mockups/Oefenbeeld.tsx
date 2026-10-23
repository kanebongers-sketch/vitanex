'use client'

import type { Stand3d } from '@/components/club/training/drie/Oefening3d'
import { renderVoor } from '@/components/aiyourgym/inhoud/oefenrenders'
import { Oefenbeeld3d } from './Oefenbeeld3d'
import { OefenLus } from './OefenLus'

// Het oefenbeeld van de website: onze eigen Blender-render als die er is
// (besluit Kane 23-10-2026), anders het 3D-figuur in de browser. Zo komt elke
// nieuwe render vanzelf op alle plekken waar die oefening staat.

interface OefenbeeldProps {
  /** Naam exact zoals in de oefenbibliotheek. */
  naam: string
  label: string
  stand?: Stand3d
  className?: string
  /** Alleen voor het 3D-figuur: hoofd tot voeten altijd in beeld. */
  passend?: boolean
  /** Breedte op de pagina, voor de keuze tussen de kleine en de grote lus. */
  sizes?: string
  /** Pauzeknop bij de render. */
  bediening?: boolean
}

export function Oefenbeeld({ naam, label, stand = 'speelt', className, passend, sizes, bediening }: OefenbeeldProps) {
  const render = renderVoor(naam)
  if (render) {
    return <OefenLus render={render} label={label} stand={stand} className={className} sizes={sizes} bediening={bediening} />
  }
  return <Oefenbeeld3d naam={naam} label={label} stand={stand} className={className} passend={passend} />
}

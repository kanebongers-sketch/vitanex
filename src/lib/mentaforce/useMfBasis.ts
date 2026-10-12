'use client'

import { useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { basisVanPad, metBasis, zonderBasis } from './basis'

// Hooks voor MentaForce onder releasev.nl/mentaforce (zie ./basis.ts).
// usePathname() geeft daar het zichtbare adres ("/mentaforce/dashboard"); deze
// hooks halen de basis eraf of zetten hem ervoor. Op elk ander domein staat er
// geen basis in het pad en geven ze precies hetzelfde terug als zonder hook.

/** De basis waaronder MentaForce nu draait: "/mentaforce" of "". */
export function useMfBasis(): string {
  return basisVanPad(usePathname() ?? '')
}

/** Het MentaForce-pad zonder basis ("/dashboard"), voor vergelijkingen in menu's. */
export function useMfPathname(): string {
  return zonderBasis(usePathname() ?? '')
}

/** Zet een intern pad ("/contact", "/#brein", "/api/contact") om naar de link voor de browser. */
export function useMfHref(): (pad: string) => string {
  const basis = useMfBasis()
  return useCallback((pad: string) => metBasis(pad, basis), [basis])
}

'use client'

// Taalset (vertalen + landinstelling) voor client-componenten, zodat pure
// gezondheidsfuncties dezelfde taal krijgen als de rest van het scherm.

import { useMemo } from 'react'
import { useVertaling } from '@/lib/i18n/TaalProvider'
import { INTL_LOCALE } from '@/lib/i18n/talen'
import type { Taalset } from '@/lib/i18n/taalset'

export function useTaalset(): Taalset {
  const { t, taal } = useVertaling()
  return useMemo(() => ({ taal, locale: INTL_LOCALE[taal], t }), [t, taal])
}

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Houdt "Nu binnen" actueel als er aan een andere balie (of via de app) wordt
// ingecheckt: elke minuut de servergegevens opnieuw, alleen als het scherm zichtbaar is.

export function Verversen({ seconden = 60 }: { seconden?: number }) {
  const router = useRouter()
  useEffect(() => {
    const klok = window.setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh()
    }, seconden * 1000)
    return () => window.clearInterval(klok)
  }, [router, seconden])
  return null
}

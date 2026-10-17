'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// Terwijl de sportschool wordt ingericht: elke paar seconden opnieuw kijken,
// hooguit een minuut. Daarna een knop, zodat de pagina niet eindeloos blijft vragen.

const ELKE_MS = 4_000
const MAX_KEER = 15

export function Ververs() {
  const router = useRouter()
  const [keer, setKeer] = useState(0)
  useEffect(() => {
    if (keer >= MAX_KEER) return
    const t = window.setTimeout(() => {
      router.refresh()
      setKeer((k) => k + 1)
    }, ELKE_MS)
    return () => window.clearTimeout(t)
  }, [keer, router])
  if (keer < MAX_KEER) return null
  return (
    <button type="button" className="ayg-knop ayg-knop--rand" onClick={() => setKeer(0)}>
      Opnieuw kijken
    </button>
  )
}

'use client'

export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// "Vandaag" en "Home" waren twee aparte hubs. /home is de canonieke hub
// (rijker dashboard, onboarding-gate, landingspagina na login). Deze route
// blijft bestaan als redirect zodat oude links en opgeslagen-flows blijven werken.
export default function VandaagRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/home')
  }, [router])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)' }}>
      <div className="mf-spinner" />
    </div>
  )
}

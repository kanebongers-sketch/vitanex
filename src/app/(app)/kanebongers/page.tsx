'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
import { authFetch } from '@/lib/auth/auth-fetch'
import Navbar from '@/components/layout/Navbar'
import { CockpitKop } from '@/components/lifeos/cockpit/CockpitKop'
import { Cockpit } from '@/components/lifeos/cockpit/Cockpit'
import { KoppelFeedback } from '@/components/lifeos/KoppelFeedback'

// Kane's persoonlijke werk-OS (de founder-cockpit), losgeknipt van de publieke
// consumenten-app. Verborgen achter de founder-gate (dezelfde als /api/lifeos):
// een niet-founder valt fail-safe terug naar /home. Zie project_consumer_shell.

export default function KanebongersPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'laden' | 'ok' | 'geen'>('laden')

  useEffect(() => {
    let actief = true
    void supabase.auth.getUser().then(({ data }) => {
      if (!actief) return
      if (!data.user) { router.push('/login'); return }
      return authFetch('/api/lifeos/toegang')
        .then((poort) => { if (actief) setStatus(poort.ok ? 'ok' : 'geen') })
        .catch(() => { if (actief) setStatus('geen') })
    })
    return () => { actief = false }
  }, [router])

  useEffect(() => {
    if (status === 'geen') router.replace('/home')
  }, [status, router])

  if (status !== 'ok') {
    return <main className="mf-home" aria-busy="true" aria-label="Laden" style={{ minHeight: '100vh' }} />
  }

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      <div className="lifeos-root">
        <div className="os-sfeer" aria-hidden="true" />
        <main className="os-schil os-schil--breed">
          <KoppelFeedback />
          <CockpitKop />
          <Cockpit />
        </main>
      </div>
    </div>
  )
}

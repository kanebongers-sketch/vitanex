'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
import { authFetch } from '@/lib/auth/auth-fetch'
import Navbar from '@/components/layout/Navbar'
import { BlokKaart } from '@/components/lifeos/blok/BlokKaart'
import { ProgrammaKaart } from '@/components/lifeos/programma/ProgrammaKaart'

// Training & voeding — losgeknipt van het hoofd-dashboard. Kane's "training van
// vandaag" (het interactieve 4-weken-blok) en zijn programma-/voedingsschema
// stonden in de cockpit, maar verdrongen daar het werk-, taken- en agenda-beeld.
// Nu wonen ze op hun eigen pagina met een eigen sidebar-link, zodat het dashboard
// rustig blijft én de training niet verdwijnt.
//
// Zelfde founder-gate en shell als /kanebongers: een niet-founder valt fail-safe
// terug naar /home. De echte gate zit server-side (elke /api/lifeos-route 403't
// een niet-founder).

export default function TrainingPage() {
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
          <header className="os-cluster__kop" style={{ marginBottom: 8 }}>
            <h1 className="os-zone__kop">Training &amp; voeding</h1>
            <p className="os-zone__intro">
              Je training van vandaag en je programma. Kies een sessie of voedingsdag om je dag te volgen.
            </p>
          </header>

          <section className="os-cluster" aria-label="Training en voeding">
            <div className="os-tile--vol">
              <BlokKaart />
            </div>
            <div className="os-tile--vol">
              <ProgrammaKaart />
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

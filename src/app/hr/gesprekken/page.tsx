'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import HrShell from '@/components/layout/HrShell'
import nextDynamic from 'next/dynamic'
import GesprekkenTab from '@/components/hr/GesprekkenTab'

const GlowOrb = nextDynamic(() => import('@/components/three/GlowOrb'), { ssr: false })

export default function HrGesprekkenPage() {
  const router = useRouter()
  const [bedrijfId, setBedrijfId] = useState<string | null>(null)
  const [hrUserId, setHrUserId] = useState<string | null>(null)
  const [laden, setLaden] = useState(true)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profiel } = await supabase
        .from('profiles').select('rol, bedrijf_id').eq('id', user.id).single()
      if (!profiel || !['hr', 'admin'].includes(profiel.rol)) {
        router.push('/home'); return
      }
      setBedrijfId(profiel.bedrijf_id)
      setHrUserId(user.id)
      setLaden(false)
    }
    laad()
  }, [router])

  if (laden) return (
    <HrShell>
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="mf-spinner" />
      </div>
    </HrShell>
  )

  return (
    <HrShell>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 20px 72px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
            HR Gesprekken
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>
            Plan en log 1-op-1 gesprekken met medewerkers
          </p>
        </div>
        <GesprekkenTab bedrijfId={bedrijfId ?? ''} hrUserId={hrUserId ?? ''} />
      </div>
    </HrShell>
  )
}

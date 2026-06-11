'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import HrShell from '@/components/layout/HrShell'

type Rooster = {
  id: string
  naam: string
  week_start: string
  created_at: string
  aangemaakt_door: string | null
  dienst_count?: number
}

function weekLabel(weekStart: string): string {
  const ma = new Date(weekStart)
  const zo = new Date(ma)
  zo.setDate(ma.getDate() + 6)
  return `${ma.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} – ${zo.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}`
}

export default function HrRoostersPage() {
  const router = useRouter()
  const [roosters, setRoosters] = useState<Rooster[]>([])
  const [geladen, setGeladen] = useState(false)
  const [verwijderBezig, setVerwijderBezig] = useState<string | null>(null)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profiel } = await supabase
        .from('profiles').select('rol, bedrijf_id').eq('id', user.id).single()
      if (!profiel || !['hr', 'admin'].includes(profiel.rol ?? '')) {
        router.push('/home'); return
      }

      const { data } = await supabase
        .from('roosters')
        .select('id, naam, week_start, created_at, aangemaakt_door')
        .eq('bedrijf_id', profiel.bedrijf_id)
        .order('week_start', { ascending: false })

      // Haal dienst-aantallen op
      const ids = (data ?? []).map(r => r.id)
      const counts: Record<string, number> = {}
      if (ids.length > 0) {
        const { data: dc } = await supabase
          .from('rooster_diensten')
          .select('rooster_id')
          .in('rooster_id', ids)
        dc?.forEach(d => { counts[d.rooster_id] = (counts[d.rooster_id] ?? 0) + 1 })
      }

      setRoosters((data ?? []).map(r => ({ ...r, dienst_count: counts[r.id] ?? 0 })))
      setGeladen(true)
    }
    laad()
  }, [router])

  async function verwijder(id: string) {
    if (!confirm('Rooster en alle diensten verwijderen?')) return
    setVerwijderBezig(id)
    await supabase.from('roosters').delete().eq('id', id)
    setRoosters(prev => prev.filter(r => r.id !== id))
    setVerwijderBezig(null)
  }

  return (
    <HrShell>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 16px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Roosters</h1>
            <p style={{ color: '#6B7280', fontSize: 13, marginTop: 4 }}>Beheer werkroosters per week</p>
          </div>
          <Link
            href="/hr/roosters/nieuw"
            style={{
              background: '#1D9E75',
              color: '#fff',
              padding: '9px 20px',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            + Nieuw rooster
          </Link>
        </div>

        {!geladen ? (
          <div style={{ color: '#9CA3AF', textAlign: 'center', padding: 40 }}>Laden...</div>
        ) : roosters.length === 0 ? (
          <div className="rounded-2xl border border-gray-100" style={{ background: '#fff', padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
            <div style={{ color: '#374151', fontWeight: 600, marginBottom: 6 }}>Nog geen roosters</div>
            <div style={{ color: '#9CA3AF', fontSize: 13, marginBottom: 20 }}>Maak je eerste rooster aan om diensten in te plannen.</div>
            <Link href="/hr/roosters/nieuw" style={{ background: '#1D9E75', color: '#fff', padding: '9px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              + Nieuw rooster
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {roosters.map(r => (
              <div
                key={r.id}
                className="rounded-2xl border border-gray-100"
                style={{ background: '#fff', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#111827', fontSize: 15 }}>{r.naam}</div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                    {weekLabel(r.week_start)}
                    <span style={{ marginLeft: 12, color: '#9CA3AF' }}>{r.dienst_count} diensten</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link
                    href={`/hr/roosters/${r.id}`}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 8,
                      border: '1.5px solid #1D9E75',
                      color: '#1D9E75',
                      fontSize: 13,
                      fontWeight: 500,
                      textDecoration: 'none',
                    }}
                  >
                    Bewerken
                  </Link>
                  <button
                    onClick={() => verwijder(r.id)}
                    disabled={verwijderBezig === r.id}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 8,
                      border: '1.5px solid #E5E7EB',
                      color: '#EF4444',
                      fontSize: 13,
                      background: 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    {verwijderBezig === r.id ? '...' : 'Verwijder'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </HrShell>
  )
}

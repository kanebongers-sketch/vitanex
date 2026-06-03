'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import HrShell from '@/components/HrShell'

function maandag(datum: Date): Date {
  const d = new Date(datum)
  const dag = d.getDay() === 0 ? 7 : d.getDay()
  d.setDate(d.getDate() - (dag - 1))
  d.setHours(0, 0, 0, 0)
  return d
}

function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export default function NieuwRoosterPage() {
  const router = useRouter()
  const [bedrijfId, setBedrijfId] = useState('')
  const [userId, setUserId] = useState('')
  const [naam, setNaam] = useState('')
  const [weekStart, setWeekStart] = useState(() => toYMD(maandag(new Date())))
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profiel } = await supabase
        .from('profiles').select('rol, bedrijf_id').eq('id', user.id).single()
      if (!profiel || !['hr', 'admin'].includes(profiel.rol ?? '')) {
        router.push('/home'); return
      }
      setBedrijfId(profiel.bedrijf_id)
      setUserId(user.id)
      // Auto-naam op basis van week
      const d = new Date(weekStart)
      const weekNr = Math.ceil((((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86400000) + 1) / 7)
      setNaam(`Week ${weekNr}`)
    }
    laad()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleWeekChange(val: string) {
    // Zorg dat het altijd een maandag is
    const d = maandag(new Date(val))
    setWeekStart(toYMD(d))
    const weekNr = Math.ceil((((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86400000) + 1) / 7)
    setNaam(`Week ${weekNr}`)
  }

  async function opslaan() {
    if (!naam.trim()) { setFout('Geef het rooster een naam.'); return }
    setBezig(true)
    setFout('')
    const { data, error } = await supabase
      .from('roosters')
      .insert({ bedrijf_id: bedrijfId, naam: naam.trim(), week_start: weekStart, aangemaakt_door: userId })
      .select('id')
      .single()
    if (error || !data) {
      setFout('Opslaan mislukt: ' + (error?.message ?? 'onbekende fout'))
      setBezig(false)
      return
    }
    router.push(`/hr/roosters/${data.id}`)
  }

  return (
    <HrShell>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 16px' }}>
        <button
          onClick={() => router.back()}
          style={{ color: '#6B7280', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, padding: 0 }}
        >
          ← Terug
        </button>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 24 }}>Nieuw rooster</h1>

        <div className="rounded-2xl border border-gray-100" style={{ background: '#fff', padding: 24 }}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Week
            </label>
            <input
              type="date"
              value={weekStart}
              onChange={e => handleWeekChange(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1.5px solid #E5E7EB',
                fontSize: 14,
                color: '#111827',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
              De datum wordt automatisch op de maandag van die week gezet.
            </p>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Naam rooster
            </label>
            <input
              type="text"
              value={naam}
              onChange={e => setNaam(e.target.value)}
              placeholder="bijv. Week 23 - Team A"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1.5px solid #E5E7EB',
                fontSize: 14,
                color: '#111827',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {fout && (
            <div style={{ background: '#FCEBEB', color: '#A32D2D', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
              {fout}
            </div>
          )}

          <button
            onClick={opslaan}
            disabled={bezig}
            style={{
              width: '100%',
              background: bezig ? '#9CA3AF' : '#1D9E75',
              color: '#fff',
              padding: '11px',
              borderRadius: 10,
              border: 'none',
              fontSize: 15,
              fontWeight: 600,
              cursor: bezig ? 'not-allowed' : 'pointer',
            }}
          >
            {bezig ? 'Aanmaken...' : 'Rooster aanmaken →'}
          </button>
        </div>
      </div>
    </HrShell>
  )
}

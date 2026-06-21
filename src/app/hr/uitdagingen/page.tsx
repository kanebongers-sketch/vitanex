'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'

interface TeamUitdaging {
  id: string
  titel: string
  beschrijving: string
  type: string
  doel_waarde: number | null
  eenheid: string | null
  start_datum: string
  eind_datum: string
  actief: boolean
  team_uitdaging_logs?: { user_id: string }[]
}

const TYPES = [
  { id: 'stappen', label: 'Stappen' },
  { id: 'minuten_sport', label: 'Sportminuten' },
  { id: 'water', label: 'Water (glazen)' },
  { id: 'slaap', label: 'Slaap (uren)' },
  { id: 'checkin', label: 'Check-ins' },
  { id: 'custom', label: 'Anders' },
]

export default function HRUitdagingenPagina() {
  const router = useRouter()
  const [laden, setLaden] = useState(true)
  const [uitdagingen, setUitdagingen] = useState<TeamUitdaging[]>([])
  const [showForm, setShowForm] = useState(false)
  const [opslaan, setOpslaan] = useState(false)
  const [form, setForm] = useState({
    titel: '',
    beschrijving: '',
    type: 'stappen',
    doel_waarde: '',
    eenheid: '',
    start_datum: new Date().toISOString().split('T')[0],
    eind_datum: '',
  })

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profiel } = await supabase.from('profiles').select('rol').eq('id', user.id).single()
      if (!['hr', 'admin'].includes(profiel?.rol ?? '')) {
        router.push('/home')
        return
      }

      const res = await authFetch('/api/team-uitdagingen')
      if (res.ok) {
        const json = await res.json() as { uitdagingen: TeamUitdaging[] }
        setUitdagingen(json.uitdagingen ?? [])
      }
      setLaden(false)
    }
    laad()
  }, [router])

  async function aanmaken() {
    if (!form.titel.trim() || !form.eind_datum) return
    setOpslaan(true)
    try {
      const res = await authFetch('/api/team-uitdagingen', {
        method: 'POST',
        body: JSON.stringify({
          titel: form.titel,
          beschrijving: form.beschrijving || undefined,
          type: form.type,
          doel_waarde: form.doel_waarde ? parseFloat(form.doel_waarde) : undefined,
          eenheid: form.eenheid || TYPES.find(t => t.id === form.type)?.label,
          start_datum: form.start_datum,
          eind_datum: form.eind_datum,
        }),
      })
      if (res.ok) {
        const json = await res.json() as { uitdaging: TeamUitdaging }
        setUitdagingen(prev => [json.uitdaging, ...prev])
        setShowForm(false)
        setForm({ titel: '', beschrijving: '', type: 'stappen', doel_waarde: '', eenheid: '', start_datum: new Date().toISOString().split('T')[0], eind_datum: '' })
      }
    } catch { /* stil falen */ }
    setOpslaan(false)
  }

  const dagenResterend = (einddatum: string) => {
    const diff = Math.ceil((new Date(einddatum).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return diff
  }

  if (laden) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="mf-spinner" /></div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '24px 20px 88px', maxWidth: 600, margin: '0 auto' }}>

        <header style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 4 }}>
              Team uitdagingen
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Maak en beheer team wellbeing challenges</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{
            background: 'var(--text-1)', color: 'white', border: 'none', borderRadius: 10,
            padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>
            {showForm ? '✕ Annuleer' : '+ Nieuw'}
          </button>
        </header>

        {/* Aanmaak formulier */}
        {showForm && (
          <div style={{ background: 'white', borderRadius: 20, padding: '20px', border: '1px solid #E5E7EB', marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 16 }}>
              Nieuwe uitdaging
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>Titel *</label>
                <input value={form.titel} onChange={e => setForm(p => ({ ...p, titel: e.target.value }))}
                  placeholder="30 minuten bewegen per dag"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 13, boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>Beschrijving</label>
                <textarea value={form.beschrijving} onChange={e => setForm(p => ({ ...p, beschrijving: e.target.value }))}
                  placeholder="Extra context voor deelnemers..."
                  rows={2}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 13, boxSizing: 'border-box', resize: 'none', fontFamily: 'inherit' }} />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>Type</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 13, boxSizing: 'border-box' }}>
                  {TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>Doelwaarde</label>
                  <input type="number" value={form.doel_waarde} onChange={e => setForm(p => ({ ...p, doel_waarde: e.target.value }))}
                    placeholder="10000"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>Eenheid</label>
                  <input value={form.eenheid} onChange={e => setForm(p => ({ ...p, eenheid: e.target.value }))}
                    placeholder="stappen"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>Startdatum</label>
                  <input type="date" value={form.start_datum} onChange={e => setForm(p => ({ ...p, start_datum: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>Einddatum *</label>
                  <input type="date" value={form.eind_datum} onChange={e => setForm(p => ({ ...p, eind_datum: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
              </div>

              <button onClick={aanmaken} disabled={opslaan || !form.titel.trim() || !form.eind_datum} style={{
                width: '100%', padding: '12px', borderRadius: 12,
                background: opslaan ? 'var(--text-3)' : 'var(--mf-green)',
                color: 'white', border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 700,
              }}>
                {opslaan ? 'Aanmaken…' : 'Uitdaging aanmaken →'}
              </button>
            </div>
          </div>
        )}

        {/* Uitdagingen lijst */}
        {uitdagingen.length === 0 && !showForm ? (
          <div style={{ background: 'white', borderRadius: 20, padding: '40px 24px', textAlign: 'center', border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Nog geen uitdagingen</p>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Maak je eerste team uitdaging aan.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {uitdagingen.map(u => {
              const resterende = dagenResterend(u.eind_datum)
              const deelnemers = u.team_uitdaging_logs?.length ?? 0
              return (
                <div key={u.id} style={{
                  background: 'white', borderRadius: 16, padding: '16px 18px',
                  border: `1px solid ${u.actief && resterende > 0 ? '#E5E7EB' : '#F3F4F6'}`,
                  opacity: (!u.actief || resterende < 0) ? 0.6 : 1,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>{u.titel}</p>
                      {u.beschrijving && <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{u.beschrijving}</p>}
                    </div>
                    <div style={{ flexShrink: 0, textAlign: 'right', marginLeft: 12 }}>
                      {resterende > 0 ? (
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--mf-green)', background: 'var(--mf-green-light)', padding: '2px 8px', borderRadius: 99 }}>
                          {resterende}d resterend
                        </span>
                      ) : (
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', background: 'var(--bg-subtle)', padding: '2px 8px', borderRadius: 99 }}>
                          Afgelopen
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-3)' }}>
                    <span>📅 {new Date(u.start_datum).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} → {new Date(u.eind_datum).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}</span>
                    {u.doel_waarde && <span>🎯 {u.doel_waarde} {u.eenheid}</span>}
                    <span>👥 {deelnemers} deelnemers</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}


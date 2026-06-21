'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'

interface UitdagingData {
  uitdaging: {
    id: string
    titel: string
    type: string
    doel_waarde: number
    eenheid: string
    start_datum: string
    eind_datum: string
  }
  mijn_bijdrage: number
  team_totaal: number
  doel_bereikt_pct: number
  aantal_deelnemers: number
  dagen_resterend: number
  mijn_logs: { waarde: number; aangemaakt_op: string }[]
}

const TYPE_CONFIG: Record<string, { label: string; kleur: string; icon: string }> = {
  stappen:    { label: 'Stappen',    kleur: 'var(--mf-green)', icon: '👟' },
  slaap:      { label: 'Slaap',      kleur: 'var(--mf-purple)', icon: '😴' },
  meditatie:  { label: 'Meditatie',  kleur: 'var(--mf-purple)', icon: '🧘' },
  water:      { label: 'Water',      kleur: 'var(--mf-blue)', icon: '💧' },
  beweging:   { label: 'Beweging',   kleur: 'var(--mf-amber)', icon: '🏃' },
  focus:      { label: 'Focus',      kleur: 'var(--mf-red)', icon: '🎯' },
}

export default function UitdagingDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [laden, setLaden] = useState(true)
  const [data, setData] = useState<UitdagingData | null>(null)
  const [bijdrage, setBijdrage] = useState('')
  const [notitie, setNotitie] = useState('')
  const [verzenden, setVerzenden] = useState(false)
  const [success, setSuccess] = useState(false)

  async function laadData() {
    const res = await authFetch(`/api/team-uitdagingen/${id}/voortgang`)
    if (res.ok) setData(await res.json() as UitdagingData)
    setLaden(false)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login')
      else laadData()
    })
  }, [id, router])

  async function logBijdrage() {
    const waarde = parseFloat(bijdrage)
    if (!waarde || waarde <= 0) return
    setVerzenden(true)
    const res = await authFetch(`/api/team-uitdagingen/${id}/voortgang`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ waarde, notitie: notitie.trim() || undefined }),
    })
    if (res.ok) {
      setBijdrage('')
      setNotitie('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
      await laadData()
    }
    setVerzenden(false)
  }

  if (laden) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="mf-spinner" /></div>
    </div>
  )

  if (!data) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '36px 40px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-3)' }}>Uitdaging niet gevonden.</p>
        <Link href="/team-uitdagingen" style={{ color: 'var(--mf-green)', marginTop: 12, display: 'inline-block', textDecoration: 'none' }}>← Terug</Link>
      </main>
    </div>
  )

  const cfg = TYPE_CONFIG[data.uitdaging.type] ?? { label: data.uitdaging.type, kleur: 'var(--mf-green)', icon: '🎯' }
  const pct = data.doel_bereikt_pct

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '36px 40px 72px', maxWidth: 680, margin: '0 auto' }}>

        <Link href="/team-uitdagingen" style={{ color: 'var(--text-3)', textDecoration: 'none', fontSize: 13, display: 'block', marginBottom: 20 }}>
          ← Alle uitdagingen
        </Link>

        {/* Header */}
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E5E7EB', padding: '24px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: `${cfg.kleur}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
              {cfg.icon}
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em', marginBottom: 4 }}>{data.uitdaging.titel}</h1>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: cfg.kleur, background: `${cfg.kleur}12`, padding: '2px 8px', borderRadius: 100 }}>{cfg.label}</span>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{data.dagen_resterend} dagen resterend</span>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{data.aantal_deelnemers} deelnemers</span>
              </div>
            </div>
          </div>

          {/* Voortgangsbalk */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Team voortgang</p>
              <p style={{ fontSize: 13, fontWeight: 800, color: cfg.kleur }}>{pct}%</p>
            </div>
            <div style={{ height: 12, background: 'var(--bg-subtle)', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${pct}%`, background: cfg.kleur, borderRadius: 100,
                transition: 'width 0.8s ease',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{data.team_totaal} {data.uitdaging.eenheid} behaald</p>
              <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Doel: {data.uitdaging.doel_waarde} {data.uitdaging.eenheid}</p>
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              { label: 'Mijn bijdrage', waarde: `${data.mijn_bijdrage} ${data.uitdaging.eenheid}` },
              { label: 'Team totaal', waarde: `${data.team_totaal} ${data.uitdaging.eenheid}` },
              { label: 'Deelnemers', waarde: `${data.aantal_deelnemers}` },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--bg-subtle)', borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
                <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)' }}>{s.waarde}</p>
                <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2, fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Log bijdrage */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', padding: '20px 22px', marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 14 }}>Mijn bijdrage loggen</p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5 }}>Waarde ({data.uitdaging.eenheid})</p>
              <input
                type="number"
                placeholder={`0 ${data.uitdaging.eenheid}`}
                value={bijdrage}
                onChange={e => setBijdrage(e.target.value)}
                min="0"
                style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ flex: 2 }}>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5 }}>Notitie (optioneel)</p>
              <input
                type="text"
                placeholder="Korte omschrijving..."
                value={notitie}
                onChange={e => setNotitie(e.target.value)}
                style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <button
            onClick={logBijdrage}
            disabled={!bijdrage || parseFloat(bijdrage) <= 0 || verzenden}
            style={{
              width: '100%', padding: '11px', borderRadius: 12, fontSize: 14, fontWeight: 600,
              color: 'white', border: 'none', cursor: 'pointer', background: cfg.kleur,
              opacity: (!bijdrage || parseFloat(bijdrage) <= 0 || verzenden) ? 0.4 : 1,
              marginTop: 12,
            }}
          >
            {verzenden ? 'Loggen...' : success ? '✓ Gelogd!' : `Bijdrage loggen`}
          </button>
        </div>

        {/* Mijn recente logs */}
        {data.mijn_logs.length > 0 && (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', padding: '18px 20px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)', marginBottom: 12 }}>Mijn recente bijdragen</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.mijn_logs.map((log, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: i < data.mijn_logs.length - 1 ? '1px solid #F9FAFB' : 'none' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
                    {new Date(log.aangemaakt_op).toLocaleDateString('nl-BE', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: cfg.kleur }}>{log.waarde} {data.uitdaging.eenheid}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

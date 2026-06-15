'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'

interface VraagStat {
  id: string
  vraag: string
  type: 'scale' | 'nps' | 'multiple_choice' | 'text'
  actief: boolean
  volgorde: number
  aangemaakt_op: string
  aantal_antwoorden: number
  gemiddelde: number | null
  distributie: Record<string, number>
  nps: number | null
}

interface SurveyData {
  vragen: VraagStat[]
  participatie: { respondenten: number; totaal: number; pct: number }
  week_start: string
}

const TYPE_LABELS: Record<string, string> = {
  scale: '1—5 schaal',
  nps: 'NPS (0—10)',
  multiple_choice: 'Meerkeuze',
  text: 'Open tekst',
}

const NPS_KLEUR = (score: number) => score >= 30 ? '#1D9E75' : score >= 0 ? '#F59E0B' : '#E24B4A'

export default function HrPulseSurveyPage() {
  const router = useRouter()
  const [laden, setLaden] = useState(true)
  const [data, setData] = useState<SurveyData | null>(null)
  const [nieuw, setNieuw] = useState(false)
  const [vraag, setVraag] = useState('')
  const [type, setType] = useState<'scale' | 'nps' | 'multiple_choice' | 'text'>('scale')
  const [optiesRaw, setOptiesRaw] = useState('')
  const [toevoegen, setToevoegen] = useState(false)
  const [uitbreiden, setUitbreiden] = useState<string | null>(null)

  async function laadData() {
    const res = await authFetch('/api/hr/pulse-survey')
    if (res.ok) setData(await res.json() as SurveyData)
    setLaden(false)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login')
      else laadData()
    })
  }, [router])

  async function voegToe() {
    if (!vraag.trim() || toevoegen) return
    setToevoegen(true)
    const opties = type === 'multiple_choice'
      ? optiesRaw.split('\n').map(s => s.trim()).filter(Boolean)
      : undefined

    const res = await authFetch('/api/hr/pulse-survey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vraag: vraag.trim(), type, opties }),
    })
    if (res.ok) {
      setVraag('')
      setOptiesRaw('')
      setType('scale')
      setNieuw(false)
      await laadData()
    }
    setToevoegen(false)
  }

  async function toggleActief(id: string, huidig: boolean) {
    await authFetch('/api/hr/pulse-survey', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, actief: !huidig }),
    })
    await laadData()
  }

  if (laden) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="mf-spinner" /></div>
    </div>
  )

  const participatie = data?.participatie ?? { respondenten: 0, totaal: 0, pct: 0 }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '36px 40px 72px', maxWidth: 760, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', marginBottom: 4 }}>Pulse survey</h1>
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>
              Week van {data?.week_start ? new Date(data.week_start).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long' }) : '—'} ·{' '}
              {participatie.respondenten} van {participatie.totaal} ingevuld ({participatie.pct}%)
            </p>
          </div>
          <button
            onClick={() => setNieuw(v => !v)}
            style={{ padding: '10px 18px', borderRadius: 12, background: '#1D9E75', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
          >
            {nieuw ? '✕ Annuleer' : '+ Vraag toevoegen'}
          </button>
        </div>

        {/* Participatie balk */}
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E5E7EB', padding: '16px 20px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Participatie deze week</p>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#1D9E75' }}>{participatie.pct}%</p>
          </div>
          <div style={{ height: 8, background: '#F3F4F6', borderRadius: 100, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${participatie.pct}%`, background: '#1D9E75', borderRadius: 100 }} />
          </div>
          <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 5 }}>{participatie.respondenten} respondenten van {participatie.totaal} medewerkers</p>
        </div>

        {/* Nieuw vraag formulier */}
        {nieuw && (
          <div style={{ background: 'white', borderRadius: 16, border: '1.5px solid #1D9E75', padding: '20px 22px', marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 14 }}>Nieuwe vraag</p>
            <textarea
              rows={2}
              value={vraag}
              onChange={e => setVraag(e.target.value)}
              placeholder="Hoe tevreden ben je over...?"
              style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 12 }}
            />
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 5 }}>Type vraag</p>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as typeof type)}
                  style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 10, padding: '9px 12px', fontSize: 13, outline: 'none' }}
                >
                  {Object.entries(TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            {type === 'multiple_choice' && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 5 }}>Opties (één per regel)</p>
                <textarea
                  rows={4}
                  value={optiesRaw}
                  onChange={e => setOptiesRaw(e.target.value)}
                  placeholder={"Altijd\nVaak\nSoms\nNooit"}
                  style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px 14px', fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                />
              </div>
            )}
            <button
              onClick={voegToe}
              disabled={!vraag.trim() || toevoegen}
              style={{ width: '100%', padding: '11px', borderRadius: 12, background: '#1D9E75', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, opacity: !vraag.trim() || toevoegen ? 0.5 : 1 }}
            >
              {toevoegen ? 'Toevoegen...' : 'Vraag toevoegen'}
            </button>
          </div>
        )}

        {/* Vragenlijst */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(data?.vragen ?? []).length === 0 && (
            <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingTop: 40 }}>
              Nog geen pulse survey vragen aangemaakt. Klik op "Vraag toevoegen" om te beginnen.
            </p>
          )}
          {(data?.vragen ?? []).map(v => (
            <div key={v.id} style={{ background: 'white', borderRadius: 14, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
              <div
                style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
                onClick={() => setUitbreiden(uitbreiden === v.id ? null : v.id)}
              >
                {/* Toggle actief */}
                <div
                  onClick={e => { e.stopPropagation(); toggleActief(v.id, v.actief) }}
                  style={{
                    width: 36, height: 20, borderRadius: 100, position: 'relative', cursor: 'pointer', flexShrink: 0,
                    background: v.actief ? '#1D9E75' : '#E5E7EB', transition: 'background 0.2s',
                  }}
                >
                  <div style={{
                    width: 14, height: 14, borderRadius: '50%', background: 'white',
                    position: 'absolute', top: 3, left: v.actief ? 19 : 3, transition: 'left 0.2s',
                  }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.vraag}</p>
                  <p style={{ fontSize: 11, color: '#9CA3AF' }}>{TYPE_LABELS[v.type]} · {v.aantal_antwoorden} antwoorden</p>
                </div>

                {v.type === 'nps' && v.nps !== null && (
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: NPS_KLEUR(v.nps) }}>{v.nps > 0 ? '+' : ''}{v.nps}</p>
                    <p style={{ fontSize: 10, color: '#9CA3AF' }}>NPS</p>
                  </div>
                )}
                {(v.type === 'scale') && v.gemiddelde !== null && (
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: '#1D9E75' }}>{v.gemiddelde}/5</p>
                    <p style={{ fontSize: 10, color: '#9CA3AF' }}>gem.</p>
                  </div>
                )}

                <span style={{ fontSize: 12, color: '#9CA3AF', flexShrink: 0 }}>{uitbreiden === v.id ? '▲' : '▼'}</span>
              </div>

              {uitbreiden === v.id && v.aantal_antwoorden > 0 && (
                <div style={{ borderTop: '1px solid #F3F4F6', padding: '16px 20px' }}>
                  {v.type === 'scale' || v.type === 'nps' ? (
                    <div>
                      {v.type === 'nps' && v.nps !== null && (
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                            {[
                              { label: 'Detractors (0—6)', count: Object.entries(v.distributie).filter(([k]) => parseInt(k) <= 6).reduce((s, [, c]) => s + c, 0), kleur: '#E24B4A' },
                              { label: 'Passives (7—8)', count: Object.entries(v.distributie).filter(([k]) => [7, 8].includes(parseInt(k))).reduce((s, [, c]) => s + c, 0), kleur: '#F59E0B' },
                              { label: 'Promoters (9—10)', count: Object.entries(v.distributie).filter(([k]) => parseInt(k) >= 9).reduce((s, [, c]) => s + c, 0), kleur: '#1D9E75' },
                            ].map(g => (
                              <div key={g.label} style={{ flex: 1, background: `${g.kleur}12`, borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                                <p style={{ fontSize: 16, fontWeight: 800, color: g.kleur }}>{g.count}</p>
                                <p style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>{g.label}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {Object.entries(v.distributie)
                          .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                          .map(([waarde, aantal]) => {
                            const max = Math.max(...Object.values(v.distributie))
                            return (
                              <div key={waarde} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', width: 24, textAlign: 'right' }}>{waarde}</span>
                                <div style={{ flex: 1, height: 8, background: '#F3F4F6', borderRadius: 100, overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${(aantal / max) * 100}%`, background: '#1D9E75', borderRadius: 100 }} />
                                </div>
                                <span style={{ fontSize: 11, color: '#9CA3AF', width: 24 }}>{aantal}</span>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  ) : v.type === 'multiple_choice' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {Object.entries(v.distributie).map(([optie, aantal]) => {
                        const max = Math.max(...Object.values(v.distributie))
                        return (
                          <div key={optie} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 12, color: '#374151', flex: 1 }}>{optie}</span>
                            <div style={{ width: 120, height: 8, background: '#F3F4F6', borderRadius: 100, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${(aantal / max) * 100}%`, background: '#1D9E75', borderRadius: 100 }} />
                            </div>
                            <span style={{ fontSize: 11, color: '#9CA3AF', width: 24 }}>{aantal}</span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p style={{ fontSize: 12, color: '#9CA3AF' }}>Open antwoorden worden niet weergegeven om anonimiteit te bewaren.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}


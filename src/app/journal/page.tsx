'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import { authFetch } from '@/lib/auth-fetch'
import nextDynamic from 'next/dynamic'

const GlowOrb = nextDynamic(() => import('@/components/three/GlowOrb'), { ssr: false })

const STEMMING_RGB: Record<number, [number, number, number]> = {
  1: [0.886, 0.294, 0.290],
  2: [0.949, 0.722, 0.141],
  3: [0.400, 0.400, 0.450],
  4: [0.114, 0.620, 0.459],
  5: [0.486, 0.231, 0.933],
}

type Entry = {
  id: string
  inhoud: string
  stemming: number | null
  aangemaakt_op: string
}

const STEMMINGEN = [
  { waarde: 1, kleur: 'var(--mf-red)', bg: 'var(--mf-red-light)', label: 'Slecht' },
  { waarde: 2, kleur: 'var(--mf-amber-dark)', bg: 'var(--mf-amber-light)', label: 'Matig' },
  { waarde: 3, kleur: 'var(--text-2)', bg: 'var(--bg-subtle)', label: 'Oké' },
  { waarde: 4, kleur: 'var(--mf-green)', bg: 'var(--mf-green-light)', label: 'Goed' },
  { waarde: 5, kleur: 'var(--mf-purple)', bg: 'var(--mf-purple-light)', label: 'Super' },
]

const PROMPTS = [
  'Hoe was mijn dag werkelijk?',
  'Waar maak ik me zorgen over?',
  'Wat gaf me energie vandaag?',
  'Wat nam energie weg?',
  'Wat ben ik dankbaar voor?',
  'Wat wil ik morgen anders doen?',
]

function formatDatum(iso: string) {
  return new Date(iso).toLocaleDateString('nl-BE', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function StemmingDot({ waarde, size = 10 }: { waarde: number; size?: number }) {
  const s = STEMMINGEN.find(m => m.waarde === waarde)
  if (!s) return null
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontWeight: 600, color: s.kleur,
      background: s.bg, borderRadius: 100, padding: '2px 9px',
    }}>
      <span style={{ width: size, height: size, borderRadius: '50%', background: s.kleur, display: 'inline-block', flexShrink: 0 }} />
      {s.label}
    </span>
  )
}

export default function JournalPagina() {
  const router = useRouter()
  const [entries, setEntries] = useState<Entry[]>([])
  const [laden, setLaden] = useState(true)
  const [nieuwTonen, setNieuwTonen] = useState(false)
  const [tekst, setTekst] = useState('')
  const [stemming, setStemming] = useState<number | null>(null)
  const [opslaan, setOpslaan] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [uitgevouwen, setUitgevouwen] = useState<string | null>(null)
  const [aiPrompt, setAiPrompt] = useState<string | null>(null)
  const [aiPromptLaden, setAiPromptLaden] = useState(false)

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data } = await supabase
        .from('journal_entries')
        .select('id, inhoud, stemming, aangemaakt_op')
        .eq('user_id', user.id)
        .order('aangemaakt_op', { ascending: false })
        .limit(50)
      setEntries(data || [])
      setLaden(false)
    }
    laad()
  }, [router])

  async function slaOp() {
    if (!tekst.trim() || !userId) return
    setOpslaan(true)
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({ user_id: userId, inhoud: tekst.trim(), stemming })
      .select('id, inhoud, stemming, aangemaakt_op')
      .single()
    if (!error && data) {
      setEntries(prev => [data, ...prev])
      setTekst('')
      setStemming(null)
      setNieuwTonen(false)
    }
    setOpslaan(false)
  }

  async function verwijder(id: string) {
    if (!confirm('Aantekening verwijderen?')) return
    const { error } = await supabase.from('journal_entries').delete().eq('id', id)
    if (!error) setEntries(prev => prev.filter(e => e.id !== id))
  }

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ padding: '24px 20px 88px', maxWidth: 600, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 0 }}>
                <GlowOrb
                  color={stemming ? (STEMMING_RGB[stemming] ?? [0.486, 0.231, 0.933]) : [0.486, 0.231, 0.933]}
                  intensity={stemming ? 0.6 : 0.35}
                  size={72}
                />
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--mf-purple-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, position: 'relative', zIndex: 1 }}>
                📖
              </div>
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em', marginBottom: 2 }}>Journal</h1>
              <p style={{ color: 'var(--text-4)', fontSize: 13 }}>Schrijf vrij — alleen zichtbaar voor jou.</p>
            </div>
          </div>
          {!nieuwTonen && (
            <button
              onClick={() => setNieuwTonen(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'linear-gradient(135deg, var(--mf-green) 0%, var(--mf-green-dark) 100%)', color: 'white',
                borderRadius: 12, padding: '10px 18px',
                fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nieuwe aantekening
            </button>
          )}
        </div>

        {/* Nieuw entry form */}
        {nieuwTonen && (
          <div style={{ background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border)', padding: '24px', marginBottom: 20 }}>

            {/* AI Prompt */}
            <div style={{ background: 'var(--mf-purple-light)', borderRadius: 12, padding: '12px 16px', marginBottom: 18, border: '1px solid #DDD6FE' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: aiPrompt ? 8 : 0 }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--mf-purple)' }}>AI reflectievraag</p>
                <button
                  onClick={async () => {
                    setAiPromptLaden(true)
                    try {
                      const res = await authFetch('/api/journal/ai-prompt')
                      if (res.ok) {
                        const d = await res.json() as { prompt: string | null }
                        setAiPrompt(d.prompt)
                      }
                    } catch { /* stil */ } finally {
                      setAiPromptLaden(false)
                    }
                  }}
                  disabled={aiPromptLaden}
                  style={{ fontSize: 11, fontWeight: 600, color: 'var(--mf-purple)', background: 'none', border: 'none', cursor: 'pointer', opacity: aiPromptLaden ? 0.5 : 1 }}
                >
                  {aiPromptLaden ? 'Laden...' : aiPrompt ? '↻ Nieuw' : 'Genereer →'}
                </button>
              </div>
              {aiPrompt && (
                <button
                  onClick={() => setTekst(prev => prev ? `${prev}\n\n${aiPrompt}\n` : `${aiPrompt}\n`)}
                  style={{ fontSize: 13, color: 'var(--mf-purple)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', lineHeight: 1.5, fontStyle: 'italic' }}
                >
                  "{aiPrompt}" →
                </button>
              )}
            </div>

            {/* Stemming picker */}
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-4)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Hoe voel je je?</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              {STEMMINGEN.map(s => {
                const actief = stemming === s.waarde
                return (
                  <button
                    key={s.waarde}
                    onClick={() => setStemming(actief ? null : s.waarde)}
                    style={{
                      padding: '7px 14px', borderRadius: 100, border: `2px solid ${actief ? s.kleur : 'var(--border)'}`,
                      background: actief ? s.bg : 'var(--bg-card)', cursor: 'pointer',
                      fontSize: 12, fontWeight: 700, color: actief ? s.kleur : 'var(--text-4)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {s.label}
                  </button>
                )
              })}
            </div>

            {/* Prompt chips */}
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Schrijftip</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => setTekst(prev => prev ? `${prev}\n\n${p}\n` : `${p}\n`)}
                  style={{
                    fontSize: 12, border: '1px solid var(--border)', borderRadius: 8,
                    padding: '5px 12px', color: 'var(--text-3)', background: 'var(--bg-card)', cursor: 'pointer',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>

            <textarea
              autoFocus
              rows={6}
              value={tekst}
              onChange={e => setTekst(e.target.value)}
              placeholder="Begin te schrijven..."
              style={{
                width: '100%', border: '1px solid var(--border)', borderRadius: 12,
                padding: '12px 16px', fontSize: 14, outline: 'none', resize: 'none',
                lineHeight: 1.7, boxSizing: 'border-box', color: 'var(--text-2)', background: 'var(--bg-card)',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button
                onClick={() => { setNieuwTonen(false); setTekst(''); setStemming(null) }}
                style={{ fontSize: 13, border: '1px solid var(--border)', borderRadius: 10, padding: '9px 16px', color: 'var(--text-3)', background: 'var(--bg-card)', cursor: 'pointer' }}
              >
                Annuleer
              </button>
              <button
                onClick={slaOp}
                disabled={!tekst.trim() || opslaan}
                style={{
                  fontSize: 13, borderRadius: 10, padding: '9px 18px',
                  color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: tekst.trim() ? 'linear-gradient(135deg, var(--mf-green) 0%, var(--mf-green-dark) 100%)' : 'var(--text-4)',
                  opacity: opslaan ? 0.7 : 1,
                }}
              >
                {opslaan ? 'Opslaan...' : 'Opslaan'}
              </button>
            </div>
          </div>
        )}

        {/* 7-daags activiteitstrip */}
        {!laden && entries.length > 0 && !nieuwTonen && (() => {
          const vandaag = new Date()
          const vandaagStr = vandaag.toISOString().split('T')[0]
          const datumSet = new Set(entries.map(e => e.aangemaakt_op.split('T')[0]))
          const strip = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(vandaag)
            d.setDate(d.getDate() - (6 - i))
            const ds = d.toISOString().split('T')[0]
            return { ds, dag: d.toLocaleDateString('nl-NL', { weekday: 'short' }).slice(0, 2), actief: datumSet.has(ds), isVandaag: ds === vandaagStr }
          })
          const streak = (() => {
            let n = 0
            for (let i = 6; i >= 0; i--) {
              const d = new Date(vandaag); d.setDate(d.getDate() - i)
              if (datumSet.has(d.toISOString().split('T')[0])) n++; else break
            }
            return n
          })()
          return (
            <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '14px 16px', marginBottom: 20, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1, display: 'flex', gap: 6 }}>
                {strip.map(({ ds, dag, actief, isVandaag }) => (
                  <div key={ds} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{
                      width: '100%', height: 28, borderRadius: 6,
                      background: actief ? 'var(--mf-green)' : 'var(--bg-subtle)',
                      opacity: actief ? 0.85 : 0.5,
                      outline: isVandaag ? '2px solid var(--mf-green)' : 'none',
                      outlineOffset: 2,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {actief && <span style={{ fontSize: 12 }}>✍️</span>}
                    </div>
                    <span style={{ fontSize: 8, color: isVandaag ? 'var(--text-2)' : 'var(--text-4)', fontWeight: isVandaag ? 800 : 400, textTransform: 'capitalize' }}>{dag}</span>
                  </div>
                ))}
              </div>
              {streak > 0 && (
                <div style={{ textAlign: 'center', paddingLeft: 12, borderLeft: '1px solid var(--border)', flexShrink: 0 }}>
                  <p style={{ fontSize: 20, fontWeight: 900, color: 'var(--mf-green)', margin: 0, lineHeight: 1 }}>{streak}</p>
                  <p style={{ fontSize: 9, color: 'var(--text-4)', margin: '2px 0 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>daagse<br />streak</p>
                </div>
              )}
            </div>
          )
        })()}

        {/* Entries */}
        {laden ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <div className="mf-spinner" />
          </div>
        ) : entries.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border)',
            padding: '56px 40px', textAlign: 'center',
          }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--text-4)' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Nog geen aantekeningen</p>
            <p style={{ fontSize: 13, color: 'var(--text-4)', marginBottom: 20 }}>Schrijf je eerste gedachten neer. Het helpt echt.</p>
            <button
              onClick={() => setNieuwTonen(true)}
              style={{ background: 'linear-gradient(135deg, var(--mf-green) 0%, var(--mf-green-dark) 100%)', color: 'white', border: 'none', borderRadius: 12, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              Begin nu
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {entries.map(e => {
              const s = STEMMINGEN.find(m => m.waarde === e.stemming)
              const isOpen = uitgevouwen === e.id
              const preview = e.inhoud.length > 160 ? e.inhoud.slice(0, 160) + '...' : e.inhoud
              return (
                <div key={e.id} style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border)', padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {s && <StemmingDot waarde={s.waarde} />}
                      <p style={{ fontSize: 12, color: 'var(--text-4)', textTransform: 'capitalize' }}>{formatDatum(e.aangemaakt_op)}</p>
                    </div>
                    <button
                      onClick={() => verwijder(e.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: 4, display: 'flex' }}
                      title="Verwijder"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                      </svg>
                    </button>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {isOpen ? e.inhoud : preview}
                  </p>
                  {e.inhoud.length > 160 && (
                    <button
                      onClick={() => setUitgevouwen(isOpen ? null : e.id)}
                      style={{ fontSize: 12, marginTop: 8, fontWeight: 600, color: 'var(--mf-green)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      {isOpen ? 'Minder tonen' : 'Meer tonen'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

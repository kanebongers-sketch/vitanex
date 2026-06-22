'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { authFetch } from '@/lib/auth-fetch'
import Navbar from '@/components/layout/Navbar'
import nextDynamic from 'next/dynamic'

const GlowOrb = nextDynamic(() => import('@/components/three/GlowOrb'), { ssr: false })

type Bericht = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const WELKOM = `Hallo! Ik ben jouw MentaForce Coach.

Ik ben hier om je te helpen met alles rondom welzijn op het werk  stress, energie, werk-privébalans, motivatie, slaap of gewoon even lucht geven.

Alles wat je hier deelt is puur voor jou. Geen manager, geen HR die meeleest.

Waar kan ik je vandaag mee helpen?`

const SUGGESTIES = [
  { emoji: '😰', tekst: 'Ik voel me gestrest' },
  { emoji: '⚡', tekst: 'Mijn energie is op' },
  { emoji: '😴', tekst: 'Ik slaap slecht' },
  { emoji: '🚨', tekst: 'Ik wil tips tegen burn-out' },
  { emoji: '⚖️', tekst: 'Werk en privé in balans' },
  { emoji: '💡', tekst: 'Ik mis motivatie' },
  { emoji: '🎯', tekst: 'Hoe blijf ik gemotiveerd?' },
  { emoji: '🧘', tekst: 'Ik wil rustiger worden' },
]

type GebruikerContext = {
  naam: string
  discPrimair?: string
  domeinScores?: Record<string, number>
  actieveDoelen?: string[]
}

const DOMEIN_CODES: Record<string, string[]> = {
  slaap:    ['slaap_kwaliteit', 'slaap_uren', 'slaap_fris', 'slaap_loslaten'],
  stress:   ['stress_niveau', 'stress_piekeren', 'stress_controle', 'stress_ontspanning'],
  energie:  ['energie_niveau', 'energie_beweging', 'energie_voeding', 'energie_dip'],
  focus:    ['focus_concentratie', 'focus_helderheid', 'focus_aanwezig', 'focus_flow'],
  balans:   ['balans_werk_prive', 'balans_grenzen', 'balans_tijd', 'balans_herstel'],
  motivatie:['motivatie_werk', 'motivatie_zinvol', 'motivatie_enthousiasme', 'motivatie_waardering'],
}

export default function CoachPagina() {
  const router = useRouter()
  const [berichten, setBerichten] = useState<Bericht[]>([
    { id: 'welkom', role: 'assistant', content: WELKOM },
  ])
  const [input, setInput] = useState('')
  const [laden, setLaden] = useState(false)
  const [klaar, setKlaar] = useState(false)
  const [gebruikerContext, setGebruikerContext] = useState<GebruikerContext | null>(null)
  const onderRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Laad context voor coach (non-blocking)
      try {
        const ctx: GebruikerContext = { naam: 'je' }

        const { data: profiel } = await supabase
          .from('profiles').select('naam').eq('id', user.id).single()
        if (profiel?.naam) ctx.naam = profiel.naam as string

        const { data: disc } = await supabase
          .from('disc_inzendingen').select('primair').eq('user_id', user.id)
          .order('aangemaakt_op', { ascending: false }).limit(1).maybeSingle()
        if (disc?.primair) ctx.discPrimair = disc.primair as string

        const { data: sessie } = await supabase
          .from('checkin_sessies').select('id')
          .eq('user_id', user.id).order('aangemaakt_op', { ascending: false })
          .limit(1).maybeSingle()

        if (sessie?.id) {
          const { data: antwoorden } = await supabase
            .from('checkin_antwoorden').select('vraag_code, waarde_schaal')
            .eq('sessie_id', sessie.id)
          if (antwoorden?.length) {
            const codeMap: Record<string, number> = {}
            for (const r of antwoorden) {
              if (r.waarde_schaal != null) codeMap[r.vraag_code] = Number(r.waarde_schaal)
            }
            const scores: Record<string, number> = {}
            for (const [domein, codes] of Object.entries(DOMEIN_CODES)) {
              scores[domein] = codes.reduce((acc, c) => acc + (codeMap[c] ?? 0), 0)
            }
            ctx.domeinScores = scores
          }
        }

        setGebruikerContext(ctx)
      } catch { /* niet-kritiek */ }

      setKlaar(true)
    }
    check()
  }, [router])

  useEffect(() => {
    onderRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [berichten])

  async function verstuur(tekst?: string) {
    const invoer = (tekst ?? input).trim()
    if (!invoer || laden) return

    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'

    // Index-gebaseerd id: puur, en uniek binnen de lijst (deze groeit alleen)
    const gebruikerBericht: Bericht = { id: `u-${berichten.length}`, role: 'user', content: invoer }
    const nieuweLijst = [...berichten, gebruikerBericht]
    setBerichten(nieuweLijst)
    setLaden(true)

    // Strip the welcome message (hardcoded, not sent to API)
    const api = nieuweLijst
      .filter(b => b.id !== 'welkom')
      .map(b => ({ role: b.role, content: b.content }))

    try {
      const res = await authFetch('/api/coach', {
        method: 'POST',
        body: JSON.stringify({
          berichten: api,
          ...(gebruikerContext ? { gebruiker_context: gebruikerContext } : {}),
        }),
      })
      const json = await res.json()
      if (json.tekst) {
        setBerichten(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: json.tekst }])
      } else if (json.error) {
        setBerichten(prev => [...prev, {
          id: `err-${Date.now()}`, role: 'assistant',
          content: `Helaas kan ik je nu niet helpen. ${json.error}`,
        }])
      }
    } catch {
      setBerichten(prev => [...prev, {
        id: `err-${Date.now()}`, role: 'assistant',
        content: 'Er ging iets mis. Probeer het opnieuw.',
      }])
    }
    setLaden(false)
    inputRef.current?.focus()

    // Sla samenvatting op na elk 6e bericht (niet-blokkerend)
    const updatedBerichten = berichten.filter(b => b.id !== 'welkom')
    if (updatedBerichten.length > 0 && updatedBerichten.length % 6 === 0) {
      authFetch('/api/coach/samenvatting', {
        method: 'POST',
        body: JSON.stringify({ berichten: updatedBerichten.map(b => ({ role: b.role, content: b.content })) }),
      }).catch(() => { /* stil falen */ })
    }
  }

  if (!klaar) return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="mf-spinner" />
      </div>
    </div>
  )

  return (
    <div className="mf-mesh-bg" style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
          background: 'var(--bg-card)', display: 'flex', alignItems: 'center',
          gap: 12, flexShrink: 0,
        }}>
          <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 0 }}>
              <GlowOrb color={[0.114, 0.620, 0.459]} intensity={laden ? 0.8 : 0.5} size={72} />
            </div>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, background: 'var(--mentaforce-primary-light)', color: 'var(--mentaforce-primary)',
              position: 'relative', zIndex: 1,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-4.24z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-4.24z"/></svg>
            </div>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>MentaForce Coach</p>
            <p style={{ fontSize: 12, color: 'var(--text-4)' }}>AI-coach · Vertrouwelijk · 24/7 beschikbaar</p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--mf-green)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-4)' }}>Online</span>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {berichten.map((b) => (
            <div key={b.id} style={{ display: 'flex', justifyContent: b.role === 'user' ? 'flex-end' : 'flex-start', gap: 10 }}>
              {b.role === 'assistant' && (
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: 2,
                  background: 'var(--mentaforce-primary-light)', color: 'var(--mentaforce-primary)',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-4.24z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-4.24z"/></svg>
                </div>
              )}
              <div style={{
                maxWidth: '78%', padding: '12px 16px',
                fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap',
                background: b.role === 'user' ? 'var(--mentaforce-primary)' : 'var(--bg-card)',
                color: b.role === 'user' ? 'white' : 'var(--text-1)',
                boxShadow: b.role === 'assistant' ? '0 1px 3px rgba(0,0,0,0.07)' : 'none',
                borderRadius: b.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              }}>
                {b.content}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {laden && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                background: 'var(--mentaforce-primary-light)', color: 'var(--mentaforce-primary)',
              }}>
                <div className="mf-spinner" style={{ width: 16, height: 16 }} />
              </div>
              <div style={{
                background: 'var(--bg-card)', padding: '12px 16px',
                borderRadius: '18px 18px 18px 4px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border)', animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border)', animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border)', animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Suggestions — only before first user message */}
          {berichten.length === 1 && !laden && (
            <div style={{ marginTop: 8 }}>
              <p style={{ fontSize: 12, color: 'var(--text-4)', marginBottom: 8, textAlign: 'center' }}>Kies een onderwerp om te beginnen</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {SUGGESTIES.map(s => (
                  <button
                    key={s.tekst}
                    onClick={() => verstuur(s.tekst)}
                    className="mf-pressable"
                    style={{
                      fontSize: 12, border: '1px solid var(--border)', borderRadius: 999,
                      padding: '6px 14px', color: 'var(--text-2)', background: 'var(--bg-card)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <span>{s.emoji}</span>{s.tekst}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={onderRef} />
        </div>

        {/* Privacy note */}
        <div style={{ padding: '4px 16px', textAlign: 'center', flexShrink: 0 }}>
          <p style={{ fontSize: 12, color: 'var(--text-4)', opacity: 0.6 }}>Gesprekken worden niet opgeslagen · Alleen zichtbaar voor jou</p>
        </div>

        {/* Input */}
        <div style={{
          padding: '12px 16px', background: 'var(--bg-card)',
          borderTop: '1px solid var(--border)', flexShrink: 0,
        }}>
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: 8,
            borderRadius: 20, border: '1px solid var(--border)',
            padding: '8px 12px', background: 'var(--bg-subtle)',
          }}>
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => {
                setInput(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); verstuur() }
              }}
              placeholder="Typ je bericht"
              disabled={laden}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                fontSize: 14, resize: 'none', lineHeight: 1.5,
                minHeight: 24, maxHeight: 120, color: 'var(--text-1)',
                opacity: laden ? 0.5 : 1,
              }}
            />
            <button
              onClick={() => verstuur()}
              disabled={!input.trim() || laden}
              style={{
                flexShrink: 0, width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', cursor: input.trim() && !laden ? 'pointer' : 'default',
                background: input.trim() && !laden
                  ? 'linear-gradient(135deg, #1D9E75 0%, #16a34a 100%)'
                  : 'var(--border)',
                opacity: !input.trim() || laden ? 0.4 : 1,
                transition: 'background 0.15s ease, opacity 0.15s ease',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke={input.trim() && !laden ? 'white' : 'var(--text-4)'}
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>

      </main>
    </div>
  )
}

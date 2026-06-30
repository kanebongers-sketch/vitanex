'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Brain, Send, BatteryLow, Moon, AlertTriangle, Scale, Lightbulb, Target, Wind, Frown,
  MessageCircleMore, ListChecks, Compass,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { authFetch } from '@/lib/auth-fetch'
import Navbar from '@/components/layout/Navbar'

type Bericht = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const WELKOM = `Hallo! Ik ben jouw MentaForce Coach.

Ik ben hier om je te helpen met alles rondom welzijn op het werk  stress, energie, werk-privébalans, motivatie, slaap of gewoon even lucht geven.

Alles wat je hier deelt is vertrouwelijk. Geen manager, geen HR die meeleest.

Waar kan ik je vandaag mee helpen?`

const SUGGESTIES: { icon: LucideIcon; tekst: string }[] = [
  { icon: Frown, tekst: 'Ik voel me gestrest' },
  { icon: BatteryLow, tekst: 'Mijn energie is op' },
  { icon: Moon, tekst: 'Ik slaap slecht' },
  { icon: AlertTriangle, tekst: 'Ik wil tips tegen burn-out' },
  { icon: Scale, tekst: 'Werk en privé in balans' },
  { icon: Lightbulb, tekst: 'Ik mis motivatie' },
  { icon: Target, tekst: 'Hoe blijf ik gemotiveerd?' },
  { icon: Wind, tekst: 'Ik wil rustiger worden' },
]

const VERVOLGVRAGEN: { icon: LucideIcon; tekst: string }[] = [
  { icon: MessageCircleMore, tekst: 'Vertel me meer' },
  { icon: ListChecks, tekst: 'Wat kan ik vandaag doen?' },
  { icon: Compass, tekst: 'Hoe pak ik dit het beste aan?' },
]

type GebruikerContext = {
  naam: string
  discPrimair?: string
  domeinScores?: Record<string, number>
  actieveDoelen?: string[]
}

const DOMEIN_CODES: Record<string, string[]> = {
  slaap:    ['slaap_kwaliteit', 'slaap_fris'],
  stress:   ['stress_niveau',   'stress_controle'],
  energie:  ['energie_niveau',  'energie_beweging'],
  focus:    ['focus_concentratie', 'focus_helderheid'],
  balans:   ['balans_werk_prive',  'balans_herstel'],
  motivatie:['motivatie_werk', 'motivatie_zinvol'],
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

    const gebruikerBericht: Bericht = { id: `u-${berichten.length}`, role: 'user', content: invoer }
    const assistentId = `a-${berichten.length + 1}`
    const nieuweLijst = [...berichten, gebruikerBericht, { id: assistentId, role: 'assistant' as const, content: '' }]
    setBerichten(nieuweLijst)
    setLaden(true)

    // Strip the welcome message en de lege assistent-placeholder (puur lokaal, niet naar de API)
    const api = nieuweLijst
      .filter(b => b.id !== 'welkom' && b.id !== assistentId)
      .map(b => ({ role: b.role, content: b.content }))

    let volledigAntwoord = ''

    try {
      const res = await authFetch('/api/coach', {
        method: 'POST',
        body: JSON.stringify({
          berichten: api,
          ...(gebruikerContext ? { gebruiker_context: gebruikerContext } : {}),
        }),
      })

      if (!res.ok || !res.body) {
        let foutmelding = 'Kon de coach niet bereiken.'
        try {
          const json = await res.json()
          if (json.error) foutmelding = json.error
        } catch { /* geen JSON-body beschikbaar */ }
        setBerichten(prev => prev.map(b => b.id === assistentId
          ? { ...b, content: `Helaas kan ik je nu niet helpen. ${foutmelding}` }
          : b))
      } else {
        // De coach streamt platte tekst-tokens; lees ze incrementeel en
        // laat het antwoord live "typen" in de bestaande bubbel.
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          volledigAntwoord += decoder.decode(value, { stream: true })
          setBerichten(prev => prev.map(b => b.id === assistentId ? { ...b, content: volledigAntwoord } : b))
        }
      }
    } catch {
      setBerichten(prev => prev.map(b => b.id === assistentId
        ? { ...b, content: 'Er ging iets mis. Probeer het opnieuw.' }
        : b))
    }

    setLaden(false)
    inputRef.current?.focus()

    // Sla samenvatting op na elk 6e bericht, zodat de coach context onthoudt (niet-blokkerend)
    if (volledigAntwoord) {
      const voltooid = [...api, { role: 'assistant' as const, content: volledigAntwoord }]
      if (voltooid.length % 6 === 0) {
        authFetch('/api/coach/samenvatting', {
          method: 'POST',
          body: JSON.stringify({ berichten: voltooid }),
        }).catch(() => { /* stil falen */ })
      }
    }
  }

  const laatsteBericht = berichten[berichten.length - 1]
  const toonVervolgvragen = !laden && berichten.length > 1 && laatsteBericht?.role === 'assistant' && laatsteBericht.content.length > 0
  const heeftGeheugen = Boolean(gebruikerContext?.discPrimair || gebruikerContext?.domeinScores)

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
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: 72, height: 72, borderRadius: '50%',
              background: laden
                ? 'radial-gradient(circle, color-mix(in srgb, var(--mentaforce-primary) 22%, transparent) 0%, transparent 70%)'
                : 'radial-gradient(circle, color-mix(in srgb, var(--mentaforce-primary) 15%, transparent) 0%, transparent 70%)',
              zIndex: 0,
            }} />
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--mentaforce-primary-light)', color: 'var(--mentaforce-primary)',
              position: 'relative', zIndex: 1,
            }}>
              <Brain size={20} strokeWidth={1.5} aria-hidden />
            </div>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>MentaForce Coach</p>
            <p style={{ fontSize: 12, color: 'var(--text-4)' }}>
              AI-coach · Vertrouwelijk · 24/7 beschikbaar
              {heeftGeheugen && ' · Kent jouw profiel'}
            </p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--mentaforce-primary)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-4)' }}>Online</span>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {berichten.map((b) => {
            const isStreamendLeeg = laden && b.id === berichten[berichten.length - 1].id && b.role === 'assistant' && b.content.length === 0
            return (
              <div key={b.id} style={{ display: 'flex', justifyContent: b.role === 'user' ? 'flex-end' : 'flex-start', gap: 10 }}>
                {b.role === 'assistant' && (
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: 2,
                    background: 'var(--mentaforce-primary-light)', color: 'var(--mentaforce-primary)',
                  }}>
                    <Brain size={16} strokeWidth={1.5} aria-hidden />
                  </div>
                )}
                {isStreamendLeeg ? (
                  <div style={{
                    background: 'var(--bg-card)', padding: '12px 16px',
                    borderRadius: '18px 18px 18px 4px',
                    boxShadow: 'var(--shadow-card)',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <div className="mf-spinner" style={{ width: 14, height: 14 }} />
                    <span style={{ fontSize: 13, color: 'var(--text-3)' }}>denkt na…</span>
                  </div>
                ) : (
                  <div style={{
                    maxWidth: '78%', padding: '12px 16px',
                    fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap',
                    background: b.role === 'user' ? 'var(--mentaforce-primary)' : 'var(--bg-card)',
                    color: b.role === 'user' ? 'var(--bg-app)' : 'var(--text-1)',
                    boxShadow: b.role === 'assistant' ? 'var(--shadow-card)' : 'none',
                    borderRadius: b.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  }}>
                    {b.content}
                    {laden && b.id === berichten[berichten.length - 1].id && b.role === 'assistant' && (
                      <span className="mf-coach-cursor" aria-hidden />
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Suggestions — alleen vóór het eerste bericht */}
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
                    <s.icon size={13} strokeWidth={1.75} aria-hidden />{s.tekst}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Vervolgvragen — na elk antwoord van de coach */}
          {toonVervolgvragen && (
            <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-start', paddingLeft: 42 }}>
              {VERVOLGVRAGEN.map(s => (
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
                  <s.icon size={13} strokeWidth={1.75} aria-hidden />{s.tekst}
                </button>
              ))}
            </div>
          )}

          <div ref={onderRef} />
        </div>

        {/* Privacy note */}
        <div style={{ padding: '4px 16px', textAlign: 'center', flexShrink: 0 }}>
          <p style={{ fontSize: 12, color: 'var(--text-4)', opacity: 0.6 }}>
            Je coach onthoudt context tussen gesprekken om je beter te helpen · Nooit zichtbaar voor manager of HR
          </p>
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
              aria-label="Verstuur bericht"
              style={{
                flexShrink: 0, width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', cursor: input.trim() && !laden ? 'pointer' : 'default',
                background: input.trim() && !laden ? 'var(--mentaforce-primary)' : 'var(--border)',
                opacity: !input.trim() || laden ? 0.4 : 1,
                transition: 'background 0.15s ease, opacity 0.15s ease',
              }}
            >
              <Send
                size={14}
                strokeWidth={2.5}
                color={input.trim() && !laden ? 'var(--bg-app)' : 'var(--text-4)'}
                aria-hidden
              />
            </button>
          </div>
        </div>

      </main>
      <style>{`
        .mf-coach-cursor {
          display: inline-block;
          width: 2px;
          height: 14px;
          margin-left: 2px;
          vertical-align: text-bottom;
          background: var(--mentaforce-primary);
          animation: mf-coach-blink 0.9s step-end infinite;
        }
        @keyframes mf-coach-blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .mf-coach-cursor { animation: none; opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}

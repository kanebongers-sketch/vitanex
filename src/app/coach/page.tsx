'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { authFetch } from '@/lib/auth-fetch'
import Navbar from '@/components/layout/Navbar'

type Bericht = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const WELKOM = `Hallo! Ik ben jouw MentaForce Coach.

Ik ben hier om je te helpen met alles rondom welzijn op het werk  stress, energie, werk-privébalans, motivatie, slaap of gewoon even lucht geven.

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
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Navbar />
      <main className="flex justify-center mt-20">
        <div className="w-7 h-7 rounded-full border-2 border-gray-200 animate-spin" style={{ borderTopColor: 'var(--mentaforce-primary)' }} />
      </main>
    </div>
  )

  return (
    <div className="h-screen flex flex-col" style={{ background: 'var(--bg-app)' }}>
      <Navbar />
      <main className="flex-1 flex flex-col w-full overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 bg-white flex items-center gap-3 flex-shrink-0">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: 'var(--mentaforce-primary-light)', color: 'var(--mentaforce-primary)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-4.24z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-4.24z"/></svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">MentaForce Coach</p>
            <p className="text-xs text-gray-400">AI-coach · Vertrouwelijk · 24/7 beschikbaar</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-gray-400">Online</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-3">
          {berichten.map((b) => (
            <div key={b.id} className={`flex ${b.role === 'user' ? 'justify-end' : 'justify-start'} gap-2.5`}>
              {b.role === 'assistant' && (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5"
                  style={{ background: 'var(--mentaforce-primary-light)', color: 'var(--mentaforce-primary)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-4.24z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-4.24z"/></svg>
                </div>
              )}
              <div
                className="max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                style={{
                  background: b.role === 'user' ? 'var(--mentaforce-primary)' : 'white',
                  color: b.role === 'user' ? 'white' : '#1f2937',
                  boxShadow: b.role === 'assistant' ? '0 1px 3px rgba(0,0,0,0.07)' : 'none',
                  borderRadius: b.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                }}
              >
                {b.content}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {laden && (
            <div className="flex justify-start gap-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                style={{ background: 'var(--mentaforce-primary-light)', color: 'var(--mentaforce-primary)' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-4.24z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-4.24z"/></svg></div>
              <div className="bg-white px-4 py-3 rounded-2xl shadow-sm" style={{ borderRadius: '18px 18px 18px 4px' }}>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Suggestions  only before first user message */}
          {berichten.length === 1 && !laden && (
            <div className="mt-2">
              <p className="text-xs text-gray-400 mb-2 text-center">Kies een onderwerp om te beginnen</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTIES.map(s => (
                  <button
                    key={s.tekst}
                    onClick={() => verstuur(s.tekst)}
                    className="mf-pressable text-xs border border-gray-200 rounded-full px-3.5 py-1.5 text-gray-600 bg-white hover:bg-gray-50 transition flex items-center gap-1.5"
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
        <div className="px-4 py-1 text-center flex-shrink-0">
          <p className="text-xs text-gray-300">Gesprekken worden niet opgeslagen · Alleen zichtbaar voor jou</p>
        </div>

        {/* Input */}
        <div className="px-4 py-3 bg-white border-t border-gray-200 flex-shrink-0">
          <div className="flex items-end gap-2 rounded-2xl border border-gray-200 px-3 py-2" style={{ background: 'var(--bg-app)' }}>
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
              placeholder="Typ je bericht"
              disabled={laden}
              className="flex-1 bg-transparent text-sm outline-none resize-none leading-relaxed disabled:opacity-50"
              style={{ minHeight: 24, maxHeight: 120 }}
            />
            <button
              onClick={() => verstuur()}
              disabled={!input.trim() || laden}
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition disabled:opacity-30"
              style={{ background: input.trim() && !laden ? 'var(--mentaforce-primary)' : '#e5e7eb' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke={input.trim() && !laden ? 'white' : '#9ca3af'}
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

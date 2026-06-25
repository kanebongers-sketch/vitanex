'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { authFetch } from '@/lib/auth-fetch'
import PandaFace, { EmotionState } from '@/components/vita/PandaFace'
import CompanionBubble from '@/components/vita/CompanionBubble'
import { emotionFromScore, emotionFromEvent, getTimeOfDay } from '@/lib/vita/emotion-engine'
import { getPageGuide } from '@/lib/vita/page-guide'
import { laadXPData, berekenLevel, LEVEL_NAMEN, LEVEL_KLEUREN, xpVoortgang } from '@/lib/xp'
import type { VitaEventPayload } from '@/lib/vita/events'

const HIDDEN_ROUTES = [
  '/login', '/register', '/setup', '/uitnodiging',
  '/voorwaarden', '/wachtwoord-reset', '/wachtwoord-vergeten',
  '/onboarding', '/bedankt',
]

const READINESS_CACHE_KEY = 'vita-state-v1'
const COMPANION_CACHE_KEY = 'vita-companion-v1'
const VANDAAG_CACHE_KEY = 'vita-vandaag-v1'
const CACHE_TTL = 5 * 60 * 1000

type Persona = 'stoicijn' | 'optimizer' | 'mentor' | 'challenger' | 'wetenschapper'

interface ReadinessData {
  score: number
  label: string
  slaap_uren: number | null
  stress_niveau: number | null
  stemming_waarde: number | null
  streak: number
  heeft_data: boolean
}

interface CompanionData {
  persona: Persona
  level: number
  xp_total: number
  onboarding_goal: string | null
}

interface ChecklistItem {
  id: string
  icoon: string
  titel: string
  status: 'open' | 'gedaan'
  detail: string
  url: string
}

interface VandaagData {
  checklist: ChecklistItem[]
  scores: { gedaan: number; totaal: number; score_pct: number }
}

interface CacheEntry<T> { data: T; ts: number }

function getCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw) as CacheEntry<T>
    if (Date.now() - ts > CACHE_TTL) return null
    return data
  } catch { return null }
}

function setCache<T>(key: string, data: T) {
  try { localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })) } catch {}
}

function clearCache(key: string) {
  try { localStorage.removeItem(key) } catch {}
}

// Bijhouden welke pagina's je al "ontdekt" hebt, zodat VITA elke zone één keer
// uitlegt — als een game die een nieuw gebied onthult.
const SEEN_PAGES_KEY = 'vita-seen-pages-v1'

function getSeenPages(): string[] {
  try { return JSON.parse(localStorage.getItem(SEEN_PAGES_KEY) ?? '[]') as string[] } catch { return [] }
}

function markPageSeen(path: string) {
  try {
    const seen = getSeenPages()
    if (!seen.includes(path)) localStorage.setItem(SEEN_PAGES_KEY, JSON.stringify([...seen, path]))
  } catch {}
}

function orbColor(score: number): [number, number, number] {
  if (score >= 80) return [0.114, 0.620, 0.459]
  if (score >= 60) return [0.231, 0.510, 0.965]
  if (score >= 40) return [0.949, 0.722, 0.141]
  return [0.886, 0.294, 0.290]
}

function orbIntensity(score: number): number {
  return 0.25 + (score / 100) * 0.45
}

function scoreLabel(score: number): string {
  if (score >= 85) return 'Uitstekend'
  if (score >= 70) return 'Vitaal'
  if (score >= 55) return 'Stabiel'
  if (score >= 40) return 'Aandacht'
  return 'Herstel'
}

function scoreColor(score: number): string {
  if (score >= 70) return 'var(--mf-green)'
  if (score >= 55) return '#5B8DF0'
  if (score >= 40) return 'var(--mf-amber)'
  return 'var(--mf-red)'
}

const PERSONA_LABELS: Record<Persona, string> = {
  stoicijn: 'De Stoïcijn',
  optimizer: 'De Optimizer',
  mentor: 'De Mentor',
  challenger: 'De Challenger',
  wetenschapper: 'De Wetenschapper',
}

const PERSONA_COLORS: Record<Persona, string> = {
  stoicijn: 'rgba(180,180,200,0.12)',
  optimizer: 'rgba(29,158,117,0.12)',
  mentor: 'rgba(167,139,250,0.12)',
  challenger: 'rgba(226,75,74,0.12)',
  wetenschapper: 'rgba(91,141,240,0.12)',
}

const PERSONA_ACCENT: Record<Persona, string> = {
  stoicijn: '#b4b4c8',
  optimizer: '#1D9E75',
  mentor: '#A78BFA',
  challenger: '#E24B4A',
  wetenschapper: '#5B8DF0',
}

function vitaMessage(d: ReadinessData, persona: Persona): string {
  if (!d.heeft_data) {
    if (persona === 'challenger') return 'Geen data. Vul je check-in in — praten helpt niet, actie wel.'
    if (persona === 'stoicijn') return 'Begin met meten. Wat niet gemeten wordt, kan niet verbeterd worden.'
    if (persona === 'wetenschapper') return 'Nulpunt vereist. Vul je eerste check-in in voor een baseline.'
    if (persona === 'optimizer') return 'Geen data = geen optimalisatie. Start je eerste check-in.'
    return 'Vul je eerste check-in in — VITA leert jouw patroon kennen.'
  }

  const slaap = d.slaap_uren !== null ? Number(d.slaap_uren) : null
  const stress = d.stress_niveau
  const { score, streak } = d

  if (slaap !== null && slaap < 6) {
    if (persona === 'stoicijn') return `${slaap.toFixed(1)}u slaap. Onvoldoende. Herstel staat vandaag centraal.`
    if (persona === 'optimizer') return `${slaap.toFixed(1)}u slaap kost je ~18% cognitieve prestatie. Prioriteit: herstel.`
    if (persona === 'challenger') return `${slaap.toFixed(1)}u. Dat is structureel onvoldoende. Wanneer pak je dit aan?`
    if (persona === 'wetenschapper') return `Slaaptekort detecteerd: ${slaap.toFixed(1)}u. Adenosine stapelt — cognitie daalt.`
    return `Slaap van ${slaap.toFixed(1)}u — herstel staat vandaag centraal.`
  }

  if (stress !== null && stress >= 4) {
    if (persona === 'stoicijn') return 'Hoge stress. Analyseer de bron. Elimineer of accepteer — geen derde optie.'
    if (persona === 'optimizer') return 'Stressniveau verstoort je HRV-herstel. Eén ademhalingsmoment vandaag.'
    if (persona === 'challenger') return 'Hoge stress. Dit is niet duurzaam. Wat ga je vandaag anders doen?'
    if (persona === 'wetenschapper') return 'Verhoogd cortisolniveau verwacht. Parasympathische activatie aanbevolen.'
    return 'Hoog stressniveau gedetecteerd. Eén herstelmoment maakt het verschil.'
  }

  if (score >= 80) {
    if (streak >= 14) {
      if (persona === 'stoicijn') return `${streak} dagen. Dat is discipline worden tot karakter.`
      if (persona === 'optimizer') return `${streak} dagen consistentie. Je systeem reageert — patronen worden zichtbaar.`
      if (persona === 'challenger') return `${streak} dagen. Niet slecht. Hoelang hou je het vol?`
      if (persona === 'wetenschapper') return `${streak} aaneengesloten dagen — neurologische gewoontepaden versterken.`
      return `${streak} dagen consistentie. Jouw systeem reageert — patronen worden zichtbaar.`
    }
    if (persona === 'stoicijn') return 'Alle signalen staan op groen. Gebruik deze dag zoals hij bedoeld is.'
    if (persona === 'optimizer') return 'Optimale readiness. Ideaal moment voor intensieve sessies of diep werk.'
    if (persona === 'wetenschapper') return 'HRV-herstel naar verwachting optimaal. Maximale output mogelijk vandaag.'
    return 'Alle signalen staan op groen. Dit is een krachtige dag.'
  }

  if (score >= 60) {
    if (persona === 'stoicijn') return 'Je staat er goed voor. Doe wat je gepland hebt.'
    if (persona === 'optimizer') return 'Goede baseline. Kleine acties vandaag bouwen morgen\'s resultaat.'
    if (persona === 'mentor') return 'Goed geslapen. Gebruik die energie vandaag doelbewust.'
    return 'Je staat er goed voor. VITA houdt jouw patronen in de gaten.'
  }

  if (persona === 'stoicijn') return 'Signalen zijn matig. Pas je planning aan — doe wat nodig is.'
  if (persona === 'mentor') return 'VITA monitort jouw signalen. Check je voortgang voor een persoonlijk inzicht.'
  return 'VITA monitort jouw signalen. Check je voortgang voor een persoonlijk inzicht.'
}

// Eén bron van waarheid voor het level: dezelfde Fit Level-logica als /niveau
// en /achievements, zodat de panda nooit een ander getal toont.
function XpBar({ xp }: { xp: number }) {
  const level = berekenLevel(xp)
  const { pct, nodig } = xpVoortgang(xp, level)
  const kleur = LEVEL_KLEUREN[level] ?? '#5B8DF0'

  return (
    <div style={{ padding: '0 14px 12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Level {level} · {LEVEL_NAMEN[level]}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-3)' }}>
          {level >= 10 ? 'Max' : `nog ${nodig} XP`}
        </span>
      </div>
      <div style={{ height: 3, background: 'var(--bg-subtle)', borderRadius: 100, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: kleur,
            borderRadius: 100,
            transition: 'width 0.6s ease',
          }}
        />
      </div>
    </div>
  )
}

// Dagelijkse quests — de open acties van vandaag, in één tik te starten.
function QuestList({ checklist, onGo }: { checklist: ChecklistItem[]; onGo: (url: string) => void }) {
  const open = checklist.filter(i => i.status === 'open')
  const gedaan = checklist.length - open.length

  return (
    <div style={{ padding: '0 14px 12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
          Vandaag
        </span>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)' }}>
          {gedaan}/{checklist.length} gedaan
        </span>
      </div>

      {open.length === 0 ? (
        <div style={{
          padding: '12px 13px',
          background: 'var(--mf-green-light, #E1F5EE)',
          borderRadius: 12,
          fontSize: 12.5,
          fontWeight: 600,
          color: 'var(--mf-green-dark, #0F6E56)',
          textAlign: 'center',
        }}>
          Je dag is compleet — sterk gedaan! ✨
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {open.slice(0, 3).map(item => (
            <button
              key={item.id}
              onClick={() => onGo(item.url)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '9px 11px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                borderRadius: 11,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color 0.15s ease',
              }}
            >
              <span style={{
                width: 18, height: 18, flexShrink: 0,
                borderRadius: '50%',
                border: '1.5px solid var(--border-strong)',
              }} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-1)' }}>
                  {item.titel}
                </span>
                <span style={{ display: 'block', fontSize: 10.5, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.detail}
                </span>
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-4)', flexShrink: 0 }}>›</span>
            </button>
          ))}
          {open.length > 3 && (
            <span style={{ fontSize: 10.5, color: 'var(--text-4)', textAlign: 'center', marginTop: 2 }}>
              +{open.length - 3} meer
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function PersonaSelector({
  current,
  onSelect,
  loading,
}: {
  current: Persona
  onSelect: (p: Persona) => void
  loading: boolean
}) {
  const personas: Persona[] = ['stoicijn', 'optimizer', 'mentor', 'challenger', 'wetenschapper']

  return (
    <div style={{ padding: '0 14px 14px' }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>
        Persoonlijkheid
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {personas.map(p => (
          <button
            key={p}
            onClick={() => !loading && onSelect(p)}
            disabled={loading}
            style={{
              padding: '4px 10px',
              borderRadius: 100,
              border: `1px solid ${p === current ? PERSONA_ACCENT[p] : 'var(--border)'}`,
              background: p === current ? PERSONA_COLORS[p] : 'transparent',
              color: p === current ? PERSONA_ACCENT[p] : 'var(--text-3)',
              fontSize: 11,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.15s ease',
            }}
          >
            {PERSONA_LABELS[p].replace('De ', '')}
          </button>
        ))}
      </div>
    </div>
  )
}

const ORB_SIZE = 56
const ORB_POS_KEY = 'vita-orb-pos'

export default function VitaCompanion() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<ReadinessData | null>(null)
  const [companion, setCompanion] = useState<CompanionData | null>(null)
  const [vandaag, setVandaag] = useState<VandaagData | null>(null)
  const [xp, setXp] = useState<number>(0)
  const [personaLoading, setPersonaLoading] = useState(false)
  const [emotion, setEmotion] = useState<EmotionState>('calm')
  const [bubble, setBubble] = useState<{ message: string; emotion: EmotionState } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null)
  const didDrag = useRef(false)
  const lastNudgeRef = useRef<number>(0)
  const emotionResetRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isHidden = HIDDEN_ROUTES.some(r => pathname.startsWith(r))

  const loadReadiness = useCallback(async () => {
    const cached = getCache<ReadinessData>(READINESS_CACHE_KEY)
    if (cached) {
      setData(cached)
      setEmotion(emotionFromScore(cached.score))
      return
    }
    try {
      const res = await authFetch('/api/readiness')
      if (!res.ok) return
      const json = await res.json() as ReadinessData
      setData(json)
      setEmotion(emotionFromScore(json.score))
      setCache(READINESS_CACHE_KEY, json)
    } catch {}
  }, [])

  const loadCompanion = useCallback(async () => {
    const cached = getCache<CompanionData>(COMPANION_CACHE_KEY)
    if (cached) { setCompanion(cached); return }
    try {
      const res = await authFetch('/api/vita/companion')
      if (!res.ok) return
      const json = await res.json() as CompanionData
      setCompanion(json)
      setCache(COMPANION_CACHE_KEY, json)
    } catch {}
  }, [])

  const loadVandaag = useCallback(async () => {
    const cached = getCache<VandaagData>(VANDAAG_CACHE_KEY)
    if (cached) { setVandaag(cached); return }
    try {
      const res = await authFetch('/api/vandaag')
      if (!res.ok) return
      const json = await res.json() as VandaagData
      setVandaag(json)
      setCache(VANDAAG_CACHE_KEY, json)
    } catch {}
  }, [])

  useEffect(() => {
    if (!isHidden) {
      loadReadiness()
      loadCompanion()
      loadVandaag()
      setXp(laadXPData().xp)
    }
  }, [isHidden, loadReadiness, loadCompanion, loadVandaag])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(ORB_POS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as { x: number; y: number }
        const clampedX = Math.min(Math.max(0, parsed.x), window.innerWidth - ORB_SIZE)
        const clampedY = Math.min(Math.max(0, parsed.y), window.innerHeight - ORB_SIZE)
        setPos({ x: clampedX, y: clampedY })
        return
      }
    } catch {}
    setPos({ x: window.innerWidth - 24 - ORB_SIZE, y: window.innerHeight - 24 - ORB_SIZE })
  }, [])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return
      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) didDrag.current = true
      const x = Math.min(Math.max(0, dragRef.current.posX + dx), window.innerWidth - ORB_SIZE)
      const y = Math.min(Math.max(0, dragRef.current.posY + dy), window.innerHeight - ORB_SIZE)
      setPos({ x, y })
    }
    const onUp = () => {
      if (!dragRef.current) return
      dragRef.current = null
      setPos(prev => {
        if (prev) {
          try { localStorage.setItem(ORB_POS_KEY, JSON.stringify(prev)) } catch {}
        }
        return prev
      })
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  useEffect(() => {
    const handler = (e: Event) => {
      const { type } = (e as CustomEvent<VitaEventPayload>).detail
      // Houd level en dagquests vers na een actie — directe beloning.
      setXp(laadXPData().xp)
      if (['check_in_completed', 'data_logged', 'mood_logged', 'habit_completed', 'goal_achieved'].includes(type)) {
        clearCache(VANDAAG_CACHE_KEY)
        loadVandaag()
      }
      const newEmotion = emotionFromEvent(type)
      if (newEmotion) {
        if (emotionResetRef.current) clearTimeout(emotionResetRef.current)
        setEmotion(newEmotion)
        emotionResetRef.current = setTimeout(() => {
          setEmotion(prev => prev)
        }, 8000)
      }
      const now = Date.now()
      if (now - lastNudgeRef.current < 90000) return
      const bubbleMessages: Partial<Record<string, string>> = {
        goal_achieved:      'Yes! Doel bereikt 🎉',
        streak_milestone:   'Streak milestone! Je bent consistent 🔥',
        level_up:           'Level up! Je companion groeit met je mee ⬆️',
        check_in_completed: 'Check-in gedaan! Ik houd je voortgang bij 📊',
      }
      if (bubbleMessages[type] && !open) {
        lastNudgeRef.current = now
        setBubble({ message: bubbleMessages[type]!, emotion: newEmotion ?? emotion })
      }
    }
    window.addEventListener('vita:event', handler)
    return () => window.removeEventListener('vita:event', handler)
  }, [open, emotion, loadVandaag])

  useEffect(() => {
    if (!companion || !data) return
    const sessionKey = 'vita-nudge-v1'
    if (sessionStorage.getItem(sessionKey)) return
    const tod = getTimeOfDay()
    const nudges: Partial<Record<string, { message: string; emotion: EmotionState }>> = {
      morning: { message: 'Goedemorgen! Klaar voor een nieuwe dag? 🌅', emotion: 'curious' },
      evening: { message: 'Hoe was je dag? Vergeet je avond reflectie niet 🌙', emotion: 'supportive' },
    }
    const nudge = nudges[tod]
    if (nudge) {
      sessionStorage.setItem(sessionKey, '1')
      const timer = setTimeout(() => {
        setEmotion(nudge.emotion)
        setBubble(nudge)
      }, 3500)
      return () => clearTimeout(timer)
    }
  }, [companion, data])

  // Per-pagina uitleg: de eerste keer dat je een nieuwe zone betreedt, legt VITA
  // 'm in één zin uit. Daarna stil — geen genag bij elke navigatie.
  useEffect(() => {
    if (isHidden || open) return
    const guide = getPageGuide(pathname)
    if (!guide) return
    if (getSeenPages().includes(pathname)) return
    const timer = setTimeout(() => {
      markPageSeen(pathname)
      setEmotion(guide.emotion)
      setBubble(prev => prev ?? { message: guide.uitleg, emotion: guide.emotion })
    }, 1200)
    return () => clearTimeout(timer)
  }, [pathname, isHidden, open])

  const handlePersonaChange = async (persona: Persona) => {
    if (!companion || companion.persona === persona) return
    setPersonaLoading(true)
    const prev = companion
    setCompanion({ ...companion, persona })
    clearCache(COMPANION_CACHE_KEY)
    try {
      const res = await authFetch('/api/vita/companion', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona }),
      })
      if (res.ok) {
        const json = await res.json() as CompanionData
        setCompanion(json)
        setCache(COMPANION_CACHE_KEY, json)
      } else {
        setCompanion(prev)
      }
    } catch {
      setCompanion(prev)
    } finally {
      setPersonaLoading(false)
    }
  }

  if (isHidden || !data) return null

  const persona = companion?.persona ?? 'mentor'
  const label = scoreLabel(data.score)
  const accentColor = scoreColor(data.score)
  const message = vitaMessage(data, persona)
  const guide = getPageGuide(pathname)
  const gaNaar = (url: string) => { setOpen(false); router.push(url) }

  if (!pos) return null

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: pos.y,
        left: pos.x,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 10,
        userSelect: 'none',
      }}
    >
      {bubble && !open && (
        <CompanionBubble
          message={bubble.message}
          emotion={bubble.emotion}
          onDismiss={() => setBubble(null)}
        />
      )}

      {open && (
        <div
          style={{
            width: 292,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-strong)',
            borderRadius: 20,
            boxShadow: '0 20px 60px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            animation: 'vita-slide-up 0.22s cubic-bezier(0.16,1,0.3,1) both',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '14px 16px 12px',
            borderBottom: '1px solid var(--border)',
          }}>
            <div style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: accentColor,
              boxShadow: `0 0 8px ${accentColor}`,
              flexShrink: 0,
            }} />
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--text-3)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              flex: 1,
            }}>
              VITA
            </span>
            {companion && (
              <span style={{
                fontSize: 10,
                fontWeight: 600,
                color: PERSONA_ACCENT[persona],
                background: PERSONA_COLORS[persona],
                padding: '2px 7px',
                borderRadius: 100,
                letterSpacing: '0.04em',
              }}>
                {PERSONA_LABELS[persona]}
              </span>
            )}
            <button
              onClick={() => setOpen(false)}
              style={{
                width: 24,
                height: 24,
                borderRadius: 7,
                border: 'none',
                background: 'var(--bg-subtle)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-3)',
                fontSize: 12,
                fontWeight: 700,
                lineHeight: 1,
                marginLeft: 4,
              }}
              aria-label="Sluit VITA"
            >
              ✕
            </button>
          </div>

          {/* Orb + Score */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '16px 20px 12px',
          }}>
            <div style={{
              width: 80,
              height: 80,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}>
              <PandaFace emotion={emotion} size={90} />
            </div>
            <div>
              <div style={{
                fontSize: 42,
                fontWeight: 900,
                color: 'var(--text-1)',
                letterSpacing: '-0.05em',
                lineHeight: 1,
              }}>
                {data.score}
              </div>
              <div style={{
                fontSize: 13,
                fontWeight: 700,
                color: accentColor,
                marginTop: 3,
              }}>
                {label}
              </div>
              {data.streak > 0 && (
                <div style={{
                  fontSize: 11,
                  color: 'var(--text-3)',
                  marginTop: 5,
                  fontWeight: 500,
                }}>
                  🔥 {data.streak} {data.streak === 1 ? 'dag' : 'dagen'} op rij
                </div>
              )}
            </div>
          </div>

          {/* Message */}
          <div style={{
            margin: '0 14px 14px',
            padding: '11px 13px',
            background: 'var(--bg-subtle)',
            borderRadius: 12,
            fontSize: 13,
            color: 'var(--text-2)',
            lineHeight: 1.6,
            fontStyle: 'italic',
          }}>
            &ldquo;{message}&rdquo;
          </div>

          {/* Page guide — wat is deze pagina + je volgende stap */}
          {guide && (
            <div style={{
              margin: '0 14px 14px',
              padding: '12px 13px',
              background: 'var(--mf-green-light, #E1F5EE)',
              borderRadius: 12,
              border: '1px solid rgba(29,158,117,0.20)',
            }}>
              <div style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                color: 'var(--mf-green-dark, #0F6E56)',
                marginBottom: 5,
              }}>
                Op deze pagina · {guide.label}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.55 }}>
                {guide.uitleg}
              </div>
              {guide.stap && (
                <div style={{ marginTop: 9, paddingTop: 9, borderTop: '1px solid rgba(29,158,117,0.18)' }}>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--mf-green-dark, #0F6E56)',
                  }}>
                    Volgende stap
                  </span>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-1)', lineHeight: 1.5, marginTop: 3 }}>
                    {guide.stap}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dagelijkse quests */}
          {vandaag && vandaag.checklist.length > 0 && (
            <QuestList checklist={vandaag.checklist} onGo={gaNaar} />
          )}

          {/* Data chips */}
          {data.heeft_data && (
            <div style={{
              padding: '0 14px 12px',
              display: 'flex',
              gap: 6,
              flexWrap: 'wrap',
            }}>
              {data.slaap_uren !== null && (
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '3px 9px',
                  borderRadius: 100,
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-3)',
                }}>
                  😴 {Number(data.slaap_uren).toFixed(1)}u slaap
                </span>
              )}
              {data.stress_niveau !== null && (
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '3px 9px',
                  borderRadius: 100,
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-3)',
                }}>
                  ⚡ Stress {data.stress_niveau}/5
                </span>
              )}
              {data.stemming_waarde !== null && (
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '3px 9px',
                  borderRadius: 100,
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-3)',
                }}>
                  😊 Stemming {data.stemming_waarde}/5
                </span>
              )}
            </div>
          )}

          {/* XP bar — Fit Level (zelfde bron als /niveau) */}
          <XpBar xp={xp} />

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--border)', margin: '0 14px' }} />

          {/* Persona selector */}
          {companion && (
            <PersonaSelector
              current={persona}
              onSelect={handlePersonaChange}
              loading={personaLoading}
            />
          )}
        </div>
      )}

      {/* Orb trigger button */}
      <button
        onMouseDown={(e) => {
          e.preventDefault()
          didDrag.current = false
          dragRef.current = { startX: e.clientX, startY: e.clientY, posX: pos.x, posY: pos.y }
        }}
        onClick={() => {
          if (didDrag.current) return
          setOpen(v => !v)
        }}
        title="VITA — jouw gezondheidscompanion"
        aria-label="Open VITA gezondheidscompanion"
        style={{
          cursor: 'grab',
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: `1.5px solid ${open ? accentColor : 'var(--border-strong)'}`,
          background: 'var(--bg-card)',
          boxShadow: open
            ? `0 8px 32px rgba(0,0,0,0.14), 0 0 24px ${accentColor}33`
            : '0 4px 16px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: 0,
          transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
          animation: 'vita-orb-appear 0.35s cubic-bezier(0.16,1,0.3,1) both',
        }}
      >
        <PandaFace emotion={emotion} size={56} animate />
      </button>
    </div>
  )
}

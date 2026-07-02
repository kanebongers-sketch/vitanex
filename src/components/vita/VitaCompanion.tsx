'use client'

import { useEffect, useState, useRef, useCallback, type CSSProperties } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { X, Flame, Moon, Zap, Smile, Sparkles, ChevronRight } from 'lucide-react'
import { authFetch } from '@/lib/auth-fetch'
import PandaFace, { EmotionState } from '@/components/vita/PandaFace'
import TalkToVita from '@/components/vita/TalkToVita'
import CelebrationBurst from '@/components/vita/CelebrationBurst'
import { emotionFromScore, emotionFromEvent, getTimeOfDay, celebrationMessage } from '@/lib/vita/emotion-engine'
import { getPageGuide } from '@/lib/vita/page-guide'
import { laadXPData, berekenLevel, LEVEL_NAMEN, LEVEL_KLEUREN, xpVoortgang } from '@/lib/xp'
import { isCelebrationEvent, type VitaEventPayload } from '@/lib/vita/events'

// Route waar het echte Vita-gesprek leeft. Companion deeplinkt ernaartoe.
const COACH_ROUTE = '/coach'

const HIDDEN_ROUTES = [
  '/login', '/register', '/setup', '/uitnodiging',
  '/voorwaarden', '/wachtwoord-reset', '/wachtwoord-vergeten',
  '/onboarding', '/bedankt',
]

const READINESS_CACHE_KEY = 'vita-state-v1'
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

// Bijhouden welke pagina's je al "ontdekt" hebt, zodat Vita elke zone één keer
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

function scoreLabel(score: number): string {
  if (score >= 85) return 'Uitstekend'
  if (score >= 70) return 'Vitaal'
  if (score >= 55) return 'Stabiel'
  if (score >= 40) return 'Aandacht'
  return 'Herstel'
}

// Status-accent volgt het navy/cyan-systeem: cyaan = goed, inkt-grijs = neutraal,
// amber = aandacht, rood = herstel. Geen losse hex — alles via tokens.
function scoreColor(score: number): string {
  if (score >= 70) return 'var(--mentaforce-primary)'
  if (score >= 55) return 'var(--text-2)'
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

// Strikt twee-tonig: persona's worden onderscheiden via hun tekstlabel, niet via
// een eigen kleur (zie accessibility.md — niet op kleur alleen leunen). De badge
// gebruikt het cyaan-accent + een subtiele cyaan-tint; alles via tokens.
const PERSONA_TINT = 'var(--mentaforce-primary-light)'
const PERSONA_ACCENT_COLOR = 'var(--mentaforce-primary)'

// Warme ik-vorm: Vita praat als companion die je kent, niet als monitor.
// Geen verzonnen percentages of jargon — alleen wat we echt uit de data weten.
function vitaMessage(d: ReadinessData, persona: Persona): string {
  if (!d.heeft_data) {
    if (persona === 'challenger') return 'Ik heb nog geen data van je. Doe je eerste check-in — dan kan ik je echt uitdagen.'
    if (persona === 'stoicijn') return 'Ik begin graag bij het begin: doe je eerste check-in, dan weten we waar je staat.'
    if (persona === 'wetenschapper') return 'Ik heb een nulpunt nodig. Vul je eerste check-in in, dan bouw ik jouw baseline op.'
    if (persona === 'optimizer') return 'Zonder data kan ik nog niets voor je fijnslijpen. Start met je eerste check-in.'
    return 'Vul je eerste check-in in — dan leer ik jouw patroon kennen.'
  }

  const slaap = d.slaap_uren !== null ? Number(d.slaap_uren) : null
  const stress = d.stress_niveau
  const { score, streak } = d

  if (slaap !== null && slaap < 6) {
    if (persona === 'stoicijn') return `Ik zie dat je maar ${slaap.toFixed(1)}u sliep — vandaag draait om herstel, zonder ruis.`
    if (persona === 'optimizer') return `${slaap.toFixed(1)}u slaap ga je merken in je focus. Ik zou vandaag inzetten op herstel.`
    if (persona === 'challenger') return `${slaap.toFixed(1)}u slaap — dat houd je niet vol. Wat doe je vanavond anders?`
    if (persona === 'wetenschapper') return `Slaaptekort gedetecteerd: ${slaap.toFixed(1)}u. Ik zou herstel vandaag voorrang geven.`
    return `Ik zie dat je maar ${slaap.toFixed(1)}u sliep — vandaag draait om herstel.`
  }

  if (stress !== null && stress >= 4) {
    if (persona === 'stoicijn') return 'Ik zie hoge stress bij je. Kijk rustig wat de bron is — en wat je vandaag kunt loslaten.'
    if (persona === 'optimizer') return 'Je stress staat hoog. Eén bewust ademhalingsmoment vandaag helpt je al herstellen.'
    if (persona === 'challenger') return 'Ik zie hoge stress bij je. Wat ga je vandaag anders doen?'
    if (persona === 'wetenschapper') return 'Je stressniveau is hoog — ik zou vandaag bewust een herstelmoment inplannen.'
    return 'Ik zie een hoog stressniveau bij je. Eén herstelmoment maakt vandaag het verschil.'
  }

  if (score >= 80) {
    if (streak >= 14) {
      if (persona === 'stoicijn') return `${streak} dagen op rij — dat is discipline die karakter wordt.`
      if (persona === 'optimizer') return `${streak} dagen consistentie. Ik zie je patronen steeds duidelijker worden.`
      if (persona === 'challenger') return `${streak} dagen op rij. Sterk — hoelang houd je dit vol?`
      if (persona === 'wetenschapper') return `${streak} dagen op rij — zo wordt een gewoonte echt onderdeel van je routine.`
      return `${streak} dagen consistentie. Ik zie je patronen steeds duidelijker worden.`
    }
    if (persona === 'stoicijn') return 'Al je signalen staan goed. Gebruik deze dag zoals je hem bedoeld hebt.'
    if (persona === 'optimizer') return 'Je zit vandaag op je best — een mooi moment voor diep werk of een stevige sessie.'
    if (persona === 'wetenschapper') return 'Al je signalen staan goed — vandaag kun je veel aan.'
    return 'Al je signalen staan op groen. Ik zie een krachtige dag voor je.'
  }

  if (score >= 60) {
    if (persona === 'stoicijn') return 'Je staat er goed voor. Doe wat je gepland hebt.'
    if (persona === 'optimizer') return 'Een goede basis vandaag. Kleine acties nu bouwen aan morgen.'
    if (persona === 'mentor') return 'Je staat er goed voor — gebruik die energie vandaag doelbewust.'
    return 'Je staat er goed voor. Ik houd je patronen voor je in de gaten.'
  }

  if (persona === 'stoicijn') return 'Je signalen zijn vandaag matig. Pas je planning aan — doe wat nodig is, niet meer.'
  return 'Ik zie dat het wat minder loopt. Kijk bij je voortgang — ik denk met je mee.'
}

// Vita kiest zijn toon op basis van wat je op dit moment nodig hebt — niet via
// een handmatige keuze. Volgorde van prioriteit: eerst steun bij zwaarte.
function aanbevolenPersona(d: ReadinessData): { persona: Persona; reden: string } {
  if (!d.heeft_data) {
    return { persona: 'mentor', reden: 'Je begint net — ik help je rustig op weg.' }
  }

  const slaap = d.slaap_uren !== null ? Number(d.slaap_uren) : null
  const stress = d.stress_niveau
  const stemming = d.stemming_waarde

  // Onder druk of laag → je hebt steun nodig → Mentor
  if ((stress !== null && stress >= 4) || (stemming !== null && stemming <= 2) || d.score < 40) {
    return { persona: 'mentor', reden: 'Het is even zwaar — ik ben er rustig en steunend voor je.' }
  }
  // Uitgeput (weinig slaap) → kalmte en herstel → Stoïcijn
  if (slaap !== null && slaap < 6) {
    return { persona: 'stoicijn', reden: 'Je bent moe — vandaag draait om herstel, zonder ruis.' }
  }
  // Op dreef (hoge score én streak) → je kunt uitdaging aan → Challenger
  if (d.score >= 80 && d.streak >= 7) {
    return { persona: 'challenger', reden: 'Je loopt sterk — ik daag je uit om scherp te blijven.' }
  }
  // Goed bezig, aan het bouwen → fijnslijpen → Optimizer
  if (d.score >= 60) {
    return { persona: 'optimizer', reden: 'Je staat er goed voor — laten we fijnslijpen.' }
  }
  // Rest → rustige begeleiding → Mentor
  return { persona: 'mentor', reden: 'Ik stem mijn toon af op hoe het met je gaat.' }
}

// Eén bron van waarheid voor het level: dezelfde Fit Level-logica als /niveau
// en /achievements, zodat de panda nooit een ander getal toont.
function XpBar({ xp }: { xp: number }) {
  const level = berekenLevel(xp)
  const { pct, nodig } = xpVoortgang(xp, level)
  const kleur = LEVEL_KLEUREN[level] ?? 'var(--mentaforce-primary)'

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
        {/* scaleX i.p.v. width: alleen compositor-vriendelijke properties animeren */}
        <div
          style={{
            height: '100%',
            width: '100%',
            background: kleur,
            borderRadius: 100,
            transform: `scaleX(${pct / 100})`,
            transformOrigin: 'left',
            transition: 'transform 0.6s var(--ease)',
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
          padding: '12px 13px',
          background: 'var(--mentaforce-primary-light)',
          borderRadius: 12,
          fontSize: 12.5,
          fontWeight: 600,
          color: 'var(--mentaforce-primary-dark)',
        }}>
          <Sparkles size={15} aria-hidden="true" strokeWidth={2} />
          Je dag is compleet — sterk gedaan!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {open.slice(0, 3).map(item => (
            <button
              key={item.id}
              className="vita-focusable"
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
              <ChevronRight size={16} color="var(--text-4)" aria-hidden="true" style={{ flexShrink: 0 }} />
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

// Leest uit waaróm Vita nu deze toon kiest — geen handmatige keuze meer.
function PersonaUitleg({ persona, reden }: { persona: Persona; reden: string }) {
  return (
    <div style={{ padding: '0 14px 14px' }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>
        Vita past zich aan je aan
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '10px 12px',
        background: PERSONA_TINT,
        border: '1px solid var(--border)',
        borderRadius: 12,
      }}>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          color: PERSONA_ACCENT_COLOR,
          background: 'var(--bg-card)',
          padding: '2px 8px',
          borderRadius: 100,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          {PERSONA_LABELS[persona]}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
          {reden}
        </span>
      </div>
    </div>
  )
}

const ORB_SIZE = 56
const ORB_POS_KEY = 'vita-orb-pos'

// Gedeelde stijl voor de data-chips (slaap/stress/stemming) — één bron, geen
// duplicatie. Icoon + label naast elkaar, alles via tokens.
const dataChipStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  fontSize: 11,
  fontWeight: 600,
  padding: '3px 9px',
  borderRadius: 100,
  background: 'var(--bg-subtle)',
  border: '1px solid var(--border)',
  color: 'var(--text-3)',
}

export default function VitaCompanion() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [toonMeer, setToonMeer] = useState(false)
  const [data, setData] = useState<ReadinessData | null>(null)
  const [vandaag, setVandaag] = useState<VandaagData | null>(null)
  const [xp, setXp] = useState<number>(0)
  const [emotion, setEmotion] = useState<EmotionState>('calm')
  const [bubble, setBubble] = useState<{ message: string; emotion: EmotionState } | null>(null)
  // Viering-moment: telkens een nieuw id, zodat de glow-puls opnieuw afspeelt.
  const [celebrateId, setCelebrateId] = useState<number>(0)
  const celebrateResetRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const orbRef = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null)
  const didDrag = useRef(false)
  const lastNudgeRef = useRef<number>(0)
  const emotionResetRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const restEmotionRef = useRef<EmotionState>('calm')   // score-gebaseerde rust-emotie om naar terug te keren

  const isHidden = HIDDEN_ROUTES.some(r => pathname.startsWith(r))

  const loadReadiness = useCallback(async () => {
    const cached = getCache<ReadinessData>(READINESS_CACHE_KEY)
    if (cached) {
      setData(cached)
      const rust = emotionFromScore(cached.score)
      restEmotionRef.current = rust
      setEmotion(rust)
      return
    }
    try {
      const res = await authFetch('/api/readiness')
      if (!res.ok) return
      const json = await res.json() as ReadinessData
      setData(json)
      const rust = emotionFromScore(json.score)
      restEmotionRef.current = rust
      setEmotion(rust)
      setCache(READINESS_CACHE_KEY, json)
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
      loadVandaag()
      setXp(laadXPData().xp)
    }
  }, [isHidden, loadReadiness, loadVandaag])

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
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      // Sluit het paneel én geef de focus terug aan de orb-knop, zodat
      // toetsenbordgebruikers niet de focus kwijtraken (WCAG focus-management).
      setOpen(prev => {
        if (prev) orbRef.current?.focus()
        return false
      })
    }
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
    // Pointer events i.p.v. muis-events, zodat slepen ook op touch/mobiel werkt.
    const onMove = (e: PointerEvent) => {
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
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [])

  // Houd de panda binnen beeld bij resize of schermrotatie — anders kan een
  // opgeslagen positie buiten de nieuwe viewport vallen.
  useEffect(() => {
    const onResize = () => {
      setPos(prev => {
        if (!prev) return prev
        const x = Math.min(Math.max(0, prev.x), window.innerWidth - ORB_SIZE)
        const y = Math.min(Math.max(0, prev.y), window.innerHeight - ORB_SIZE)
        if (x === prev.x && y === prev.y) return prev
        const next = { x, y }
        try { localStorage.setItem(ORB_POS_KEY, JSON.stringify(next)) } catch {}
        return next
      })
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const handler = (e: Event) => {
      const { type } = (e as CustomEvent<VitaEventPayload>).detail
      // Houd level, dagquests én readiness vers na een actie. Doordat de persona
      // uit readiness volgt, past Vita's toon zich zo direct aan je nieuwe status aan.
      setXp(laadXPData().xp)
      if (['check_in_completed', 'data_logged', 'mood_logged', 'habit_completed', 'goal_achieved'].includes(type)) {
        clearCache(VANDAAG_CACHE_KEY)
        clearCache(READINESS_CACHE_KEY)
        loadVandaag()
        loadReadiness()
      }
      // Echte mijlpaal → viering: 'proud'-gezicht + een rustige cyan glow-puls
      // over de orb. Bij prefers-reduced-motion toont de burst een statische
      // eindstaat (zie CelebrationBurst).
      const isCelebration = isCelebrationEvent(type)
      if (isCelebration) {
        if (celebrateResetRef.current) clearTimeout(celebrateResetRef.current)
        setCelebrateId(Date.now())
        celebrateResetRef.current = setTimeout(() => setCelebrateId(0), 1800)
      }

      const newEmotion = isCelebration ? 'proud' : emotionFromEvent(type)
      if (newEmotion) {
        if (emotionResetRef.current) clearTimeout(emotionResetRef.current)
        setEmotion(newEmotion)
        emotionResetRef.current = setTimeout(() => {
          setEmotion(restEmotionRef.current)
        }, 8000)
      }
      const now = Date.now()
      if (now - lastNudgeRef.current < 90000) return
      // Warme, eerlijke bubbeltekst zonder emoji-spam voor de mijlpalen;
      // daarnaast één rustige status-bubbel voor de afgeronde check-in.
      const bubbleText =
        celebrationMessage(type)
        ?? (type === 'check_in_completed' ? 'Check-in gedaan — ik houd je voortgang bij.' : null)
      if (bubbleText && !open) {
        lastNudgeRef.current = now
        setBubble({ message: bubbleText, emotion: newEmotion ?? emotion })
      }
    }
    window.addEventListener('vita:event', handler)
    return () => window.removeEventListener('vita:event', handler)
  }, [open, emotion, loadVandaag, loadReadiness])

  // Ruim de emotie- en viering-timers op bij unmount, zodat er nooit een
  // setState op een verdwenen component valt.
  useEffect(() => () => {
    if (emotionResetRef.current) clearTimeout(emotionResetRef.current)
    if (celebrateResetRef.current) clearTimeout(celebrateResetRef.current)
  }, [])

  useEffect(() => {
    if (!data) return
    // Op /home zegt VitaDagstart al goedemorgen — daar geen dubbele nudge.
    if (pathname === '/home') return
    const sessionKey = 'vita-nudge-v1'
    if (sessionStorage.getItem(sessionKey)) return
    const tod = getTimeOfDay()
    const nudges: Partial<Record<string, { message: string; emotion: EmotionState }>> = {
      morning: { message: 'Goedemorgen! Klaar voor een nieuwe dag?', emotion: 'curious' },
      evening: { message: 'Hoe was je dag? Vergeet je avondreflectie niet.', emotion: 'supportive' },
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
  }, [data, pathname])

  // Transient bubbels (events, nudges, eerste-bezoek) vallen na een paar tellen
  // vanzelf terug op de vaste regel die Vita altijd toont.
  useEffect(() => {
    if (!bubble) return
    const t = setTimeout(() => setBubble(null), 6000)
    return () => clearTimeout(t)
  }, [bubble])

  // Per-pagina uitleg: de eerste keer dat je een nieuwe zone betreedt, legt Vita
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

  if (isHidden || !data) return null

  const { persona, reden } = aanbevolenPersona(data)
  const label = scoreLabel(data.score)
  const accentColor = scoreColor(data.score)
  const message = vitaMessage(data, persona)
  const guide = getPageGuide(pathname)
  const gaNaar = (url: string) => { setOpen(false); router.push(url) }

  // De vaste zin die Vita altijd "zegt" in zijn tekstballon: bij voorkeur je
  // volgende stap op deze pagina, anders een korte status of uitnodiging.
  const vasteRegel =
    guide?.stap
    ?? (data.heeft_data ? `Je staat op ${data.score} — ${label.toLowerCase()}.` : 'Doe je check-in, dan leer ik je kennen.')
  const ballonTekst = bubble?.message ?? vasteRegel

  if (!pos) return null

  // Staat de panda in de bovenste helft van het scherm? Dan is er boven 'm geen
  // ruimte — klap de ballon en het paneel naar beneden in plaats van naar boven.
  const flipBelow = pos.y < (typeof window !== 'undefined' ? window.innerHeight : 800) * 0.45

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
      {/* Zichtbare focus-ring (cyaan) voor toetsenbordnavigatie — alle knoppen
          in Vita delen 'm via .vita-focusable. */}
      <style>{`
        .vita-focusable:focus-visible {
          outline: 2px solid var(--mentaforce-primary);
          outline-offset: 2px;
        }
        /* Ontworpen states voor de "Praat met Vita"-actie: rustige lift op
           hover, indrukken op active. Alleen transform — geen layout. */
        .vita-talk:hover {
          border-color: color-mix(in srgb, var(--mentaforce-primary) 70%, transparent);
          background: color-mix(in srgb, var(--mentaforce-primary) 20%, transparent);
          transform: translateY(-1px);
        }
        .vita-talk:active {
          transform: translateY(0) scale(0.99);
        }
        @media (prefers-reduced-motion: reduce) {
          .vita-anim { animation: none !important; }
          .vita-talk:hover, .vita-talk:active { transform: none; }
        }
      `}</style>
      {!open && (
        <button
          className="vita-focusable vita-anim"
          onClick={() => { if (!didDrag.current) setOpen(true) }}
          aria-label="Open Vita — bekijk je dag"
          style={{
            position: 'absolute',
            right: 0,
            ...(flipBelow ? { top: '100%', marginTop: 10 } : { bottom: '100%', marginBottom: 10 }),
            maxWidth: 224,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-strong)',
            borderRadius: 16,
            padding: '10px 14px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-1)',
            lineHeight: 1.5,
            textAlign: 'left',
            cursor: 'pointer',
            animation: 'vita-slide-up 0.25s var(--ease) both',
          }}
        >
          <span style={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {ballonTekst}
          </span>
          <span style={{
            display: 'block',
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--text-4)',
            marginTop: 5,
            letterSpacing: '0.02em',
          }}>
            Tik voor meer →
          </span>
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              right: 22,
              width: 12,
              height: 12,
              background: 'var(--bg-card)',
              transform: 'rotate(45deg)',
              ...(flipBelow
                ? { top: -6, borderTop: '1px solid var(--border-strong)', borderLeft: '1px solid var(--border-strong)' }
                : { bottom: -6, borderRight: '1px solid var(--border-strong)', borderBottom: '1px solid var(--border-strong)' }),
            }}
          />
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Vita — jouw dag in één oogopslag"
          className="vita-anim"
          style={{
            position: 'absolute',
            right: 0,
            ...(flipBelow ? { top: '100%', marginTop: 10 } : { bottom: '100%', marginBottom: 10 }),
            width: 292,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-strong)',
            borderRadius: 20,
            boxShadow: '0 20px 60px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            animation: 'vita-slide-up 0.22s var(--ease) both',
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
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text-3)',
              letterSpacing: '0.02em',
              flex: 1,
            }}>
              Vita
            </span>
            <span style={{
              fontSize: 10,
              fontWeight: 600,
              color: PERSONA_ACCENT_COLOR,
              background: PERSONA_TINT,
              padding: '2px 7px',
              borderRadius: 100,
              letterSpacing: '0.04em',
            }}>
              {PERSONA_LABELS[persona]}
            </span>
            <button
              className="vita-focusable"
              onClick={() => { setOpen(false); orbRef.current?.focus() }}
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
                lineHeight: 1,
                marginLeft: 4,
              }}
              aria-label="Sluit Vita"
            >
              <X size={14} strokeWidth={2.5} aria-hidden="true" />
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 11,
                  color: 'var(--text-3)',
                  marginTop: 5,
                  fontWeight: 500,
                }}>
                  <Flame size={13} color="var(--mentaforce-primary)" aria-hidden="true" strokeWidth={2} />
                  {data.streak} {data.streak === 1 ? 'dag' : 'dagen'} op rij
                </div>
              )}
            </div>
          </div>

          {/* Dagelijkse quests — actie-eerst, direct onder je score */}
          {vandaag && vandaag.checklist.length > 0 && (
            <QuestList checklist={vandaag.checklist} onGo={gaNaar} />
          )}

          {/* Praat met Vita — de companion conversationeel bereikbaar maken */}
          <TalkToVita onStart={() => gaNaar(COACH_ROUTE)} />

          {/* Page guide — wat is deze pagina + je volgende stap */}
          {guide && (
            <div style={{
              margin: '0 14px 14px',
              padding: '12px 13px',
              background: 'var(--mentaforce-primary-light)',
              borderRadius: 12,
              border: '1px solid var(--border)',
            }}>
              <div style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                color: 'var(--mentaforce-primary-dark)',
                marginBottom: 5,
              }}>
                Op deze pagina · {guide.label}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.55 }}>
                {guide.uitleg}
              </div>
              {guide.stap && (
                <div style={{ marginTop: 9, paddingTop: 9, borderTop: '1px solid var(--border)' }}>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--mentaforce-primary-dark)',
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

          {/* Meer / minder — secundaire details achter één tik */}
          <button
            className="vita-focusable"
            onClick={() => setToonMeer(v => !v)}
            style={{
              width: 'calc(100% - 28px)',
              margin: '0 14px 12px',
              padding: '8px',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 10,
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-3)',
              letterSpacing: '0.02em',
            }}
            aria-expanded={toonMeer}
          >
            {toonMeer ? 'Minder tonen' : 'Meer tonen'}
          </button>

          {toonMeer && (
            <>
              {/* Coach-boodschap */}
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

          {/* Data chips */}
          {data.heeft_data && (
            <div style={{
              padding: '0 14px 12px',
              display: 'flex',
              gap: 6,
              flexWrap: 'wrap',
            }}>
              {data.slaap_uren !== null && (
                <span style={dataChipStyle}>
                  <Moon size={12} aria-hidden="true" strokeWidth={2} />
                  {Number(data.slaap_uren).toFixed(1)}u slaap
                </span>
              )}
              {data.stress_niveau !== null && (
                <span style={dataChipStyle}>
                  <Zap size={12} aria-hidden="true" strokeWidth={2} />
                  Stress {data.stress_niveau}/5
                </span>
              )}
              {data.stemming_waarde !== null && (
                <span style={dataChipStyle}>
                  <Smile size={12} aria-hidden="true" strokeWidth={2} />
                  Stemming {data.stemming_waarde}/5
                </span>
              )}
            </div>
          )}

          {/* XP bar — Fit Level (zelfde bron als /niveau) */}
          <XpBar xp={xp} />

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--border)', margin: '0 14px' }} />

          {/* Persona — automatisch gekozen op basis van wat je nodig hebt */}
          <PersonaUitleg persona={persona} reden={reden} />
            </>
          )}
        </div>
      )}

      {/* Orb trigger button — de burst valt eromheen, dus in een relatieve
          wrapper zodat de uitdijende ring niet door overflow: hidden wordt
          afgesneden. */}
      <div style={{ position: 'relative', width: ORB_SIZE, height: ORB_SIZE, flexShrink: 0 }}>
        {celebrateId > 0 && <CelebrationBurst key={celebrateId} size={ORB_SIZE} />}
        <button
          ref={orbRef}
          className="vita-focusable vita-anim"
          onPointerDown={(e) => {
            e.preventDefault()
            didDrag.current = false
            dragRef.current = { startX: e.clientX, startY: e.clientY, posX: pos.x, posY: pos.y }
          }}
          onClick={() => {
            if (didDrag.current) return
            setOpen(v => !v)
          }}
          title="Vita — jouw gezondheidscompanion"
          aria-label="Open Vita, jouw gezondheidscompanion"
          aria-expanded={open}
          style={{
            cursor: 'grab',
            touchAction: 'none',
            width: ORB_SIZE,
            height: ORB_SIZE,
            borderRadius: '50%',
            border: `1.5px solid ${open ? accentColor : 'var(--border-strong)'}`,
            background: 'var(--bg-card)',
            boxShadow: open
              ? '0 8px 32px rgba(0,0,0,0.14), 0 0 24px color-mix(in srgb, var(--mentaforce-primary) 30%, transparent)'
              : '0 4px 16px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            padding: 0,
            position: 'relative',
            transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
            animation: 'vita-orb-appear 0.35s var(--ease) both',
          }}
        >
          <PandaFace emotion={emotion} size={ORB_SIZE} animate />
        </button>
      </div>
    </div>
  )
}

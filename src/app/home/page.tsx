'use client'

export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { authFetch } from '@/lib/auth-fetch'
import Navbar from '@/components/layout/Navbar'
import { laadXPVanServer } from '@/lib/xp-sync'
import { berekenLevel, xpVoortgang, LEVEL_NAMEN, LEVEL_KLEUREN, LEVEL_BG, type XPData } from '@/lib/xp'
import nextDynamic from 'next/dynamic'

const GlowOrb = nextDynamic(() => import('@/components/three/GlowOrb'), { ssr: false })

// ── Helpers ───────────────────────────────────────────────────

function nlDatumKort(): string {
  return new Date().toLocaleDateString('nl-NL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function initialen(naam: string): string {
  return naam
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('')
}

function scoreLabel(score: number | null): string {
  if (score === null) return 'Onbekend'
  if (score >= 80) return 'Hersteld'
  if (score >= 60) return 'Goed'
  if (score >= 40) return 'Matig'
  return 'Rust nodig'
}

const SCORE_KLEUR_HEX = {
  onbekend: 'var(--text-3)',
  hersteld:  'var(--mf-green)',
  goed:      'var(--mf-blue)',
  matig:     'var(--mf-amber)',
  rust:      'var(--mf-red)',
}

function scoreKleur(score: number | null): string {
  if (score === null) return SCORE_KLEUR_HEX.onbekend
  if (score >= 80) return SCORE_KLEUR_HEX.hersteld
  if (score >= 60) return SCORE_KLEUR_HEX.goed
  if (score >= 40) return SCORE_KLEUR_HEX.matig
  return SCORE_KLEUR_HEX.rust
}

function scoreGradient(score: number | null): string {
  if (score === null) return 'linear-gradient(160deg, #F9FAFB 0%, #F3F4F6 100%)'
  if (score >= 80) return 'linear-gradient(160deg, #E1F5EE 0%, #D1FAE5 60%, #F0FDF4 100%)'
  if (score >= 60) return 'linear-gradient(160deg, #E6F1FB 0%, #DBEAFE 60%, #EFF6FF 100%)'
  if (score >= 40) return 'linear-gradient(160deg, #FFFBEB 0%, #FEF3C7 60%, #FFF7ED 100%)'
  return 'linear-gradient(160deg, #FEF2F2 0%, #FCEBEB 60%, #FFF5F5 100%)'
}

const CALORIE_DOEL = 2000
const WATER_DOEL_ML = 2000

// ── ReadinessRing ─────────────────────────────────────────────

function ReadinessRing({ score }: { score: number | null }) {
  const r = 64
  const circ = 2 * Math.PI * r
  const pct = score ?? 0
  const kleur = scoreKleur(score)

  return (
    <svg
      width="160"
      height="160"
      viewBox="0 0 160 160"
      role="img"
      aria-label={`Readiness score: ${score ?? 'onbekend'} van 100`}
    >
      <circle cx="80" cy="80" r={r} fill="none" stroke={`${kleur}20`} strokeWidth="12" />
      <circle
        cx="80"
        cy="80"
        r={r}
        fill="none"
        stroke={kleur}
        strokeWidth="12"
        strokeDasharray={`${(pct / 100) * circ} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 80 80)"
        style={{ transition: 'stroke-dasharray 1.4s cubic-bezier(0.16,1,0.3,1)' }}
      />
      {score !== null ? (
        <>
          <text x="80" y="73" textAnchor="middle" fontSize="38" fontWeight="900" fill={kleur}>
            {score}
          </text>
          <text x="80" y="92" textAnchor="middle" fontSize="12" style={{ fill: 'var(--text-4)' }} fontWeight="600">
            /100
          </text>
        </>
      ) : (
        <text x="80" y="86" textAnchor="middle" fontSize="14" style={{ fill: 'var(--text-4)' }} fontWeight="600">
          Geen data
        </text>
      )}
    </svg>
  )
}

// ── Mini calorie ring ─────────────────────────────────────────

function CalorieRingMini({ kcal, doel }: { kcal: number; doel: number }) {
  const r = 30
  const circ = 2 * Math.PI * r
  const pct = Math.min(1, doel > 0 ? kcal / doel : 0)
  const overKcal = kcal > doel * 1.1
  const kleur = overKcal ? SCORE_KLEUR_HEX.rust : SCORE_KLEUR_HEX.hersteld
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" aria-label={`${kcal} van ${doel} kcal`}>
      <circle cx="36" cy="36" r={r} fill="none" stroke={`${kleur}20`} strokeWidth="7" />
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke={kleur}
        strokeWidth="7"
        strokeDasharray={`${pct * circ} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 36 36)"
        style={{ transition: 'stroke-dasharray 1s ease' }}
      />
      <text x="36" y="32" textAnchor="middle" fontSize="12" fontWeight="900" fill={kleur}>{kcal}</text>
      <text x="36" y="45" textAnchor="middle" fontSize="8" fill={SCORE_KLEUR_HEX.onbekend}>kcal</text>
    </svg>
  )
}

// ── Mini progress bar ─────────────────────────────────────────

function ProgressBar({ waarde, max, kleur }: { waarde: number; max: number; kleur: string }) {
  const pct = Math.min(100, max > 0 ? (waarde / max) * 100 : 0)
  return (
    <div style={{ height: 5, background: 'var(--bg-subtle)', borderRadius: 100, overflow: 'hidden' }}>
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
  )
}

// ── Dagelijkse tips ───────────────────────────────────────────

const DAGELIJKSE_TIPS = [
  { emoji: '🌅', tip: 'Begin de dag met 5 minuten in de frisse lucht. Daglicht zet je bioritme op scherp.' },
  { emoji: '💧', tip: 'Drink een glas water zodra je wakker wordt. Je lichaam is na de nacht uitgedroogd.' },
  { emoji: '🧠', tip: 'Schrijf 3 dingen op waar je dankbaar voor bent. Dit traint de hersenen op positief denken.' },
  { emoji: '😴', tip: 'Ga elke dag op dezelfde tijd slapen — ook in het weekend. Regelmaat verbetert slaapkwaliteit.' },
  { emoji: '🏃', tip: '22 minuten matige beweging per dag is genoeg om je stemming en energie significant te verbeteren.' },
  { emoji: '🍎', tip: 'Voeg elke dag één extra portie groente toe. Klein verandering, groot effect op de lange termijn.' },
  { emoji: '🧘', tip: 'Drie diepe ademhalingen activeren het parasympathisch zenuwstelsel en verminderen stress direct.' },
  { emoji: '📵', tip: 'Vermijd schermen het laatste uur voor bed. Blauw licht onderdrukt melatonine aanmaak.' },
  { emoji: '⚡', tip: 'De 10-minuten regel: te moe om te trainen? Begin gewoon 10 minuten. Je stopt zelden na 10 minuten.' },
  { emoji: '🌿', tip: 'Natuur verlaagt cortisol. Een korte wandeling in het groen kan evenveel doen als meditatie.' },
  { emoji: '🎯', tip: 'Stel morgenochtend je top-3 prioriteiten in. Wie de ochtend wint, wint de dag.' },
  { emoji: '🤝', tip: 'Sociale verbinding is net zo belangrijk als beweging en voeding. Plan deze week een afspraak in.' },
  { emoji: '🔋', tip: 'Power nap van 10-20 min tussen 13:00 en 15:00 herstelt alertheid zonder de nacht te verstoren.' },
  { emoji: '💪', tip: 'Consistentie klopt intensiteit. 30 minuten per dag verslaat 4 uur in het weekend.' },
  { emoji: '🌊', tip: 'Koude douche (30 seconden) verhoogt dopamine met 250% en energieniveaus voor uren.' },
  { emoji: '📖', tip: '20 minuten lezen voor het slapen vervangt scrolltime en kalmeert het zenuwstelsel.' },
  { emoji: '🍵', tip: 'Cafeïne werkt het best als je het 90 minuten na opstaan neemt — na de eerste cortisol-piek.' },
  { emoji: '🎵', tip: 'Muziek met 60 bpm vertraagt hartslag en verhoogt focus. Zoek op "binaural beats focus".' },
  { emoji: '🌙', tip: 'Leg morgen je sportkleren al klaar. Beslissingsvermoeidheid saboteert je ochtendroutine.' },
  { emoji: '🏋️', tip: 'Krachttraining 2-3x per week beschermt hersenen, botten en metabolisme tegelijk.' },
  { emoji: '💬', tip: 'Praat hardop over je gevoelens — niet in je hoofd maar met iemand. Dat is wat echt helpt.' },
  { emoji: '🎉', tip: 'Vier kleine overwinningen. Dopamine door erkenning maakt het makkelijker om door te gaan.' },
  { emoji: '⏰', tip: 'Je telefoon uit de slaapkamer laten verlengt de gemiddelde slaap met 37 minuten.' },
  { emoji: '🌞', tip: 'Een vaste ochtendroutine verlaagt de mentale belasting van elke dag — minder besluiten, meer energie.' },
  { emoji: '🦶', tip: '5 minuten op blote voeten op gras (aarden) verlaagt ontstekingswaarden meetbaar.' },
  { emoji: '💡', tip: 'Leer iets nieuws vandaag. Nieuwe neurale verbindingen beschermen tegen cognitieve achteruitgang.' },
  { emoji: '🫁', tip: 'Box breathing (4-4-4-4 sec) werkt altijd. Ademhaling is de snelste toegang tot het zenuwstelsel.' },
  { emoji: '🥗', tip: 'Eet meer eiwitten bij ontbijt. Dit stabiliseert bloedsuiker en vermindert snacken de rest van de dag.' },
]

function dagelijksTip(): { emoji: string; tip: string } {
  const dag = Math.floor(Date.now() / 86400000)
  return DAGELIJKSE_TIPS[dag % DAGELIJKSE_TIPS.length]
}

// ── Interfaces ────────────────────────────────────────────────

interface VandaagItem {
  key: string
  label: string
  emoji: string
  href: string
  gedaan: boolean
}

interface ScoresData {
  water_ml: number
  water_doel_ml: number
  slaap_uren: number | null
  stemming_waarde: number | null
  focus_minuten: number
  meditatie_minuten: number
}

interface VoedingLog {
  calorieen: number | null
  eiwitten_g: number | null
  koolhydraten_g: number | null
  vetten_g: number | null
}

interface WeekStat {
  gem: number | null
  vorige: number | null
}

interface DagActiviteit {
  datum: string
  slaap: number | null
  stemming: number | null
  sport: boolean
  actief: boolean
}

interface WeekData {
  slaap: WeekStat
  stemming: WeekStat
  readiness: WeekStat
  actief_dagen: number
  dagActiviteit?: DagActiviteit[]
}

function trendLabel(nu: number | null, vorige: number | null): { delta: string; positief: boolean } | null {
  if (nu === null || vorige === null || vorige === 0) return null
  const diff = nu - vorige
  if (Math.abs(diff) < 0.1) return null
  return { delta: `${diff > 0 ? '+' : ''}${diff.toFixed(1)}`, positief: diff > 0 }
}

// ── WeekInzichten card ────────────────────────────────────────

function WeekInzichtenCard({ data }: { data: WeekData | null }) {
  if (!data) return null

  const items = [
    {
      label: 'Readiness',
      emoji: '⚡',
      waarde: data.readiness.gem,
      max: 100,
      kleur: 'var(--mf-green)',
      suffix: '',
      trend: trendLabel(data.readiness.gem, data.readiness.vorige),
      formatVal: (v: number) => `${Math.round(v)}`,
    },
    {
      label: 'Stemming',
      emoji: '😊',
      waarde: data.stemming.gem,
      max: 10,
      kleur: 'var(--mf-blue)',
      suffix: '',
      trend: trendLabel(data.stemming.gem, data.stemming.vorige),
      formatVal: (v: number) => `${v.toFixed(1)}/10`,
    },
    {
      label: 'Slaap',
      emoji: '😴',
      waarde: data.slaap.gem,
      max: 9,
      kleur: 'var(--mf-purple)',
      suffix: 'u',
      trend: trendLabel(data.slaap.gem, data.slaap.vorige),
      formatVal: (v: number) => `${v.toFixed(1)}u`,
    },
  ]

  const hasData = items.some(i => i.waarde !== null)
  if (!hasData) return null

  return (
    <section
      className="mf-animate-slide-up mf-stagger-1"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '14px 16px',
        marginBottom: 10,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          📊 Week inzichten
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-4)', fontWeight: 600 }}>
          {data.actief_dagen > 0 ? `${data.actief_dagen} dagen actief` : 'Nog geen data'}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map(item =>
          item.waarde === null ? null : (
            <div key={item.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>
                  {item.emoji} {item.label}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {item.trend && (
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      color: item.trend.positief ? 'var(--mf-green)' : 'var(--mf-red)',
                      background: item.trend.positief ? 'var(--mf-green-light)' : 'var(--mf-red-light)',
                      padding: '1px 6px', borderRadius: 20,
                    }}>
                      {item.trend.delta}
                    </span>
                  )}
                  <span style={{ fontSize: 12, fontWeight: 800, color: item.kleur }}>
                    {item.formatVal(item.waarde)}
                  </span>
                </div>
              </div>
              <ProgressBar waarde={item.waarde} max={item.max} kleur={item.kleur} />
            </div>
          )
        )}
      </div>

      {data.dagActiviteit && data.dagActiviteit.length > 0 && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-4)' }}>
              7 DAGEN ACTIVITEIT
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between' }}>
            {data.dagActiviteit.map(dag => {
              const weekDag = new Date(dag.datum + 'T12:00:00').toLocaleDateString('nl-NL', { weekday: 'narrow' })
              const kleur = dag.actief
                ? dag.slaap !== null && dag.slaap >= 7 ? 'var(--mf-green)'
                : dag.stemming !== null && dag.stemming >= 4 ? 'var(--mf-blue)'
                : 'var(--mf-amber)'
                : 'var(--bg-subtle)'
              const border = dag.actief ? `1.5px solid ${kleur}` : '1.5px solid var(--border)'
              return (
                <div key={dag.datum} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: '100%', aspectRatio: '1', borderRadius: 8,
                    background: dag.actief ? kleur : 'var(--bg-subtle)',
                    border,
                    opacity: dag.actief ? 1 : 0.5,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10,
                  }}>
                    {dag.sport && dag.actief ? <span style={{ color: 'white' }}>🏃</span> : null}
                  </div>
                  <span style={{ fontSize: 9, color: 'var(--text-4)', fontWeight: 600 }}>{weekDag}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}

// ── Component ─────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter()

  const [laden, setLaden] = useState(true)
  const [naam, setNaam] = useState('')
  const [readiness, setReadiness] = useState<number | null>(null)
  const [streak, setStreak] = useState(0)
  const [scores, setScores] = useState<ScoresData>({
    water_ml: 0,
    water_doel_ml: WATER_DOEL_ML,
    slaap_uren: null,
    stemming_waarde: null,
    focus_minuten: 0,
    meditatie_minuten: 0,
  })
  const [voedingTotaal, setVoedingTotaal] = useState({
    calorieen: 0,
    eiwitten_g: 0,
    koolhydraten_g: 0,
    vetten_g: 0,
  })
  const [weekData, setWeekData] = useState<WeekData | null>(null)
  const [xpData, setXpData] = useState<XPData | null>(null)
  const [waterToast, setWaterToast] = useState(false)
  const [waterLaden, setWaterLaden] = useState(false)
  const [stemmingLaden, setStemmingLaden] = useState(false)

  const [vandaagItems, setVandaagItems] = useState<VandaagItem[]>([
    { key: 'stemming',     label: 'Stemming',    emoji: '😊', href: '/stemming',     gedaan: false },
    { key: 'slaap',        label: 'Slaap',       emoji: '😴', href: '/slaap',        gedaan: false },
    { key: 'water',        label: 'Water',        emoji: '💧', href: '/water',        gedaan: false },
    { key: 'sport',        label: 'Bewegen',      emoji: '🏃', href: '/sport',        gedaan: false },
    { key: 'meditatie',    label: 'Meditatie',    emoji: '🧘', href: '/meditatie',    gedaan: false },
    { key: 'dankbaarheid', label: 'Dankbaarheid', emoji: '🙏', href: '/dankbaarheid', gedaan: false },
  ])

  const STEMMING_EMOJIS = ['😫','😔','😐','🙂','😄']

  async function logStemming(waarde: number) {
    if (stemmingLaden || scores.stemming_waarde !== null) return
    setStemmingLaden(true)
    try {
      const res = await authFetch('/api/stemming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stemming: waarde, emoji: STEMMING_EMOJIS[waarde - 1] }),
      })
      if (!res.ok) throw new Error('POST mislukt')
      setScores(prev => ({ ...prev, stemming_waarde: waarde }))
      setVandaagItems(prev => prev.map(i => i.key === 'stemming' ? { ...i, gedaan: true } : i))
    } catch { /* stil falen */ }
    setStemmingLaden(false)
  }

  async function logGlas() {
    if (waterLaden) return
    setWaterLaden(true)
    const vorigeWater = scores.water_ml
    setScores(prev => ({ ...prev, water_ml: prev.water_ml + 250 }))
    try {
      const res = await authFetch('/api/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ml: 250 }),
      })
      if (!res.ok) throw new Error('POST mislukt')
      const d = await res.json() as { nieuw_totaal?: number }
      if (typeof d.nieuw_totaal === 'number') {
        setScores(prev => ({ ...prev, water_ml: d.nieuw_totaal! }))
        if (d.nieuw_totaal >= (scores.water_doel_ml || WATER_DOEL_ML)) {
          setVandaagItems(prev => prev.map(i => i.key === 'water' ? { ...i, gedaan: true } : i))
        }
      }
      setWaterToast(true)
      setTimeout(() => setWaterToast(false), 1800)
    } catch {
      setScores(prev => ({ ...prev, water_ml: vorigeWater }))
    } finally {
      setWaterLaden(false)
    }
  }

  const snelLog = [
    { href: '/stemming',  emoji: '😊', label: 'Stemming'  },
    { href: '/water',     emoji: '💧', label: 'Water'     },
    { href: '/slaap',     emoji: '😴', label: 'Slaap'     },
    { href: '/sport',     emoji: '🏃', label: 'Sport'     },
    { href: '/voeding',   emoji: '🍎', label: 'Eten'      },
    { href: '/meditatie', emoji: '🧘', label: 'Mediteren' },
  ]

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profiel } = await supabase
        .from('profiles')
        .select('naam, onboarding_voltooid')
        .eq('id', user.id)
        .single()

      if (!profiel?.onboarding_voltooid) { router.replace('/onboarding'); return }
      setNaam(profiel?.naam ?? '')
      setLaden(false)

      const [readinessRes, vandaagRes, gewoontesRes, voedingRes, weekRes] = await Promise.allSettled([
        authFetch('/api/readiness').then(r => r.ok ? r.json() : null).catch(() => null),
        authFetch('/api/vandaag').then(r => r.ok ? r.json() : null).catch(() => null),
        authFetch('/api/streak').then(r => r.ok ? r.json() : null).catch(() => null),
        authFetch('/api/voeding').then(r => r.ok ? r.json() : null).catch(() => null),
        authFetch('/api/home/week').then(r => r.ok ? r.json() : null).catch(() => null),
      ])

      if (readinessRes.status === 'fulfilled' && readinessRes.value) {
        const d = readinessRes.value as { score?: number; readiness?: number }
        const s = d.score ?? d.readiness ?? null
        if (typeof s === 'number') setReadiness(Math.round(s))
      }

      if (vandaagRes.status === 'fulfilled' && vandaagRes.value) {
        const d = vandaagRes.value as {
          checklist?: Array<{ id: string; status: string }>
          scores?: ScoresData
        }
        const gedaanSet = new Set(
          (d.checklist ?? []).filter(i => i.status === 'gedaan').map(i => i.id)
        )
        setVandaagItems(prev => prev.map(item => ({ ...item, gedaan: gedaanSet.has(item.key) })))
        if (d.scores) setScores(d.scores)
      }

      if (gewoontesRes.status === 'fulfilled' && gewoontesRes.value) {
        const d = gewoontesRes.value as { streak?: number }
        setStreak(d.streak ?? 0)
      }

      if (voedingRes.status === 'fulfilled' && voedingRes.value) {
        const d = voedingRes.value as { logs?: VoedingLog[] }
        const logs = d.logs ?? []
        setVoedingTotaal({
          calorieen: Math.round(logs.reduce((s, l) => s + (l.calorieen ?? 0), 0)),
          eiwitten_g: Math.round(logs.reduce((s, l) => s + (l.eiwitten_g ?? 0), 0)),
          koolhydraten_g: Math.round(logs.reduce((s, l) => s + (l.koolhydraten_g ?? 0), 0)),
          vetten_g: Math.round(logs.reduce((s, l) => s + (l.vetten_g ?? 0), 0)),
        })
      }

      if (weekRes.status === 'fulfilled' && weekRes.value) {
        setWeekData(weekRes.value as WeekData)
      }

      // XP laden (non-blocking, na primaire data)
      laadXPVanServer().then(xp => { if (xp) setXpData(xp) }).catch(() => null)
    }

    laad()
  }, [router])

  const kleur = scoreKleur(readiness)
  const label = scoreLabel(readiness)
  const gradient = scoreGradient(readiness)
  const gedaanCount = vandaagItems.filter(i => i.gedaan).length
  const sportGedaan = vandaagItems.find(i => i.key === 'sport')?.gedaan ?? false

  if (laden) {
    return (
      <div style={{ minHeight: '100vh' }} className="mf-mesh-bg">
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 160, flexDirection: 'column', gap: 16 }}>
          <div className="mf-spinner" />
          <p style={{ fontSize: 13, color: 'var(--text-4)', fontWeight: 500 }}>Laden…</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }} className="mf-mesh-bg">
      <Navbar />

      {/* ── FIXED HEADER ── */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          zIndex: 40,
          width: '100%',
          background: 'rgba(244,246,248,0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
          padding: '0 20px',
          height: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 17, fontWeight: 400, color: 'var(--mf-green)' }}>
          MentaForce
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-4)', fontWeight: 600 }}>{nlDatumKort()}</span>
        <div
          aria-label="Profielmenu"
          style={{ width: 34, height: 34, borderRadius: '50%', background: kleur, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'white', cursor: 'pointer', flexShrink: 0 }}
          onClick={() => router.push('/instellingen')}
        >
          {initialen(naam) || '?'}
        </div>
      </header>

      <main style={{ maxWidth: 480, margin: '0 auto', padding: '72px 16px 120px' }}>

        {/* ── SECTION 1 — READINESS HERO ── */}
        <section
          className="mf-grain"
          style={{
            borderRadius: 28,
            background: gradient,
            border: `1.5px solid ${kleur}22`,
            boxShadow: `0 8px 40px ${kleur}15, 0 2px 8px ${kleur}08`,
            marginBottom: 12,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div style={{ height: 5, background: `linear-gradient(90deg, ${kleur}, ${kleur}50)`, width: '100%' }} />
          <div
            style={{
              padding: '24px 24px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: kleur, opacity: 0.85, marginBottom: 16 }}>
              READINESS VANDAAG
            </p>
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 0 }}>
                <GlowOrb
                  color={readiness !== null && readiness >= 80 ? [0.114, 0.620, 0.459] : readiness !== null && readiness >= 60 ? [0.231, 0.510, 0.965] : readiness !== null && readiness >= 40 ? [0.949, 0.722, 0.141] : [0.886, 0.294, 0.290]}
                  intensity={readiness !== null ? Math.max(0.25, readiness / 100) : 0.3}
                  size={190}
                />
              </div>
              <div className="mf-animate-breathe mf-animate-glow" style={{ display: 'inline-block', position: 'relative', zIndex: 1 }}>
                <ReadinessRing score={readiness} />
              </div>
            </div>
            <p className="mf-display" style={{ fontSize: 'clamp(20px, 5vw, 26px)', color: kleur, marginTop: 10, fontStyle: 'italic', letterSpacing: '-0.01em' }}>
              {label}
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link href="/slaap" className="mf-pill"><span>😴</span> Slaap</Link>
              <Link href="/stemming" className="mf-pill"><span>😊</span> Stemming</Link>
              <Link href="/checkin" className="mf-pill"><span>⚡</span> Stress</Link>
            </div>
            <Link
              href="/checkin"
              style={{ marginTop: 20, width: '100%', background: kleur, color: 'white', borderRadius: 14, padding: '13px 24px', fontSize: 14, fontWeight: 700, textAlign: 'center', boxShadow: `0 4px 20px ${kleur}35`, letterSpacing: '-0.01em', display: 'block', textDecoration: 'none' }}
            >
              {readiness === null ? 'Log vandaag om je score te berekenen' : 'Start je dag →'}
            </Link>
          </div>
        </section>

        {/* ── SECTION 2 — BENTO: MENTAAL + FYSIEK ── */}
        <div
          className="mf-animate-slide-up"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}
        >
          {/* Mentaal */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '14px 14px 12px', boxShadow: 'var(--shadow-sm)', height: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>🧠 Mentaal</span>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>Stemming</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--mf-blue)' }}>
                    {scores.stemming_waarde != null ? `${scores.stemming_waarde}/5` : '—'}
                  </span>
                </div>
                {scores.stemming_waarde === null ? (
                  <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                    {STEMMING_EMOJIS.map((em, i) => (
                      <button
                        key={i}
                        onClick={() => logStemming(i + 1)}
                        disabled={stemmingLaden}
                        aria-label={`Stemming ${i + 1}`}
                        style={{
                          flex: 1, fontSize: 16, background: 'var(--bg-subtle)', border: '1.5px solid var(--border)',
                          borderRadius: 8, padding: '4px 0', cursor: stemmingLaden ? 'default' : 'pointer',
                          transition: 'transform 0.1s, background 0.15s',
                          opacity: stemmingLaden ? 0.5 : 1,
                        }}
                        onMouseEnter={e => { if (!stemmingLaden) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.15)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                ) : (
                  <ProgressBar waarde={scores.stemming_waarde ?? 0} max={5} kleur="var(--mf-blue)" />
                )}
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>Meditatie</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--mf-purple)' }}>
                    {scores.meditatie_minuten > 0 ? `${scores.meditatie_minuten}m` : '—'}
                  </span>
                </div>
                <ProgressBar waarde={scores.meditatie_minuten} max={20} kleur="var(--mf-purple)" />
              </div>
            </div>
            <Link href="/stemming" style={{ fontSize: 10, color: 'var(--mf-green)', fontWeight: 700, textDecoration: 'none' }}>Details →</Link>
          </div>

          {/* Fysiek */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '14px 14px 12px', boxShadow: 'var(--shadow-sm)', height: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>💪 Fysiek</span>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>💧 Water</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {waterToast && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, color: 'var(--mf-blue-mid)',
                        background: 'rgba(55,138,221,0.12)', padding: '1px 5px', borderRadius: 8,
                        animation: 'mf-toast-pop 1.8s cubic-bezier(0.34,1.56,0.64,1) forwards',
                        display: 'inline-block',
                      }}>
                        +250ml
                      </span>
                    )}
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--mf-blue-mid)' }}>
                      {scores.water_ml > 0 ? `${Math.round(scores.water_ml / 250)} gl` : '—'}
                    </span>
                    <button
                      onClick={logGlas}
                      disabled={waterLaden}
                      aria-label="Log 1 glas water"
                      style={{
                        width: 22, height: 22, borderRadius: '50%',
                        background: waterLaden ? 'var(--bg-subtle)' : 'var(--mf-blue-mid)',
                        border: 'none', color: 'white', fontSize: 13, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: waterLaden ? 'default' : 'pointer',
                        flexShrink: 0, lineHeight: 1,
                        transition: 'transform 0.12s, background 0.15s',
                        transform: waterLaden ? 'scale(0.88)' : 'scale(1)',
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
                <ProgressBar waarde={scores.water_ml} max={scores.water_doel_ml || WATER_DOEL_ML} kleur="var(--mf-blue-mid)" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>😴 Slaap</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--mf-purple)' }}>
                    {scores.slaap_uren != null ? `${scores.slaap_uren}u` : '—'}
                  </span>
                </div>
                <ProgressBar waarde={scores.slaap_uren ?? 0} max={9} kleur="var(--mf-purple)" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>🏃 Sport</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                  background: sportGedaan ? 'var(--mf-green-light)' : 'var(--bg-subtle)',
                  color: sportGedaan ? 'var(--mf-green-dark)' : 'var(--text-4)',
                }}>
                  {sportGedaan ? 'Gedaan ✓' : 'Open'}
                </span>
              </div>
            </div>
            <Link href="/slaap" style={{ fontSize: 10, color: 'var(--mf-green)', fontWeight: 700, textDecoration: 'none' }}>Details →</Link>
          </div>
        </div>

        {/* ── SECTION 3 — VOEDING ── */}
        <Link href="/voeding" style={{ textDecoration: 'none', display: 'block', marginBottom: 10 }}>
          <div
            className="mf-animate-slide-up mf-stagger-1"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '14px 16px', boxShadow: 'var(--shadow-sm)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>🍎 Voeding</span>
              <span style={{ fontSize: 11, color: 'var(--mf-green)', fontWeight: 700 }}>Loggen →</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <CalorieRingMini kcal={voedingTotaal.calorieen} doel={CALORIE_DOEL} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                {[
                  { label: 'Eiwit',   waarde: voedingTotaal.eiwitten_g,     max: 56,  kleur: 'var(--mf-red)'    },
                  { label: 'Koolh.',  waarde: voedingTotaal.koolhydraten_g, max: 275, kleur: 'var(--mf-amber)'  },
                  { label: 'Vet',     waarde: voedingTotaal.vetten_g,       max: 78,  kleur: 'var(--mf-purple)' },
                ].map(m => (
                  <div key={m.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>{m.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: m.kleur }}>
                        {m.waarde > 0 ? `${m.waarde}g` : '—'}
                      </span>
                    </div>
                    <ProgressBar waarde={m.waarde} max={m.max} kleur={m.kleur} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Link>

        {/* ── SECTION 4 — STREAK + PATRONEN ── */}
        <div
          className="mf-animate-slide-up mf-stagger-1"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}
        >
          <div style={{
            borderRadius: 18,
            background: streak >= 30
              ? 'linear-gradient(135deg, var(--mf-amber-light), #FDE68A)'
              : streak > 0
              ? 'linear-gradient(135deg, var(--mf-amber-light), #FFEDD5)'
              : 'var(--bg-card)',
            border: streak > 0 ? '1.5px solid rgba(186,117,23,0.22)' : '1px solid var(--border)',
            padding: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: streak > 0 ? 'var(--shadow-amber-glow)' : 'var(--shadow-xs)',
          }}>
            <span className={streak > 0 ? 'mf-animate-flame' : ''} style={{ fontSize: 28 }}>
              {streak >= 30 ? '🏆' : streak > 0 ? '🔥' : '💪'}
            </span>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: streak > 0 ? 'var(--mf-amber-dark)' : 'var(--text-1)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
                {streak}
              </div>
              <div style={{ fontSize: 10, color: streak > 0 ? 'var(--mf-amber-mid)' : 'var(--text-4)', fontWeight: 600 }}>
                {streak === 1 ? 'dag op rij' : streak > 1 ? 'dagen op rij' : 'start vandaag'}
              </div>
            </div>
          </div>

          {xpData ? (() => {
            const lvl = berekenLevel(xpData.xp)
            const vrt = xpVoortgang(xpData.xp, lvl)
            const lvlKleur = LEVEL_KLEUREN[lvl] ?? 'var(--mf-green)'
            const lvlBg = LEVEL_BG[lvl] ?? 'var(--mf-green-light)'
            return (
              <Link href="/niveau" style={{ textDecoration: 'none' }}>
                <div style={{ borderRadius: 18, background: lvlBg, border: `1.5px solid ${lvlKleur}30`, padding: '14px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: 'var(--shadow-xs)' }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: lvlKleur, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                      Level {lvl}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1.2 }}>
                      {LEVEL_NAMEN[lvl]}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 2 }}>
                      {xpData.xp} XP
                    </div>
                  </div>
                  <div>
                    <div style={{ height: 4, background: 'rgba(0,0,0,0.08)', borderRadius: 100, overflow: 'hidden', marginTop: 10 }}>
                      <div style={{ height: '100%', width: `${vrt.pct}%`, background: lvlKleur, borderRadius: 100, transition: 'width 0.8s ease' }} />
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--text-4)', marginTop: 4, fontWeight: 600 }}>
                      {vrt.nodig > 0 ? `${vrt.nodig} XP tot level ${lvl + 1}` : 'Max level!'}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })() : (
            <Link href="/patronen" style={{ textDecoration: 'none' }}>
              <div style={{ borderRadius: 18, background: 'var(--mf-green-light)', border: '1.5px solid rgba(29,158,117,0.2)', padding: '14px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: 'var(--shadow-xs)' }}>
                <span style={{ fontSize: 22, marginBottom: 6 }}>🔬</span>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--mf-green-dark)', lineHeight: 1.3 }}>Jouw patronen</div>
                <div style={{ fontSize: 10, color: 'var(--mf-green-mid)', marginTop: 3 }}>Bekijk trends →</div>
              </div>
            </Link>
          )}
        </div>

        {/* ── SECTION 4.5 — WEEK INZICHTEN ── */}
        <WeekInzichtenCard data={weekData} />

        {/* ── SECTION 5 — VANDAAG CHECKLIST ── */}
        <section
          className="mf-animate-slide-up mf-stagger-2"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '16px 18px', marginBottom: 14, boxShadow: 'var(--shadow-sm)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>Vandaag</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: gedaanCount === vandaagItems.length ? 'var(--mf-green)' : 'var(--text-4)' }}>
              {gedaanCount}/{vandaagItems.length}
            </span>
          </div>
          <div style={{ height: 3, borderRadius: 100, background: 'var(--bg-subtle)', marginBottom: 12, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(gedaanCount / vandaagItems.length) * 100}%`, background: 'linear-gradient(90deg, var(--mf-green), var(--mf-green-mid))', borderRadius: 100, transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)' }} />
          </div>

          {gedaanCount === vandaagItems.length && vandaagItems.length > 0 && (
            <div
              className="mf-grain"
              style={{
                background: 'linear-gradient(135deg, var(--mf-green-light), rgba(29,158,117,0.06))',
                border: '1.5px solid rgba(29,158,117,0.25)',
                borderRadius: 16,
                padding: '14px 16px',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span className="mf-animate-bounce-once" style={{ fontSize: 28, flexShrink: 0 }}>🎉</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--mf-green-dark)', letterSpacing: '-0.01em' }}>
                  Dag voltooid!
                </div>
                <div style={{ fontSize: 11, color: 'var(--mf-green-mid)', marginTop: 2, fontWeight: 500 }}>
                  Alle {vandaagItems.length} gewoonten afgevinkt. Geweldig gedaan.
                </div>
              </div>
            </div>
          )}

          {vandaagItems.map(item => (
            <Link key={item.key} href={item.href} className={`mf-check-row${item.gedaan ? ' done' : ''}`}>
              <span className="mf-check-bubble">
                {item.gedaan ? <span style={{ fontSize: 13, color: 'white', fontWeight: 800 }}>✓</span> : null}
              </span>
              <span style={{ fontSize: 14, fontWeight: item.gedaan ? 600 : 500, color: item.gedaan ? 'var(--mf-green)' : 'var(--text-2)', flex: 1, textDecoration: item.gedaan ? 'line-through' : 'none', textDecorationColor: 'rgba(29,158,117,0.4)' }}>
                {item.emoji} {item.label}
              </span>
              {!item.gedaan && <span style={{ fontSize: 12, color: 'var(--text-4)' }}>›</span>}
            </Link>
          ))}
        </section>

        {/* ── SECTION 5.5 — DAGELIJKSE TIP ── */}
        {(() => {
          const { emoji, tip } = dagelijksTip()
          return (
            <div
              className="mf-animate-slide-up mf-stagger-2"
              style={{
                background: 'linear-gradient(135deg, var(--mf-purple-light), rgba(139,92,246,0.04))',
                border: '1px solid rgba(139,92,246,0.15)',
                borderRadius: 18,
                padding: '14px 16px',
                marginBottom: 12,
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
              }}
            >
              <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1.3 }}>{emoji}</span>
              <div>
                <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--mf-purple)', marginBottom: 4 }}>
                  Tip van de dag
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55, margin: 0, fontWeight: 500 }}>
                  {tip}
                </p>
              </div>
            </div>
          )
        })()}

        {/* ── SECTION 6 — SNEL LOGGEN ── */}
        <section className="mf-animate-slide-up mf-stagger-3">
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-4)', marginBottom: 12 }}>
            Snel loggen
          </p>
          <div className="mf-scroll-row">
            {snelLog.map(actie => (
              <Link key={actie.href} href={actie.href} className="mf-scroll-item" style={{ textDecoration: 'none' }}>
                <div
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 18px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, boxShadow: 'var(--shadow-xs)', minWidth: 80, cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.transform = 'translateY(-3px)'
                    el.style.boxShadow = 'var(--shadow-md)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.transform = 'translateY(0)'
                    el.style.boxShadow = 'var(--shadow-xs)'
                  }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, var(--mf-green-light), rgba(29,158,117,0.08))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, lineHeight: 1 }}>
                    {actie.emoji}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textAlign: 'center', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
                    {actie.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

      </main>
    </div>
  )
}

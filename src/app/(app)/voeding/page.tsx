'use client'

export const dynamic = 'force-dynamic'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import nextDynamic from 'next/dynamic'
import VoedingSetup from './VoedingSetup'
import { vitaEvent } from '@/lib/vita/events'
import { useToast } from '@/components/ui/Toast'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
const AiCoachCard = nextDynamic(() => import('@/components/gezondheid/AiCoachCard'), { ssr: false })

// Macro-kleuren als tokens (geen hardcoded hex): hergebruikt over rings, balken en donuts.
const MACRO_KLEUR = {
  eiwit: 'var(--mf-red)',
  koolhydraten: 'var(--mf-amber)',
  vet: 'var(--mf-purple)',
  vezels: 'var(--mentaforce-primary)',
  micro: 'var(--mf-blue)',
} as const

// Zachte radial-glow achter de calorie-ring, afgestemd op status (token-gebaseerd).
const KCAL_GLOW = (gegeten: number, doel: number): string =>
  gegeten > doel * 1.05
    ? 'var(--mf-red-light)'
    : gegeten > doel * 0.75
    ? 'var(--mentaforce-primary-light)'
    : 'var(--mf-amber-light)'

// ─── Types ────────────────────────────────────────────────────────────────────

interface VoedingLog {
  id: string
  datum: string
  maaltijd_type: 'ontbijt' | 'tussendoortje_1' | 'lunch' | 'tussendoortje_2' | 'diner' | 'avondsnack'
  omschrijving: string
  calorieen: number | null
  eiwitten_g: number | null
  koolhydraten_g: number | null
  vetten_g: number | null
  vezels_g: number | null
  portie_gram: number | null
  bron: 'foto' | 'manueel'
  foto_url: string | null
  ai_analyse: AiAnalyse | null
}

interface AiAnalyse {
  gerecht: string
  beschrijving: string
  portie_gram: number
  calorieen: number
  macros: { eiwitten_g: number; koolhydraten_g: number; vetten_g: number; vezels_g: number }
  ingredienten: string[]
  maaltijd_type: string
  gezondheid_score: number
  tips: string
  betrouwbaarheid: 'laag' | 'gemiddeld' | 'hoog'
}

interface NutrientenPer100g {
  calorieen: number
  eiwitten_g: number
  koolhydraten_g: number
  suikers_g: number
  vetten_g: number
  verzadigd_vet_g: number
  vezels_g: number
  zout_mg: number
  micronutrienten: Record<string, number | null>
}

interface ZoekResultaat {
  id: string
  naam: string
  merk: string | null
  hoeveelheid?: string | null
  bron: 'open_food_facts' | 'usda'
  per_100g: NutrientenPer100g
  foto_url: string | null
}

interface DagTotaal {
  calorieen: number; eiwitten_g: number; koolhydraten_g: number; vetten_g: number; vezels_g: number
}

/** Persoonlijke voedingsdoelen + dieetcontext uit het intake-profiel (via /api/voeding). */
interface VoedingDoelen {
  calorie_doel: number | null
  calorie_handmatig: boolean
  macros: { eiwit_g: number; koolhydraten_g: number; vet_g: number } | null
  dieetvoorkeur: string | null
  allergieen: string[]
  profiel_compleet: boolean
}

type Scherm = 'overzicht' | 'analyseren' | 'bevestigen' | 'manueel' | 'zoeken' | 'detail'

// ─── RDI (EU aanbevolen dagelijkse inname) ────────────────────────────────────

const RDI: Record<string, number> = {
  calorieen: 2000, eiwitten_g: 50, koolhydraten_g: 260, suikers_g: 90,
  vetten_g: 70, verzadigd_vet_g: 20, vezels_g: 25, zout_mg: 6000,
  vitamine_a_ug: 800, vitamine_c_mg: 80, vitamine_d_ug: 5, vitamine_e_mg: 12,
  vitamine_b12_ug: 2.5, folaat_ug: 200, calcium_mg: 800, ijzer_mg: 14,
  magnesium_mg: 375, kalium_mg: 2000, natrium_mg: 2000, zink_mg: 10,
}

const MICRO_META: Record<string, { label: string; eenheid: string; rdi_key: string }> = {
  vitamine_a_ug:   { label: 'Vitamine A',   eenheid: 'μg', rdi_key: 'vitamine_a_ug'   },
  vitamine_c_mg:   { label: 'Vitamine C',   eenheid: 'mg', rdi_key: 'vitamine_c_mg'   },
  vitamine_d_ug:   { label: 'Vitamine D',   eenheid: 'μg', rdi_key: 'vitamine_d_ug'   },
  vitamine_e_mg:   { label: 'Vitamine E',   eenheid: 'mg', rdi_key: 'vitamine_e_mg'   },
  vitamine_b12_ug: { label: 'Vitamine B12', eenheid: 'μg', rdi_key: 'vitamine_b12_ug' },
  folaat_ug:       { label: 'Folaat',       eenheid: 'μg', rdi_key: 'folaat_ug'       },
  calcium_mg:      { label: 'Calcium',      eenheid: 'mg', rdi_key: 'calcium_mg'      },
  ijzer_mg:        { label: 'IJzer',        eenheid: 'mg', rdi_key: 'ijzer_mg'        },
  magnesium_mg:    { label: 'Magnesium',    eenheid: 'mg', rdi_key: 'magnesium_mg'    },
  kalium_mg:       { label: 'Kalium',       eenheid: 'mg', rdi_key: 'kalium_mg'       },
  natrium_mg:      { label: 'Natrium',      eenheid: 'mg', rdi_key: 'natrium_mg'      },
  zink_mg:         { label: 'Zink',         eenheid: 'mg', rdi_key: 'zink_mg'         },
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAALTIJD_VOLGORDE: VoedingLog['maaltijd_type'][] = ['ontbijt', 'tussendoortje_1', 'lunch', 'tussendoortje_2', 'diner', 'avondsnack']
const MAALTIJD_EMOJI: Record<string, string> = { ontbijt: '🌅', tussendoortje_1: '🍌', lunch: '☀️', tussendoortje_2: '🥜', diner: '🌙', avondsnack: '🍫' }
const MAALTIJD_KLEUR: Record<string, string> = { ontbijt: 'var(--mf-amber)', tussendoortje_1: 'var(--mf-amber)', lunch: 'var(--mf-green)', tussendoortje_2: 'var(--mf-amber-dark)', diner: 'var(--mf-purple)', avondsnack: 'var(--mf-red)' }
const MAALTIJD_LABEL: Record<string, string> = { ontbijt: 'Ontbijt', tussendoortje_1: 'Tuss. 1', lunch: 'Lunch', tussendoortje_2: 'Tuss. 2', diner: 'Diner', avondsnack: 'Avond' }
const MAALTIJD_VOL_LABEL: Record<string, string> = { ontbijt: 'Ontbijt', tussendoortje_1: 'Tussendoortje 1', lunch: 'Lunch', tussendoortje_2: 'Tussendoortje 2', diner: 'Diner', avondsnack: 'Avondsnack' }
const DOEL_KCAL = 2000
const ML_PER_GLAS = 250

// ─── SVG Componenten ──────────────────────────────────────────────────────────

function CalorieRing({ gegeten, doel, kleur }: { gegeten: number; doel: number; kleur: string }) {
  const r = 70, circ = 2 * Math.PI * r
  const pct = Math.min(1, gegeten / doel)
  const over = gegeten > doel
  const ariaLabel = over
    ? `${gegeten} van ${doel} kcal gegeten, ${gegeten - doel} kcal over het doel`
    : `${gegeten} van ${doel} kcal gegeten, ${doel - gegeten} kcal resterend`
  return (
    <svg width="180" height="180" viewBox="0 0 180 180" style={{ display: 'block' }} role="img" aria-label={ariaLabel}>
      <circle cx="90" cy="90" r={r} fill="none" style={{ stroke: 'var(--bg-subtle)' }} strokeWidth="12" />
      <circle cx="90" cy="90" r={r} fill="none"
        style={{ stroke: over ? 'var(--mf-red)' : kleur, transition: 'stroke-dasharray 1s ease' }} strokeWidth="12"
        strokeDasharray={`${pct * circ} ${circ}`}
        strokeLinecap="round" transform="rotate(-90 90 90)" />
      <text x="90" y="82" textAnchor="middle" fontSize="28" fontWeight="900" style={{ fill: over ? 'var(--mf-red)' : 'var(--text-1)' }}>{gegeten}</text>
      <text x="90" y="100" textAnchor="middle" fontSize="12" style={{ fill: 'var(--text-4)' }} fontWeight="600">kcal</text>
      <text x="90" y="116" textAnchor="middle" fontSize="11" style={{ fill: over ? 'var(--mf-red)' : 'var(--mf-green)' }} fontWeight="700">
        {over ? `+${gegeten - doel} over` : `${doel - gegeten} resterend`}
      </text>
    </svg>
  )
}

function MacroRing({ waarde, max, kleur, label, eenheid }: { waarde: number; max: number; kleur: string; label: string; eenheid: string }) {
  const r = 26, circ = 2 * Math.PI * r
  const pct = Math.min(1, waarde / max)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width="68" height="68" viewBox="0 0 68 68" role="img" aria-label={`${label}: ${waarde.toFixed(0)}${eenheid} van ${max.toFixed(0)}${eenheid}`}>
        <circle cx="34" cy="34" r={r} fill="none" style={{ stroke: 'var(--bg-subtle)' }} strokeWidth="6" />
        <circle cx="34" cy="34" r={r} fill="none" style={{ stroke: kleur, transition: 'stroke-dasharray 1s ease' }} strokeWidth="6"
          strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 34 34)" />
        <text x="34" y="37" textAnchor="middle" fontSize="11" fontWeight="800" style={{ fill: kleur }}>{waarde.toFixed(0)}{eenheid}</text>
      </svg>
      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)' }}>{label}</span>
    </div>
  )
}

function RdiBalk({ label, waarde, eenheid, rdi, kleur = 'var(--mentaforce-primary)', sub = false }: {
  label: string; waarde: number; eenheid: string; rdi: number; kleur?: string; sub?: boolean
}) {
  const pctRaw = Math.round((waarde / rdi) * 100)
  const pct = Math.min(100, pctRaw)
  const overRdi = pctRaw > 100
  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 13, color: sub ? 'var(--text-4)' : 'var(--text-2)', fontWeight: sub ? 400 : 600 }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: sub ? 'var(--text-4)' : 'var(--text-2)' }}>{waarde.toFixed(1)} {eenheid}</span>
          <span style={{
            fontSize: 10, fontWeight: 800, borderRadius: 20, padding: '2px 7px',
            background: overRdi ? 'var(--mf-red-light)' : pct >= 50 ? 'var(--mf-green-light)' : 'var(--mf-amber-light)',
            color: overRdi ? 'var(--mf-red)' : pct >= 50 ? 'var(--mentaforce-primary)' : 'var(--mf-amber)',
          }}>{pctRaw}%</span>
        </div>
      </div>
      <div role="img" aria-label={`${label}: ${waarde.toFixed(1)} ${eenheid}, ${pctRaw}% van de dagelijkse behoefte`}
        style={{ height: 4, borderRadius: 9999, background: 'var(--bg-subtle)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 9999, width: `${Math.min(100, pct)}%`,
          background: overRdi ? 'var(--mf-red)' : kleur,
          transition: 'width 0.8s ease',
        }} />
      </div>
    </div>
  )
}

function GezondheidBadge({ score }: { score: number }) {
  const kleur = score >= 7 ? 'var(--mf-green)' : score >= 4 ? 'var(--mf-amber)' : 'var(--mf-red)'
  const bg    = score >= 7 ? 'var(--mf-green-light)' : score >= 4 ? 'var(--mf-amber-light)' : 'var(--mf-red-light)'
  const label = score >= 7 ? 'Gezond' : score >= 4 ? 'Matig' : 'Ongezond'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: bg, color: kleur, borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
      {score}/10 · {label}
    </span>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function VoedingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef    = useRef<HTMLInputElement>(null)
  const cameraInputRef  = useRef<HTMLInputElement>(null)
  const barcodeInputRef = useRef<HTMLInputElement>(null)

  const [scherm, setScherm]       = useState<Scherm>('overzicht')
  const [logs, setLogs]           = useState<VoedingLog[]>([])
  const [doelen, setDoelen]       = useState<VoedingDoelen | null>(null)
  const [laden, setLaden]         = useState(true)
  const [opslaan, setOpslaan]     = useState(false)
  const [fout, setFout]           = useState<string | null>(null)

  // Foto state
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [analyse, setAnalyse]         = useState<AiAnalyse | null>(null)

  // Form state
  const [form, setForm] = useState({
    maaltijd_type: 'lunch' as VoedingLog['maaltijd_type'],
    omschrijving: '', calorieen: '', eiwitten_g: '',
    koolhydraten_g: '', vetten_g: '', vezels_g: '', portie_gram: '',
  })

  // Zoek state
  const [zoekQuery, setZoekQuery]                   = useState('')
  const [zoekBron, setZoekBron]                     = useState<'off' | 'usda'>('off')
  const [zoekResultaten, setZoekResultaten]         = useState<ZoekResultaat[]>([])
  const [zoekLaden, setZoekLaden]                   = useState(false)
  const [geselecteerdProduct, setGeselecteerdProduct] = useState<ZoekResultaat | null>(null)
  const [portieGram, setPortieGram]                 = useState(100)
  const [recenteFoods, setRecenteFoods]             = useState<ZoekResultaat[]>([])

  // Water state
  const [water, setWater] = useState(0)
  const [waterDoelMl, setWaterDoelMl] = useState(2000)

  // Setup wizard: toon wanneer profiel incompleet is, of handmatig geopend
  const [heeftSetupGezien, setHeeftSetupGezien] = useState(false)
  const [toontSetup, setToontSetup] = useState(false)

  // Session
  const [token, setToken] = useState<string | null>(null)
  const vandaag = new Date().toISOString().split('T')[0]

  // ── Init ────────────────────────────────────────────────────────────────────

  const laadLogs = useCallback(async (tok: string) => {
    setLaden(true)
    const res = await fetch(`/api/voeding?datum=${vandaag}`, { headers: { Authorization: `Bearer ${tok}` } })
    const data = await res.json() as { logs: VoedingLog[]; doelen?: VoedingDoelen }
    setLogs(data.logs || [])
    setDoelen(data.doelen ?? null)
    setLaden(false)
  }, [vandaag])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/login'); return }
      setToken(session.access_token)
      laadLogs(session.access_token)
      // Waterdoel ophalen vanuit profiel
      fetch(`/api/water?datum=${vandaag}`, { headers: { Authorization: `Bearer ${session.access_token}` } })
        .then(r => r.json())
        .then((d: { doel_ml?: number }) => { if (d.doel_ml) setWaterDoelMl(d.doel_ml) })
        .catch(() => { /* fallback op 2000 ml */ })
    })
    // localStorage lezen + setState buiten de synchrone effect-body
    Promise.resolve().then(() => {
      try { setWater(parseInt(localStorage.getItem(`water_${vandaag}`) || '0')) } catch { /* ok */ }
      try {
        const r = JSON.parse(localStorage.getItem('voeding_recent') || '[]') as ZoekResultaat[]
        setRecenteFoods(r.slice(0, 8))
      } catch { /* ok */ }
    })
  }, [router, vandaag, laadLogs])

  // ── Data ─────────────────────────────────────────────────────────────────────


  const dagTotaal: DagTotaal = logs.reduce(
    (acc, l) => ({
      calorieen:      acc.calorieen      + (l.calorieen      ?? 0),
      eiwitten_g:     acc.eiwitten_g     + (l.eiwitten_g     ?? 0),
      koolhydraten_g: acc.koolhydraten_g + (l.koolhydraten_g ?? 0),
      vetten_g:       acc.vetten_g       + (l.vetten_g       ?? 0),
      vezels_g:       acc.vezels_g       + (l.vezels_g       ?? 0),
    }),
    { calorieen: 0, eiwitten_g: 0, koolhydraten_g: 0, vetten_g: 0, vezels_g: 0 }
  )

  // ── Water ────────────────────────────────────────────────────────────────────

  const waterDoelGlazen = Math.max(4, Math.round(waterDoelMl / ML_PER_GLAS))

  const setWaterSave = (n: number) => {
    const clamped = Math.max(0, Math.min(waterDoelGlazen + 4, n))
    setWater(clamped)
    try { localStorage.setItem(`water_${vandaag}`, String(clamped)) } catch { /* ok */ }
  }

  // ── Foto ─────────────────────────────────────────────────────────────────────

  const verwerkFoto = async (file: File) => {
    setFout(null)
    const reader = new FileReader()
    reader.onload = e => setFotoPreview(e.target?.result as string)
    reader.readAsDataURL(file)
    setScherm('analyseren')

    const tok = (await supabase.auth.getSession()).data.session?.access_token
    if (!tok) return
    const fd = new FormData()
    fd.append('foto', file)

    try {
      const res = await fetch('/api/voeding/analyseer', { method: 'POST', headers: { Authorization: `Bearer ${tok}` }, body: fd })
      if (!res.ok) { const e = await res.json() as { error?: string }; throw new Error(e.error || 'Analyse mislukt') }
      const data = await res.json() as { analyse: AiAnalyse }
      const a = data.analyse
      setAnalyse(a)
      setForm({
        maaltijd_type: (a.maaltijd_type as VoedingLog['maaltijd_type']) || 'lunch',
        omschrijving: a.gerecht || '',
        calorieen: a.calorieen ? String(a.calorieen) : '',
        eiwitten_g: a.macros?.eiwitten_g ? String(a.macros.eiwitten_g) : '',
        koolhydraten_g: a.macros?.koolhydraten_g ? String(a.macros.koolhydraten_g) : '',
        vetten_g: a.macros?.vetten_g ? String(a.macros.vetten_g) : '',
        vezels_g: a.macros?.vezels_g ? String(a.macros.vezels_g) : '',
        portie_gram: a.portie_gram ? String(a.portie_gram) : '',
      })
      setScherm('bevestigen')
    } catch (e) {
      const msg = (e as Error).message || 'Analyse mislukt.'
      setFout(msg)
      toast({ title: 'Analyse mislukt', description: msg, variant: 'error' })
      setScherm('overzicht')
    }
  }

  const onFotoInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) verwerkFoto(file)
    e.target.value = ''
  }

  // ── Barcode scan ─────────────────────────────────────────────────────────────

  const onBarcodeInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    // BarcodeDetector is available in Chrome/Safari on modern devices
    if (!('BarcodeDetector' in window)) {
      // Fallback: open search so user can type barcode manually
      setZoekQuery(''); setZoekResultaten([]); setScherm('zoeken')
      return
    }

    try {
      const bitmap = await createImageBitmap(file)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detector = new (window as any).BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] })
      const codes: Array<{ rawValue: string }> = await detector.detect(bitmap)
      if (codes.length > 0) {
        const ean = codes[0].rawValue
        setZoekQuery(ean)
        setZoekResultaten([])
        setScherm('zoeken')
        // trigger search after state settles
        setTimeout(() => zoekVoeding(ean), 50)
      } else {
        setZoekQuery(''); setZoekResultaten([]); setScherm('zoeken')
      }
    } catch {
      setZoekQuery(''); setZoekResultaten([]); setScherm('zoeken')
    }
  }

  // ── Opslaan ──────────────────────────────────────────────────────────────────

  const slaOp = async (bron: 'foto' | 'manueel') => {
    if (!token) return
    setOpslaan(true); setFout(null)
    const body = {
      datum: vandaag, maaltijd_type: form.maaltijd_type,
      omschrijving: form.omschrijving.trim() || 'Onbekend gerecht',
      calorieen: form.calorieen ? parseInt(form.calorieen) : null,
      eiwitten_g: form.eiwitten_g ? parseFloat(form.eiwitten_g) : null,
      koolhydraten_g: form.koolhydraten_g ? parseFloat(form.koolhydraten_g) : null,
      vetten_g: form.vetten_g ? parseFloat(form.vetten_g) : null,
      vezels_g: form.vezels_g ? parseFloat(form.vezels_g) : null,
      portie_gram: form.portie_gram ? parseInt(form.portie_gram) : null,
      bron, ai_analyse: bron === 'foto' ? analyse : null,
    }
    try {
      const res = await fetch('/api/voeding', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Opslaan mislukt')
      await laadLogs(token)
      vitaEvent('data_logged', { kind: 'voeding' })
      toast({ title: 'Maaltijd opgeslagen', variant: 'success' })
      resetForm(); setScherm('overzicht')
      router.push('/vandaag')
    } catch (e) {
      const msg = (e as Error).message || 'Opslaan mislukt.'
      setFout(msg)
      toast({ title: 'Opslaan mislukt', description: msg, variant: 'error' })
    }
    finally { setOpslaan(false) }
  }

  const verwijder = async (id: string) => {
    if (!token) return
    const vorige = logs
    setLogs(prev => prev.filter(l => l.id !== id))
    try {
      const res = await fetch(`/api/voeding?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Verwijderen mislukt')
    } catch (e) {
      // Rollback bij fout: terug naar de vorige lijst en meld het.
      setLogs(vorige)
      toast({ title: 'Verwijderen mislukt', description: (e as Error).message, variant: 'error' })
    }
  }

  // ── Zoeken ───────────────────────────────────────────────────────────────────

  const zoekVoeding = async (q: string, bron?: string) => {
    if (q.length < 2) { setZoekResultaten([]); return }
    setZoekLaden(true)
    try {
      const res = await fetch(`/api/voeding/zoek?q=${encodeURIComponent(q)}&bron=${bron || zoekBron}`)
      const data = await res.json() as { resultaten: ZoekResultaat[] }
      setZoekResultaten(data.resultaten || [])
    } catch { setZoekResultaten([]) }
    finally { setZoekLaden(false) }
  }

  const selecteerProduct = (product: ZoekResultaat) => {
    setGeselecteerdProduct(product); setPortieGram(100); setScherm('detail')
  }

  const slaRecentOp = (product: ZoekResultaat) => {
    try {
      const recent = JSON.parse(localStorage.getItem('voeding_recent') || '[]') as ZoekResultaat[]
      const gefilterd = recent.filter(r => r.id !== product.id)
      const nieuw = [product, ...gefilterd].slice(0, 8)
      localStorage.setItem('voeding_recent', JSON.stringify(nieuw))
      setRecenteFoods(nieuw)
    } catch { /* ok */ }
  }

  const voegProductToe = async () => {
    if (!token || !geselecteerdProduct) return
    setOpslaan(true)
    const factor = portieGram / 100
    const p = geselecteerdProduct.per_100g
    const body = {
      datum: vandaag, maaltijd_type: form.maaltijd_type,
      omschrijving: geselecteerdProduct.naam + (geselecteerdProduct.merk ? ` (${geselecteerdProduct.merk})` : ''),
      calorieen: Math.round((p.calorieen || 0) * factor),
      eiwitten_g: Number(((p.eiwitten_g || 0) * factor).toFixed(1)),
      koolhydraten_g: Number(((p.koolhydraten_g || 0) * factor).toFixed(1)),
      vetten_g: Number(((p.vetten_g || 0) * factor).toFixed(1)),
      vezels_g: Number(((p.vezels_g || 0) * factor).toFixed(1)),
      portie_gram: portieGram, bron: 'manueel',
      food_database_id: geselecteerdProduct.id, food_database_bron: geselecteerdProduct.bron,
      ai_analyse: { micronutrienten: p.micronutrienten },
    }
    try {
      const res = await fetch('/api/voeding', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Opslaan mislukt')
      slaRecentOp(geselecteerdProduct)
      await laadLogs(token)
      vitaEvent('data_logged', { kind: 'voeding' })
      toast({ title: 'Toegevoegd aan je dag', variant: 'success' })
      setGeselecteerdProduct(null); setZoekQuery(''); setZoekResultaten([])
      setScherm('overzicht')
    } catch (e) {
      const msg = (e as Error).message || 'Opslaan mislukt.'
      setFout(msg)
      toast({ title: 'Opslaan mislukt', description: msg, variant: 'error' })
    }
    finally { setOpslaan(false) }
  }

  const resetForm = () => {
    setForm({ maaltijd_type: 'lunch', omschrijving: '', calorieen: '', eiwitten_g: '', koolhydraten_g: '', vetten_g: '', vezels_g: '', portie_gram: '' })
    setFotoPreview(null); setAnalyse(null); setFout(null)
  }

  // ── Render helpers ────────────────────────────────────────────────────────────

  // Effectief calorie-doel: persoonlijk doel uit het profiel, anders RDI-fallback.
  const heeftPersoonlijkDoel = doelen?.calorie_doel != null
  const calorieDoel = doelen?.calorie_doel ?? DOEL_KCAL
  // Macrotargets: persoonlijk berekend (eiwit/koolhydraten/vet), vezels blijft RDI.
  const eiwitDoel = doelen?.macros?.eiwit_g ?? RDI.eiwitten_g
  const koolhDoel = doelen?.macros?.koolhydraten_g ?? RDI.koolhydraten_g
  const vetDoel   = doelen?.macros?.vet_g ?? RDI.vetten_g
  const vezelsDoel = RDI.vezels_g
  const kCalKleur = dagTotaal.calorieen > calorieDoel * 1.05 ? 'var(--mf-red)' : dagTotaal.calorieen > calorieDoel * 0.75 ? 'var(--mf-green)' : 'var(--mf-amber)'
  const logsByMaaltijd = MAALTIJD_VOLGORDE.reduce((acc, mt) => { acc[mt] = logs.filter(l => l.maaltijd_type === mt); return acc }, {} as Record<string, VoedingLog[]>)

  function renderInputVeld({ label, veld, type = 'text', suffix = '' }: { label: string; veld: keyof typeof form; type?: string; suffix?: string }) {
    // Eenheid in het label (bv. "Calorieën (kcal)") houdt de label-koppeling intact
    // en is voorleesbaar — beter dan een losse, niet-gekoppelde suffix.
    const labelMetEenheid = suffix ? `${label} (${suffix})` : label
    return (
      <Field label={labelMetEenheid}>
        <Input
          type={type}
          inputMode={type === 'number' ? 'decimal' : undefined}
          value={form[veld]}
          onChange={e => setForm(prev => ({ ...prev, [veld]: e.target.value }))}
          placeholder={type === 'number' ? '0' : ''}
        />
      </Field>
    )
  }

  function renderMaaltijdSelector() {
    return (
      <div role="group" aria-label="Maaltijdtype" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
        {MAALTIJD_VOLGORDE.map(mt => {
          const actief = form.maaltijd_type === mt
          return (
            <button key={mt} type="button" onClick={() => setForm(prev => ({ ...prev, maaltijd_type: mt }))}
              aria-pressed={actief}
              aria-label={MAALTIJD_VOL_LABEL[mt]}
              style={{ minHeight: 44, padding: '9px 4px', borderRadius: 10,
                border: `1.5px solid ${actief ? MAALTIJD_KLEUR[mt] : 'var(--border)'}`,
                background: actief ? `color-mix(in srgb, ${MAALTIJD_KLEUR[mt]} 14%, transparent)` : 'var(--bg-card)',
                color: actief ? MAALTIJD_KLEUR[mt] : 'var(--text-3)',
                fontSize: 10, fontWeight: 700, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <span aria-hidden style={{ fontSize: 16 }}>{MAALTIJD_EMOJI[mt]}</span>
              <span>{MAALTIJD_LABEL[mt]}</span>
            </button>
          )
        })}
      </div>
    )
  }

  // ── Loading ───────────────────────────────────────────────────────────────────

  if (laden) return (
    <div className="mf-mesh-bg" style={{ background: 'var(--bg-app)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="mf-spinner" />
      </div>
    </div>
  )

  // ── Setup wizard: toon bij incompleet profiel ────────────────────────────────

  if (toontSetup || (!heeftSetupGezien && doelen !== null && !doelen.profiel_compleet)) {
    return (
      <VoedingSetup
        onComplete={() => { setToontSetup(false); setHeeftSetupGezien(true); if (token) laadLogs(token) }}
        onOverslaan={() => { setToontSetup(false); setHeeftSetupGezien(true) }}
      />
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="mf-mesh-bg" style={{ background: 'var(--bg-app)', minHeight: '100vh' }}>
      <Navbar />
      <input ref={cameraInputRef}  type="file" accept="image/*" capture="environment" onChange={onFotoInput}    style={{ display: 'none' }} />
      <input ref={fileInputRef}    type="file" accept="image/*"                        onChange={onFotoInput}    style={{ display: 'none' }} />
      <input ref={barcodeInputRef} type="file" accept="image/*" capture="environment" onChange={onBarcodeInput} style={{ display: 'none' }} />

      <div style={{ maxWidth: 900, margin: '0 auto',
        paddingTop: 24,
        paddingRight: 'calc(16px + var(--safe-right, 0px))',
        paddingBottom: 'calc(100px + var(--safe-bottom, 0px))',
        paddingLeft: 'calc(16px + var(--safe-left, 0px))' }}>

        {/* ══════════════════════════════════════════════════════════════════════
            OVERZICHT
        ══════════════════════════════════════════════════════════════════════ */}
        {scherm === 'overzicht' && (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-1)', margin: '0 0 2px', letterSpacing: '-0.03em' }}>Voeding</h1>
                <p style={{ fontSize: 13, color: 'var(--text-4)', margin: 0, textTransform: 'capitalize' }}>
                  {new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <div style={{ fontSize: logs.length > 0 ? 12 : 11, color: logs.length > 0 ? 'var(--mf-green)' : 'var(--text-4)', fontWeight: 700 }}>
                  {logs.length > 0 ? `${logs.length} maaltijd${logs.length !== 1 ? 'en' : ''}` : 'Nog niets gelogd'}
                </div>
                <button
                  type="button"
                  aria-label="Wijzig je voedingsplan"
                  onClick={() => setToontSetup(true)}
                  style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-strong)', borderRadius: 20, padding: '7px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-2)', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  Wijzig plan ›
                </button>
              </div>
            </div>

            {fout && (
              <div style={{ background: 'var(--mf-red-light)', border: '1px solid var(--mf-red)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: 'var(--mf-red)' }}>{fout}</div>
            )}

            {/* ── Calorie Dashboard kaart ── */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 24, border: '1px solid var(--border)', marginBottom: 14, overflow: 'hidden',
              boxShadow: 'var(--shadow-md)' }}>
              {/* Top: ring + macro rings */}
              <div style={{ padding: '20px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <div aria-hidden style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 0, pointerEvents: 'none', width: 220, height: 220, borderRadius: '50%', background: `radial-gradient(circle, ${KCAL_GLOW(dagTotaal.calorieen, calorieDoel)} 0%, transparent 70%)` }} />
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <CalorieRing gegeten={dagTotaal.calorieen} doel={calorieDoel} kleur={kCalKleur} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <MacroRing waarde={dagTotaal.eiwitten_g}     max={eiwitDoel}  kleur={MACRO_KLEUR.eiwit}        label="Eiwit"   eenheid="g" />
                  <MacroRing waarde={dagTotaal.koolhydraten_g} max={koolhDoel}  kleur={MACRO_KLEUR.koolhydraten} label="Koolh."  eenheid="g" />
                  <MacroRing waarde={dagTotaal.vetten_g}       max={vetDoel}    kleur={MACRO_KLEUR.vet}          label="Vet"     eenheid="g" />
                  <MacroRing waarde={dagTotaal.vezels_g}       max={vezelsDoel} kleur={MACRO_KLEUR.vezels}       label="Vezels"  eenheid="g" />
                </div>
              </div>

              {/* Doel-context: persoonlijk doel of uitnodiging om intake af te ronden */}
              <div style={{ padding: '0 20px 12px' }}>
                {heeftPersoonlijkDoel ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, color: 'var(--text-4)', fontWeight: 600 }}>
                    <span>🎯</span>
                    <span>Persoonlijk doel: <strong style={{ color: 'var(--text-2)' }}>{calorieDoel} kcal</strong>{doelen?.calorie_handmatig ? ' (handmatig ingesteld)' : ' (berekend uit je profiel)'}</span>
                  </div>
                ) : (
                  <button type="button" aria-label="Rond je intake af in instellingen" onClick={() => router.push('/instellingen')}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--mf-amber-light)', border: '1px solid var(--mf-amber)', borderRadius: 12, padding: '12px 14px', cursor: 'pointer', textAlign: 'left' }}>
                    <span aria-hidden style={{ fontSize: 18 }}>⚙️</span>
                    <span style={{ flex: 1, fontSize: 12, color: 'var(--text-1)', fontWeight: 600, lineHeight: 1.4 }}>
                      Rond je intake af voor een persoonlijk calorie- en macrodoel. Nu tonen we het standaarddoel ({DOEL_KCAL} kcal).
                    </span>
                    <span style={{ fontSize: 16, color: 'var(--mf-amber)' }}>›</span>
                  </button>
                )}
              </div>

              {/* Macro-voortgang t.o.v. persoonlijke targets */}
              <div style={{ padding: '0 20px 16px' }}>
                {[
                  { label: 'Eiwit',        waarde: dagTotaal.eiwitten_g,     rdi: eiwitDoel,  kleur: 'var(--mf-red)',    eenheid: 'g' },
                  { label: 'Koolhydraten', waarde: dagTotaal.koolhydraten_g, rdi: koolhDoel,  kleur: 'var(--mf-amber)',  eenheid: 'g' },
                  { label: 'Vet',          waarde: dagTotaal.vetten_g,       rdi: vetDoel,    kleur: 'var(--mf-purple)', eenheid: 'g' },
                  { label: 'Vezels',       waarde: dagTotaal.vezels_g,       rdi: vezelsDoel, kleur: 'var(--mf-green)',  eenheid: 'g' },
                ].map(m => (
                  <RdiBalk key={m.label} label={m.label} waarde={m.waarde} eenheid={m.eenheid} rdi={m.rdi} kleur={m.kleur} />
                ))}
              </div>
            </div>

            {/* ── Dieetvoorkeur & allergieën ── */}
            {doelen && ((doelen.dieetvoorkeur && doelen.dieetvoorkeur !== 'geen') || doelen.allergieen.length > 0) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {doelen.dieetvoorkeur && doelen.dieetvoorkeur !== 'geen' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--mf-green-light)', color: 'var(--mf-green)', borderRadius: 20, padding: '4px 11px', fontSize: 12, fontWeight: 700, textTransform: 'capitalize' }}>
                    🥗 {doelen.dieetvoorkeur}
                  </span>
                )}
                {doelen.allergieen.map(a => (
                  <span key={a} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--mf-red-light)', color: 'var(--mf-red)', borderRadius: 20, padding: '4px 11px', fontSize: 12, fontWeight: 700, textTransform: 'capitalize' }}>
                    ⚠️ {a}
                  </span>
                ))}
              </div>
            )}

            {/* ── Water tracker ── */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 18, border: '1px solid var(--border)', padding: '12px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 22 }}>💧</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Water</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--mf-blue)' }}>{water}/{waterDoelGlazen} glazen</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {Array.from({ length: waterDoelGlazen }).map((_, i) => (
                    <button key={i} type="button" onClick={() => setWaterSave(i < water ? i : i + 1)}
                      aria-label={`Zet water op ${i < water ? i : i + 1} glazen`}
                      style={{ flex: 1, minHeight: 24, padding: '8px 0', display: 'flex', alignItems: 'center', borderRadius: 4, border: 'none', cursor: 'pointer', background: 'transparent' }}>
                      <span aria-hidden style={{ display: 'block', width: '100%', height: 8, borderRadius: 4,
                        background: i < water ? 'var(--mf-blue)' : 'var(--mf-blue-light)',
                        transition: 'background 0.2s var(--ease)' }} />
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button type="button" onClick={() => setWaterSave(water - 1)} aria-label="Eén glas water minder"
                  style={{ width: 44, height: 44, borderRadius: 10, border: '1px solid var(--border-strong)', background: 'var(--bg-subtle)', cursor: 'pointer', fontSize: 16, color: 'var(--text-2)', fontWeight: 700 }}>−</button>
                <button type="button" onClick={() => setWaterSave(water + 1)} aria-label="Eén glas water meer"
                  style={{ width: 44, height: 44, borderRadius: 10, border: '1px solid var(--mf-blue)', background: 'var(--mf-blue)', cursor: 'pointer', fontSize: 16, color: 'var(--bg-app)', fontWeight: 800 }}>+</button>
              </div>
            </div>

            {/* ── Actie knoppen ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {/* Zoeken — primaire actie (cyan-accent) */}
              <button type="button" className="vd-action vd-action--primary"
                aria-label="Voeding zoeken in productdatabase"
                onClick={() => { setZoekQuery(''); setZoekResultaten([]); setScherm('zoeken') }}>
                <span aria-hidden style={{ fontSize: 24, marginBottom: 4 }}>🔍</span>
                <span style={{ fontSize: 12, fontWeight: 800 }}>Zoeken</span>
                <span style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>3M+ producten</span>
              </button>
              {/* Foto AI */}
              <button type="button" className="vd-action"
                aria-label="Maaltijd fotograferen voor AI-analyse"
                onClick={() => cameraInputRef.current?.click()}>
                <span aria-hidden style={{ fontSize: 24, marginBottom: 4 }}>📸</span>
                <span style={{ fontSize: 12, fontWeight: 800 }}>Foto AI</span>
                <span style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>Auto-analyse</span>
              </button>
              {/* Barcode */}
              <button type="button" className="vd-action"
                aria-label="Barcode van product scannen"
                onClick={() => barcodeInputRef.current?.click()}>
                <span aria-hidden style={{ fontSize: 24, marginBottom: 4 }}>〄</span>
                <span style={{ fontSize: 12, fontWeight: 800 }}>Barcode</span>
                <span style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>Scan product</span>
              </button>
              {/* Manueel */}
              <button type="button" className="vd-action"
                aria-label="Maaltijd handmatig invoeren"
                onClick={() => { resetForm(); setScherm('manueel') }}>
                <span aria-hidden style={{ fontSize: 24, marginBottom: 4 }}>✏️</span>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Manueel</span>
                <span style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>Zelf invoeren</span>
              </button>
            </div>

            {/* ── AI Voedingscoach ── */}
            {logs.length >= 2 && (
              <AiCoachCard
                categorie="voeding"
                apiUrl="/api/ai-coach/voeding"
                linkUrl="/voeding"
                linkLabel="Mijn voedingsrapport"
              />
            )}

            {/* ── Recente voeding ── */}
            {recenteFoods.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>Recent gebruikt</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {recenteFoods.slice(0, 4).map(r => (
                    <button key={r.id} type="button" aria-label={`Selecteer ${r.naam}`} onClick={() => selecteerProduct(r)}
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 12px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                        {r.foto_url ? <img src={r.foto_url} alt="" style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover' }} /> : '🍽️'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.naam}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-4)', margin: 0 }}>{r.per_100g.calorieen} kcal/100g · {r.per_100g.eiwitten_g}g eiwit</p>
                      </div>
                      <span style={{ fontSize: 16, color: 'var(--text-4)' }}>›</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Maaltijdlog ── */}
            {MAALTIJD_VOLGORDE.map(mt => {
              const mtLogs = logsByMaaltijd[mt]
              if (mtLogs.length === 0) return null
              const mtKcal = mtLogs.reduce((a, l) => a + (l.calorieen ?? 0), 0)
              return (
                <div key={mt} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '0 2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span aria-hidden style={{ fontSize: 16 }}>{MAALTIJD_EMOJI[mt]}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)' }}>{MAALTIJD_LABEL[mt]}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: MAALTIJD_KLEUR[mt] }}>{mtKcal} kcal</span>
                      <button type="button" aria-label={`Voeg toe aan ${MAALTIJD_VOL_LABEL[mt]}`}
                        onClick={() => { setForm(f => ({ ...f, maaltijd_type: mt })); setZoekQuery(''); setZoekResultaten([]); setScherm('zoeken') }}
                        style={{ background: `color-mix(in srgb, ${MAALTIJD_KLEUR[mt]} 15%, transparent)`, border: 'none', borderRadius: 8, padding: '7px 12px', minHeight: 36, cursor: 'pointer', fontSize: 11, fontWeight: 700, color: MAALTIJD_KLEUR[mt] }}>
                        + Toevoegen
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {mtLogs.map(log => (
                      <div key={log.id} style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden', display: 'flex' }}>
                        {/* Kleurstrook links */}
                        <div style={{ width: 4, background: MAALTIJD_KLEUR[mt], flexShrink: 0 }} />
                        <div style={{ display: 'flex', gap: 10, padding: '11px 12px', flex: 1, alignItems: 'center' }}>
                          {/* Foto/emoji */}
                          <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
                            background: `color-mix(in srgb, ${MAALTIJD_KLEUR[mt]} 15%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                            {log.foto_url
                              ? <Image src={log.foto_url} alt={log.omschrijving} width={44} height={44} style={{ objectFit: 'cover' }} />
                              : <span aria-hidden>{MAALTIJD_EMOJI[mt]}</span>}
                          </div>
                          {/* Content */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                                {log.omschrijving}
                              </p>
                              <button type="button" aria-label={`Verwijder ${log.omschrijving}`} onClick={() => verwijder(log.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 18, lineHeight: 1, padding: 4, marginRight: -4, flexShrink: 0 }}>×</button>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                              {log.calorieen && <span style={{ fontSize: 12, fontWeight: 800, color: kCalKleur }}>{log.calorieen} kcal</span>}
                              {log.eiwitten_g && <span style={{ fontSize: 11, color: 'var(--text-4)' }}>E:{log.eiwitten_g}g</span>}
                              {log.koolhydraten_g && <span style={{ fontSize: 11, color: 'var(--text-4)' }}>K:{log.koolhydraten_g}g</span>}
                              {log.vetten_g && <span style={{ fontSize: 11, color: 'var(--text-4)' }}>V:{log.vetten_g}g</span>}
                              {log.portie_gram && <span style={{ fontSize: 11, color: 'var(--text-4)' }}>{log.portie_gram}g</span>}
                              {log.bron === 'foto' && log.ai_analyse?.gezondheid_score && (
                                <GezondheidBadge score={log.ai_analyse.gezondheid_score} />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            {/* Leeg state */}
            {logs.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--bg-card)', borderRadius: 20, border: '1.5px dashed var(--border-strong)' }}>
                <div style={{ fontSize: 52, marginBottom: 12 }}>🥗</div>
                <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-2)', marginBottom: 6 }}>Begin met loggen</p>
                <p style={{ fontSize: 13, color: 'var(--text-4)', lineHeight: 1.6 }}>Zoek een product, maak een foto,<br />of voeg handmatig in.</p>
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            ANALYSEREN
        ══════════════════════════════════════════════════════════════════════ */}
        {scherm === 'analyseren' && (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            {fotoPreview && (
              <div style={{ width: 220, height: 220, borderRadius: 24, overflow: 'hidden', margin: '0 auto 32px', position: 'relative', boxShadow: 'var(--shadow-xl)' }}>
                <Image src={fotoPreview} alt="Foto" fill style={{ objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  <div className="mf-spinner" style={{ width: 36, height: 36, borderTopColor: 'white', borderWidth: 3 }} />
                  <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>Analyseren...</span>
                </div>
              </div>
            )}
            <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-1)', margin: '0 0 10px', letterSpacing: '-0.03em' }}>AI analyseert je maaltijd</h2>
            <p style={{ fontSize: 14, color: 'var(--text-3)', margin: 0, lineHeight: 1.6 }}>Claude herkent ingrediënten en<br />berekent calorieën + micros.</p>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            BEVESTIGEN (na AI foto)
        ══════════════════════════════════════════════════════════════════════ */}
        {scherm === 'bevestigen' && analyse && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <button type="button" aria-label="Terug naar overzicht" onClick={() => { resetForm(); setScherm('overzicht') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 24, padding: 0, lineHeight: 1, minWidth: 44, minHeight: 44 }}>‹</button>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-1)', margin: 0 }}>Bevestig maaltijd</h1>
            </div>

            {fotoPreview && (
              <div style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 14, position: 'relative', height: 200 }}>
                <Image src={fotoPreview} alt="Maaltijd" fill style={{ objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: 12, right: 12 }}><GezondheidBadge score={analyse.gezondheid_score} /></div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.75))', padding: '20px 16px 14px' }}>
                  <p style={{ color: 'white', fontSize: 16, fontWeight: 800, margin: '0 0 2px' }}>{analyse.gerecht}</p>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, margin: 0 }}>{analyse.beschrijving}</p>
                </div>
              </div>
            )}

            <div style={{
              background: analyse.betrouwbaarheid === 'hoog' ? 'var(--mf-green-light)' : analyse.betrouwbaarheid === 'gemiddeld' ? 'var(--mf-amber-light)' : 'var(--mf-red-light)',
              border: `1px solid ${analyse.betrouwbaarheid === 'hoog' ? 'var(--mentaforce-primary)' : analyse.betrouwbaarheid === 'gemiddeld' ? 'var(--mf-amber)' : 'var(--mf-red)'}`,
              borderRadius: 12, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>{analyse.betrouwbaarheid === 'hoog' ? '✅' : analyse.betrouwbaarheid === 'gemiddeld' ? '⚠️' : '❓'}</span>
              <span><strong>Betrouwbaarheid: {analyse.betrouwbaarheid}</strong>{analyse.betrouwbaarheid !== 'hoog' && ' — controleer de waarden.'}</span>
            </div>

            {analyse.ingredienten?.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Herkende ingrediënten</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {analyse.ingredienten.map((ing, i) => (
                    <span key={i} style={{ background: 'var(--bg-subtle)', color: 'var(--text-2)', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{ing}</span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ background: 'var(--bg-card)', borderRadius: 18, border: '1px solid var(--border)', padding: '16px', marginBottom: 14 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Aanpassen indien nodig</p>
              <div style={{ display: 'grid', gap: 10 }}>
                {renderMaaltijdSelector()}
                {renderInputVeld({ label: 'Gerecht', veld: 'omschrijving' })}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {renderInputVeld({ label: 'Calorieën', veld: 'calorieen', type: 'number', suffix: 'kcal' })}
                  {renderInputVeld({ label: 'Portie', veld: 'portie_gram', type: 'number', suffix: 'g' })}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {renderInputVeld({ label: 'Eiwit', veld: 'eiwitten_g', type: 'number', suffix: 'g' })}
                  {renderInputVeld({ label: 'Koolh.', veld: 'koolhydraten_g', type: 'number', suffix: 'g' })}
                  {renderInputVeld({ label: 'Vet', veld: 'vetten_g', type: 'number', suffix: 'g' })}
                  {renderInputVeld({ label: 'Vezels', veld: 'vezels_g', type: 'number', suffix: 'g' })}
                </div>
              </div>
            </div>

            {analyse.tips && (
              <div style={{ background: 'var(--mf-green-light)', border: '1px solid var(--mentaforce-primary)', borderRadius: 12, padding: '11px 14px', marginBottom: 14 }}>
                <p style={{ fontSize: 13, color: 'var(--text-1)', margin: 0, lineHeight: 1.5 }}><span aria-hidden>💡 </span>{analyse.tips}</p>
              </div>
            )}

            {fout && <div style={{ background: 'var(--mf-red-light)', border: '1px solid var(--mf-red)', borderRadius: 12, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: 'var(--mf-red)' }}>{fout}</div>}

            <button type="button" className="vd-cta" onClick={() => slaOp('foto')} disabled={opslaan}>
              {opslaan ? 'Opslaan...' : <><span aria-hidden>✅ </span>Maaltijd opslaan</>}
            </button>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            ZOEKEN
        ══════════════════════════════════════════════════════════════════════ */}
        {scherm === 'zoeken' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <button type="button" aria-label="Terug naar overzicht" onClick={() => setScherm('overzicht')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 24, padding: 0, minWidth: 44, minHeight: 44 }}>‹</button>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-1)', margin: 0 }}>Voeding zoeken</h1>
            </div>

            {/* Zoekbalk */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <div className="vd-searchbar" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-card)', border: '1.5px solid var(--border-strong)', borderRadius: 14, padding: '12px 16px' }}>
                <span aria-hidden style={{ fontSize: 18, color: 'var(--text-4)' }}>🔍</span>
                <input autoFocus type="search" enterKeyHint="search" value={zoekQuery}
                  aria-label="Zoek product, merk of ingrediënt"
                  onChange={e => { setZoekQuery(e.target.value); zoekVoeding(e.target.value) }}
                  placeholder="Zoek product, merk of ingrediënt..."
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: 16, color: 'var(--text-1)', background: 'none' }} />
                {zoekLaden && <div className="mf-spinner" style={{ width: 18, height: 18 }} />}
                {zoekQuery && !zoekLaden && (
                  <button type="button" aria-label="Zoekopdracht wissen" onClick={() => { setZoekQuery(''); setZoekResultaten([]) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', fontSize: 18, lineHeight: 1, minWidth: 28, minHeight: 28 }}>×</button>
                )}
              </div>
            </div>

            {/* Bron tabs */}
            <div role="group" aria-label="Database kiezen" style={{ display: 'flex', background: 'var(--bg-subtle)', borderRadius: 12, padding: 4, marginBottom: 12, gap: 4 }}>
              {[{ key: 'off' as const, label: '🌍 Open Food Facts', sub: '3M+ producten' }, { key: 'usda' as const, label: '🇺🇸 USDA', sub: 'Voedingswaarden' }].map(b => {
                const actief = zoekBron === b.key
                return (
                  <button key={b.key} type="button" aria-pressed={actief}
                    onClick={() => { setZoekBron(b.key); setZoekResultaten([]); if (zoekQuery.length >= 2) zoekVoeding(zoekQuery, b.key) }}
                    style={{ flex: 1, minHeight: 44, padding: '8px 10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: actief ? 'var(--bg-card)' : 'transparent',
                      boxShadow: actief ? 'var(--shadow-sm)' : 'none' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: actief ? 'var(--text-1)' : 'var(--text-3)' }}>{b.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-4)' }}>{b.sub}</div>
                  </button>
                )
              })}
            </div>

            {/* Maaltijd type */}
            <div style={{ marginBottom: 14 }}>{renderMaaltijdSelector()}</div>

            {/* Recent (alleen als geen query) */}
            {zoekQuery.length < 2 && recenteFoods.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>Recent gebruikt</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {recenteFoods.map(r => (
                    <button key={r.id} type="button" aria-label={`Selecteer ${r.naam}`} onClick={() => selecteerProduct(r)}
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 12px', cursor: 'pointer', textAlign: 'left', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, overflow: 'hidden' }}>
                        {r.foto_url ? <img src={r.foto_url} alt="" style={{ width: 40, height: 40, objectFit: 'cover' }} /> : '🍽️'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.naam}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-4)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.per_100g.calorieen} kcal · {r.per_100g.eiwitten_g}g eiwit · {r.per_100g.koolhydraten_g}g koolh.</p>
                      </div>
                      <span style={{ fontSize: 16, color: 'var(--text-4)', flexShrink: 0, paddingTop: 2 }}>›</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Geen resultaten */}
            {zoekQuery.length >= 2 && !zoekLaden && zoekResultaten.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 24px' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6 }}>Geen resultaten</p>
                <p style={{ fontSize: 13, color: 'var(--text-4)' }}>Probeer een andere zoekterm of wissel van database.</p>
              </div>
            )}

            {/* Zoek skeleton */}
            {zoekLaden && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ background: 'var(--bg-card)', borderRadius: 14, padding: '12px 14px', border: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 10, background: 'var(--bg-subtle)', animation: 'pulse 1.4s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 13, borderRadius: 6, background: 'var(--bg-subtle)', width: '70%', marginBottom: 7, animation: 'pulse 1.4s ease-in-out infinite' }} />
                      <div style={{ height: 11, borderRadius: 6, background: 'var(--bg-subtle)', width: '45%', animation: 'pulse 1.4s ease-in-out infinite' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Resultaten */}
            {!zoekLaden && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {zoekResultaten.map(r => (
                  <button key={r.id} type="button" aria-label={`Selecteer ${r.naam}`} onClick={() => selecteerProduct(r)}
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '12px 14px', cursor: 'pointer', textAlign: 'left', display: 'flex', gap: 12, alignItems: 'flex-start',
                      transition: 'box-shadow 0.15s' }}>
                    <div style={{ width: 50, height: 50, borderRadius: 12, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, overflow: 'hidden' }}>
                      {r.foto_url ? <img src={r.foto_url} alt={r.naam} style={{ width: 50, height: 50, objectFit: 'cover' }} /> : '🍽️'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.naam}</p>
                      {r.merk && <p style={{ fontSize: 11, color: 'var(--text-4)', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.merk}</p>}
                      <div style={{ display: 'flex', gap: 6, overflow: 'hidden' }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--mf-green)', flexShrink: 0 }}>{r.per_100g.calorieen} kcal</span>
                        <span style={{ fontSize: 11, color: 'var(--text-4)', flexShrink: 0 }}>E:{r.per_100g.eiwitten_g}g</span>
                        <span style={{ fontSize: 11, color: 'var(--text-4)', flexShrink: 0 }}>K:{r.per_100g.koolhydraten_g}g</span>
                        <span style={{ fontSize: 11, color: 'var(--text-4)', flexShrink: 0 }}>V:{r.per_100g.vetten_g}g</span>
                      </div>
                    </div>
                    <span style={{ color: 'var(--text-4)', fontSize: 20, flexShrink: 0, paddingTop: 2 }}>›</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            DETAIL
        ══════════════════════════════════════════════════════════════════════ */}
        {scherm === 'detail' && geselecteerdProduct && (() => {
          const p = geselecteerdProduct.per_100g
          const factor = portieGram / 100
          const micros = p.micronutrienten || {}
          const heeftMicros = Object.values(micros).some(v => v !== null && (v as number) > 0)

          // Macro donut data voor portie
          const totCalMacro = ((p.eiwitten_g + p.koolhydraten_g) * 4 + p.vetten_g * 9) * factor || 1
          const eiwitPct  = Math.round(((p.eiwitten_g * 4 * factor) / totCalMacro) * 100)
          const koolhPct  = Math.round(((p.koolhydraten_g * 4 * factor) / totCalMacro) * 100)
          const vetPct    = 100 - eiwitPct - koolhPct

          // Macro donut SVG
          const r2 = 42, circ2 = 2 * Math.PI * r2
          const eiwitDash  = (eiwitPct / 100) * circ2
          const koolhDash  = (koolhPct / 100) * circ2
          const vetDash    = (vetPct   / 100) * circ2
          const eiwitOff   = 0
          const koolhOff   = circ2 - eiwitDash
          const vetOff     = circ2 - eiwitDash - koolhDash

          return (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <button type="button" aria-label="Terug naar zoeken" onClick={() => setScherm('zoeken')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 24, padding: 0, minWidth: 44, minHeight: 44 }}>‹</button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h1 style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-1)', margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{geselecteerdProduct.naam}</h1>
                  {geselecteerdProduct.merk && <p style={{ fontSize: 11, color: 'var(--text-4)', margin: 0 }}>{geselecteerdProduct.merk}</p>}
                </div>
              </div>

              {/* Foto */}
              {geselecteerdProduct.foto_url && (
                <div style={{ borderRadius: 20, overflow: 'hidden', height: 190, marginBottom: 14, position: 'relative' }}>
                  <img src={geselecteerdProduct.foto_url} alt={geselecteerdProduct.naam} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)' }} />
                  {geselecteerdProduct.merk && (
                    <div style={{ position: 'absolute', bottom: 12, left: 14, background: 'rgba(0,0,0,0.55)', color: 'white', borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                      {geselecteerdProduct.merk}
                    </div>
                  )}
                </div>
              )}

              {/* Portie aanpassen */}
              <div style={{ background: 'var(--bg-card)', borderRadius: 18, padding: '16px', border: '1px solid var(--border)', marginBottom: 12 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px' }}>Portiegrootte</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <button type="button" aria-label="Portie 5 gram minder" onClick={() => setPortieGram(Math.max(5, portieGram - 5))}
                    style={{ width: 44, height: 44, borderRadius: 10, border: '1.5px solid var(--border-strong)', background: 'var(--bg-subtle)', fontSize: 20, cursor: 'pointer', color: 'var(--text-2)', fontWeight: 700, flexShrink: 0 }}>−</button>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <input type="number" inputMode="numeric" value={portieGram}
                      aria-label="Portiegrootte in gram"
                      onChange={e => setPortieGram(Math.max(1, parseInt(e.target.value) || 1))}
                      style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-1)', border: 'none', outline: 'none', textAlign: 'center', width: 90, background: 'none' }} />
                    <span aria-hidden style={{ fontSize: 14, color: 'var(--text-4)', fontWeight: 600 }}>gram</span>
                  </div>
                  <button type="button" aria-label="Portie 5 gram meer" onClick={() => setPortieGram(portieGram + 5)}
                    style={{ width: 44, height: 44, borderRadius: 10, border: '1.5px solid var(--mentaforce-primary)', background: 'var(--mentaforce-primary)', fontSize: 20, cursor: 'pointer', color: 'var(--bg-app)', fontWeight: 800, flexShrink: 0 }}>+</button>
                </div>
                <div role="group" aria-label="Snelkeuze portiegrootte" style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {[30, 50, 100, 150, 200, 250, 300].map(g => {
                    const actief = portieGram === g
                    return (
                      <button key={g} type="button" onClick={() => setPortieGram(g)}
                        aria-pressed={actief} aria-label={`Portie ${g} gram`}
                        style={{ minHeight: 36, padding: '7px 13px', borderRadius: 20,
                          border: `1.5px solid ${actief ? 'var(--mentaforce-primary)' : 'var(--border)'}`,
                          background: actief ? 'var(--mentaforce-primary)' : 'var(--bg-subtle)',
                          color: actief ? 'var(--bg-app)' : 'var(--text-3)',
                          fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          transition: 'background 0.15s var(--ease), border-color 0.15s var(--ease), color 0.15s var(--ease)' }}>
                        {g}g
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Calorieën + macro donut */}
              <div style={{ background: 'var(--mf-green-light)', borderRadius: 18, padding: '16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* Macro donut */}
                <svg width="100" height="100" viewBox="0 0 100 100" style={{ flexShrink: 0 }}
                  role="img" aria-label={`Macroverdeling per ${portieGram} gram: eiwit ${eiwitPct}%, koolhydraten ${koolhPct}%, vet ${vetPct}%, ${Math.round(p.calorieen * factor)} kcal`}>
                  <circle cx="50" cy="50" r={r2} fill="none" style={{ stroke: 'var(--bg-subtle)' }} strokeWidth="10" />
                  <circle cx="50" cy="50" r={r2} fill="none" style={{ stroke: 'var(--mf-red)' }} strokeWidth="10"
                    strokeDasharray={`${eiwitDash} ${circ2}`} strokeDashoffset={-eiwitOff}
                    transform="rotate(-90 50 50)" />
                  <circle cx="50" cy="50" r={r2} fill="none" style={{ stroke: 'var(--mf-amber)' }} strokeWidth="10"
                    strokeDasharray={`${koolhDash} ${circ2}`} strokeDashoffset={-koolhOff}
                    transform="rotate(-90 50 50)" />
                  <circle cx="50" cy="50" r={r2} fill="none" style={{ stroke: 'var(--mf-purple)' }} strokeWidth="10"
                    strokeDasharray={`${vetDash} ${circ2}`} strokeDashoffset={-vetOff}
                    transform="rotate(-90 50 50)" />
                  <text x="50" y="46" textAnchor="middle" fontSize="14" fontWeight="900" style={{ fill: 'var(--mf-green)' }}>{Math.round(p.calorieen * factor)}</text>
                  <text x="50" y="58" textAnchor="middle" fontSize="9" style={{ fill: 'var(--text-4)' }}>kcal</text>
                </svg>
                {/* Macro legend */}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 700, margin: '0 0 8px' }}>Per {portieGram}g</p>
                  {[
                    { label: 'Eiwit',        waarde: p.eiwitten_g     * factor, kleur: 'var(--mf-red)',    pct: eiwitPct },
                    { label: 'Koolhydr.',    waarde: p.koolhydraten_g * factor, kleur: 'var(--mf-amber)',  pct: koolhPct },
                    { label: 'Vet',          waarde: p.vetten_g       * factor, kleur: 'var(--mf-purple)', pct: vetPct   },
                  ].map(m => (
                    <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.kleur, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600, flex: 1 }}>{m.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: m.kleur }}>{m.waarde.toFixed(1)}g</span>
                      <span style={{ fontSize: 10, color: 'var(--text-4)', width: 30, textAlign: 'right' }}>{m.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Macros tabel met RDI % */}
              <div style={{ background: 'var(--bg-card)', borderRadius: 18, padding: '16px', border: '1px solid var(--border)', marginBottom: 12 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 4px' }}>
                  Macronutriënten <span style={{ color: 'var(--text-4)' }}>— % van dagelijkse behoefte</span>
                </p>
                <RdiBalk label="Calorieën"          waarde={Math.round(p.calorieen      * factor)} eenheid="kcal" rdi={RDI.calorieen}      kleur={MACRO_KLEUR.vezels} />
                <RdiBalk label="Eiwit"              waarde={p.eiwitten_g     * factor}            eenheid="g"    rdi={RDI.eiwitten_g}     kleur={MACRO_KLEUR.eiwit} />
                <RdiBalk label="Koolhydraten"       waarde={p.koolhydraten_g * factor}            eenheid="g"    rdi={RDI.koolhydraten_g} kleur={MACRO_KLEUR.koolhydraten} />
                <RdiBalk label="  waarvan suikers"  waarde={(p.suikers_g       || 0) * factor}    eenheid="g"    rdi={RDI.suikers_g}      kleur={MACRO_KLEUR.koolhydraten} sub />
                <RdiBalk label="Vet"                waarde={p.vetten_g       * factor}            eenheid="g"    rdi={RDI.vetten_g}       kleur={MACRO_KLEUR.vet} />
                <RdiBalk label="  waarvan verzad."  waarde={(p.verzadigd_vet_g || 0) * factor}    eenheid="g"    rdi={RDI.verzadigd_vet_g} kleur={MACRO_KLEUR.vet} sub />
                <RdiBalk label="Vezels"             waarde={p.vezels_g       * factor}            eenheid="g"    rdi={RDI.vezels_g}       kleur={MACRO_KLEUR.micro} />
                <div style={{ borderBottom: 'none' }}>
                  <RdiBalk label="Zout"             waarde={(p.zout_mg         || 0) * factor}    eenheid="mg"   rdi={RDI.zout_mg}        kleur="var(--text-3)" />
                </div>
              </div>

              {/* Micronutriënten met RDI % */}
              {heeftMicros && (
                <div style={{ background: 'var(--bg-card)', borderRadius: 18, padding: '16px', border: '1px solid var(--border)', marginBottom: 12 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 4px' }}>
                    Micronutriënten <span style={{ color: 'var(--text-4)' }}>— % van dagelijkse behoefte</span>
                  </p>
                  {Object.entries(MICRO_META)
                    .filter(([key]) => micros[key] !== null && micros[key] !== undefined && (micros[key] as number) > 0)
                    .map(([key, meta]) => (
                      <RdiBalk key={key}
                        label={meta.label}
                        waarde={Number(((micros[key] as number) * factor).toFixed(2))}
                        eenheid={meta.eenheid}
                        rdi={RDI[meta.rdi_key] || 1}
                        kleur={MACRO_KLEUR.micro} />
                    ))}
                </div>
              )}

              {/* Maaltijd type */}
              <div style={{ marginBottom: 14 }}>{renderMaaltijdSelector()}</div>

              {fout && <div style={{ background: 'var(--mf-red-light)', border: '1px solid var(--mf-red)', borderRadius: 12, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: 'var(--mf-red)' }}>{fout}</div>}

              <button type="button" className="vd-cta" onClick={voegProductToe} disabled={opslaan}>
                {opslaan ? 'Toevoegen...' : <><span aria-hidden>✅ </span>{`Toevoegen aan ${MAALTIJD_LABEL[form.maaltijd_type]} (${Math.round(p.calorieen * factor)} kcal)`}</>}
              </button>
            </>
          )
        })()}

        {/* ══════════════════════════════════════════════════════════════════════
            MANUEEL
        ══════════════════════════════════════════════════════════════════════ */}
        {scherm === 'manueel' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <button type="button" aria-label="Terug naar overzicht" onClick={() => { resetForm(); setScherm('overzicht') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 24, padding: 0, lineHeight: 1, minWidth: 44, minHeight: 44 }}>‹</button>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-1)', margin: 0 }}>Manueel invoeren</h1>
            </div>

            <div style={{ background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border)', padding: '18px 16px', marginBottom: 16 }}>
              <div style={{ display: 'grid', gap: 12 }}>
                {renderMaaltijdSelector()}
                {renderInputVeld({ label: 'Gerecht / omschrijving', veld: 'omschrijving' })}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {renderInputVeld({ label: 'Calorieën', veld: 'calorieen', type: 'number', suffix: 'kcal' })}
                  {renderInputVeld({ label: 'Portie', veld: 'portie_gram', type: 'number', suffix: 'gram' })}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {renderInputVeld({ label: 'Eiwit', veld: 'eiwitten_g', type: 'number', suffix: 'g' })}
                  {renderInputVeld({ label: 'Koolhydraten', veld: 'koolhydraten_g', type: 'number', suffix: 'g' })}
                  {renderInputVeld({ label: 'Vet', veld: 'vetten_g', type: 'number', suffix: 'g' })}
                  {renderInputVeld({ label: 'Vezels', veld: 'vezels_g', type: 'number', suffix: 'g' })}
                </div>
              </div>
            </div>

            {fout && <div style={{ background: 'var(--mf-red-light)', border: '1px solid var(--mf-red)', borderRadius: 12, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: 'var(--mf-red)' }}>{fout}</div>}

            <button type="button" className="vd-cta" onClick={() => slaOp('manueel')} disabled={opslaan || !form.omschrijving.trim()}>
              {opslaan ? 'Opslaan...' : <><span aria-hidden>✅ </span>Maaltijd opslaan</>}
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.45 } }

        /* Actie-tegels: tonaal navy met cyan-accent op hover/focus (on-brand) */
        .vd-action {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 84px;
          padding: 14px 8px;
          border-radius: 16px;
          background: var(--bg-card);
          color: var(--text-1);
          border: 1.5px solid var(--border);
          cursor: pointer;
          text-align: center;
          transition: transform 0.15s var(--ease), border-color 0.15s var(--ease), background 0.15s var(--ease);
        }
        .vd-action:hover { border-color: var(--border-strong); transform: translateY(-1px); }
        .vd-action:active { transform: translateY(0); }
        .vd-action:focus-visible {
          outline: none;
          border-color: var(--mentaforce-primary);
          box-shadow: 0 0 0 3px var(--mentaforce-primary-light);
        }
        .vd-action--primary {
          background: var(--mentaforce-primary-light);
          border-color: var(--mentaforce-primary);
        }
        .vd-action--primary:hover { background: color-mix(in srgb, var(--mentaforce-primary) 22%, transparent); }

        /* Primaire CTA: cyan op navy-inkt, hoog contrast */
        .vd-cta {
          width: 100%;
          min-height: 52px;
          padding: 16px;
          border-radius: 14px;
          border: none;
          background: var(--mentaforce-primary);
          color: var(--bg-app);
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          transition: transform 0.15s var(--ease), opacity 0.15s var(--ease), background 0.15s var(--ease);
        }
        .vd-cta:hover:not(:disabled) { background: var(--mentaforce-primary-dark); transform: translateY(-1px); }
        .vd-cta:active:not(:disabled) { transform: translateY(0); }
        .vd-cta:disabled { opacity: 0.55; cursor: not-allowed; }
        .vd-cta:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px var(--mentaforce-primary-light), 0 0 0 1px var(--mentaforce-primary);
        }

        /* Zoekbalk krijgt een cyan focus-ring wanneer het input-veld focus heeft */
        .vd-searchbar:focus-within {
          border-color: var(--mentaforce-primary);
          box-shadow: 0 0 0 3px var(--mentaforce-primary-light);
        }

        @media (prefers-reduced-motion: reduce) {
          .vd-action, .vd-cta { transition: none; }
          .vd-action:hover, .vd-action:active, .vd-cta:hover, .vd-cta:active { transform: none; }
        }
      `}</style>
    </div>
  )
}

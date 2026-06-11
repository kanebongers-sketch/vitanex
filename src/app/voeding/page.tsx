'use client'

export const dynamic = 'force-dynamic'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import nextDynamic from 'next/dynamic'
const AiCoachCard = nextDynamic(() => import('@/components/gezondheid/AiCoachCard'), { ssr: false })

// ─── Types ────────────────────────────────────────────────────────────────────

interface VoedingLog {
  id: string
  datum: string
  maaltijd_type: 'ontbijt' | 'lunch' | 'diner' | 'snack'
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

const MAALTIJD_VOLGORDE: VoedingLog['maaltijd_type'][] = ['ontbijt', 'lunch', 'diner', 'snack']
const MAALTIJD_EMOJI: Record<string, string> = { ontbijt: '🌅', lunch: '☀️', diner: '🌙', snack: '🍎' }
const MAALTIJD_KLEUR: Record<string, string> = { ontbijt: '#F59E0B', lunch: '#1D9E75', diner: '#8B5CF6', snack: '#E24B4A' }
const DOEL_KCAL = 2000
const WATER_DOEL = 8

// ─── SVG Componenten ──────────────────────────────────────────────────────────

function CalorieRing({ gegeten, doel, kleur }: { gegeten: number; doel: number; kleur: string }) {
  const r = 70, circ = 2 * Math.PI * r
  const pct = Math.min(1, gegeten / doel)
  const over = gegeten > doel
  return (
    <svg width="180" height="180" viewBox="0 0 180 180" style={{ display: 'block' }}>
      {/* Track */}
      <circle cx="90" cy="90" r={r} fill="none" stroke="#F3F4F6" strokeWidth="12" />
      {/* Fill */}
      <circle cx="90" cy="90" r={r} fill="none"
        stroke={over ? '#E24B4A' : kleur} strokeWidth="12"
        strokeDasharray={`${pct * circ} ${circ}`}
        strokeLinecap="round" transform="rotate(-90 90 90)"
        style={{ transition: 'stroke-dasharray 1s ease' }} />
      {/* Center text */}
      <text x="90" y="82" textAnchor="middle" fontSize="28" fontWeight="900" fill={over ? '#E24B4A' : '#111827'}>{gegeten}</text>
      <text x="90" y="100" textAnchor="middle" fontSize="12" fill="#9CA3AF" fontWeight="600">kcal</text>
      <text x="90" y="116" textAnchor="middle" fontSize="11" fill={over ? '#E24B4A' : '#1D9E75'} fontWeight="700">
        {over ? `+${gegeten - doel} over` : `${doel - gegeten} over`}
      </text>
    </svg>
  )
}

function MacroRing({ waarde, max, kleur, label, eenheid }: { waarde: number; max: number; kleur: string; label: string; eenheid: string }) {
  const r = 26, circ = 2 * Math.PI * r
  const pct = Math.min(1, waarde / max)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width="68" height="68" viewBox="0 0 68 68">
        <circle cx="34" cy="34" r={r} fill="none" stroke="#F3F4F6" strokeWidth="6" />
        <circle cx="34" cy="34" r={r} fill="none" stroke={kleur} strokeWidth="6"
          strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 34 34)"
          style={{ transition: 'stroke-dasharray 1s ease' }} />
        <text x="34" y="37" textAnchor="middle" fontSize="11" fontWeight="800" fill={kleur}>{waarde.toFixed(0)}{eenheid}</text>
      </svg>
      <span style={{ fontSize: 10, fontWeight: 700, color: '#6B7280' }}>{label}</span>
    </div>
  )
}

function RdiBalk({ label, waarde, eenheid, rdi, kleur = '#1D9E75', sub = false }: {
  label: string; waarde: number; eenheid: string; rdi: number; kleur?: string; sub?: boolean
}) {
  const pct = Math.min(100, Math.round((waarde / rdi) * 100))
  const overRdi = pct > 100
  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid #F9FAFB' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 13, color: sub ? '#9CA3AF' : '#374151', fontWeight: sub ? 400 : 600 }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: sub ? '#9CA3AF' : '#374151' }}>{waarde.toFixed(1)} {eenheid}</span>
          <span style={{
            fontSize: 10, fontWeight: 800, borderRadius: 20, padding: '2px 7px',
            background: overRdi ? '#FEF2F2' : pct >= 50 ? '#F0FAF6' : '#FFF7ED',
            color: overRdi ? '#E24B4A' : pct >= 50 ? '#1D9E75' : '#F59E0B',
          }}>{pct}%</span>
        </div>
      </div>
      <div style={{ height: 4, borderRadius: 9999, background: '#F3F4F6', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 9999, width: `${Math.min(100, pct)}%`,
          background: overRdi ? '#E24B4A' : kleur,
          transition: 'width 0.8s ease',
        }} />
      </div>
    </div>
  )
}

function GezondheidBadge({ score }: { score: number }) {
  const kleur = score >= 7 ? '#1D9E75' : score >= 4 ? '#F59E0B' : '#E24B4A'
  const bg    = score >= 7 ? '#F0FAF6' : score >= 4 ? '#FFFBEB' : '#FEF2F2'
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
  const fileInputRef   = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const [scherm, setScherm]       = useState<Scherm>('overzicht')
  const [logs, setLogs]           = useState<VoedingLog[]>([])
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

  // Session
  const [token, setToken] = useState<string | null>(null)
  const vandaag = new Date().toISOString().split('T')[0]

  // ── Init ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/login'); return }
      setToken(session.access_token)
      laadLogs(session.access_token)
    })
    // Load water from localStorage
    try { setWater(parseInt(localStorage.getItem(`water_${vandaag}`) || '0')) } catch { /* ok */ }
    // Load recent foods
    try {
      const r = JSON.parse(localStorage.getItem('voeding_recent') || '[]') as ZoekResultaat[]
      setRecenteFoods(r.slice(0, 8))
    } catch { /* ok */ }
  }, [router, vandaag])

  // ── Data ─────────────────────────────────────────────────────────────────────

  const laadLogs = useCallback(async (tok: string) => {
    setLaden(true)
    const res = await fetch(`/api/voeding?datum=${vandaag}`, { headers: { Authorization: `Bearer ${tok}` } })
    const data = await res.json() as { logs: VoedingLog[] }
    setLogs(data.logs || [])
    setLaden(false)
  }, [vandaag])

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

  const setWaterSave = (n: number) => {
    const clamped = Math.max(0, Math.min(WATER_DOEL + 4, n))
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
      setFout((e as Error).message || 'Analyse mislukt.')
      setScherm('overzicht')
    }
  }

  const onFotoInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) verwerkFoto(file)
    e.target.value = ''
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
      resetForm(); setScherm('overzicht')
    } catch (e) { setFout((e as Error).message) }
    finally { setOpslaan(false) }
  }

  const verwijder = async (id: string) => {
    if (!token) return
    setLogs(prev => prev.filter(l => l.id !== id))
    await fetch(`/api/voeding?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
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
      setGeselecteerdProduct(null); setZoekQuery(''); setZoekResultaten([])
      setScherm('overzicht')
    } catch (e) { setFout((e as Error).message) }
    finally { setOpslaan(false) }
  }

  const resetForm = () => {
    setForm({ maaltijd_type: 'lunch', omschrijving: '', calorieen: '', eiwitten_g: '', koolhydraten_g: '', vetten_g: '', vezels_g: '', portie_gram: '' })
    setFotoPreview(null); setAnalyse(null); setFout(null)
  }

  // ── Render helpers ────────────────────────────────────────────────────────────

  const kCalKleur = dagTotaal.calorieen > DOEL_KCAL * 1.05 ? '#E24B4A' : dagTotaal.calorieen > DOEL_KCAL * 0.75 ? '#1D9E75' : '#F59E0B'
  const logsByMaaltijd = MAALTIJD_VOLGORDE.reduce((acc, mt) => { acc[mt] = logs.filter(l => l.maaltijd_type === mt); return acc }, {} as Record<string, VoedingLog[]>)

  function InputVeld({ label, veld, type = 'text', suffix = '' }: { label: string; veld: keyof typeof form; type?: string; suffix?: string }) {
    return (
      <div>
        <label style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '10px 14px' }}>
          <input type={type} value={form[veld]}
            onChange={e => setForm(prev => ({ ...prev, [veld]: e.target.value }))}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 15, color: '#111827', fontWeight: 600 }}
            placeholder="0" />
          {suffix && <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 700 }}>{suffix}</span>}
        </div>
      </div>
    )
  }

  function MaaltijdSelector() {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
        {MAALTIJD_VOLGORDE.map(mt => (
          <button key={mt} onClick={() => setForm(prev => ({ ...prev, maaltijd_type: mt }))}
            style={{ padding: '9px 4px', borderRadius: 10,
              border: `1.5px solid ${form.maaltijd_type === mt ? MAALTIJD_KLEUR[mt] : '#E5E7EB'}`,
              background: form.maaltijd_type === mt ? `${MAALTIJD_KLEUR[mt]}18` : 'white',
              color: form.maaltijd_type === mt ? MAALTIJD_KLEUR[mt] : '#9CA3AF',
              fontSize: 10, fontWeight: 700, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: 16 }}>{MAALTIJD_EMOJI[mt]}</span>
            <span style={{ textTransform: 'capitalize' }}>{mt}</span>
          </button>
        ))}
      </div>
    )
  }

  // ── Loading ───────────────────────────────────────────────────────────────────

  if (laden) return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="mf-spinner" />
      </div>
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh' }}>
      <Navbar />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={onFotoInput} style={{ display: 'none' }} />
      <input ref={fileInputRef}   type="file" accept="image/*"                        onChange={onFotoInput} style={{ display: 'none' }} />

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px 100px' }}>

        {/* ══════════════════════════════════════════════════════════════════════
            OVERZICHT
        ══════════════════════════════════════════════════════════════════════ */}
        {scherm === 'overzicht' && (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h1 style={{ fontSize: 26, fontWeight: 900, color: '#111827', margin: '0 0 2px', letterSpacing: '-0.03em' }}>Voeding</h1>
                <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0, textTransform: 'capitalize' }}>
                  {new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
              <div style={{ fontSize: logs.length > 0 ? 12 : 11, color: logs.length > 0 ? '#1D9E75' : '#9CA3AF', fontWeight: 700 }}>
                {logs.length > 0 ? `${logs.length} maaltijd${logs.length !== 1 ? 'en' : ''}` : 'Nog niets gelogd'}
              </div>
            </div>

            {fout && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#B91C1C' }}>{fout}</div>
            )}

            {/* ── Calorie Dashboard kaart ── */}
            <div style={{ background: 'white', borderRadius: 24, border: '1px solid #F1F5F9', marginBottom: 14, overflow: 'hidden',
              boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
              {/* Top: ring + macro rings */}
              <div style={{ padding: '20px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <CalorieRing gegeten={dagTotaal.calorieen} doel={DOEL_KCAL} kleur={kCalKleur} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <MacroRing waarde={dagTotaal.eiwitten_g}     max={RDI.eiwitten_g}     kleur="#E24B4A" label="Eiwit"   eenheid="g" />
                  <MacroRing waarde={dagTotaal.koolhydraten_g} max={RDI.koolhydraten_g} kleur="#F59E0B" label="Koolh."  eenheid="g" />
                  <MacroRing waarde={dagTotaal.vetten_g}       max={RDI.vetten_g}       kleur="#8B5CF6" label="Vet"     eenheid="g" />
                  <MacroRing waarde={dagTotaal.vezels_g}       max={RDI.vezels_g}       kleur="#1D9E75" label="Vezels"  eenheid="g" />
                </div>
              </div>

              {/* RDI bars for macros */}
              <div style={{ padding: '0 20px 16px' }}>
                {[
                  { label: 'Eiwit',        waarde: dagTotaal.eiwitten_g,     rdi: RDI.eiwitten_g,     kleur: '#E24B4A', eenheid: 'g' },
                  { label: 'Koolhydraten', waarde: dagTotaal.koolhydraten_g, rdi: RDI.koolhydraten_g, kleur: '#F59E0B', eenheid: 'g' },
                  { label: 'Vet',          waarde: dagTotaal.vetten_g,       rdi: RDI.vetten_g,       kleur: '#8B5CF6', eenheid: 'g' },
                  { label: 'Vezels',       waarde: dagTotaal.vezels_g,       rdi: RDI.vezels_g,       kleur: '#1D9E75', eenheid: 'g' },
                ].map(m => (
                  <RdiBalk key={m.label} label={m.label} waarde={m.waarde} eenheid={m.eenheid} rdi={m.rdi} kleur={m.kleur} />
                ))}
              </div>
            </div>

            {/* ── Water tracker ── */}
            <div style={{ background: 'white', borderRadius: 18, border: '1px solid #F1F5F9', padding: '12px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 22 }}>💧</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Water</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#185FA5' }}>{water}/{WATER_DOEL} glazen</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {Array.from({ length: WATER_DOEL }).map((_, i) => (
                    <button key={i} onClick={() => setWaterSave(i < water ? i : i + 1)}
                      style={{ flex: 1, height: 8, borderRadius: 4, border: 'none', cursor: 'pointer',
                        background: i < water ? '#185FA5' : '#E0F2FE',
                        transition: 'background 0.2s' }} />
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => setWaterSave(water - 1)}
                  style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', fontSize: 14, color: '#6B7280', fontWeight: 700 }}>−</button>
                <button onClick={() => setWaterSave(water + 1)}
                  style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #185FA5', background: '#185FA5', cursor: 'pointer', fontSize: 14, color: 'white', fontWeight: 700 }}>+</button>
              </div>
            </div>

            {/* ── Actie knoppen ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
              {/* Zoeken */}
              <button onClick={() => { setZoekQuery(''); setZoekResultaten([]); setScherm('zoeken') }}
                style={{ background: 'linear-gradient(135deg, #185FA5, #2563EB)', color: 'white', border: 'none',
                  borderRadius: 16, padding: '14px 8px', cursor: 'pointer', textAlign: 'center',
                  boxShadow: '0 4px 14px rgba(24,95,165,0.3)' }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>🔍</div>
                <div style={{ fontSize: 12, fontWeight: 800 }}>Zoeken</div>
                <div style={{ fontSize: 10, opacity: 0.8, marginTop: 1 }}>3M+ producten</div>
              </button>
              {/* Foto */}
              <button onClick={() => cameraInputRef.current?.click()}
                style={{ background: 'linear-gradient(135deg, #1D9E75, #059669)', color: 'white', border: 'none',
                  borderRadius: 16, padding: '14px 8px', cursor: 'pointer', textAlign: 'center',
                  boxShadow: '0 4px 14px rgba(29,158,117,0.3)' }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>📸</div>
                <div style={{ fontSize: 12, fontWeight: 800 }}>Foto AI</div>
                <div style={{ fontSize: 10, opacity: 0.8, marginTop: 1 }}>Auto-analyse</div>
              </button>
              {/* Manueel + galerij */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button onClick={() => fileInputRef.current?.click()}
                  style={{ flex: 1, background: 'white', color: '#374151', border: '1.5px solid #E5E7EB', borderRadius: 12, padding: '8px 6px', cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ fontSize: 16 }}>🖼️</div>
                  <div style={{ fontSize: 10, fontWeight: 700, marginTop: 2 }}>Galerij</div>
                </button>
                <button onClick={() => { resetForm(); setScherm('manueel') }}
                  style={{ flex: 1, background: 'white', color: '#374151', border: '1.5px solid #E5E7EB', borderRadius: 12, padding: '8px 6px', cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ fontSize: 16 }}>✏️</div>
                  <div style={{ fontSize: 10, fontWeight: 700, marginTop: 2 }}>Manueel</div>
                </button>
              </div>
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
                <p style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>Recent gebruikt</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {recenteFoods.slice(0, 4).map(r => (
                    <button key={r.id} onClick={() => selecteerProduct(r)}
                      style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 12, padding: '10px 12px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                        {r.foto_url ? <img src={r.foto_url} alt="" style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover' }} /> : '🍽️'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.naam}</p>
                        <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>{r.per_100g.calorieen} kcal/100g · {r.per_100g.eiwitten_g}g eiwit</p>
                      </div>
                      <span style={{ fontSize: 16, color: '#D1D5DB' }}>›</span>
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
                      <span style={{ fontSize: 16 }}>{MAALTIJD_EMOJI[mt]}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', textTransform: 'capitalize' }}>{mt}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: MAALTIJD_KLEUR[mt] }}>{mtKcal} kcal</span>
                      <button onClick={() => { setForm(f => ({ ...f, maaltijd_type: mt })); setZoekQuery(''); setZoekResultaten([]); setScherm('zoeken') }}
                        style={{ background: `${MAALTIJD_KLEUR[mt]}15`, border: 'none', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: MAALTIJD_KLEUR[mt] }}>
                        + Toevoegen
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {mtLogs.map(log => (
                      <div key={log.id} style={{ background: 'white', borderRadius: 14, border: '1px solid #F1F5F9', overflow: 'hidden', display: 'flex' }}>
                        {/* Kleurstrook links */}
                        <div style={{ width: 4, background: MAALTIJD_KLEUR[mt], flexShrink: 0 }} />
                        <div style={{ display: 'flex', gap: 10, padding: '11px 12px', flex: 1, alignItems: 'center' }}>
                          {/* Foto/emoji */}
                          <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
                            background: `${MAALTIJD_KLEUR[mt]}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                            {log.foto_url
                              ? <Image src={log.foto_url} alt={log.omschrijving} width={44} height={44} style={{ objectFit: 'cover' }} />
                              : MAALTIJD_EMOJI[mt]}
                          </div>
                          {/* Content */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                                {log.omschrijving}
                              </p>
                              <button onClick={() => verwijder(log.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E5E7EB', fontSize: 18, lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                              {log.calorieen && <span style={{ fontSize: 12, fontWeight: 800, color: kCalKleur }}>{log.calorieen} kcal</span>}
                              {log.eiwitten_g && <span style={{ fontSize: 11, color: '#9CA3AF' }}>E:{log.eiwitten_g}g</span>}
                              {log.koolhydraten_g && <span style={{ fontSize: 11, color: '#9CA3AF' }}>K:{log.koolhydraten_g}g</span>}
                              {log.vetten_g && <span style={{ fontSize: 11, color: '#9CA3AF' }}>V:{log.vetten_g}g</span>}
                              {log.portie_gram && <span style={{ fontSize: 11, color: '#D1D5DB' }}>{log.portie_gram}g</span>}
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
              <div style={{ textAlign: 'center', padding: '48px 24px', background: 'white', borderRadius: 20, border: '1.5px dashed #E5E7EB' }}>
                <div style={{ fontSize: 52, marginBottom: 12 }}>🥗</div>
                <p style={{ fontSize: 16, fontWeight: 800, color: '#374151', marginBottom: 6 }}>Begin met loggen</p>
                <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.6 }}>Zoek een product, maak een foto,<br />of voeg handmatig in.</p>
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
              <div style={{ width: 220, height: 220, borderRadius: 24, overflow: 'hidden', margin: '0 auto 32px', position: 'relative', boxShadow: '0 16px 48px rgba(0,0,0,0.15)' }}>
                <Image src={fotoPreview} alt="Foto" fill style={{ objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  <div className="mf-spinner" style={{ width: 36, height: 36, borderTopColor: 'white', borderWidth: 3 }} />
                  <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>Analyseren...</span>
                </div>
              </div>
            )}
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#111827', margin: '0 0 10px', letterSpacing: '-0.03em' }}>AI analyseert je maaltijd</h2>
            <p style={{ fontSize: 14, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>Claude herkent ingrediënten en<br />berekent calorieën + micros.</p>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            BEVESTIGEN (na AI foto)
        ══════════════════════════════════════════════════════════════════════ */}
        {scherm === 'bevestigen' && analyse && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <button onClick={() => { resetForm(); setScherm('overzicht') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: 24, padding: 0, lineHeight: 1 }}>‹</button>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: '#111827', margin: 0 }}>Bevestig maaltijd</h1>
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

            <div style={{ background: analyse.betrouwbaarheid === 'hoog' ? '#F0FAF6' : analyse.betrouwbaarheid === 'gemiddeld' ? '#FFFBEB' : '#FEF2F2',
              border: `1px solid ${analyse.betrouwbaarheid === 'hoog' ? '#6EE7B7' : analyse.betrouwbaarheid === 'gemiddeld' ? '#FDE68A' : '#FCA5A5'}`,
              borderRadius: 12, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#374151', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>{analyse.betrouwbaarheid === 'hoog' ? '✅' : analyse.betrouwbaarheid === 'gemiddeld' ? '⚠️' : '❓'}</span>
              <span><strong>Betrouwbaarheid: {analyse.betrouwbaarheid}</strong>{analyse.betrouwbaarheid !== 'hoog' && ' — controleer de waarden.'}</span>
            </div>

            {analyse.ingredienten?.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Herkende ingrediënten</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {analyse.ingredienten.map((ing, i) => (
                    <span key={i} style={{ background: '#F3F4F6', color: '#374151', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{ing}</span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ background: 'white', borderRadius: 18, border: '1px solid #F1F5F9', padding: '16px', marginBottom: 14 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Aanpassen indien nodig</p>
              <div style={{ display: 'grid', gap: 10 }}>
                <MaaltijdSelector />
                <InputVeld label="Gerecht" veld="omschrijving" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <InputVeld label="Calorieën" veld="calorieen" type="number" suffix="kcal" />
                  <InputVeld label="Portie" veld="portie_gram" type="number" suffix="g" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  <InputVeld label="Eiwit" veld="eiwitten_g" type="number" suffix="g" />
                  <InputVeld label="Koolh." veld="koolhydraten_g" type="number" suffix="g" />
                  <InputVeld label="Vet" veld="vetten_g" type="number" suffix="g" />
                  <InputVeld label="Vezels" veld="vezels_g" type="number" suffix="g" />
                </div>
              </div>
            </div>

            {analyse.tips && (
              <div style={{ background: '#F0FAF6', border: '1px solid #A7F3D0', borderRadius: 12, padding: '11px 14px', marginBottom: 14 }}>
                <p style={{ fontSize: 13, color: '#065F46', margin: 0, lineHeight: 1.5 }}>💡 {analyse.tips}</p>
              </div>
            )}

            {fout && <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 12, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#B91C1C' }}>{fout}</div>}

            <button onClick={() => slaOp('foto')} disabled={opslaan}
              style={{ width: '100%', background: 'linear-gradient(135deg, #1D9E75, #059669)', color: 'white', border: 'none', borderRadius: 14, padding: '16px', fontSize: 15, fontWeight: 800, cursor: opslaan ? 'not-allowed' : 'pointer', opacity: opslaan ? 0.7 : 1 }}>
              {opslaan ? 'Opslaan...' : '✅ Maaltijd opslaan'}
            </button>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            ZOEKEN
        ══════════════════════════════════════════════════════════════════════ */}
        {scherm === 'zoeken' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <button onClick={() => setScherm('overzicht')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: 24, padding: 0 }}>‹</button>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: '#111827', margin: 0 }}>Voeding zoeken</h1>
            </div>

            {/* Zoekbalk + barcode */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 14, padding: '12px 16px' }}>
                <span style={{ fontSize: 18, color: '#9CA3AF' }}>🔍</span>
                <input autoFocus type="text" value={zoekQuery}
                  onChange={e => { setZoekQuery(e.target.value); zoekVoeding(e.target.value) }}
                  placeholder="Zoek product, merk of ingrediënt..."
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#111827', background: 'none' }} />
                {zoekLaden && <div className="mf-spinner" style={{ width: 18, height: 18 }} />}
                {zoekQuery && !zoekLaden && (
                  <button onClick={() => { setZoekQuery(''); setZoekResultaten([]) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 18, lineHeight: 1 }}>×</button>
                )}
              </div>
            </div>

            {/* Bron tabs */}
            <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 12, padding: 4, marginBottom: 12, gap: 4 }}>
              {[{ key: 'off' as const, label: '🌍 Open Food Facts', sub: '3M+ producten' }, { key: 'usda' as const, label: '🇺🇸 USDA', sub: 'Voedingswaarden' }].map(b => (
                <button key={b.key} onClick={() => { setZoekBron(b.key); setZoekResultaten([]); if (zoekQuery.length >= 2) zoekVoeding(zoekQuery, b.key) }}
                  style={{ flex: 1, padding: '8px 10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: zoekBron === b.key ? 'white' : 'transparent',
                    boxShadow: zoekBron === b.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: zoekBron === b.key ? '#111827' : '#6B7280' }}>{b.label}</div>
                  <div style={{ fontSize: 10, color: '#9CA3AF' }}>{b.sub}</div>
                </button>
              ))}
            </div>

            {/* Maaltijd type */}
            <div style={{ marginBottom: 14 }}><MaaltijdSelector /></div>

            {/* Recent (alleen als geen query) */}
            {zoekQuery.length < 2 && recenteFoods.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>Recent gebruikt</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {recenteFoods.map(r => (
                    <button key={r.id} onClick={() => selecteerProduct(r)}
                      style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 12, padding: '10px 12px', cursor: 'pointer', textAlign: 'left', display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, overflow: 'hidden' }}>
                        {r.foto_url ? <img src={r.foto_url} alt="" style={{ width: 40, height: 40, objectFit: 'cover' }} /> : '🍽️'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.naam}</p>
                        <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>{r.per_100g.calorieen} kcal · {r.per_100g.eiwitten_g}g eiwit · {r.per_100g.koolhydraten_g}g koolh.</p>
                      </div>
                      <span style={{ fontSize: 16, color: '#D1D5DB' }}>›</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Geen resultaten */}
            {zoekQuery.length >= 2 && !zoekLaden && zoekResultaten.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 24px' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Geen resultaten</p>
                <p style={{ fontSize: 13, color: '#9CA3AF' }}>Probeer een andere zoekterm of wissel van database.</p>
              </div>
            )}

            {/* Zoek skeleton */}
            {zoekLaden && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ background: 'white', borderRadius: 14, padding: '12px 14px', border: '1px solid #F1F5F9', display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 10, background: '#F3F4F6', animation: 'pulse 1.4s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 13, borderRadius: 6, background: '#F3F4F6', width: '70%', marginBottom: 7, animation: 'pulse 1.4s ease-in-out infinite' }} />
                      <div style={{ height: 11, borderRadius: 6, background: '#F3F4F6', width: '45%', animation: 'pulse 1.4s ease-in-out infinite' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Resultaten */}
            {!zoekLaden && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {zoekResultaten.map(r => (
                  <button key={r.id} onClick={() => selecteerProduct(r)}
                    style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 14, padding: '12px 14px', cursor: 'pointer', textAlign: 'left', display: 'flex', gap: 12, alignItems: 'center',
                      transition: 'box-shadow 0.15s' }}>
                    <div style={{ width: 50, height: 50, borderRadius: 12, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, overflow: 'hidden' }}>
                      {r.foto_url ? <img src={r.foto_url} alt={r.naam} style={{ width: 50, height: 50, objectFit: 'cover' }} /> : '🍽️'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.naam}</p>
                      {r.merk && <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 4px' }}>{r.merk}</p>}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#1D9E75' }}>{r.per_100g.calorieen} kcal</span>
                        <span style={{ fontSize: 11, color: '#9CA3AF' }}>E:{r.per_100g.eiwitten_g}g</span>
                        <span style={{ fontSize: 11, color: '#9CA3AF' }}>K:{r.per_100g.koolhydraten_g}g</span>
                        <span style={{ fontSize: 11, color: '#9CA3AF' }}>V:{r.per_100g.vetten_g}g</span>
                      </div>
                    </div>
                    <span style={{ color: '#D1D5DB', fontSize: 20 }}>›</span>
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
                <button onClick={() => setScherm('zoeken')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: 24, padding: 0 }}>‹</button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h1 style={{ fontSize: 17, fontWeight: 900, color: '#111827', margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{geselecteerdProduct.naam}</h1>
                  {geselecteerdProduct.merk && <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>{geselecteerdProduct.merk}</p>}
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
              <div style={{ background: 'white', borderRadius: 18, padding: '16px', border: '1px solid #F1F5F9', marginBottom: 12 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px' }}>Portiegrootte</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <button onClick={() => setPortieGram(Math.max(5, portieGram - 5))}
                    style={{ width: 38, height: 38, borderRadius: 10, border: '1.5px solid #E5E7EB', background: 'white', fontSize: 20, cursor: 'pointer', color: '#374151', fontWeight: 700, flexShrink: 0 }}>−</button>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <input type="number" value={portieGram}
                      onChange={e => setPortieGram(Math.max(1, parseInt(e.target.value) || 1))}
                      style={{ fontSize: 28, fontWeight: 900, color: '#111827', border: 'none', outline: 'none', textAlign: 'center', width: 90, background: 'none' }} />
                    <span style={{ fontSize: 14, color: '#9CA3AF', fontWeight: 600 }}>gram</span>
                  </div>
                  <button onClick={() => setPortieGram(portieGram + 5)}
                    style={{ width: 38, height: 38, borderRadius: 10, border: '1.5px solid #1D9E75', background: '#1D9E75', fontSize: 20, cursor: 'pointer', color: 'white', fontWeight: 700, flexShrink: 0 }}>+</button>
                </div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {[30, 50, 100, 150, 200, 250, 300].map(g => (
                    <button key={g} onClick={() => setPortieGram(g)}
                      style={{ padding: '5px 11px', borderRadius: 20,
                        border: `1.5px solid ${portieGram === g ? '#1D9E75' : '#E5E7EB'}`,
                        background: portieGram === g ? '#1D9E75' : 'white',
                        color: portieGram === g ? 'white' : '#6B7280',
                        fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        transition: 'all 0.15s' }}>
                      {g}g
                    </button>
                  ))}
                </div>
              </div>

              {/* Calorieën + macro donut */}
              <div style={{ background: 'linear-gradient(135deg, #F0FAF6, #E8F5FF)', borderRadius: 18, padding: '16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* Macro donut */}
                <svg width="100" height="100" viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
                  <circle cx="50" cy="50" r={r2} fill="none" stroke="#F3F4F6" strokeWidth="10" />
                  {/* Eiwit */}
                  <circle cx="50" cy="50" r={r2} fill="none" stroke="#E24B4A" strokeWidth="10"
                    strokeDasharray={`${eiwitDash} ${circ2}`} strokeDashoffset={-eiwitOff}
                    transform="rotate(-90 50 50)" />
                  {/* Koolh */}
                  <circle cx="50" cy="50" r={r2} fill="none" stroke="#F59E0B" strokeWidth="10"
                    strokeDasharray={`${koolhDash} ${circ2}`} strokeDashoffset={-koolhOff}
                    transform="rotate(-90 50 50)" />
                  {/* Vet */}
                  <circle cx="50" cy="50" r={r2} fill="none" stroke="#8B5CF6" strokeWidth="10"
                    strokeDasharray={`${vetDash} ${circ2}`} strokeDashoffset={-vetOff}
                    transform="rotate(-90 50 50)" />
                  <text x="50" y="46" textAnchor="middle" fontSize="14" fontWeight="900" fill="#1D9E75">{Math.round(p.calorieen * factor)}</text>
                  <text x="50" y="58" textAnchor="middle" fontSize="9" fill="#9CA3AF">kcal</text>
                </svg>
                {/* Macro legend */}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, color: '#065F46', fontWeight: 700, margin: '0 0 8px' }}>Per {portieGram}g</p>
                  {[
                    { label: 'Eiwit',        waarde: p.eiwitten_g     * factor, kleur: '#E24B4A', pct: eiwitPct },
                    { label: 'Koolhydr.',    waarde: p.koolhydraten_g * factor, kleur: '#F59E0B', pct: koolhPct },
                    { label: 'Vet',          waarde: p.vetten_g       * factor, kleur: '#8B5CF6', pct: vetPct   },
                  ].map(m => (
                    <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.kleur, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: '#374151', fontWeight: 600, flex: 1 }}>{m.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: m.kleur }}>{m.waarde.toFixed(1)}g</span>
                      <span style={{ fontSize: 10, color: '#9CA3AF', width: 30, textAlign: 'right' }}>{m.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Macros tabel met RDI % */}
              <div style={{ background: 'white', borderRadius: 18, padding: '16px', border: '1px solid #F1F5F9', marginBottom: 12 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 4px' }}>
                  Macronutriënten <span style={{ color: '#D1D5DB' }}>— % van dagelijkse behoefte</span>
                </p>
                <RdiBalk label="Calorieën"          waarde={Math.round(p.calorieen      * factor)} eenheid="kcal" rdi={RDI.calorieen}      kleur="#1D9E75" />
                <RdiBalk label="Eiwit"              waarde={p.eiwitten_g     * factor}            eenheid="g"    rdi={RDI.eiwitten_g}     kleur="#E24B4A" />
                <RdiBalk label="Koolhydraten"       waarde={p.koolhydraten_g * factor}            eenheid="g"    rdi={RDI.koolhydraten_g} kleur="#F59E0B" />
                <RdiBalk label="  waarvan suikers"  waarde={(p.suikers_g       || 0) * factor}    eenheid="g"    rdi={RDI.suikers_g}      kleur="#F59E0B" sub />
                <RdiBalk label="Vet"                waarde={p.vetten_g       * factor}            eenheid="g"    rdi={RDI.vetten_g}       kleur="#8B5CF6" />
                <RdiBalk label="  waarvan verzad."  waarde={(p.verzadigd_vet_g || 0) * factor}    eenheid="g"    rdi={RDI.verzadigd_vet_g} kleur="#8B5CF6" sub />
                <RdiBalk label="Vezels"             waarde={p.vezels_g       * factor}            eenheid="g"    rdi={RDI.vezels_g}       kleur="#0EA5E9" />
                <div style={{ borderBottom: 'none' }}>
                  <RdiBalk label="Zout"             waarde={(p.zout_mg         || 0) * factor}    eenheid="mg"   rdi={RDI.zout_mg}        kleur="#6B7280" />
                </div>
              </div>

              {/* Micronutriënten met RDI % */}
              {heeftMicros && (
                <div style={{ background: 'white', borderRadius: 18, padding: '16px', border: '1px solid #F1F5F9', marginBottom: 12 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 4px' }}>
                    Micronutriënten <span style={{ color: '#D1D5DB' }}>— % van dagelijkse behoefte</span>
                  </p>
                  {Object.entries(MICRO_META)
                    .filter(([key]) => micros[key] !== null && micros[key] !== undefined && (micros[key] as number) > 0)
                    .map(([key, meta]) => (
                      <RdiBalk key={key}
                        label={meta.label}
                        waarde={Number(((micros[key] as number) * factor).toFixed(2))}
                        eenheid={meta.eenheid}
                        rdi={RDI[meta.rdi_key] || 1}
                        kleur="#0EA5E9" />
                    ))}
                </div>
              )}

              {/* Maaltijd type */}
              <div style={{ marginBottom: 14 }}><MaaltijdSelector /></div>

              {fout && <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 12, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#B91C1C' }}>{fout}</div>}

              <button onClick={voegProductToe} disabled={opslaan}
                style={{ width: '100%', background: 'linear-gradient(135deg, #1D9E75, #059669)',
                  color: 'white', border: 'none', borderRadius: 14, padding: '17px',
                  fontSize: 15, fontWeight: 800, cursor: opslaan ? 'not-allowed' : 'pointer',
                  opacity: opslaan ? 0.7 : 1, boxShadow: '0 4px 16px rgba(29,158,117,0.35)' }}>
                {opslaan ? 'Toevoegen...' : `✅ Toevoegen aan ${form.maaltijd_type} (${Math.round(p.calorieen * factor)} kcal)`}
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
              <button onClick={() => { resetForm(); setScherm('overzicht') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: 24, padding: 0, lineHeight: 1 }}>‹</button>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: '#111827', margin: 0 }}>Manueel invoeren</h1>
            </div>

            <div style={{ background: 'white', borderRadius: 20, border: '1px solid #F1F5F9', padding: '18px 16px', marginBottom: 16 }}>
              <div style={{ display: 'grid', gap: 12 }}>
                <MaaltijdSelector />
                <InputVeld label="Gerecht / omschrijving" veld="omschrijving" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <InputVeld label="Calorieën" veld="calorieen" type="number" suffix="kcal" />
                  <InputVeld label="Portie" veld="portie_gram" type="number" suffix="gram" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  <InputVeld label="Eiwit" veld="eiwitten_g" type="number" suffix="g" />
                  <InputVeld label="Koolhydraten" veld="koolhydraten_g" type="number" suffix="g" />
                  <InputVeld label="Vet" veld="vetten_g" type="number" suffix="g" />
                  <InputVeld label="Vezels" veld="vezels_g" type="number" suffix="g" />
                </div>
              </div>
            </div>

            {fout && <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 12, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#B91C1C' }}>{fout}</div>}

            <button onClick={() => slaOp('manueel')} disabled={opslaan || !form.omschrijving.trim()}
              style={{ width: '100%', background: '#1D9E75', color: 'white', border: 'none', borderRadius: 14, padding: '16px', fontSize: 15, fontWeight: 800,
                cursor: (opslaan || !form.omschrijving.trim()) ? 'not-allowed' : 'pointer',
                opacity: (opslaan || !form.omschrijving.trim()) ? 0.6 : 1 }}>
              {opslaan ? 'Opslaan...' : '✅ Maaltijd opslaan'}
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.45 } }
      `}</style>
    </div>
  )
}

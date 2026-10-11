'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/supabase'
import { authFetch } from '@/lib/auth/auth-fetch'
import Navbar from '@/components/layout/Navbar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Crown, Sparkles, HeartHandshake, Microscope, CheckCircle2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useVertaling } from '@/lib/i18n/TaalProvider'
import { INTL_LOCALE } from '@/lib/i18n/talen'
import type { Params } from '@/lib/i18n/vertaal'


type Dimensie = 'D' | 'I' | 'S' | 'C'
// Teksten in het woordenboek: mentaal.disc.vraag.v<id>.
interface Vraag { id: number; dimensie: Dimensie }

type Vertaler = (sleutel: string, params?: Params) => string

type Fase = 'intro' | 'test' | 'resultaat' | 'opgeslagen' | 'eerder'

interface EerderResultaat {
  d_score: number
  i_score: number
  s_score: number
  c_score: number
  primair_profiel: string
  aangemaakt_op: string
}

const VRAGEN: Vraag[] = [
  { id: 1, dimensie: 'D' },
  { id: 2, dimensie: 'D' },
  { id: 3, dimensie: 'D' },
  { id: 4, dimensie: 'D' },
  { id: 5, dimensie: 'D' },
  { id: 6, dimensie: 'D' },
  { id: 7, dimensie: 'I' },
  { id: 8, dimensie: 'I' },
  { id: 9, dimensie: 'I' },
  { id: 10, dimensie: 'I' },
  { id: 11, dimensie: 'I' },
  { id: 12, dimensie: 'I' },
  { id: 13, dimensie: 'S' },
  { id: 14, dimensie: 'S' },
  { id: 15, dimensie: 'S' },
  { id: 16, dimensie: 'S' },
  { id: 17, dimensie: 'S' },
  { id: 18, dimensie: 'S' },
  { id: 19, dimensie: 'C' },
  { id: 20, dimensie: 'C' },
  { id: 21, dimensie: 'C' },
  { id: 22, dimensie: 'C' },
  { id: 23, dimensie: 'C' },
  { id: 24, dimensie: 'C' },
]

const DIM_KLEUR: Record<Dimensie, string> = { D: 'var(--mf-red)', I: 'var(--mf-amber)', S: 'var(--mf-green)', C: 'var(--mf-blue)' }
// Label, beschrijving en kernwoorden per dimensie: mentaal.disc.dim.<d>.*
function dimLabel(t: Vertaler, d: Dimensie): string {
  return t(`mentaal.disc.dim.${d.toLowerCase()}.label`)
}
function dimBeschr(t: Vertaler, d: Dimensie): string {
  return t(`mentaal.disc.dim.${d.toLowerCase()}.beschrijving`)
}
function dimNaam(t: Vertaler, d: Dimensie): string {
  return t('mentaal.disc.dimNaam', { letter: d, label: dimLabel(t, d) })
}
// Icoon per dimensie (vervangt de gekleurde emoji-bollen). Kleur blijft via DIM_KLEUR,
// maar het icoon + label dragen de betekenis, niet enkel de kleur.
const DIM_ICOON: Record<Dimensie, LucideIcon> = {
  D: Crown, I: Sparkles, S: HeartHandshake, C: Microscope,
}
const KERNWOORDEN_AANTAL = 4

// Schaallabels: mentaal.disc.schaal<1-5>.

// Dimensie-volgorde: vragen 1-6 = D, 7-12 = I, 13-18 = S, 19-24 = C
const DIM_RANGES: Record<Dimensie, [number, number]> = {
  D: [1, 6], I: [7, 12], S: [13, 18], C: [19, 24],
}

// Samenwerkingtabel: combinaties van primaire profielen. Teksten in
// mentaal.disc.samen.<combinatie>.label / .beschrijving (bv. 'di' voor D+I).
const SAMENWERKING: Partial<Record<string, { kleur: string }>> = {
  'D+D': { kleur: 'var(--mf-red)' },
  'D+I': { kleur: 'var(--mf-orange)' },
  'D+S': { kleur: 'var(--mf-purple)' },
  'D+C': { kleur: 'var(--mf-purple)' },
  'I+I': { kleur: 'var(--mf-amber)' },
  'I+S': { kleur: 'var(--mf-green)' },
  'I+C': { kleur: 'var(--mf-blue)' },
  'S+S': { kleur: 'var(--mf-green)' },
  'S+C': { kleur: 'var(--mf-blue)' },
  'C+C': { kleur: 'var(--mf-blue)' },
}

function getSamenwerking(primair: Dimensie) {
  const dims: Dimensie[] = ['D', 'I', 'S', 'C']
  return dims.map(andere => {
    const key1 = `${primair}+${andere}`
    const key2 = `${andere}+${primair}`
    const sleutel = SAMENWERKING[key1] ? key1 : SAMENWERKING[key2] ? key2 : null
    const data = sleutel ? SAMENWERKING[sleutel] : undefined
    return { andere, data, tekstSleutel: sleutel ? sleutel.replace('+', '').toLowerCase() : null }
  })
}

function formatDatum(iso: string, locale: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
}

const DIMS: Dimensie[] = ['D', 'I', 'S', 'C']

// ── Radar-diagram (memo'd presentational component) ───────────────────────────
interface RadarProps {
  scores: Record<Dimensie, number>
  primair: Dimensie
}

function RadarDiagram({ scores, primair }: RadarProps) {
  const { t } = useVertaling()
  // Geometrie is puur afhankelijk van scores/primair; memo'iseren voorkomt
  // herberekening van paden bij elke parent-render.
  const geom = useMemo(() => {
    const cx = 110, cy = 110, r = 80
    const axisAngles: Record<Dimensie, number> = { D: -90, I: 0, S: 90, C: 180 }
    const toRad = (deg: number) => (deg * Math.PI) / 180
    const punkt = (dim: Dimensie, s: number) => ({
      x: cx + r * (s / 30) * Math.cos(toRad(axisAngles[dim])),
      y: cy + r * (s / 30) * Math.sin(toRad(axisAngles[dim])),
    })
    const axPunkt = (dim: Dimensie) => ({
      x: cx + (r + 22) * Math.cos(toRad(axisAngles[dim])),
      y: cy + (r + 22) * Math.sin(toRad(axisAngles[dim])),
    })
    const punten = DIMS.map(d => punkt(d, scores[d]))
    const polyPath = punten.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z'
    const grids = [10, 20, 30].map(lvl => {
      const gridPts = DIMS.map(d => ({
        x: cx + r * (lvl / 30) * Math.cos(toRad(axisAngles[d])),
        y: cy + r * (lvl / 30) * Math.sin(toRad(axisAngles[d])),
      }))
      return gridPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z'
    })
    const assen = DIMS.map(d => ({
      dim: d,
      x2: cx + r * Math.cos(toRad(axisAngles[d])),
      y2: cy + r * Math.sin(toRad(axisAngles[d])),
    }))
    const labels = DIMS.map(d => {
      const ap = axPunkt(d)
      const anchor: 'start' | 'end' | 'middle' = axisAngles[d] === 0 ? 'start' : axisAngles[d] === 180 ? 'end' : 'middle'
      const dy = axisAngles[d] === -90 ? -4 : axisAngles[d] === 90 ? 12 : 4
      return { dim: d, x: ap.x, y: ap.y + dy, anchor }
    })
    const dots = DIMS.map(d => ({ dim: d, ...punkt(d, scores[d]) }))
    return { cx, cy, polyPath, grids, assen, labels, dots }
  }, [scores, primair])

  const beschrijving = DIMS.map(d => t('mentaal.disc.radarDeel', { label: dimLabel(t, d), score: scores[d] })).join(', ')

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24, position: 'relative' }}>
      <div aria-hidden style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 0 }}>
        <div style={{ width: 200, height: 200, borderRadius: '50%', background: 'var(--mentaforce-primary-light)' }} />
      </div>
      <svg
        width={220}
        height={220}
        viewBox="0 0 220 220"
        role="img"
        aria-label={t('mentaal.disc.radarLabel', { beschrijving })}
        style={{ position: 'relative', zIndex: 1 }}
      >
        {/* Grid rings */}
        {geom.grids.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="var(--border-strong)" strokeWidth="1" />
        ))}
        {/* Axis lines */}
        {geom.assen.map(a => (
          <line key={a.dim} x1={geom.cx} y1={geom.cy} x2={a.x2} y2={a.y2} stroke="var(--border-strong)" strokeWidth="1" />
        ))}
        {/* Score polygon */}
        <path
          d={geom.polyPath}
          fill={`color-mix(in srgb, ${DIM_KLEUR[primair]} 19%, transparent)`}
          stroke={DIM_KLEUR[primair]}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Score dots */}
        {geom.dots.map(p => (
          <circle key={p.dim} cx={p.x} cy={p.y} r={5} fill={DIM_KLEUR[p.dim]} />
        ))}
        {/* Axis labels */}
        {geom.labels.map(l => (
          <text key={l.dim} x={l.x} y={l.y} textAnchor={l.anchor} fontSize={12} fontWeight="700" fill={DIM_KLEUR[l.dim]}>
            {l.dim}
          </text>
        ))}
      </svg>
    </div>
  )
}

export default function DiscPage() {
  const router = useRouter()
  const { t, taal } = useVertaling()
  const [geladen, setGeladen] = useState(false)
  const [fase, setFase] = useState<Fase>('intro')
  const [antwoorden, setAntwoorden] = useState<Record<number, number>>({})
  const [huidigIdx, setHuidigIdx] = useState(0)
  const [scores, setScores] = useState<Record<Dimensie, number>>({ D: 0, I: 0, S: 0, C: 0 })
  const [primair, setPrimair] = useState<Dimensie>('D')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')
  const [bedrijfId, setBedrijfId] = useState<string | null>(null)
  const [eerderResultaat, setEerderResultaat] = useState<EerderResultaat | null>(null)
  // Stuurt de auto-advance aan: id van de zojuist beantwoorde vraag, of null.
  const [zojuistBeantwoord, setZojuistBeantwoord] = useState<number | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profiel } = await supabase.from('profiles').select('bedrijf_id').eq('id', user.id).single()
      setBedrijfId(profiel?.bedrijf_id ?? null)

      // Check of er al eerder een inzending is
      const { data: eerder } = await supabase
        .from('disc_inzendingen')
        .select('d_score, i_score, s_score, c_score, primair_profiel, aangemaakt_op')
        .eq('user_id', user.id)
        .order('aangemaakt_op', { ascending: false })
        .limit(1)
        .single()

      if (eerder) {
        setEerderResultaat(eerder as EerderResultaat)
        setFase('eerder')
      }

      setGeladen(true)
    }
    init()
  }, [router])

  // Auto-advance 300ms na een antwoord (behalve op de laatste vraag — dan
  // berekent `antwoord` direct). Effect met cleanup ruimt de timer op.
  useEffect(() => {
    if (zojuistBeantwoord === null) return
    if (huidigIdx >= VRAGEN.length - 1) return
    const timer = setTimeout(() => {
      setHuidigIdx(v => v + 1)
      setZojuistBeantwoord(null)
    }, 300)
    return () => clearTimeout(timer)
  }, [zojuistBeantwoord, huidigIdx])

  function antwoord(vraagId: number, waarde: number) {
    const nieuw = { ...antwoorden, [vraagId]: waarde }
    setAntwoorden(nieuw)
    if (huidigIdx < VRAGEN.length - 1) {
      setZojuistBeantwoord(vraagId)
    } else { bereken(nieuw) }
  }

  function bereken(ant: Record<number, number>) {
    const s: Record<Dimensie, number> = { D: 0, I: 0, S: 0, C: 0 }
    for (const v of VRAGEN) s[v.dimensie] += ant[v.id] ?? 0
    setScores(s)
    const pr = (Object.entries(s) as [Dimensie, number][]).reduce((m, c) => c[1] > m[1] ? c : m)[0]
    setPrimair(pr)
    setFase('resultaat')
  }

  function startOpnieuw() {
    setAntwoorden({})
    setHuidigIdx(0)
    setScores({ D: 0, I: 0, S: 0, C: 0 })
    setPrimair('D')
    setFout('')
    setZojuistBeantwoord(null)
    setFase('intro')
  }

  async function verzend() {
    setBezig(true)
    setFout('')
    try {
      const res = await authFetch('/api/disc', {
        method: 'POST',
        body: JSON.stringify({ d_score: scores.D, i_score: scores.I, s_score: scores.S, c_score: scores.C, primair_profiel: primair, antwoorden, bedrijf_id: bedrijfId }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(taal === 'nl' && j.error ? j.error : t('mentaal.disc.verwerkingMislukt'))
      }
      setFase('opgeslagen')
    } catch (e) {
      setFout(e instanceof Error ? e.message : t('mentaal.disc.ietsMis'))
    } finally { setBezig(false) }
  }

  if (!geladen) return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="mf-spinner" />
    </div>
  )

  const hv = VRAGEN[huidigIdx]
  const HvIcoon = DIM_ICOON[hv.dimensie]

  // Voortgang per dimensie berekenen
  function dimVoortgang(dim: Dimensie) {
    const [start, eind] = DIM_RANGES[dim]
    const vragen = VRAGEN.filter(v => v.dimensie === dim)
    const beantwoord = vragen.filter(v => antwoorden[v.id] !== undefined).length
    const huidig = huidigIdx + 1
    const inDeze = huidig >= start && huidig <= eind
    return { beantwoord, totaal: 6, actief: inDeze }
  }

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', color: 'var(--text-1)' }}>
      <Navbar />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
        <header style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>{t('mentaal.disc.titel')}</h1>
          <p style={{ color: 'var(--text-3)', fontSize: 15 }}>{t('mentaal.disc.sub')}</p>
        </header>

        {/* FASE: eerder gedaan */}
        {fase === 'eerder' && eerderResultaat && (
          <Card style={{ padding: 32 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <div aria-hidden style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 0 }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--mentaforce-primary-light)' }} />
                </div>
                {(() => {
                  const Icoon = DIM_ICOON[eerderResultaat.primair_profiel as Dimensie] ?? Sparkles
                  return <Icoon size={36} strokeWidth={1.5} aria-hidden style={{ position: 'relative', zIndex: 1, color: DIM_KLEUR[eerderResultaat.primair_profiel as Dimensie] ?? 'var(--mentaforce-primary)' }} />
                })()}
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>{t('mentaal.disc.alIngevuld')}</h2>
              <p style={{ color: 'var(--text-3)', fontSize: 14 }}>{t('mentaal.disc.gedaanOp', { datum: formatDatum(eerderResultaat.aangemaakt_op, INTL_LOCALE[taal]) })}</p>
            </div>

            <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 20, marginBottom: 24 }}>
              <p className="mf-overline" style={{ marginBottom: 12 }}>{t('mentaal.disc.laatste')}</p>
              <p style={{ color: DIM_KLEUR[eerderResultaat.primair_profiel as Dimensie], fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
                {dimNaam(t, eerderResultaat.primair_profiel as Dimensie)}
              </p>
              <p style={{ color: 'var(--text-3)', fontSize: 14, margin: 0 }}>
                {dimBeschr(t, eerderResultaat.primair_profiel as Dimensie)}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                {([
                  ['D', eerderResultaat.d_score],
                  ['I', eerderResultaat.i_score],
                  ['S', eerderResultaat.s_score],
                  ['C', eerderResultaat.c_score],
                ] as [Dimensie, number][]).map(([dim, score]) => (
                  <ScoreBalk key={dim} dim={dim} score={score} />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
              <Button onClick={() => router.push('/bestanden')} style={{ width: '100%' }}>
                {t('mentaal.disc.bekijkRapport')}
              </Button>
              <Button variant="ghost" onClick={startOpnieuw} style={{ width: '100%', border: '1px solid var(--border-strong)' }}>
                {t('mentaal.disc.opnieuw')}
              </Button>
            </div>
          </Card>
        )}

        {/* FASE: intro */}
        {fase === 'intro' && (
          <div>
            <Card style={{ padding: 32, marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>{t('mentaal.disc.watIs')}</h2>
              <p style={{ color: 'var(--text-3)', fontSize: 15, lineHeight: 1.7, margin: 0 }}>
                {t('mentaal.disc.uitleg', { aantal: VRAGEN.length })}
              </p>
            </Card>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 24 }}>
              {DIMS.map(dim => {
                const Icoon = DIM_ICOON[dim]
                return (
                  <Card key={dim} style={{
                    padding: 20,
                    background: `color-mix(in srgb, ${DIM_KLEUR[dim]} 7%, var(--bg-card))`,
                    border: `1px solid color-mix(in srgb, ${DIM_KLEUR[dim]} 30%, transparent)`,
                  }}>
                    <Icoon size={26} strokeWidth={1.6} aria-hidden style={{ color: DIM_KLEUR[dim], marginBottom: 8 }} />
                    <div style={{ color: DIM_KLEUR[dim], fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                      {dimNaam(t, dim)}
                    </div>
                    <p style={{ color: 'var(--text-3)', fontSize: 13, lineHeight: 1.5, margin: '0 0 12px' }}>{dimBeschr(t, dim)}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {Array.from({ length: KERNWOORDEN_AANTAL }, (_, i) => t(`mentaal.disc.dim.${dim.toLowerCase()}.kern${i + 1}`)).map(k => (
                        <span key={k} style={{
                          background: `color-mix(in srgb, ${DIM_KLEUR[dim]} 18%, transparent)`,
                          color: DIM_KLEUR[dim], borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600,
                        }}>{k}</span>
                      ))}
                    </div>
                  </Card>
                )
              })}
            </div>
            <Button onClick={() => setFase('test')} size="lg" style={{ width: '100%' }}>
              {t('mentaal.disc.start')}
            </Button>
          </div>
        )}

        {/* FASE: test */}
        {fase === 'test' && (
          <>
            {/* Voortgang per dimensie */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {DIMS.map(dim => {
                const vg = dimVoortgang(dim)
                return (
                  <div key={dim} style={{
                    flex: 1, background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', padding: '8px 10px',
                    border: `1px solid ${vg.actief ? `color-mix(in srgb, ${DIM_KLEUR[dim]} 60%, transparent)` : 'var(--border)'}`,
                  }}>
                    <div style={{ color: vg.actief ? DIM_KLEUR[dim] : 'var(--text-3)', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{dim}</div>
                    <div style={{ background: 'var(--bg-app)', borderRadius: 4, height: 4, overflow: 'hidden' }}>
                      <div style={{ width: ((vg.beantwoord / vg.totaal) * 100) + '%', height: '100%', background: DIM_KLEUR[dim], borderRadius: 4, transition: 'width 0.3s var(--ease)' }} />
                    </div>
                    <div style={{ color: 'var(--text-3)', fontSize: 11, marginTop: 3 }}>{vg.beantwoord}/{vg.totaal}</div>
                  </div>
                )
              })}
            </div>

            {/* Algemene voortgangsbalk */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-3)', fontSize: 13 }}>{t('mentaal.disc.vraagVan', { nummer: huidigIdx + 1, totaal: VRAGEN.length })}</span>
                <span style={{ color: 'var(--text-3)', fontSize: 13 }}>{Math.round(((huidigIdx + 1) / VRAGEN.length) * 100)}%</span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={huidigIdx + 1}
                aria-valuemin={1}
                aria-valuemax={VRAGEN.length}
                aria-label={t('mentaal.disc.voortgang')}
                style={{ background: 'var(--bg-subtle)', borderRadius: 6, height: 6, overflow: 'hidden' }}
              >
                <div style={{ width: (((huidigIdx + 1) / VRAGEN.length) * 100) + '%', height: '100%', background: DIM_KLEUR[hv.dimensie], borderRadius: 6, transition: 'width 0.3s var(--ease)' }} />
              </div>
            </div>

            <Card style={{ padding: 32, border: `1px solid color-mix(in srgb, ${DIM_KLEUR[hv.dimensie]} 40%, transparent)` }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: `color-mix(in srgb, ${DIM_KLEUR[hv.dimensie]} 20%, transparent)`,
                color: DIM_KLEUR[hv.dimensie], borderRadius: 'var(--radius-xs)', padding: '4px 12px',
                fontSize: 13, fontWeight: 600, marginBottom: 20,
              }}>
                <HvIcoon size={14} aria-hidden /> {dimLabel(t, hv.dimensie)}
              </div>
              <p style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-1)', lineHeight: 1.5, marginBottom: 32 }}>{t(`mentaal.disc.vraag.v${hv.id}`)}</p>
              <div role="radiogroup" aria-label={t(`mentaal.disc.vraag.v${hv.id}`)} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[1, 2, 3, 4, 5].map(w => {
                  const g = antwoorden[hv.id] === w
                  return (
                    <button
                      key={w}
                      type="button"
                      role="radio"
                      aria-checked={g}
                      aria-label={t('mentaal.disc.schaalLabel', { waarde: w, label: t(`mentaal.disc.schaal${w}`) })}
                      onClick={() => antwoord(hv.id, w)}
                      className="mf-disc-opt"
                      style={{
                        flex: 1, minWidth: 80,
                        background: g ? DIM_KLEUR[hv.dimensie] : 'var(--bg-subtle)',
                        border: `1px solid ${g ? DIM_KLEUR[hv.dimensie] : 'var(--border)'}`,
                        borderRadius: 'var(--radius-sm)', padding: '14px 8px',
                        color: g ? 'var(--bg-app)' : 'var(--text-2)', cursor: 'pointer',
                        fontSize: 13, fontWeight: 600, textAlign: 'center', transition: 'background 0.15s var(--ease), border-color 0.15s var(--ease)',
                      }}
                    >
                      <div style={{ fontSize: 18, marginBottom: 4 }}>{w}</div>
                      <div style={{ fontSize: 11, lineHeight: 1.2 }}>{t(`mentaal.disc.schaal${w}`)}</div>
                    </button>
                  )
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
                <Button
                  variant="ghost"
                  onClick={() => setHuidigIdx(v => Math.max(0, v - 1))}
                  disabled={huidigIdx === 0}
                  style={{ border: '1px solid var(--border-strong)' }}
                >
                  ← {t('mentaal.disc.vorige')}
                </Button>
                {huidigIdx < VRAGEN.length - 1 && antwoorden[hv.id] !== undefined && (
                  <Button variant="secondary" onClick={() => setHuidigIdx(v => v + 1)}>
                    {t('mentaal.disc.volgende')} →
                  </Button>
                )}
              </div>
            </Card>

            <style>{`
              .mf-disc-opt:focus-visible {
                outline: 2px solid var(--mentaforce-primary);
                outline-offset: 2px;
              }
            `}</style>
          </>
        )}

        {/* FASE: resultaat */}
        {fase === 'resultaat' && (
          <div>
            <Card style={{ padding: 32, marginBottom: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, textAlign: 'center', color: 'var(--text-1)' }}>{t('mentaal.disc.profiel')}</h2>
              <p style={{ color: 'var(--text-3)', textAlign: 'center', marginBottom: 24 }}>
                {t('mentaal.disc.primair')} <span style={{ color: DIM_KLEUR[primair], fontWeight: 700, fontSize: 18 }}>{dimNaam(t, primair)}</span>
              </p>

              <RadarDiagram scores={scores} primair={primair} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
                {(Object.entries(scores) as [Dimensie, number][]).map(([dim, score]) => (
                  <ScoreBalk key={dim} dim={dim} score={score} thick />
                ))}
              </div>
              {(() => {
                const Icoon = DIM_ICOON[primair]
                return (
                  <div style={{
                    background: `color-mix(in srgb, ${DIM_KLEUR[primair]} 14%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${DIM_KLEUR[primair]} 40%, transparent)`,
                    borderRadius: 'var(--radius-md)', padding: 20, marginBottom: 24,
                  }}>
                    <h3 style={{ color: DIM_KLEUR[primair], fontWeight: 700, marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <Icoon size={18} aria-hidden /> {dimLabel(t, primair)}
                    </h3>
                    <p style={{ color: 'var(--text-2)', fontSize: 15, lineHeight: 1.6, margin: 0 }}>{dimBeschr(t, primair)}</p>
                  </div>
                )
              })()}
              {fout && (
                <div role="alert" style={{ background: 'var(--mf-red-light)', border: '1px solid var(--mf-red)', borderRadius: 'var(--radius-sm)', padding: 12, color: 'var(--mf-red)', marginBottom: 16 }}>
                  {fout}
                </div>
              )}
              <Button onClick={verzend} loading={bezig} size="lg" style={{ width: '100%' }}>
                {bezig ? t('mentaal.disc.opslaan') : t('mentaal.disc.opslaanKnop')}
              </Button>
            </Card>

            {/* Samenwerkingtabel */}
            <Card style={{ padding: 32 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6 }}>{t('mentaal.disc.samenTitel')}</h3>
              <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 20 }}>{t('mentaal.disc.samenSub', { profiel: primair })}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {getSamenwerking(primair).map(({ andere, data, tekstSleutel }) => {
                  const Icoon = DIM_ICOON[andere]
                  return (
                    <div key={andere} style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 16, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <div style={{ minWidth: 48, textAlign: 'center' }}>
                        <Icoon size={20} aria-hidden style={{ color: DIM_KLEUR[andere] }} />
                        <div style={{ color: DIM_KLEUR[andere], fontWeight: 700, fontSize: 13, marginTop: 2 }}>{primair}+{andere}</div>
                      </div>
                      <div>
                        <div style={{ color: data?.kleur ?? 'var(--text-2)', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{tekstSleutel ? t(`mentaal.disc.samen.${tekstSleutel}.label`) : '-'}</div>
                        <p style={{ color: 'var(--text-3)', fontSize: 14, lineHeight: 1.5, margin: 0 }}>{tekstSleutel ? t(`mentaal.disc.samen.${tekstSleutel}.beschrijving`) : ''}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        )}

        {/* FASE: opgeslagen */}
        {fase === 'opgeslagen' && (
          <Card style={{ padding: 40, textAlign: 'center' }}>
            <CheckCircle2 size={48} strokeWidth={1.5} aria-hidden style={{ color: 'var(--mf-green)', marginBottom: 16 }} />
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--mf-green)', marginBottom: 8 }}>{t('mentaal.disc.opgeslagen')}</h2>
            <p style={{ color: 'var(--text-3)', marginBottom: 24 }}>{t('mentaal.disc.opgeslagenTekst')}</p>
            <Button onClick={() => router.push('/bestanden')}>
              {t('mentaal.disc.bekijkRapport')}
            </Button>
          </Card>
        )}
      </main>
    </div>
  )
}

// ── Score-balk (gedeeld tussen 'eerder' en 'resultaat') ───────────────────────
interface ScoreBalkProps {
  dim: Dimensie
  score: number
  thick?: boolean
}

function ScoreBalk({ dim, score, thick = false }: ScoreBalkProps) {
  const { t } = useVertaling()
  const pct = Math.round((score / 30) * 100)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: DIM_KLEUR[dim], fontWeight: 600, fontSize: thick ? 15 : 13 }}>{dimNaam(t, dim)}</span>
        <span style={{ color: 'var(--text-3)', fontSize: thick ? 14 : 13 }}>{score}/30</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={30}
        aria-label={t('mentaal.disc.scoreLabel', { label: dimLabel(t, dim), score })}
        style={{ background: 'var(--bg-app)', borderRadius: 6, height: thick ? 10 : 8, overflow: 'hidden' }}
      >
        <div style={{ width: pct + '%', height: '100%', background: DIM_KLEUR[dim], borderRadius: 6, transition: 'width 0.8s var(--ease)' }} />
      </div>
    </div>
  )
}

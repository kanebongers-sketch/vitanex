'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { authFetch } from '@/lib/auth-fetch'
import Navbar from '@/components/layout/Navbar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Crown, Sparkles, HeartHandshake, Microscope, CheckCircle2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'


type Dimensie = 'D' | 'I' | 'S' | 'C'
interface Vraag { id: number; tekst: string; dimensie: Dimensie }

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
  { id: 1, tekst: 'Ik neem graag het voortouw in nieuwe situaties.', dimensie: 'D' },
  { id: 2, tekst: 'Ik stel hoge eisen aan mezelf en anderen.', dimensie: 'D' },
  { id: 3, tekst: 'Ik ga direct op mijn doel af, zonder omwegen.', dimensie: 'D' },
  { id: 4, tekst: 'Ik neem snel beslissingen, ook zonder alle informatie.', dimensie: 'D' },
  { id: 5, tekst: 'Ik daag bestaande situaties en regels graag uit.', dimensie: 'D' },
  { id: 6, tekst: 'Ik werk hard om de beste te zijn in wat ik doe.', dimensie: 'D' },
  { id: 7, tekst: 'Ik maak makkelijk nieuwe contacten en vrienden.', dimensie: 'I' },
  { id: 8, tekst: 'Ik ben enthousiast en positief ingesteld.', dimensie: 'I' },
  { id: 9, tekst: 'Ik weet mensen te overtuigen en te inspireren.', dimensie: 'I' },
  { id: 10, tekst: 'Ik ben graag het middelpunt van de aandacht.', dimensie: 'I' },
  { id: 11, tekst: 'Ik deel mijn gevoelens en ervaringen open met anderen.', dimensie: 'I' },
  { id: 12, tekst: 'Ik breng energie en positiviteit in een groep.', dimensie: 'I' },
  { id: 13, tekst: 'Mensen kunnen op mij rekenen: ik ben betrouwbaar en consistent.', dimensie: 'S' },
  { id: 14, tekst: 'Ik werk het liefst in een stabiele, voorspelbare omgeving.', dimensie: 'S' },
  { id: 15, tekst: 'Ik ben een goede luisteraar en geef anderen ruimte.', dimensie: 'S' },
  { id: 16, tekst: 'Ik werk graag samen met anderen aan een gemeenschappelijk doel.', dimensie: 'S' },
  { id: 17, tekst: 'Ik blijf geduldig in stressvolle of onduidelijke situaties.', dimensie: 'S' },
  { id: 18, tekst: 'Ik streef naar harmonie en goede relaties in mijn omgeving.', dimensie: 'S' },
  { id: 19, tekst: 'Nauwkeurigheid en kwaliteit zijn voor mij erg belangrijk.', dimensie: 'C' },
  { id: 20, tekst: 'Ik analyseer situaties grondig voordat ik actie onderneem.', dimensie: 'C' },
  { id: 21, tekst: 'Ik volg graag vaste procedures en richtlijnen.', dimensie: 'C' },
  { id: 22, tekst: 'Ik controleer mijn werk meerdere keren om fouten te vermijden.', dimensie: 'C' },
  { id: 23, tekst: 'Ik werk op een systematische en gestructureerde manier.', dimensie: 'C' },
  { id: 24, tekst: 'Ik houd hoge kwaliteitsstandaarden aan in alles wat ik doe.', dimensie: 'C' },
]

const DIM_KLEUR: Record<Dimensie, string> = { D: 'var(--mf-red)', I: 'var(--mf-amber)', S: 'var(--mf-green)', C: 'var(--mf-blue)' }
const DIM_LABEL: Record<Dimensie, string> = { D: 'Dominantie', I: 'Invloed', S: 'Stabiliteit', C: 'Conscientieusheid' }
const DIM_BESCHR: Record<Dimensie, string> = {
  D: 'Resultaatgericht, direct en besluitvaardig. Je neemt graag de leiding en stelt hoge eisen.',
  I: 'Enthousiast, sociaal en overtuigend. Je inspireert anderen en brengt energie in het team.',
  S: 'Betrouwbaar, geduldig en samenwerkingsgericht. Je zorgt voor stabiliteit en harmonie.',
  C: 'Nauwkeurig, analytisch en kwaliteitsgericht. Je werkt systematisch en grondig.',
}
// Icoon per dimensie (vervangt de gekleurde emoji-bollen). Kleur blijft via DIM_KLEUR,
// maar het icoon + label dragen de betekenis, niet enkel de kleur.
const DIM_ICOON: Record<Dimensie, LucideIcon> = {
  D: Crown, I: Sparkles, S: HeartHandshake, C: Microscope,
}
const DIM_KERNWOORDEN: Record<Dimensie, string[]> = {
  D: ['Leidend', 'Besluitvaardig', 'Resultaatgericht', 'Direct'],
  I: ['Enthousiast', 'Sociaal', 'Overtuigend', 'Inspirerend'],
  S: ['Betrouwbaar', 'Geduldig', 'Harmonieus', 'Teamgericht'],
  C: ['Nauwkeurig', 'Analytisch', 'Systematisch', 'Kwaliteitsgericht'],
}

const SCHAAL = ['Helemaal niet', 'Nauwelijks', 'Soms', 'Vaak', 'Volledig']

// Dimensie-volgorde: vragen 1-6 = D, 7-12 = I, 13-18 = S, 19-24 = C
const DIM_RANGES: Record<Dimensie, [number, number]> = {
  D: [1, 6], I: [7, 12], S: [13, 18], C: [19, 24],
}

// Samenwerkingtabel: combinaties van primaire profielen
const SAMENWERKING: Partial<Record<string, { label: string; beschrijving: string; kleur: string }>> = {
  'D+D': { label: 'Krachtig duo', beschrijving: 'Hoge energie en ambitie, maar let op: beide willen leiden. Spreek rollen duidelijk af.', kleur: 'var(--mf-red)' },
  'D+I': { label: 'Energieke combinatie', beschrijving: 'D brengt focus en richting, I zorgt voor enthousiasme en draagvlak. Sterk team.', kleur: 'var(--mf-orange)' },
  'D+S': { label: 'Daadkracht & rust', beschrijving: 'D drijft vooruit, S zorgt voor stabiliteit. Goede balans als er respect is voor elkaars tempo.', kleur: 'var(--mf-purple)' },
  'D+C': { label: 'Resultaat & precisie', beschrijving: 'D wil snel, C wil grondig. Kan wrijving geven, maar levert kwalitatief sterke resultaten.', kleur: 'var(--mf-purple)' },
  'I+I': { label: 'Bruisend en creatief', beschrijving: 'Veel energie en ideeën, maar wie bewaakt de uitvoering? Zorg voor structuur erbij.', kleur: 'var(--mf-amber)' },
  'I+S': { label: 'Warm en harmonieus', beschrijving: 'I inspireert, S ondersteunt. Mensen voelen zich gewaardeerd in dit team.', kleur: 'var(--mf-green)' },
  'I+C': { label: 'Creativiteit & kwaliteit', beschrijving: 'I genereert ideeën, C verfijnt ze. Complementair als ze elkaars stijl respecteren.', kleur: 'var(--mf-blue)' },
  'S+S': { label: 'Stabiel en betrouwbaar', beschrijving: 'Hoge harmonie en loyaliteit. Sterk in uitvoering, maar pas op voor vermijding van conflict.', kleur: 'var(--mf-green)' },
  'S+C': { label: 'Stabiel analytisch team', beschrijving: 'Geduldig, grondig en betrouwbaar. Uitstekend voor complexe, zorgvuldige taken.', kleur: 'var(--mf-blue)' },
  'C+C': { label: 'Kwaliteitsgedreven duo', beschrijving: 'Hoge standaarden en precisie. Sterk in analyse, maar bewaar oog voor de grote lijn.', kleur: 'var(--mf-blue)' },
}

function getSamenwerking(primair: Dimensie) {
  const dims: Dimensie[] = ['D', 'I', 'S', 'C']
  return dims.map(andere => {
    const key1 = `${primair}+${andere}`
    const key2 = `${andere}+${primair}`
    const data = SAMENWERKING[key1] ?? SAMENWERKING[key2]
    return { andere, data }
  })
}

function formatDatum(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
}

const DIMS: Dimensie[] = ['D', 'I', 'S', 'C']

// ── Radar-diagram (memo'd presentational component) ───────────────────────────
interface RadarProps {
  scores: Record<Dimensie, number>
  primair: Dimensie
}

function RadarDiagram({ scores, primair }: RadarProps) {
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

  const beschrijving = DIMS.map(d => `${DIM_LABEL[d]} ${scores[d]} van 30`).join(', ')

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
        aria-label={`Radar-diagram van jouw DISC-scores: ${beschrijving}.`}
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
    const t = setTimeout(() => {
      setHuidigIdx(v => v + 1)
      setZojuistBeantwoord(null)
    }, 300)
    return () => clearTimeout(t)
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
        throw new Error(j.error ?? 'Verwerking mislukt')
      }
      setFase('opgeslagen')
    } catch (e) {
      setFout(e instanceof Error ? e.message : 'Er ging iets mis')
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
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>DISC Persoonlijkheidstest</h1>
          <p style={{ color: 'var(--text-3)', fontSize: 15 }}>Ontdek jouw dominante gedragsstijl</p>
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
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>Je hebt deze test al ingevuld</h2>
              <p style={{ color: 'var(--text-3)', fontSize: 14 }}>Gedaan op {formatDatum(eerderResultaat.aangemaakt_op)}</p>
            </div>

            <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 20, marginBottom: 24 }}>
              <p className="mf-overline" style={{ marginBottom: 12 }}>Jouw laatste resultaat</p>
              <p style={{ color: DIM_KLEUR[eerderResultaat.primair_profiel as Dimensie], fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
                {eerderResultaat.primair_profiel} – {DIM_LABEL[eerderResultaat.primair_profiel as Dimensie]}
              </p>
              <p style={{ color: 'var(--text-3)', fontSize: 14, margin: 0 }}>
                {DIM_BESCHR[eerderResultaat.primair_profiel as Dimensie]}
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
                Bekijk je rapport
              </Button>
              <Button variant="ghost" onClick={startOpnieuw} style={{ width: '100%', border: '1px solid var(--border-strong)' }}>
                Doe de test opnieuw
              </Button>
            </div>
          </Card>
        )}

        {/* FASE: intro */}
        {fase === 'intro' && (
          <div>
            <Card style={{ padding: 32, marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>Wat is DISC?</h2>
              <p style={{ color: 'var(--text-3)', fontSize: 15, lineHeight: 1.7, margin: 0 }}>
                DISC is een model dat gedragsstijlen beschrijft aan de hand van vier dimensies. Er is geen goed of fout profiel — elke stijl heeft unieke sterke punten. De test bestaat uit 24 stellingen en duurt ongeveer 5 minuten.
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
                      {dim} – {DIM_LABEL[dim]}
                    </div>
                    <p style={{ color: 'var(--text-3)', fontSize: 13, lineHeight: 1.5, margin: '0 0 12px' }}>{DIM_BESCHR[dim]}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {DIM_KERNWOORDEN[dim].map(k => (
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
              Start de test
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
                <span style={{ color: 'var(--text-3)', fontSize: 13 }}>Vraag {huidigIdx + 1} van {VRAGEN.length}</span>
                <span style={{ color: 'var(--text-3)', fontSize: 13 }}>{Math.round(((huidigIdx + 1) / VRAGEN.length) * 100)}%</span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={huidigIdx + 1}
                aria-valuemin={1}
                aria-valuemax={VRAGEN.length}
                aria-label="Voortgang DISC-test"
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
                <HvIcoon size={14} aria-hidden /> {DIM_LABEL[hv.dimensie]}
              </div>
              <p style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-1)', lineHeight: 1.5, marginBottom: 32 }}>{hv.tekst}</p>
              <div role="radiogroup" aria-label={hv.tekst} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[1, 2, 3, 4, 5].map(w => {
                  const g = antwoorden[hv.id] === w
                  return (
                    <button
                      key={w}
                      type="button"
                      role="radio"
                      aria-checked={g}
                      aria-label={`${w} – ${SCHAAL[w - 1]}`}
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
                      <div style={{ fontSize: 11, lineHeight: 1.2 }}>{SCHAAL[w - 1]}</div>
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
                  ← Vorige vraag
                </Button>
                {huidigIdx < VRAGEN.length - 1 && antwoorden[hv.id] !== undefined && (
                  <Button variant="secondary" onClick={() => setHuidigIdx(v => v + 1)}>
                    Volgende →
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
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, textAlign: 'center', color: 'var(--text-1)' }}>Jouw DISC-profiel</h2>
              <p style={{ color: 'var(--text-3)', textAlign: 'center', marginBottom: 24 }}>
                Primair: <span style={{ color: DIM_KLEUR[primair], fontWeight: 700, fontSize: 18 }}>{primair} – {DIM_LABEL[primair]}</span>
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
                      <Icoon size={18} aria-hidden /> {DIM_LABEL[primair]}
                    </h3>
                    <p style={{ color: 'var(--text-2)', fontSize: 15, lineHeight: 1.6, margin: 0 }}>{DIM_BESCHR[primair]}</p>
                  </div>
                )
              })()}
              {fout && (
                <div role="alert" style={{ background: 'var(--mf-red-light)', border: '1px solid var(--mf-red)', borderRadius: 'var(--radius-sm)', padding: 12, color: 'var(--mf-red)', marginBottom: 16 }}>
                  {fout}
                </div>
              )}
              <Button onClick={verzend} loading={bezig} size="lg" style={{ width: '100%' }}>
                {bezig ? 'Opslaan…' : 'Resultaat opslaan & rapport genereren'}
              </Button>
            </Card>

            {/* Samenwerkingtabel */}
            <Card style={{ padding: 32 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6 }}>Samenwerking met andere profielen</h3>
              <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 20 }}>Hoe werkt jouw {primair}-profiel samen met andere DISC-typen?</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {getSamenwerking(primair).map(({ andere, data }) => {
                  const Icoon = DIM_ICOON[andere]
                  return (
                    <div key={andere} style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 16, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <div style={{ minWidth: 48, textAlign: 'center' }}>
                        <Icoon size={20} aria-hidden style={{ color: DIM_KLEUR[andere] }} />
                        <div style={{ color: DIM_KLEUR[andere], fontWeight: 700, fontSize: 13, marginTop: 2 }}>{primair}+{andere}</div>
                      </div>
                      <div>
                        <div style={{ color: data?.kleur ?? 'var(--text-2)', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{data?.label ?? '–'}</div>
                        <p style={{ color: 'var(--text-3)', fontSize: 14, lineHeight: 1.5, margin: 0 }}>{data?.beschrijving ?? ''}</p>
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
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--mf-green)', marginBottom: 8 }}>Resultaat opgeslagen!</h2>
            <p style={{ color: 'var(--text-3)', marginBottom: 24 }}>Je DISC-profiel en rapport zijn opgeslagen.</p>
            <Button onClick={() => router.push('/bestanden')}>
              Bekijk je rapport
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
  const pct = Math.round((score / 30) * 100)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: DIM_KLEUR[dim], fontWeight: 600, fontSize: thick ? 15 : 13 }}>{dim} – {DIM_LABEL[dim]}</span>
        <span style={{ color: 'var(--text-3)', fontSize: thick ? 14 : 13 }}>{score}/30</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={30}
        aria-label={`${DIM_LABEL[dim]}: ${score} van 30`}
        style={{ background: 'var(--bg-app)', borderRadius: 6, height: thick ? 10 : 8, overflow: 'hidden' }}
      >
        <div style={{ width: pct + '%', height: '100%', background: DIM_KLEUR[dim], borderRadius: 6, transition: 'width 0.8s var(--ease)' }} />
      </div>
    </div>
  )
}

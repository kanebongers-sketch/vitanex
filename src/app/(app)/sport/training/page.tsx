'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import {
  Dumbbell, Clock, CheckCircle2, Circle,
  Plus, ArrowLeft, Timer, Flame, Trophy,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

type SetLog = { herhalingen: number; gewicht_kg: number | null; voltooid: boolean }

type OefeningState = {
  naam: string
  naam_en: string
  setsGedaan: SetLog[]
  doelSets: number
  doelHerhalingen: string
  heeft_gewicht: boolean
  gewicht_tip: string
  uitvoering_tip: string
  gif_url: string | null
  laadt_img: boolean
}

type OefeningData = {
  naam: string
  naam_en?: string
  sets: number
  herhalingen: string
  rusttijd_sec: number
  heeft_gewicht?: boolean
  gewicht_tip: string
  uitvoering_tip: string
}

type Trainingsdag = {
  dag: number
  naam: string
  spiergroepen: string[]
  coaching_tekst: string
  geschatte_duur: number
  oefeningen: OefeningData[]
}

type FitnessSchema = { id: string; naam: string; schema_json: Trainingsdag[] }
type Scherm = 'kiezen' | 'actief' | 'afronden'

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(sec: number) {
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`
}

function aanbevolenDag(schema: Trainingsdag[]): number {
  const w = new Date().getDay()
  return Math.min((w === 0 ? 6 : w - 1) % schema.length, schema.length - 1)
}

const SPIERKLEUR: Record<string, string> = {
  borst: '#EF4444', schouders: '#F97316', triceps: '#F59E0B',
  rug: '#3B82F6', biceps: '#6366F1', benen: '#8B5CF6',
  billen: '#EC4899', core: '#10B981', kuiten: '#06B6D4',
}
function spierKleur(s: string) {
  const lc = s.toLowerCase()
  for (const [k, v] of Object.entries(SPIERKLEUR)) if (lc.includes(k)) return v
  return '#6B7280'
}

// ── Component ────────────────────────────────────────────────────────────────

export default function TrainingLoggerPage() {
  const router = useRouter()
  const [laden, setLaden]                   = useState(true)
  const [schema, setSchema]                 = useState<FitnessSchema | null>(null)
  const [userId, setUserId]                 = useState<string | null>(null)
  const [scherm, setScherm]                 = useState<Scherm>('kiezen')
  const [gekozenTraining, setGekozenTraining] = useState<Trainingsdag | null>(null)
  const [oefeningen, setOefeningen]         = useState<OefeningState[]>([])
  const [timerSec, setTimerSec]             = useState(0)
  const [timerActive, setTimerActive]       = useState(false)
  const [notities, setNotities]             = useState('')
  const [opslaan, setOpslaan]               = useState(false)
  const [toast, setToast]                   = useState<string | null>(null)

  useEffect(() => {
    if (!timerActive) return
    const iv = setInterval(() => setTimerSec(s => s + 1), 1000)
    return () => clearInterval(iv)
  }, [timerActive])

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data } = await supabase
        .from('fitness_schemas').select('id, naam, schema_json')
        .eq('user_id', user.id).eq('actief', true)
        .order('aangemaakt_op', { ascending: false }).limit(1).maybeSingle()
      if (!data) { router.push('/sport/genereer'); return }
      setSchema(data as FitnessSchema)
      setLaden(false)
    }
    laad()
  }, [router])

  const startTraining = useCallback((training: Trainingsdag) => {
    setGekozenTraining(training)
    const init: OefeningState[] = training.oefeningen.map(o => ({
      naam: o.naam,
      naam_en: o.naam_en ?? o.naam,
      doelSets: o.sets,
      doelHerhalingen: o.herhalingen,
      heeft_gewicht: o.heeft_gewicht ?? true,
      gewicht_tip: o.gewicht_tip,
      uitvoering_tip: o.uitvoering_tip,
      gif_url: null,
      laadt_img: true,
      setsGedaan: Array.from({ length: o.sets }, () => ({ herhalingen: 0, gewicht_kg: null, voltooid: false })),
    }))
    setOefeningen(init)
    setTimerSec(0)
    setTimerActive(true)
    setScherm('actief')

    // Laad afbeeldingen per oefening op de achtergrond
    training.oefeningen.forEach((o, idx) => {
      const zoek = o.naam_en ?? o.naam
      fetch(`/api/sport/oefening-image?naam=${encodeURIComponent(zoek)}`)
        .then(r => r.ok ? r.json() : null)
        .then((d: { gif_url?: string } | null) => {
          setOefeningen(prev => prev.map((oe, i) =>
            i === idx ? { ...oe, gif_url: d?.gif_url ?? null, laadt_img: false } : oe
          ))
        })
        .catch(() => setOefeningen(prev => prev.map((oe, i) =>
          i === idx ? { ...oe, laadt_img: false } : oe
        )))
    })
  }, [])

  const updateSet = (oi: number, si: number, veld: keyof SetLog, val: number | boolean | null) =>
    setOefeningen(prev => prev.map((o, i) => i !== oi ? o : {
      ...o,
      setsGedaan: o.setsGedaan.map((s, j) => j !== si ? s : { ...s, [veld]: val }),
    }))

  const extraSet = (oi: number) =>
    setOefeningen(prev => prev.map((o, i) => i !== oi ? o : {
      ...o,
      setsGedaan: [...o.setsGedaan, { herhalingen: 0, gewicht_kg: null, voltooid: false }],
    }))

  const voltooideOef = oefeningen.filter(o => o.setsGedaan.some(s => s.voltooid)).length

  const slaOp = async () => {
    if (!userId || !schema || !gekozenTraining) return
    setOpslaan(true)
    try {
      const { data: log, error } = await supabase.from('training_logs').insert({
        user_id: userId, schema_id: schema.id,
        datum: new Date().toISOString().split('T')[0],
        naam: gekozenTraining.naam,
        duur_minuten: Math.round(timerSec / 60),
        notities: notities || null,
      }).select('id').single()
      if (error || !log) throw error

      const rows = oefeningen.flatMap(o =>
        o.setsGedaan.filter(s => s.voltooid || s.herhalingen > 0).map((s, i) => ({
          training_log_id: log.id, user_id: userId,
          oefening_naam: o.naam, set_nummer: i + 1,
          herhalingen: s.herhalingen || null, gewicht_kg: s.gewicht_kg,
        }))
      )
      if (rows.length > 0) await supabase.from('oefening_logs').insert(rows)

      setTimerActive(false)
      setToast('Training opgeslagen! 💪')
      setTimeout(() => router.push('/sport'), 1500)
    } catch {
      setToast('Fout bij opslaan, probeer opnieuw')
      setOpslaan(false)
    }
  }

  if (laden) return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="mf-spinner" />
    </div>
  )

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', paddingBottom: 100 }}>
      <Navbar />

      {toast && (
        <div style={{ position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)', background: 'var(--mf-green)', color: '#fff', padding: '12px 24px', borderRadius: 12, fontWeight: 600, fontSize: 14, zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 16px' }}>

        {/* ════════════════════════════════════════════════
            SCHERM: KIEZEN
        ════════════════════════════════════════════════ */}
        {scherm === 'kiezen' && schema && (
          <>
            <div style={{ marginBottom: 22 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 4px', letterSpacing: '-0.03em' }}>Training starten</h1>
              <p style={{ color: 'var(--text-4)', fontSize: 13, margin: 0 }}>{schema.naam}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {schema.schema_json.map((dag, idx) => {
                const aanbevolen = idx === aanbevolenDag(schema.schema_json)
                return (
                  <div key={idx} style={{
                    background: 'var(--bg-card)',
                    border: aanbevolen ? '2px solid var(--mf-green)' : '1px solid var(--border)',
                    borderRadius: 18,
                    overflow: 'hidden',
                    position: 'relative',
                  }}>
                    {aanbevolen && (
                      <div style={{ background: 'var(--mf-green)', color: 'white', fontSize: 10, fontWeight: 700, padding: '4px 12px', letterSpacing: '0.06em' }}>
                        AANBEVOLEN VANDAAG
                      </div>
                    )}
                    <div style={{ padding: '16px 16px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 600, marginBottom: 3 }}>DAG {dag.dag}</div>
                          <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>{dag.naam}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-4)', justifyContent: 'flex-end' }}>
                            <Clock size={11} /> {dag.geschatte_duur} min
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-4)', justifyContent: 'flex-end', marginTop: 3 }}>
                            <Dumbbell size={11} /> {dag.oefeningen.length} oef.
                          </div>
                        </div>
                      </div>

                      {/* Spiergroepen */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                        {dag.spiergroepen.map((sg, si) => {
                          const k = spierKleur(sg)
                          return (
                            <span key={si} style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: k + '18', color: k, border: `1px solid ${k}30` }}>
                              {sg}
                            </span>
                          )
                        })}
                      </div>

                      {/* Oefeningen preview */}
                      <div style={{ marginBottom: 14 }}>
                        {dag.oefeningen.slice(0, 4).map((o, oi) => (
                          <div key={oi} style={{ fontSize: 12, color: 'var(--text-3)', padding: '3px 0', borderBottom: oi < Math.min(dag.oefeningen.length, 4) - 1 ? '1px solid var(--border)' : 'none', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{o.naam}</span>
                            <span style={{ color: 'var(--text-4)' }}>{o.sets}×{o.herhalingen}</span>
                          </div>
                        ))}
                        {dag.oefeningen.length > 4 && (
                          <div style={{ fontSize: 11, color: 'var(--text-4)', paddingTop: 4 }}>
                            +{dag.oefeningen.length - 4} meer
                          </div>
                        )}
                      </div>

                      {dag.coaching_tekst && (
                        <p style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic', margin: '0 0 14px', lineHeight: 1.5 }}>
                          &ldquo;{dag.coaching_tekst}&rdquo;
                        </p>
                      )}

                      <button
                        onClick={() => startTraining(dag)}
                        style={{
                          width: '100%',
                          background: aanbevolen ? 'var(--mf-green)' : 'var(--text-1)',
                          color: 'white', border: 'none', borderRadius: 12,
                          padding: '12px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        }}
                      >
                        <Flame size={15} /> Start training
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════
            SCHERM: ACTIEF
        ════════════════════════════════════════════════ */}
        {scherm === 'actief' && gekozenTraining && (
          <>
            {/* Sticky header */}
            <div style={{
              position: 'sticky', top: 56, zIndex: 20,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 16, padding: '14px 16px', marginBottom: 16,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 600, marginBottom: 2 }}>{gekozenTraining.naam}</div>
                <div style={{ fontSize: 13, color: 'var(--mf-green)', fontWeight: 700 }}>
                  {voltooideOef}/{oefeningen.length} oefeningen
                </div>
                <div style={{ height: 3, borderRadius: 2, background: 'var(--border)', marginTop: 6, width: 120 }}>
                  <div style={{ height: '100%', borderRadius: 2, background: 'var(--mf-green)', width: `${oefeningen.length ? (voltooideOef / oefeningen.length) * 100 : 0}%`, transition: 'width 0.3s' }} />
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--mf-orange)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                  {fmt(timerSec)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-4)', justifyContent: 'center' }}>
                  <Timer size={9} /> verstreken
                </div>
              </div>
            </div>

            {/* Oefening kaarten */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {oefeningen.map((oef, oi) => {
                const alles = oef.setsGedaan.every(s => s.voltooid)
                return (
                  <div key={oi} style={{
                    background: 'var(--bg-card)',
                    border: alles ? '2px solid var(--mf-green)' : '1px solid var(--border)',
                    borderRadius: 18,
                    overflow: 'hidden',
                    opacity: alles ? 0.8 : 1,
                  }}>

                    {/* ── Afbeelding ── */}
                    <div style={{ position: 'relative', height: 180, background: 'var(--bg-subtle)', overflow: 'hidden' }}>
                      {oef.gif_url ? (
                        <img
                          src={oef.gif_url}
                          alt={oef.naam}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                          <Dumbbell size={36} strokeWidth={1.2} style={{ color: 'var(--text-4)' }} />
                          {oef.laadt_img && (
                            <div style={{ fontSize: 11, color: 'var(--text-4)' }}>Afbeelding laden…</div>
                          )}
                        </div>
                      )}
                      {/* Overlay: naam + sets-doel */}
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        background: 'linear-gradient(transparent, rgba(0,0,0,0.72))',
                        padding: '24px 14px 12px',
                      }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>
                          {alles && <CheckCircle2 size={14} strokeWidth={2.5} style={{ display: 'inline', marginRight: 6, color: '#4ade80', verticalAlign: 'middle' }} />}
                          {oef.naam}
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
                          {oef.doelSets} sets × {oef.doelHerhalingen} herhalingen
                          {!oef.heeft_gewicht && ' · bodyweight'}
                        </div>
                      </div>
                      {/* Voortgang bolletjes */}
                      <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 4 }}>
                        {oef.setsGedaan.map((s, si) => (
                          <div key={si} style={{ width: 8, height: 8, borderRadius: '50%', background: s.voltooid ? '#4ade80' : 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.6)' }} />
                        ))}
                      </div>
                    </div>

                    <div style={{ padding: '14px 14px 16px' }}>
                      {/* Uitvoeringstip */}
                      {oef.uitvoering_tip && (
                        <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.55, marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
                          {oef.uitvoering_tip}
                          {oef.heeft_gewicht && oef.gewicht_tip && (
                            <div style={{ marginTop: 6, color: '#F97316', fontWeight: 600 }}>
                              💡 {oef.gewicht_tip}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Set rijen */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {oef.setsGedaan.map((set, si) => (
                          <div key={si} style={{ display: 'flex', gap: 8, alignItems: 'center', opacity: set.voltooid ? 0.55 : 1 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', flexShrink: 0 }}>
                              {si + 1}
                            </div>
                            <input
                              type="number" min={1} max={999}
                              value={set.herhalingen || ''}
                              onChange={e => updateSet(oi, si, 'herhalingen', parseInt(e.target.value) || 0)}
                              placeholder={oef.doelHerhalingen}
                              disabled={set.voltooid}
                              style={{ flex: 1, height: 38, borderRadius: 10, border: '1.5px solid var(--border)', textAlign: 'center', fontSize: 15, fontWeight: 700, background: set.voltooid ? 'var(--bg-subtle)' : 'var(--bg-card)', color: 'var(--text-1)', minWidth: 0 }}
                            />
                            {oef.heeft_gewicht && (
                              <>
                                <input
                                  type="number" min={0} step={0.5}
                                  value={set.gewicht_kg ?? ''}
                                  onChange={e => updateSet(oi, si, 'gewicht_kg', e.target.value === '' ? null : parseFloat(e.target.value))}
                                  placeholder="kg"
                                  disabled={set.voltooid}
                                  style={{ flex: 1, height: 38, borderRadius: 10, border: '1.5px solid var(--border)', textAlign: 'center', fontSize: 15, fontWeight: 700, background: set.voltooid ? 'var(--bg-subtle)' : 'var(--bg-card)', color: 'var(--text-1)', minWidth: 0 }}
                                />
                              </>
                            )}
                            <button
                              onClick={() => updateSet(oi, si, 'voltooid', !set.voltooid)}
                              style={{ width: 38, height: 38, borderRadius: 10, border: 'none', cursor: 'pointer', background: set.voltooid ? 'var(--mf-green)' : 'var(--bg-subtle)', color: set.voltooid ? '#fff' : 'var(--text-4)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              {set.voltooid ? <CheckCircle2 size={16} strokeWidth={2.5} /> : <Circle size={16} strokeWidth={1.8} />}
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => extraSet(oi)}
                        style={{ marginTop: 10, width: '100%', background: 'none', border: '1.5px dashed var(--border)', color: 'var(--text-4)', borderRadius: 10, padding: '8px 0', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      >
                        <Plus size={13} /> Extra set
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <button
              onClick={() => { setTimerActive(false); setScherm('afronden') }}
              style={{ marginTop: 20, width: '100%', background: 'var(--mf-orange)', color: '#fff', border: 'none', borderRadius: 14, padding: '14px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Trophy size={16} /> Training afronden
            </button>
          </>
        )}

        {/* ════════════════════════════════════════════════
            SCHERM: AFRONDEN
        ════════════════════════════════════════════════ */}
        {scherm === 'afronden' && gekozenTraining && (
          <>
            <div style={{ marginBottom: 20 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 4px', letterSpacing: '-0.03em' }}>Training afronden</h1>
              <p style={{ color: 'var(--text-4)', fontSize: 13, margin: 0 }}>
                {gekozenTraining.naam} · {fmt(timerSec)}
              </p>
            </div>

            {/* Samenvatting */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: '16px', marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 12 }}>Samenvatting</div>
              {oefeningen.map((oef, oi) => {
                const sets = oef.setsGedaan.filter(s => s.voltooid)
                if (!sets.length) return null
                return (
                  <div key={oi} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>{oef.naam}</div>
                    {sets.map((s, si) => (
                      <div key={si} style={{ fontSize: 12, color: 'var(--text-3)', paddingLeft: 12, lineHeight: 1.8 }}>
                        Set {si + 1}: {s.herhalingen || '—'} herh.{oef.heeft_gewicht && s.gewicht_kg !== null ? ` · ${s.gewicht_kg} kg` : oef.heeft_gewicht ? '' : ' · bodyweight'}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>

            {/* Notities */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: '16px', marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', display: 'block', marginBottom: 8 }}>Notities</label>
              <textarea
                value={notities}
                onChange={e => setNotities(e.target.value)}
                placeholder="Hoe voelde de training? Aandachtspunten voor volgende keer…"
                rows={3}
                style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: 10, padding: '10px 12px', fontSize: 13, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', color: 'var(--text-1)', background: 'var(--bg-app)' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setTimerActive(true); setScherm('actief') }}
                style={{ flex: 1, background: 'var(--bg-subtle)', color: 'var(--text-2)', border: 'none', borderRadius: 14, padding: '14px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <ArrowLeft size={14} /> Terug
              </button>
              <button
                onClick={slaOp}
                disabled={opslaan}
                style={{ flex: 2, background: opslaan ? 'var(--text-4)' : 'var(--mf-green)', color: '#fff', border: 'none', borderRadius: 14, padding: '14px 0', fontSize: 15, fontWeight: 700, cursor: opslaan ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <CheckCircle2 size={16} /> {opslaan ? 'Opslaan…' : 'Training opslaan'}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}

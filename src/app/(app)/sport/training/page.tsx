'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useId } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import {
  Dumbbell, Clock, CheckCircle2, Circle,
  Plus, ArrowLeft, Timer, Flame, Trophy, Lightbulb,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Progress } from '@/components/ui/Progress'
import { useToast } from '@/components/ui/Toast'
import { vitaEvent } from '@/lib/vita/events'

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

// ── Component ────────────────────────────────────────────────────────────────

export default function TrainingLoggerPage() {
  const router = useRouter()
  const { toast } = useToast()
  const fieldPrefix = useId()
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
      vitaEvent('habit_completed', { kind: 'training' })
      toast({ title: 'Training opgeslagen', description: 'Goed gedaan! Je sessie is gelogd.', variant: 'success' })
      setTimeout(() => router.push('/sport'), 1500)
    } catch {
      toast({ title: 'Fout bij opslaan', description: 'Probeer het opnieuw.', variant: 'error' })
      setOpslaan(false)
    }
  }

  if (laden) return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="mf-spinner" role="status" aria-label="Laden" />
    </div>
  )

  return (
    <div className="mf-mesh-bg" style={{ minHeight: '100vh', paddingBottom: 100 }}>
      <Navbar />

      <main style={{ maxWidth: 640, margin: '0 auto', padding: '20px 16px' }}>

        {/* ════════════════════════════════════════════════
            SCHERM: KIEZEN
        ════════════════════════════════════════════════ */}
        {scherm === 'kiezen' && schema && (
          <>
            <header style={{ marginBottom: 22 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 4px', letterSpacing: '-0.03em' }}>Training starten</h1>
              <p style={{ color: 'var(--text-3)', fontSize: 13, margin: 0 }}>{schema.naam}</p>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {schema.schema_json.map((dag, idx) => {
                const aanbevolen = idx === aanbevolenDag(schema.schema_json)
                return (
                  <Card key={idx} style={{
                    border: aanbevolen ? '2px solid var(--mentaforce-primary)' : '1px solid var(--border)',
                    overflow: 'hidden',
                    position: 'relative',
                  }}>
                    {aanbevolen && (
                      <div style={{ background: 'var(--mentaforce-primary)', color: 'var(--bg-app)', fontSize: 10, fontWeight: 700, padding: '4px 12px', letterSpacing: '0.06em' }}>
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-3)', justifyContent: 'flex-end' }}>
                            <Clock size={11} aria-hidden /> {dag.geschatte_duur} min
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-3)', justifyContent: 'flex-end', marginTop: 3 }}>
                            <Dumbbell size={11} aria-hidden /> {dag.oefeningen.length} oef.
                          </div>
                        </div>
                      </div>

                      {/* Spiergroepen */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                        {dag.spiergroepen.map((sg, si) => (
                          <Badge key={si} variant="neutral">{sg}</Badge>
                        ))}
                      </div>

                      {/* Oefeningen preview */}
                      <div style={{ marginBottom: 14 }}>
                        {dag.oefeningen.slice(0, 4).map((o, oi) => (
                          <div key={oi} style={{ fontSize: 12, color: 'var(--text-2)', padding: '3px 0', borderBottom: oi < Math.min(dag.oefeningen.length, 4) - 1 ? '1px solid var(--border)' : 'none', display: 'flex', justifyContent: 'space-between' }}>
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
                        <p style={{ fontSize: 12, color: 'var(--text-2)', fontStyle: 'italic', margin: '0 0 14px', lineHeight: 1.5 }}>
                          &ldquo;{dag.coaching_tekst}&rdquo;
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => startTraining(dag)}
                        className="mf-pressable"
                        style={{
                          width: '100%',
                          background: aanbevolen ? 'var(--mentaforce-primary)' : 'var(--bg-subtle)',
                          color: aanbevolen ? 'var(--bg-app)' : 'var(--text-1)',
                          border: aanbevolen ? 'none' : '1px solid var(--border-strong)',
                          borderRadius: 'var(--radius-btn)',
                          padding: '12px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        }}
                      >
                        <Flame size={15} aria-hidden /> Start training
                      </button>
                    </div>
                  </Card>
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
            {/* Sticky header — safe-area-bewust, blijft onder de topbar plakken */}
            <div style={{
              position: 'sticky', top: 'calc(var(--topbar-h, 56px) + 8px)', zIndex: 20,
              background: 'var(--bg-card)', border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: 16,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              boxShadow: 'var(--shadow-card)',
            }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, marginBottom: 4 }}>{gekozenTraining.naam}</div>
                <div style={{ fontSize: 13, color: 'var(--mentaforce-primary)', fontWeight: 700, marginBottom: 6 }}>
                  {voltooideOef}/{oefeningen.length} oefeningen
                </div>
                <div style={{ maxWidth: 120 }}>
                  <Progress
                    value={oefeningen.length ? (voltooideOef / oefeningen.length) * 100 : 0}
                    ariaLabel={`Voortgang: ${voltooideOef} van ${oefeningen.length} oefeningen`}
                    thickness={3}
                  />
                </div>
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--mf-orange)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                  {fmt(timerSec)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-4)', justifyContent: 'center' }}>
                  <Timer size={9} aria-hidden /> verstreken
                </div>
              </div>
            </div>

            {/* Oefening kaarten */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {oefeningen.map((oef, oi) => {
                const alles = oef.setsGedaan.every(s => s.voltooid)
                return (
                  <Card key={oi} style={{
                    border: alles ? '2px solid var(--mentaforce-primary)' : '1px solid var(--border)',
                    overflow: 'hidden',
                  }}>

                    {/* ── Afbeelding ── */}
                    <div style={{ position: 'relative', height: 180, background: 'var(--bg-subtle)', overflow: 'hidden' }}>
                      {oef.gif_url ? (
                        <img
                          src={oef.gif_url}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                          <Dumbbell size={36} strokeWidth={1.2} style={{ color: 'var(--text-4)' }} aria-hidden />
                          {oef.laadt_img && (
                            <div style={{ fontSize: 11, color: 'var(--text-4)' }}>Afbeelding laden…</div>
                          )}
                        </div>
                      )}
                      {/* Overlay: naam + sets-doel */}
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        background: 'linear-gradient(transparent, color-mix(in srgb, var(--bg-app) 88%, transparent))',
                        padding: '24px 14px 12px',
                      }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
                          {alles && <CheckCircle2 size={14} strokeWidth={2.5} style={{ display: 'inline', marginRight: 6, color: 'var(--mentaforce-primary)', verticalAlign: 'middle' }} aria-hidden />}
                          {oef.naam}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                          {oef.doelSets} sets × {oef.doelHerhalingen} herhalingen
                          {!oef.heeft_gewicht && ' · bodyweight'}
                        </div>
                      </div>
                      {/* Voortgang bolletjes */}
                      <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 4 }} aria-hidden>
                        {oef.setsGedaan.map((s, si) => (
                          <div key={si} style={{ width: 8, height: 8, borderRadius: '50%', background: s.voltooid ? 'var(--mentaforce-primary)' : 'color-mix(in srgb, var(--text-1) 35%, transparent)', border: '1px solid color-mix(in srgb, var(--text-1) 55%, transparent)' }} />
                        ))}
                      </div>
                    </div>

                    <div style={{ padding: '14px 14px 16px' }}>
                      {/* Uitvoeringstip */}
                      {oef.uitvoering_tip && (
                        <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55, marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
                          {oef.uitvoering_tip}
                          {oef.heeft_gewicht && oef.gewicht_tip && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, color: 'var(--mf-amber)', fontWeight: 600 }}>
                              <Lightbulb size={13} aria-hidden /> {oef.gewicht_tip}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Set rijen */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {oef.setsGedaan.map((set, si) => {
                          const repId = `${fieldPrefix}-${oi}-${si}-reps`
                          const kgId = `${fieldPrefix}-${oi}-${si}-kg`
                          return (
                            <div key={si} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                              <div style={{ width: 28, height: 38, borderRadius: 8, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text-2)', flexShrink: 0 }} aria-hidden>
                                {si + 1}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <label htmlFor={repId} style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
                                  {oef.naam} set {si + 1} herhalingen
                                </label>
                                <Input
                                  id={repId}
                                  type="number"
                                  inputMode="numeric"
                                  min={1}
                                  max={999}
                                  value={set.herhalingen || ''}
                                  onChange={e => updateSet(oi, si, 'herhalingen', parseInt(e.target.value) || 0)}
                                  placeholder={oef.doelHerhalingen}
                                  disabled={set.voltooid}
                                  style={{ height: 38, padding: '0 8px', textAlign: 'center', fontSize: 15, fontWeight: 700, opacity: set.voltooid ? 0.7 : 1 }}
                                />
                              </div>
                              {oef.heeft_gewicht && (
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <label htmlFor={kgId} style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
                                    {oef.naam} set {si + 1} gewicht in kilogram
                                  </label>
                                  <Input
                                    id={kgId}
                                    type="number"
                                    inputMode="decimal"
                                    min={0}
                                    step={0.5}
                                    value={set.gewicht_kg ?? ''}
                                    onChange={e => updateSet(oi, si, 'gewicht_kg', e.target.value === '' ? null : parseFloat(e.target.value))}
                                    placeholder="kg"
                                    disabled={set.voltooid}
                                    style={{ height: 38, padding: '0 8px', textAlign: 'center', fontSize: 15, fontWeight: 700, opacity: set.voltooid ? 0.7 : 1 }}
                                  />
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => updateSet(oi, si, 'voltooid', !set.voltooid)}
                                aria-pressed={set.voltooid}
                                aria-label={`Set ${si + 1} ${set.voltooid ? 'ongedaan maken' : 'als voltooid markeren'}`}
                                className="mf-pressable"
                                style={{ width: 38, height: 38, borderRadius: 10, border: 'none', cursor: 'pointer', background: set.voltooid ? 'var(--mentaforce-primary)' : 'var(--bg-subtle)', color: set.voltooid ? 'var(--bg-app)' : 'var(--text-3)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                {set.voltooid ? <CheckCircle2 size={16} strokeWidth={2.5} aria-hidden /> : <Circle size={16} strokeWidth={1.8} aria-hidden />}
                              </button>
                            </div>
                          )
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() => extraSet(oi)}
                        className="mf-pressable"
                        style={{ marginTop: 10, width: '100%', background: 'none', border: '1.5px dashed var(--border-strong)', color: 'var(--text-3)', borderRadius: 10, padding: '8px 0', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      >
                        <Plus size={13} aria-hidden /> Extra set
                      </button>
                    </div>
                  </Card>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => { setTimerActive(false); setScherm('afronden') }}
              className="mf-pressable"
              style={{ marginTop: 20, width: '100%', background: 'var(--mf-orange)', color: 'var(--bg-app)', border: 'none', borderRadius: 'var(--radius-md)', padding: '14px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Trophy size={16} aria-hidden /> Training afronden
            </button>
          </>
        )}

        {/* ════════════════════════════════════════════════
            SCHERM: AFRONDEN
        ════════════════════════════════════════════════ */}
        {scherm === 'afronden' && gekozenTraining && (
          <>
            <header style={{ marginBottom: 20 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 4px', letterSpacing: '-0.03em' }}>Training afronden</h1>
              <p style={{ color: 'var(--text-3)', fontSize: 13, margin: 0 }}>
                {gekozenTraining.naam} · {fmt(timerSec)}
              </p>
            </header>

            {/* Samenvatting */}
            <Card style={{ padding: '16px', marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 12 }}>Samenvatting</div>
              {oefeningen.map((oef, oi) => {
                const sets = oef.setsGedaan.filter(s => s.voltooid)
                if (!sets.length) return null
                return (
                  <div key={oi} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>{oef.naam}</div>
                    {sets.map((s, si) => (
                      <div key={si} style={{ fontSize: 12, color: 'var(--text-2)', paddingLeft: 12, lineHeight: 1.8 }}>
                        Set {si + 1}: {s.herhalingen || '—'} herh.{oef.heeft_gewicht && s.gewicht_kg !== null ? ` · ${s.gewicht_kg} kg` : oef.heeft_gewicht ? '' : ' · bodyweight'}
                      </div>
                    ))}
                  </div>
                )
              })}
            </Card>

            {/* Notities */}
            <Card style={{ padding: '16px', marginBottom: 20 }}>
              <Field label="Notities" htmlFor="training-notities">
                <Textarea
                  id="training-notities"
                  value={notities}
                  onChange={e => setNotities(e.target.value)}
                  placeholder="Hoe voelde de training? Aandachtspunten voor volgende keer…"
                  rows={3}
                />
              </Field>
            </Card>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => { setTimerActive(true); setScherm('actief') }}
                className="mf-pressable"
                style={{ flex: 1, background: 'var(--bg-subtle)', color: 'var(--text-2)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', padding: '14px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <ArrowLeft size={14} aria-hidden /> Terug
              </button>
              <button
                type="button"
                onClick={slaOp}
                disabled={opslaan}
                className="mf-pressable"
                style={{ flex: 2, background: opslaan ? 'var(--bg-subtle)' : 'var(--mentaforce-primary)', color: opslaan ? 'var(--text-4)' : 'var(--bg-app)', border: 'none', borderRadius: 'var(--radius-md)', padding: '14px 0', fontSize: 15, fontWeight: 700, cursor: opslaan ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <CheckCircle2 size={16} aria-hidden /> {opslaan ? 'Opslaan…' : 'Training opslaan'}
              </button>
            </div>
          </>
        )}

      </main>
    </div>
  )
}

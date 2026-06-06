'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

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
  tipIngeklapt: boolean
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
  dag: number; naam: string; spiergroepen: string[]; coaching_tekst: string; geschatte_duur: number
  oefeningen: OefeningData[]
}
type FitnessSchema = { id: string; naam: string; schema_json: Trainingsdag[] }
type Scherm = 'kiezen' | 'actief' | 'afronden'

function formatTimer(sec: number): string {
  const m = Math.floor(sec / 60).toString().padStart(2, '0')
  const s = (sec % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function aanbevolenDag(schema: Trainingsdag[]): number {
  const dagVanWeek = new Date().getDay()
  const werkdag = dagVanWeek === 0 ? 6 : dagVanWeek - 1
  return Math.min(werkdag % schema.length, schema.length - 1)
}

export default function TrainingLoggerPage() {
  const router = useRouter()
  const [laden, setLaden] = useState(true)
  const [schema, setSchema] = useState<FitnessSchema | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [scherm, setScherm] = useState<Scherm>('kiezen')
  const [gekozenTraining, setGekozenTraining] = useState<Trainingsdag | null>(null)
  const [oefeningen, setOefeningen] = useState<OefeningState[]>([])
  const [timerSec, setTimerSec] = useState(0)
  const [timerActive, setTimerActive] = useState(false)
  const [notities, setNotities] = useState('')
  const [opslaan, setOpslaan] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [oefenImages, setOefenImages] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!timerActive) return
    const iv = setInterval(() => setTimerSec(s => s + 1), 1000)
    return () => clearInterval(iv)
  }, [timerActive])

  useEffect(() => {
    async function laadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data } = await supabase
        .from('fitness_schemas')
        .select('id, naam, schema_json')
        .eq('user_id', user.id)
        .eq('actief', true)
        .maybeSingle()

      if (!data) {
        router.push('/sport/genereer')
        return
      }
      setSchema(data as FitnessSchema)
      setLaden(false)
    }
    laadData()
  }, [router])

  const startTraining = useCallback((training: Trainingsdag) => {
    setGekozenTraining(training)
    setOefeningen(
      training.oefeningen.map(oef => ({
        naam: oef.naam,
        naam_en: oef.naam_en ?? oef.naam,
        doelSets: oef.sets,
        doelHerhalingen: oef.herhalingen,
        heeft_gewicht: oef.heeft_gewicht ?? true,
        gewicht_tip: oef.gewicht_tip,
        uitvoering_tip: oef.uitvoering_tip,
        tipIngeklapt: true,
        setsGedaan: Array.from({ length: oef.sets }, () => ({
          herhalingen: 0,
          gewicht_kg: null,
          voltooid: false,
        })),
      }))
    )

    // Laad afbeeldingen voor elke oefening op de achtergrond
    setOefenImages({})
    training.oefeningen.forEach(oef => {
      const zoekNaam = oef.naam_en ?? oef.naam
      fetch(`/api/sport/oefening-image?naam=${encodeURIComponent(zoekNaam)}`)
        .then(r => r.ok ? r.json() : null)
        .then((data: { gif_url?: string } | null) => {
          if (data?.gif_url) {
            setOefenImages(prev => ({ ...prev, [oef.naam]: data.gif_url! }))
          }
        })
        .catch(() => undefined)
    })

    setTimerSec(0)
    setTimerActive(true)
    setScherm('actief')
  }, [])

  const updateSet = (oefeningIdx: number, setIdx: number, veld: 'herhalingen' | 'gewicht_kg' | 'voltooid', waarde: number | boolean | null) => {
    setOefeningen(prev => prev.map((oef, oi) => {
      if (oi !== oefeningIdx) return oef
      const nieuweSets = oef.setsGedaan.map((set, si) => {
        if (si !== setIdx) return set
        return { ...set, [veld]: waarde }
      })
      return { ...oef, setsGedaan: nieuweSets }
    }))
  }

  const extraSetToevoegen = (oefeningIdx: number) => {
    setOefeningen(prev => prev.map((oef, oi) => {
      if (oi !== oefeningIdx) return oef
      return {
        ...oef,
        setsGedaan: [...oef.setsGedaan, { herhalingen: 0, gewicht_kg: null, voltooid: false }],
      }
    }))
  }

  const toggleTip = (oefeningIdx: number) => {
    setOefeningen(prev => prev.map((oef, oi) => {
      if (oi !== oefeningIdx) return oef
      return { ...oef, tipIngeklapt: !oef.tipIngeklapt }
    }))
  }

  const oefeningenVoltooid = oefeningen.filter(oef => oef.setsGedaan.some(s => s.voltooid)).length

  const slaOpTraining = async () => {
    if (!userId || !schema || !gekozenTraining) return
    setOpslaan(true)

    try {
      const { data: log, error: logErr } = await supabase
        .from('training_logs')
        .insert({
          user_id: userId,
          schema_id: schema.id,
          datum: new Date().toISOString().split('T')[0],
          naam: gekozenTraining.naam,
          duur_minuten: Math.round(timerSec / 60),
          notities: notities || null,
        })
        .select('id')
        .single()

      if (logErr || !log) throw logErr

      const oefeningRows = oefeningen.flatMap(oef =>
        oef.setsGedaan
          .filter(set => set.voltooid || set.herhalingen > 0)
          .map((set, i) => ({
            training_log_id: log.id,
            user_id: userId,
            oefening_naam: oef.naam,
            set_nummer: i + 1,
            herhalingen: set.herhalingen || null,
            gewicht_kg: set.gewicht_kg,
          }))
      )

      if (oefeningRows.length > 0) {
        await supabase.from('oefening_logs').insert(oefeningRows)
      }

      setTimerActive(false)
      setToast('Training opgeslagen!')
      setTimeout(() => router.push('/sport'), 1500)
    } catch {
      setToast('Fout bij opslaan, probeer opnieuw')
      setOpslaan(false)
    }
  }

  if (laden) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#888', fontSize: 16 }}>Laden...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', paddingBottom: 80 }}>
      <Navbar />

      {toast && <div style={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', background: '#1D9E75', color: '#fff', padding: '12px 24px', borderRadius: 12, fontWeight: 600, fontSize: 15, zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>{toast}</div>}

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px' }}>

        {scherm === 'kiezen' && schema && (
          <>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary, #111)', margin: 0 }}>
                Training starten
              </h1>
              <p style={{ color: '#888', fontSize: 14, marginTop: 6 }}>
                {schema.naam} — kies welke training je vandaag doet
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {schema.schema_json.map((training, idx) => {
                const isAanbevolen = idx === aanbevolenDag(schema.schema_json)
                return (
                  <div key={idx} style={{
                    background: '#fff',
                    borderRadius: 16,
                    padding: 20,
                    border: isAanbevolen ? '2px solid #1D9E75' : '1px solid #eee',
                    position: 'relative',
                  }}>
                    {isAanbevolen && (
                      <div style={{
                        position: 'absolute', top: -12, left: 20,
                        background: '#1D9E75', color: '#fff',
                        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                        letterSpacing: '0.5px',
                      }}>
                        AANBEVOLEN VANDAAG
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <span style={{ fontSize: 12, color: '#aaa', fontWeight: 500 }}>Dag {training.dag}</span>
                        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111', margin: '2px 0 6px' }}>
                          {training.naam}
                        </h2>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {training.spiergroepen.map((sg, i) => (
                            <span key={i} style={{
                              background: '#f3f4f6', color: '#555', fontSize: 12,
                              padding: '3px 10px', borderRadius: 20, fontWeight: 500,
                            }}>
                              {sg}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div style={{
                        background: '#f9fafb', borderRadius: 10, padding: '8px 14px',
                        textAlign: 'center', flexShrink: 0,
                      }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#F97316' }}>
                          {training.geschatte_duur}
                        </div>
                        <div style={{ fontSize: 11, color: '#aaa' }}>min</div>
                      </div>
                    </div>

                    {training.coaching_tekst && (
                      <p style={{ fontSize: 13, color: '#666', fontStyle: 'italic', margin: '0 0 14px', lineHeight: 1.5 }}>
                        "{training.coaching_tekst}"
                      </p>
                    )}

                    <div style={{ fontSize: 12, color: '#aaa', marginBottom: 14 }}>
                      {training.oefeningen.length} oefeningen
                    </div>

                    <button
                      onClick={() => startTraining(training)}
                      style={{
                        width: '100%', background: isAanbevolen ? '#1D9E75' : '#111',
                        color: '#fff', border: 'none', borderRadius: 12,
                        padding: '12px 0', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      Start deze training
                    </button>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {scherm === 'actief' && gekozenTraining && (
          <>
            <div style={{
              background: '#fff', borderRadius: 16, padding: 20, marginBottom: 20,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: 12, color: '#aaa', fontWeight: 500 }}>Actieve training</div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111', margin: '2px 0' }}>
                  {gekozenTraining.naam}
                </h1>
                <div style={{ fontSize: 13, color: '#1D9E75', fontWeight: 500 }}>
                  {oefeningenVoltooid} van {oefeningen.length} oefeningen
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#F97316', fontVariantNumeric: 'tabular-nums' }}>
                  {formatTimer(timerSec)}
                </div>
                <div style={{ fontSize: 11, color: '#aaa' }}>verstreken</div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ height: 6, background: '#f3f4f6', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 6, background: '#1D9E75',
                  width: `${oefeningen.length ? (oefeningenVoltooid / oefeningen.length) * 100 : 0}%`,
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {oefeningen.map((oef, oi) => {
                const alVoltooid = oef.setsGedaan.every(s => s.voltooid)
                return (
                  <div key={oi} style={{
                    background: '#fff', borderRadius: 16, padding: 20,
                    border: alVoltooid ? '2px solid #1D9E75' : '1px solid #eee',
                    opacity: alVoltooid ? 0.85 : 1,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111', margin: 0 }}>
                        {alVoltooid && <span style={{ color: '#1D9E75', marginRight: 6 }}>✓</span>}
                        {oef.naam}
                      </h3>
                      <span style={{ fontSize: 12, color: '#aaa' }}>
                        {oef.doelSets}×{oef.doelHerhalingen}
                      </span>
                    </div>

                    <button
                      onClick={() => toggleTip(oi)}
                      style={{
                        background: 'none', border: 'none', color: '#aaa', fontSize: 12,
                        cursor: 'pointer', padding: '4px 0 10px', display: 'block',
                      }}
                    >
                      {oef.tipIngeklapt ? '▸ Uitvoeringstip' : '▾ Uitvoeringstip'}
                    </button>

                    {!oef.tipIngeklapt && (
                      <div style={{
                        background: '#f9fafb', borderRadius: 8, padding: '8px 12px',
                        fontSize: 13, color: '#666', marginBottom: 12, lineHeight: 1.5,
                      }}>
                        {oefenImages[oef.naam] && (
                          <img
                            src={oefenImages[oef.naam]}
                            alt={oef.naam}
                            style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 6, marginBottom: 8 }}
                          />
                        )}
                        {oef.uitvoering_tip}
                        {oef.heeft_gewicht && oef.gewicht_tip && (
                          <div style={{ marginTop: 4, color: '#F97316', fontWeight: 500 }}>
                            💡 {oef.gewicht_tip}
                          </div>
                        )}
                      </div>
                    )}

                    {!oef.heeft_gewicht && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        background: '#f0fdf4', color: '#1D9E75', borderRadius: 8,
                        padding: '4px 10px', fontSize: 12, fontWeight: 600, marginBottom: 10,
                      }}>
                        💪 Bodyweight oefening
                      </div>
                    )}

                    {oef.setsGedaan.map((set, si) => (
                      <div key={si} style={{
                        display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8,
                        opacity: set.voltooid ? 0.6 : 1,
                      }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, background: '#f3f4f6',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 600, color: '#555', flexShrink: 0,
                        }}>
                          {si + 1}
                        </div>
                        <input type="number" min={1} max={100} value={set.herhalingen || ''} onChange={e => updateSet(oi, si, 'herhalingen', parseInt(e.target.value) || 0)} placeholder={oef.doelHerhalingen} disabled={set.voltooid} style={{ flex: 1, height: 36, borderRadius: 8, border: '1.5px solid #e5e7eb', textAlign: 'center', fontSize: 15, fontWeight: 600, background: set.voltooid ? '#f9fafb' : '#fff' }} />
                        {oef.heeft_gewicht && (
                          <input type="number" min={0} step={0.5} value={set.gewicht_kg ?? ''} onChange={e => updateSet(oi, si, 'gewicht_kg', e.target.value === '' ? null : parseFloat(e.target.value))} placeholder="kg" disabled={set.voltooid} style={{ flex: 1, height: 36, borderRadius: 8, border: '1.5px solid #e5e7eb', textAlign: 'center', fontSize: 15, fontWeight: 600, background: set.voltooid ? '#f9fafb' : '#fff' }} />
                        )}
                        <button
                          onClick={() => updateSet(oi, si, 'voltooid', !set.voltooid)}
                          style={{
                            width: 40, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer',
                            background: set.voltooid ? '#1D9E75' : '#f3f4f6',
                            color: set.voltooid ? '#fff' : '#aaa',
                            fontSize: 16, fontWeight: 700, flexShrink: 0,
                          }}>✓</button>
                      </div>
                    ))}
                    <button
                      onClick={() => extraSetToevoegen(oi)}
                      style={{
                        background: 'none', border: '1.5px dashed #e5e7eb', color: '#aaa',
                        borderRadius: 8, width: '100%', padding: '8px 0', fontSize: 13,
                        cursor: 'pointer', marginTop: 4,
                      }}
                    >
                      + Extra set toevoegen
                    </button>
                  </div>
                )
              })}
            </div>

            <button
              onClick={() => { setTimerActive(false); setScherm('afronden') }}
              style={{
                marginTop: 24, width: '100%', background: '#F97316', color: '#fff',
                border: 'none', borderRadius: 14, padding: '14px 0', fontSize: 16,
                fontWeight: 700, cursor: 'pointer',
              }}
            >
              Training afronden →
            </button>
          </>
        )}

        {scherm === 'afronden' && gekozenTraining && (
          <>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111', margin: 0 }}>
                Training afronden
              </h1>
              <p style={{ color: '#888', fontSize: 14, marginTop: 6 }}>
                {gekozenTraining.naam} · {formatTimer(timerSec)}
              </p>
            </div>

            <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111', marginTop: 0, marginBottom: 14 }}>
                Samenvatting
              </h3>
              {oefeningen.map((oef, oi) => {
                const voltooidesets = oef.setsGedaan.filter(s => s.voltooid)
                if (voltooidesets.length === 0) return null
                return (
                  <div key={oi} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 4 }}>
                      {oef.naam}
                    </div>
                    {voltooidesets.map((set, si) => (
                      <div key={si} style={{ fontSize: 13, color: '#666', marginLeft: 12 }}>
                        Set {si + 1}: {set.herhalingen} herh.
                        {oef.heeft_gewicht
                          ? (set.gewicht_kg !== null ? ` · ${set.gewicht_kg} kg` : '')
                          : ' · bodyweight'
                        }
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>

            <div style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 24 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: '#111', display: 'block', marginBottom: 8 }}>
                Notities (optioneel)
              </label>
              <textarea
                value={notities}
                onChange={e => setNotities(e.target.value)}
                placeholder="Hoe voelde de training? Aandachtspunten voor volgende keer..."
                rows={4}
                style={{
                  width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 10,
                  padding: '10px 12px', fontSize: 14, resize: 'vertical',
                  fontFamily: 'inherit', boxSizing: 'border-box', color: '#111',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => { setTimerActive(true); setScherm('actief') }}
                style={{
                  flex: 1, background: '#f3f4f6', color: '#555', border: 'none',
                  borderRadius: 14, padding: '14px 0', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                }}
              >
                ← Terug
              </button>
              <button
                onClick={slaOpTraining}
                disabled={opslaan}
                style={{
                  flex: 2, background: opslaan ? '#aaa' : '#1D9E75', color: '#fff', border: 'none',
                  borderRadius: 14, padding: '14px 0', fontSize: 16, fontWeight: 700,
                  cursor: opslaan ? 'not-allowed' : 'pointer',
                }}
              >
                {opslaan ? 'Opslaan...' : 'Training opslaan ✓'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import HrShell from '@/components/HrShell'
import WeekRoosterView from '@/components/WeekRoosterView'
import { type Dienst } from '@/components/DienstKaart'

type Profiel = { id: string; naam: string; afdeling?: string | null; functie?: string | null }
type RoosterInfo = { id: string; naam: string; week_start: string }
type DienstForm = {
  user_id: string
  datum: string
  start_tijd: string
  eind_tijd: string
  rol_label: string
  notitie: string
}

const LEEG_FORM: DienstForm = {
  user_id: '',
  datum: '',
  start_tijd: '09:00',
  eind_tijd: '17:00',
  rol_label: '',
  notitie: '',
}

function weekDagen(weekStart: string): string[] {
  const ma = new Date(weekStart)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(ma)
    d.setDate(ma.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

const DAGAMEN = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag']

export default function RoosterDetailPage() {
  const router = useRouter()
  const params = useParams()
  const roosterId = params.id as string

  const [rooster, setRooster] = useState<RoosterInfo | null>(null)
  const [medewerkers, setMedewerkers] = useState<Profiel[]>([])
  const [diensten, setDiensten] = useState<(Dienst & { user_naam?: string })[]>([])
  const [geladen, setGeladen] = useState(false)
  const [form, setForm] = useState<DienstForm>(LEEG_FORM)
  const [formOpen, setFormOpen] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')
  const [verwijderBezig, setVerwijderBezig] = useState<string | null>(null)

  async function laadDiensten(bedrijfId: string) {
    const { data } = await supabase
      .from('rooster_diensten')
      .select('id, datum, start_tijd, eind_tijd, rol_label, notitie, user_id')
      .eq('rooster_id', roosterId)
      .order('datum', { ascending: true })

    // Koppel namen
    const { data: profielen } = await supabase
      .from('profiles')
      .select('id, naam')
      .eq('bedrijf_id', bedrijfId)

    const naamMap: Record<string, string> = {}
    profielen?.forEach(p => { naamMap[p.id] = p.naam })

    setDiensten((data ?? []).map(d => ({
      ...d,
      user_naam: naamMap[d.user_id] ?? 'Onbekend',
    })))
  }

  useEffect(() => {
    async function laad() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profiel } = await supabase
        .from('profiles').select('rol, bedrijf_id').eq('id', user.id).single()
      if (!profiel || !['hr', 'admin'].includes(profiel.rol ?? '')) {
        router.push('/home'); return
      }

      const { data: r } = await supabase
        .from('roosters').select('id, naam, week_start').eq('id', roosterId).single()
      if (!r) { router.push('/hr/roosters'); return }
      setRooster(r)

      const { data: meds } = await supabase
        .from('profiles')
        .select('id, naam, afdeling, functie')
        .eq('bedrijf_id', profiel.bedrijf_id)
        .eq('rol', 'medewerker')
        .order('naam', { ascending: true })
      setMedewerkers(meds ?? [])

      await laadDiensten(profiel.bedrijf_id)
      setForm(prev => ({ ...prev, datum: r.week_start }))
      setGeladen(true)
    }
    laad()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roosterId])

  async function voegDienstToe() {
    if (!form.user_id) { setFout('Kies een medewerker.'); return }
    if (!form.datum) { setFout('Kies een datum.'); return }
    if (form.start_tijd >= form.eind_tijd) { setFout('Eindtijd moet na starttijd zijn.'); return }
    setBezig(true); setFout('')
    const { error } = await supabase.from('rooster_diensten').insert({
      rooster_id: roosterId,
      user_id: form.user_id,
      datum: form.datum,
      start_tijd: form.start_tijd,
      eind_tijd: form.eind_tijd,
      rol_label: form.rol_label || null,
      notitie: form.notitie || null,
    })
    if (error) { setFout('Opslaan mislukt: ' + error.message); setBezig(false); return }
    const { data: profiel } = await supabase
      .from('profiles').select('bedrijf_id').eq('id', form.user_id).single()
    await laadDiensten(profiel?.bedrijf_id ?? '')
    setForm(prev => ({ ...LEEG_FORM, datum: prev.datum }))
    setFormOpen(false)
    setBezig(false)
  }

  async function verwijderDienst(id: string) {
    setVerwijderBezig(id)
    await supabase.from('rooster_diensten').delete().eq('id', id)
    setDiensten(prev => prev.filter(d => d.id !== id))
    setVerwijderBezig(null)
  }

  if (!geladen || !rooster) {
    return (
      <HrShell>
        <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>Laden...</div>
      </HrShell>
    )
  }

  const dagen = weekDagen(rooster.week_start)

  return (
    <HrShell>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 16px' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 13, color: '#6B7280' }}>
          <button onClick={() => router.push('/hr/roosters')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 0 }}>
            Roosters
          </button>
          <span>/</span>
          <span style={{ color: '#111827', fontWeight: 500 }}>{rooster.naam}</span>
        </div>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>{rooster.naam}</h1>
            <p style={{ color: '#6B7280', fontSize: 13, marginTop: 3 }}>
              {new Date(rooster.week_start).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
              {' – '}
              {(() => { const z = new Date(rooster.week_start); z.setDate(z.getDate() + 6); return z.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) })()}
            </p>
          </div>
          <button
            onClick={() => { setFormOpen(true); setFout('') }}
            style={{
              background: '#1D9E75',
              color: '#fff',
              padding: '9px 18px',
              borderRadius: 10,
              border: 'none',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + Dienst toevoegen
          </button>
        </div>

        {/* Week grid */}
        <div className="rounded-2xl border border-gray-100" style={{ background: '#fff', padding: 20, marginBottom: 24 }}>
          <WeekRoosterView
            diensten={diensten}
            weekStart={new Date(rooster.week_start)}
            toonNaam={true}
          />
        </div>

        {/* Diensten lijst per dag */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {dagen.map((dag, i) => {
            const dagDiensten = diensten.filter(d => d.datum === dag)
            return (
              <div key={dag} className="rounded-2xl border border-gray-100" style={{ background: '#fff', padding: '14px 18px' }}>
                <div style={{ fontWeight: 600, color: '#374151', fontSize: 14, marginBottom: dagDiensten.length > 0 ? 10 : 0 }}>
                  {DAGAMEN[i]} <span style={{ color: '#9CA3AF', fontWeight: 400, fontSize: 12 }}>{new Date(dag).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}</span>
                </div>
                {dagDiensten.length === 0 ? (
                  <div style={{ color: '#D1D5DB', fontSize: 12 }}>Geen diensten</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {dagDiensten.map(d => (
                      <div
                        key={d.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: '#F9FAFB',
                          borderRadius: 8,
                          padding: '8px 12px',
                        }}
                      >
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, color: '#1D9E75', fontSize: 13, minWidth: 90 }}>
                            {d.start_tijd.slice(0, 5)}–{d.eind_tijd.slice(0, 5)}
                          </span>
                          <span style={{ color: '#111827', fontSize: 13 }}>{d.user_naam}</span>
                          {d.rol_label && <span style={{ color: '#9CA3AF', fontSize: 11 }}>{d.rol_label}</span>}
                          {d.notitie && <span style={{ color: '#9CA3AF', fontSize: 11, fontStyle: 'italic' }}>{d.notitie}</span>}
                        </div>
                        <button
                          onClick={() => verwijderDienst(d.id)}
                          disabled={verwijderBezig === d.id}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: 13, padding: '2px 6px' }}
                        >
                          {verwijderBezig === d.id ? '...' : '✕'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Dienst toevoegen modal */}
        {formOpen && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
          }}>
            <div className="rounded-2xl" style={{ background: '#fff', width: '100%', maxWidth: 480, padding: 28, margin: '0 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>Dienst toevoegen</h2>
                <button onClick={() => setFormOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9CA3AF' }}>✕</button>
              </div>

              {/* Medewerker */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Medewerker</label>
                <select
                  value={form.user_id}
                  onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="">Kies medewerker...</option>
                  {medewerkers.map(m => (
                    <option key={m.id} value={m.id}>{m.naam}{m.afdeling ? ` (${m.afdeling})` : ''}</option>
                  ))}
                </select>
              </div>

              {/* Datum */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Datum</label>
                <select
                  value={form.datum}
                  onChange={e => setForm(f => ({ ...f, datum: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="">Kies dag...</option>
                  {dagen.map((d, i) => (
                    <option key={d} value={d}>
                      {DAGAMEN[i]} {new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tijden */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Starttijd</label>
                  <input
                    type="time"
                    value={form.start_tijd}
                    onChange={e => setForm(f => ({ ...f, start_tijd: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Eindtijd</label>
                  <input
                    type="time"
                    value={form.eind_tijd}
                    onChange={e => setForm(f => ({ ...f, eind_tijd: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Rol label */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                  Rol / label <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(optioneel)</span>
                </label>
                <input
                  type="text"
                  value={form.rol_label}
                  onChange={e => setForm(f => ({ ...f, rol_label: e.target.value }))}
                  placeholder="bijv. Kassa, Magazijn, Support..."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Notitie */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                  Notitie <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(optioneel)</span>
                </label>
                <input
                  type="text"
                  value={form.notitie}
                  onChange={e => setForm(f => ({ ...f, notitie: e.target.value }))}
                  placeholder="Extra info voor de medewerker..."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {fout && (
                <div style={{ background: '#FCEBEB', color: '#A32D2D', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}>
                  {fout}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setFormOpen(false)}
                  style={{ flex: 1, padding: 11, borderRadius: 10, border: '1.5px solid #E5E7EB', background: '#fff', color: '#374151', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
                >
                  Annuleren
                </button>
                <button
                  onClick={voegDienstToe}
                  disabled={bezig}
                  style={{ flex: 2, padding: 11, borderRadius: 10, border: 'none', background: bezig ? '#9CA3AF' : '#1D9E75', color: '#fff', fontSize: 14, fontWeight: 600, cursor: bezig ? 'not-allowed' : 'pointer' }}
                >
                  {bezig ? 'Opslaan...' : 'Dienst opslaan'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </HrShell>
  )
}

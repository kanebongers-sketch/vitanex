'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export type Actiepunt = {
  tekst: string
  gedaan: boolean
  deadline: string | null
}

export type Gesprek = {
  id?: string
  medewerker_id: string
  datum: string
  type: 'functionering' | 'beoordeling' | 'welzijn' | 'overig'
  onderwerp: string
  notities_intern: string
  samenvatting_medewerker: string
  actiepunten: Actiepunt[]
  status: 'gepland' | 'afgerond' | 'geannuleerd'
  followup_datum: string | null
}

type Medewerker = { id: string; naam: string }

type Props = {
  gesprek?: Partial<Gesprek> | null
  bedrijfId: string
  hrUserId: string
  medewerkers: Medewerker[]
  onClose: () => void
  onSaved: () => void
}

const ACCENT = '#1D9E75'
const TYPE_OPTIES = [
  { value: 'functionering', label: 'Functioneringsgesprek' },
  { value: 'beoordeling',   label: 'Beoordelingsgesprek' },
  { value: 'welzijn',       label: 'Welzijnsgesprek' },
  { value: 'overig',        label: 'Overig' },
]

export default function GesprekModal({ gesprek, bedrijfId, hrUserId, medewerkers, onClose, onSaved }: Props) {
  const isNieuw = !gesprek?.id

  const [medewerkerId, setMedewerkerId] = useState(gesprek?.medewerker_id ?? '')
  const [datum, setDatum] = useState(gesprek?.datum ?? new Date().toISOString().slice(0, 10))
  const [type, setType] = useState<Gesprek['type']>(gesprek?.type ?? 'functionering')
  const [onderwerp, setOnderwerp] = useState(gesprek?.onderwerp ?? '')
  const [notitiesIntern, setNotitiesIntern] = useState(gesprek?.notities_intern ?? '')
  const [samenvattingMedewerker, setSamenvattingMedewerker] = useState(gesprek?.samenvatting_medewerker ?? '')
  const [actiepunten, setActiepunten] = useState<Actiepunt[]>(gesprek?.actiepunten ?? [])
  const [status, setStatus] = useState<Gesprek['status']>(gesprek?.status ?? 'gepland')
  const [followupDatum, setFollowupDatum] = useState(gesprek?.followup_datum ?? '')
  const [nieuwActiepunt, setNieuwActiepunt] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [actieveTab, setActieveTab] = useState<'algemeen' | 'notities' | 'actiepunten'>('algemeen')

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function voegActiepuntToe() {
    if (!nieuwActiepunt.trim()) return
    setActiepunten(prev => [...prev, { tekst: nieuwActiepunt.trim(), gedaan: false, deadline: null }])
    setNieuwActiepunt('')
  }

  function toggleActiepunt(idx: number) {
    setActiepunten(prev => prev.map((a, i) => i === idx ? { ...a, gedaan: !a.gedaan } : a))
  }

  function verwijderActiepunt(idx: number) {
    setActiepunten(prev => prev.filter((_, i) => i !== idx))
  }

  function stelDeadlineIn(idx: number, deadline: string) {
    setActiepunten(prev => prev.map((a, i) => i === idx ? { ...a, deadline: deadline || null } : a))
  }

  async function opslaan() {
    if (!medewerkerId) { setFout('Selecteer een medewerker.'); return }
    if (!onderwerp.trim()) { setFout('Vul een onderwerp in.'); return }
    setBezig(true)
    setFout(null)

    const payload = {
      bedrijf_id: bedrijfId,
      hr_user_id: hrUserId,
      medewerker_id: medewerkerId,
      datum,
      type,
      onderwerp: onderwerp.trim(),
      notities_intern: notitiesIntern.trim() || null,
      samenvatting_medewerker: samenvattingMedewerker.trim() || null,
      actiepunten,
      status,
      followup_datum: followupDatum || null,
    }

    let error
    if (isNieuw) {
      ;({ error } = await supabase.from('hr_gesprekken').insert(payload))
    } else {
      ;({ error } = await supabase.from('hr_gesprekken').update(payload).eq('id', gesprek!.id!))
    }

    setBezig(false)
    if (error) { setFout(error.message); return }
    onSaved()
  }

  const tabStijl = (tab: typeof actieveTab) => ({
    padding: '8px 14px',
    fontSize: 13,
    fontWeight: 600,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    borderBottom: `2px solid ${actieveTab === tab ? ACCENT : 'transparent'}`,
    color: actieveTab === tab ? ACCENT : '#6B7280',
    transition: 'all 0.15s',
  } as React.CSSProperties)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: 'white', borderRadius: 16, width: '100%', maxWidth: 600,
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
      }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111', margin: 0 }}>
                {isNieuw ? 'Nieuw gesprek plannen' : 'Gesprek bewerken'}
              </h2>
              <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                {isNieuw ? 'Plan een 1-on-1 met een medewerker' : 'Pas de gespreksgegevens aan'}
              </p>
            </div>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: '50%', border: 'none',
              background: '#F3F4F6', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: '#6B7280',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #E5E7EB' }}>
            {(['algemeen', 'notities', 'actiepunten'] as const).map(tab => (
              <button key={tab} style={tabStijl(tab)} onClick={() => setActieveTab(tab)}>
                {tab === 'algemeen' ? 'Algemeen' : tab === 'notities' ? 'Notities' : `Actiepunten${actiepunten.length ? ` (${actiepunten.length})` : ''}`}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* Tab: Algemeen */}
          {actieveTab === 'algemeen' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Medewerker */}
              <div>
                <label style={labelStijl}>Medewerker *</label>
                <select value={medewerkerId} onChange={e => setMedewerkerId(e.target.value)} style={inputStijl}>
                  <option value="">Selecteer medewerker...</option>
                  {medewerkers.map(m => (
                    <option key={m.id} value={m.id}>{m.naam}</option>
                  ))}
                </select>
              </div>

              {/* Datum + Type rij */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStijl}>Datum *</label>
                  <input type="date" value={datum} onChange={e => setDatum(e.target.value)} style={inputStijl} />
                </div>
                <div>
                  <label style={labelStijl}>Type gesprek *</label>
                  <select value={type} onChange={e => setType(e.target.value as Gesprek['type'])} style={inputStijl}>
                    {TYPE_OPTIES.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Onderwerp */}
              <div>
                <label style={labelStijl}>Onderwerp *</label>
                <input
                  type="text"
                  value={onderwerp}
                  onChange={e => setOnderwerp(e.target.value)}
                  placeholder="Bijv. Jaargesprek Q4, Terugkeer na ziekte..."
                  style={inputStijl}
                />
              </div>

              {/* Status + Follow-up rij */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStijl}>Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value as Gesprek['status'])} style={inputStijl}>
                    <option value="gepland">Gepland</option>
                    <option value="afgerond">Afgerond</option>
                    <option value="geannuleerd">Geannuleerd</option>
                  </select>
                </div>
                <div>
                  <label style={labelStijl}>Follow-up datum</label>
                  <input type="date" value={followupDatum ?? ''} onChange={e => setFollowupDatum(e.target.value)} style={inputStijl} />
                </div>
              </div>

              {/* Status badge preview */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>Status:</span>
                <StatusBadge status={status} />
              </div>
            </div>
          )}

          {/* Tab: Notities */}
          {actieveTab === 'notities' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{
                background: '#FEF3C7', borderRadius: 8, padding: '10px 14px',
                display: 'flex', gap: 8, alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: 16 }}>🔒</span>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#92400E', margin: 0 }}>Interne notities zijn alleen zichtbaar voor HR</p>
                  <p style={{ fontSize: 11, color: '#B45309', marginTop: 2 }}>De samenvatting voor de medewerker is wel zichtbaar voor hen.</p>
                </div>
              </div>

              <div>
                <label style={labelStijl}>Interne notities (alleen HR)</label>
                <textarea
                  value={notitiesIntern}
                  onChange={e => setNotitiesIntern(e.target.value)}
                  placeholder="Vertrouwelijke aantekeningen, observaties, context..."
                  rows={5}
                  style={{ ...inputStijl, resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              <div>
                <label style={labelStijl}>Samenvatting voor medewerker</label>
                <textarea
                  value={samenvattingMedewerker}
                  onChange={e => setSamenvattingMedewerker(e.target.value)}
                  placeholder="Gedeelde samenvatting — medewerker kan dit lezen in hun app..."
                  rows={4}
                  style={{ ...inputStijl, resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>
            </div>
          )}

          {/* Tab: Actiepunten */}
          {actieveTab === 'actiepunten' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {actiepunten.length === 0 && (
                <div style={{
                  background: '#F9FAFB', borderRadius: 10, border: '2px dashed #E5E7EB',
                  padding: '32px 24px', textAlign: 'center', color: '#9CA3AF', fontSize: 13,
                }}>
                  Nog geen actiepunten. Voeg er een toe hieronder.
                </div>
              )}

              {actiepunten.map((ap, idx) => (
                <div key={idx} style={{
                  background: '#FAFAFA', borderRadius: 10, padding: '12px 14px',
                  border: `1.5px solid ${ap.gedaan ? '#D1FAE5' : '#E5E7EB'}`,
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      onClick={() => toggleActiepunt(idx)}
                      style={{
                        width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                        border: `2px solid ${ap.gedaan ? ACCENT : '#D1D5DB'}`,
                        background: ap.gedaan ? ACCENT : 'white',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {ap.gedaan && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                    <span style={{
                      flex: 1, fontSize: 13, color: ap.gedaan ? '#9CA3AF' : '#374151',
                      textDecoration: ap.gedaan ? 'line-through' : 'none',
                    }}>{ap.tekst}</span>
                    <button onClick={() => verwijderActiepunt(idx)} style={{
                      width: 24, height: 24, borderRadius: 6, border: 'none',
                      background: '#FEE2E2', cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', color: '#DC2626', flexShrink: 0,
                    }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 30 }}>
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>Deadline:</span>
                    <input
                      type="date"
                      value={ap.deadline ?? ''}
                      onChange={e => stelDeadlineIn(idx, e.target.value)}
                      style={{
                        fontSize: 11, border: '1px solid #E5E7EB', borderRadius: 6,
                        padding: '3px 8px', color: '#374151', background: 'white',
                      }}
                    />
                    {ap.deadline && (
                      <button onClick={() => stelDeadlineIn(idx, '')} style={{
                        fontSize: 10, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer',
                      }}>Wis</button>
                    )}
                  </div>
                </div>
              ))}

              {/* Nieuw actiepunt */}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <input
                  type="text"
                  value={nieuwActiepunt}
                  onChange={e => setNieuwActiepunt(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') voegActiepuntToe() }}
                  placeholder="Nieuw actiepunt toevoegen..."
                  style={{ ...inputStijl, flex: 1, margin: 0 }}
                />
                <button
                  onClick={voegActiepuntToe}
                  disabled={!nieuwActiepunt.trim()}
                  style={{
                    background: ACCENT, color: 'white', border: 'none',
                    borderRadius: 8, padding: '0 16px', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600, opacity: nieuwActiepunt.trim() ? 1 : 0.4,
                  }}
                >Toevoegen</button>
              </div>
            </div>
          )}

          {fout && (
            <div style={{
              marginTop: 12, background: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626',
            }}>{fout}</div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid #E5E7EB',
          display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0,
        }}>
          <button onClick={onClose} style={{
            background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 8,
            padding: '9px 18px', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer',
          }}>Annuleren</button>
          <button onClick={opslaan} disabled={bezig} style={{
            background: ACCENT, color: 'white', border: 'none', borderRadius: 8,
            padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: bezig ? 'default' : 'pointer',
            opacity: bezig ? 0.7 : 1, minWidth: 100,
          }}>
            {bezig ? 'Opslaan...' : isNieuw ? 'Gesprek plannen' : 'Wijzigingen opslaan'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function StatusBadge({ status }: { status: Gesprek['status'] }) {
  const map = {
    gepland:     { label: 'Gepland',     bg: '#EFF6FF', color: '#1D4ED8' },
    afgerond:    { label: 'Afgerond',    bg: '#E1F5EE', color: '#0F6E56' },
    geannuleerd: { label: 'Geannuleerd', bg: '#F3F4F6', color: '#6B7280' },
  }
  const s = map[status]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: s.bg, color: s.color,
      borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600,
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%', background: s.color, flexShrink: 0,
      }} />
      {s.label}
    </span>
  )
}

const labelStijl: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#374151',
  marginBottom: 6, letterSpacing: '0.01em',
}

const inputStijl: React.CSSProperties = {
  width: '100%', padding: '9px 12px', fontSize: 13, color: '#111',
  border: '1.5px solid #E5E7EB', borderRadius: 8, background: 'white',
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

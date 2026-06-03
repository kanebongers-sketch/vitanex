'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import GesprekKaart from './GesprekKaart'
import GesprekModal, { type Gesprek } from './GesprekModal'

type GesprekMet = Gesprek & { id: string; medewerker_naam?: string }
type Medewerker = { id: string; naam: string }

type Props = {
  bedrijfId: string
  hrUserId: string
  /** Als ingesteld: filtert gesprekken op deze medewerker (team/[id] view) */
  gefilterdOpMedewerker?: string
}

const ACCENT = '#1D9E75'

type FilterStatus = 'alle' | 'aankomend' | 'afgerond' | 'geannuleerd'
type FilterType = 'alle' | 'functionering' | 'beoordeling' | 'welzijn' | 'overig'

export default function GesprekkenTab({ bedrijfId, hrUserId, gefilterdOpMedewerker }: Props) {
  const [gesprekken, setGesprekken] = useState<GesprekMet[]>([])
  const [medewerkers, setMedewerkers] = useState<Medewerker[]>([])
  const [laden, setLaden] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [geselecteerd, setGeselecteerd] = useState<Partial<Gesprek> | null>(null)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('alle')
  const [filterType, setFilterType] = useState<FilterType>('alle')
  const [filterMedewerker, setFilterMedewerker] = useState(gefilterdOpMedewerker ?? 'alle')
  const [zoeken, setZoeken] = useState('')

  const laadData = useCallback(async () => {
    setLaden(true)
    const [{ data: gesprekData }, { data: medData }] = await Promise.all([
      supabase
        .from('hr_gesprekken')
        .select('*, medewerker:profiles!hr_gesprekken_medewerker_id_fkey(naam)')
        .eq('bedrijf_id', bedrijfId)
        .order('datum', { ascending: false }),
      supabase
        .from('profiles')
        .select('id, naam')
        .eq('bedrijf_id', bedrijfId)
        .eq('rol', 'medewerker')
        .order('naam'),
    ])
    const verrijkt: GesprekMet[] = (gesprekData ?? []).map((g: Record<string, unknown>) => ({
      ...g,
      medewerker_naam: (g.medewerker as { naam: string } | null)?.naam,
    })) as GesprekMet[]
    setGesprekken(verrijkt)
    setMedewerkers(medData ?? [])
    setLaden(false)
  }, [bedrijfId])

  useEffect(() => { laadData() }, [laadData])

  function nieuwGesprek() {
    setGeselecteerd(
      gefilterdOpMedewerker ? { medewerker_id: gefilterdOpMedewerker } : null
    )
    setModalOpen(true)
  }

  function bewerkGesprek(g: GesprekMet) {
    setGeselecteerd(g)
    setModalOpen(true)
  }

  const gefilterd = gesprekken.filter(g => {
    if (filterMedewerker !== 'alle' && g.medewerker_id !== filterMedewerker) return false
    if (filterType !== 'alle' && g.type !== filterType) return false
    if (filterStatus === 'aankomend') {
      if (g.status !== 'gepland') return false
    } else if (filterStatus !== 'alle' && g.status !== filterStatus) return false
    if (zoeken.trim()) {
      const q = zoeken.toLowerCase()
      if (!g.onderwerp.toLowerCase().includes(q) && !g.medewerker_naam?.toLowerCase().includes(q)) return false
    }
    return true
  })

  // Groepeer: aankomend / afgelopen
  const nu = new Date()
  const aankomend = gefilterd.filter(g => g.status === 'gepland' && new Date(g.datum) >= nu)
    .sort((a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime())
  const overig = gefilterd.filter(g => !(g.status === 'gepland' && new Date(g.datum) >= nu))

  const chipStijl = (actief: boolean) => ({
    padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    border: `1.5px solid ${actief ? ACCENT : '#E5E7EB'}`,
    background: actief ? '#E1F5EE' : 'white',
    color: actief ? ACCENT : '#6B7280',
    cursor: 'pointer',
  } as React.CSSProperties)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111', margin: 0 }}>HR Gesprekken</h2>
          <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
            {gesprekken.length} gesprek{gesprekken.length !== 1 ? 'ken' : ''} in totaal
          </p>
        </div>
        <button onClick={nieuwGesprek} style={{
          background: ACCENT, color: 'white', border: 'none', borderRadius: 8,
          padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nieuw gesprek
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {/* Zoekbalk */}
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={zoeken}
            onChange={e => setZoeken(e.target.value)}
            placeholder="Zoek op onderwerp of medewerker..."
            style={{
              width: '100%', paddingLeft: 34, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
              fontSize: 13, border: '1.5px solid #E5E7EB', borderRadius: 8, background: 'white',
              color: '#111', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Status chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {([['alle', 'Alle'], ['aankomend', 'Aankomend'], ['afgerond', 'Afgerond'], ['geannuleerd', 'Geannuleerd']] as const).map(([val, label]) => (
            <button key={val} style={chipStijl(filterStatus === val)} onClick={() => setFilterStatus(val)}>{label}</button>
          ))}
        </div>

        {/* Type + medewerker */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as FilterType)}
            style={{
              padding: '7px 10px', fontSize: 12, border: '1.5px solid #E5E7EB',
              borderRadius: 8, background: 'white', color: '#374151', cursor: 'pointer',
            }}
          >
            <option value="alle">Alle types</option>
            <option value="functionering">Functionering</option>
            <option value="beoordeling">Beoordeling</option>
            <option value="welzijn">Welzijn</option>
            <option value="overig">Overig</option>
          </select>

          {!gefilterdOpMedewerker && (
            <select
              value={filterMedewerker}
              onChange={e => setFilterMedewerker(e.target.value)}
              style={{
                padding: '7px 10px', fontSize: 12, border: '1.5px solid #E5E7EB',
                borderRadius: 8, background: 'white', color: '#374151', cursor: 'pointer',
              }}
            >
              <option value="alle">Alle medewerkers</option>
              {medewerkers.map(m => (
                <option key={m.id} value={m.id}>{m.naam}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Content */}
      {laden ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <div className="mf-spinner" />
        </div>
      ) : gefilterd.length === 0 ? (
        <div style={{
          background: 'white', borderRadius: 12, border: '2px dashed #E5E7EB',
          padding: '40px 24px', textAlign: 'center',
        }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>💬</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Geen gesprekken gevonden</p>
          <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 16 }}>
            {zoeken || filterStatus !== 'alle' || filterType !== 'alle'
              ? 'Pas je filters aan of wis de zoekopdracht.'
              : 'Plan het eerste gesprek met een medewerker.'}
          </p>
          {!zoeken && filterStatus === 'alle' && filterType === 'alle' && (
            <button onClick={nieuwGesprek} style={{
              background: ACCENT, color: 'white', border: 'none', borderRadius: 8,
              padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>Gesprek plannen</button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Aankomend */}
          {aankomend.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 10 }}>
                Aankomend ({aankomend.length})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {aankomend.map(g => (
                  <GesprekKaart key={g.id} gesprek={g} onClick={() => bewerkGesprek(g)} />
                ))}
              </div>
            </div>
          )}

          {/* Recent / overig */}
          {overig.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 10 }}>
                {aankomend.length > 0 ? `Recent & overig (${overig.length})` : `Gesprekken (${overig.length})`}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {overig.map(g => (
                  <GesprekKaart key={g.id} gesprek={g} onClick={() => bewerkGesprek(g)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <GesprekModal
          gesprek={geselecteerd}
          bedrijfId={bedrijfId}
          hrUserId={hrUserId}
          medewerkers={medewerkers}
          onClose={() => { setModalOpen(false); setGeselecteerd(null) }}
          onSaved={() => { setModalOpen(false); setGeselecteerd(null); laadData() }}
        />
      )}
    </div>
  )
}

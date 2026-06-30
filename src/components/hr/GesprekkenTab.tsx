'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, MessageSquare } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
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

type FilterStatus = 'alle' | 'aankomend' | 'afgerond' | 'geannuleerd'
type FilterType = 'alle' | 'functionering' | 'beoordeling' | 'welzijn' | 'overig'

const selectStijl: React.CSSProperties = {
  padding: '8px 12px',
  fontSize: 13,
  border: '1px solid var(--border-strong)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--bg-subtle)',
  color: 'var(--text-1)',
  cursor: 'pointer',
  outline: 'none',
}

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

  useEffect(() => {
    // Buiten de synchrone effect-body starten (react-compiler regel)
    Promise.resolve().then(laadData)
  }, [laadData])

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

  const chipStijl = (actief: boolean): React.CSSProperties => ({
    padding: '6px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600,
    border: `1px solid ${actief ? 'var(--mentaforce-primary)' : 'var(--border-strong)'}`,
    background: actief ? 'var(--mentaforce-primary-light)' : 'var(--bg-subtle)',
    color: actief ? 'var(--mentaforce-primary)' : 'var(--text-3)',
    cursor: 'pointer',
  })

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>HR Gesprekken</h2>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
            {gesprekken.length} gesprek{gesprekken.length !== 1 ? 'ken' : ''} in totaal
          </p>
        </div>
        <Button onClick={nieuwGesprek} size="sm" leftIcon={<Plus size={15} aria-hidden />}>
          Nieuw gesprek
        </Button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {/* Zoekbalk */}
        <div style={{ position: 'relative' }}>
          <Search
            size={15}
            aria-hidden
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none', zIndex: 1 }}
          />
          <Input
            type="text"
            value={zoeken}
            onChange={e => setZoeken(e.target.value)}
            placeholder="Zoek op onderwerp of medewerker..."
            aria-label="Zoek gesprekken"
            style={{ paddingLeft: 36, fontSize: 13 }}
          />
        </div>

        {/* Status chips */}
        <div role="group" aria-label="Filter op status" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {([['alle', 'Alle'], ['aankomend', 'Aankomend'], ['afgerond', 'Afgerond'], ['geannuleerd', 'Geannuleerd']] as const).map(([val, label]) => (
            <button
              key={val}
              type="button"
              className="mf-pressable"
              aria-pressed={filterStatus === val}
              style={chipStijl(filterStatus === val)}
              onClick={() => setFilterStatus(val)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Type + medewerker */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as FilterType)}
            aria-label="Filter op type gesprek"
            style={selectStijl}
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
              aria-label="Filter op medewerker"
              style={selectStijl}
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
        <EmptyState
          icon={MessageSquare}
          title="Geen gesprekken gevonden"
          description={
            zoeken || filterStatus !== 'alle' || filterType !== 'alle'
              ? 'Pas je filters aan of wis de zoekopdracht.'
              : 'Plan het eerste gesprek met een medewerker.'
          }
          action={
            !zoeken && filterStatus === 'alle' && filterType === 'alle'
              ? <Button onClick={nieuwGesprek} size="sm">Gesprek plannen</Button>
              : undefined
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Aankomend */}
          {aankomend.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 10 }}>
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
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 10 }}>
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

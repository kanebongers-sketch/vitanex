'use client'

import { useState, type CSSProperties } from 'react'
import { Plus, Trash2, Save, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { authFetch } from '@/lib/auth/auth-fetch'
import { PIJLERS, PIJLER_VOLGORDE, type Pijler } from '@/lib/coaching/pijlers'
import type { FaseInvoer, TrajectMetFases, TrajectStatus } from '@/lib/coaching/traject'

// Client-container voor het opstellen/vervangen van een traject. Bouwt de
// invoer lokaal op (immutable) en POST't naar /api/coaching/traject.

const selectStyle: CSSProperties = {
  width: '100%', padding: '9px 12px', fontSize: 14, color: 'var(--text-1)',
  background: 'var(--bg-subtle)', border: '1px solid var(--border-strong)',
  borderRadius: 'var(--radius-md)', outline: 'none', fontFamily: 'inherit',
}

interface FaseVeld extends FaseInvoer { sleutel: string }

function nieuweFase(pijler: Pijler): FaseVeld {
  return { sleutel: crypto.randomUUID(), titel: '', pijler, focus: '', week_van: null, week_tot: null }
}

/** Standaard 6-maanden (26 weken) opzet: één fase per pijler. */
function standaardFases(): FaseVeld[] {
  return [
    { ...nieuweFase('body'), titel: 'Fundament & fysiek', week_van: 1, week_tot: 8 },
    { ...nieuweFase('mind'), titel: 'Mentale kracht', week_van: 9, week_tot: 16 },
    { ...nieuweFase('performance'), titel: 'Performance & consistentie', week_van: 17, week_tot: 26 },
  ]
}

function vanBestaand(data: TrajectMetFases): FaseVeld[] {
  return data.fases.map(f => ({
    sleutel: f.id, titel: f.titel, pijler: f.pijler, focus: f.focus ?? '',
    week_van: f.week_van, week_tot: f.week_tot,
  }))
}

export interface TrajectFormulierProps {
  klantId: string
  bestaand: TrajectMetFases | null
  onOpgeslagen: (traject: TrajectMetFases) => void
  onAnnuleren?: () => void
}

export function TrajectFormulier({ klantId, bestaand, onOpgeslagen, onAnnuleren }: TrajectFormulierProps) {
  const [titel, setTitel] = useState(bestaand?.traject.titel ?? '')
  const [doel, setDoel] = useState(bestaand?.traject.doel ?? '')
  const [startDatum, setStartDatum] = useState(bestaand?.traject.start_datum ?? new Date().toISOString().slice(0, 10))
  const [duur, setDuur] = useState(bestaand?.traject.duur_maanden ?? 6)
  const [status, setStatus] = useState<TrajectStatus>(bestaand?.traject.status ?? 'actief')
  const [fases, setFases] = useState<FaseVeld[]>(bestaand ? vanBestaand(bestaand) : standaardFases())
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  function wijzigFase(sleutel: string, patch: Partial<FaseInvoer>) {
    setFases(prev => prev.map(f => (f.sleutel === sleutel ? { ...f, ...patch } : f)))
  }

  async function opslaan() {
    if (bezig) return
    setBezig(true)
    setFout(null)
    const res = await authFetch('/api/coaching/traject', {
      method: 'POST',
      body: JSON.stringify({
        klant_id: klantId, titel, doel, start_datum: startDatum,
        duur_maanden: duur, status,
        fases: fases.map(f => ({ titel: f.titel, pijler: f.pijler, focus: f.focus, week_van: f.week_van, week_tot: f.week_tot })),
      }),
    })
    const data = await res.json() as { traject?: TrajectMetFases; error?: string }
    if (res.ok && data.traject) {
      onOpgeslagen(data.traject)
    } else {
      setFout(data.error ?? 'Opslaan mislukt.')
      setBezig(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Titel van het traject" required>
            <Input value={titel} onChange={e => setTitel(e.target.value)} placeholder="bijv. 6-maanden transformatie" />
          </Field>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Hoofddoel" hint="Waar werkt de klant de komende maanden naartoe?">
            <Textarea rows={2} value={doel} onChange={e => setDoel(e.target.value)} placeholder="Sterker, scherper, met meer structuur en energie." />
          </Field>
        </div>
        <Field label="Startdatum">
          <Input type="date" value={startDatum} onChange={e => setStartDatum(e.target.value)} />
        </Field>
        <Field label="Duur (maanden)">
          <input type="number" min={1} max={24} value={duur} className="mf-traject-ctrl"
            onChange={e => setDuur(Math.max(1, Math.min(24, Number(e.target.value) || 1)))}
            style={{ ...selectStyle }} />
        </Field>
        <Field label="Status">
          <select value={status} onChange={e => setStatus(e.target.value as TrajectStatus)} className="mf-traject-ctrl" style={selectStyle}>
            <option value="concept">Concept</option>
            <option value="actief">Actief</option>
            <option value="gepauzeerd">Gepauzeerd</option>
            <option value="afgerond">Afgerond</option>
          </select>
        </Field>
      </div>

      {/* Fases */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>Fases</h3>
          <button type="button" onClick={() => setFases(standaardFases())}
            className="mf-pressable"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--mf-green)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <Wand2 size={14} aria-hidden /> 6-maanden opzet
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {fases.map((fase, i) => (
            <div key={fase.sleutel} style={{
              padding: '14px 16px', background: 'var(--bg-subtle)',
              border: `1px solid color-mix(in srgb, ${PIJLERS[fase.pijler].kleurToken} 32%, transparent)`,
              borderLeft: `3px solid ${PIJLERS[fase.pijler].kleurToken}`,
              borderRadius: 'var(--radius-sm)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-4)' }}>FASE {i + 1}</span>
                <select aria-label={`Pijler van fase ${i + 1}`} value={fase.pijler} className="mf-traject-ctrl"
                  onChange={e => wijzigFase(fase.sleutel, { pijler: e.target.value as Pijler })}
                  style={{ ...selectStyle, width: 'auto', padding: '5px 10px', fontSize: 13, color: PIJLERS[fase.pijler].kleurToken }}>
                  {PIJLER_VOLGORDE.map(p => <option key={p} value={p}>{PIJLERS[p].label}</option>)}
                </select>
                <button type="button" aria-label={`Fase ${i + 1} verwijderen`}
                  onClick={() => setFases(prev => prev.filter(f => f.sleutel !== fase.sleutel))}
                  className="mf-pressable"
                  style={{ marginLeft: 'auto', color: 'var(--mf-red)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'inline-flex' }}>
                  <Trash2 size={15} aria-hidden />
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, alignItems: 'end' }}>
                <Field label="Titel"><Input value={fase.titel} onChange={e => wijzigFase(fase.sleutel, { titel: e.target.value })} placeholder="Fasetitel" /></Field>
                <Field label="Week van"><input type="number" min={1} value={fase.week_van ?? ''} className="mf-traject-ctrl" onChange={e => wijzigFase(fase.sleutel, { week_van: e.target.value ? Number(e.target.value) : null })} style={{ ...selectStyle, width: 84 }} /></Field>
                <Field label="Week tot"><input type="number" min={1} value={fase.week_tot ?? ''} className="mf-traject-ctrl" onChange={e => wijzigFase(fase.sleutel, { week_tot: e.target.value ? Number(e.target.value) : null })} style={{ ...selectStyle, width: 84 }} /></Field>
              </div>
              <div style={{ marginTop: 8 }}>
                <Field label="Focus"><Input value={fase.focus ?? ''} onChange={e => wijzigFase(fase.sleutel, { focus: e.target.value })} placeholder="Waar ligt de nadruk in deze fase?" /></Field>
              </div>
            </div>
          ))}
        </div>

        <Button variant="secondary" size="sm" onClick={() => setFases(prev => [...prev, nieuweFase('body')])}
          leftIcon={<Plus size={15} aria-hidden />} style={{ marginTop: 12 }}>
          Fase toevoegen
        </Button>
      </div>

      {fout && <p role="alert" style={{ fontSize: 13, color: 'var(--mf-red)', fontWeight: 600 }}>{fout}</p>}

      <div style={{ display: 'flex', gap: 10 }}>
        <Button onClick={opslaan} loading={bezig} disabled={!titel.trim() || fases.length === 0} leftIcon={<Save size={15} aria-hidden />}>
          Traject opslaan
        </Button>
        {onAnnuleren && <Button variant="ghost" onClick={onAnnuleren} disabled={bezig}>Annuleren</Button>}
      </div>

      <style>{`
        .mf-traject-ctrl:focus-visible {
          border-color: var(--mentaforce-primary);
          box-shadow: 0 0 0 3px var(--mentaforce-primary-light);
          outline: none;
        }
      `}</style>
    </div>
  )
}

'use client'

import { useState, type CSSProperties } from 'react'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Plus } from 'lucide-react'
import {
  PIJLERS,
  FREQUENTIES,
  PIJLER_LABELS,
  FREQUENTIE_LABELS,
  type Frequentie,
  type Pijler,
} from '@/lib/coaching/taken'

export interface NieuweTaakWaarden {
  titel: string
  beschrijving: string
  pijler: Pijler
  frequentie: Frequentie
  target_per_week: number
}

export interface TaakFormulierProps {
  /** Retourneer true bij succes; het formulier wist dan zijn velden. */
  onSubmit: (waarden: NieuweTaakWaarden) => Promise<boolean>
  bezig: boolean
  fout: string | null
}

const SELECT_STYLE: CSSProperties = {
  width: '100%', padding: '10px 14px', fontSize: 15, lineHeight: 1.4,
  color: 'var(--text-1)', background: 'var(--bg-subtle)',
  border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)',
  outline: 'none', cursor: 'pointer',
}

const LEEG: NieuweTaakWaarden = {
  titel: '', beschrijving: '', pijler: 'body', frequentie: 'dagelijks', target_per_week: 3,
}

export function TaakFormulier({ onSubmit, bezig, fout }: TaakFormulierProps) {
  const [waarden, setWaarden] = useState<NieuweTaakWaarden>(LEEG)

  function zet<K extends keyof NieuweTaakWaarden>(sleutel: K, waarde: NieuweTaakWaarden[K]) {
    setWaarden(prev => ({ ...prev, [sleutel]: waarde }))
  }

  async function verstuur() {
    if (!waarden.titel.trim() || bezig) return
    const gelukt = await onSubmit(waarden)
    if (gelukt) setWaarden(LEEG)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Field label="Titel" error={fout ?? undefined}>
        <Input
          type="text"
          placeholder="Bijv. 10.000 stappen lopen"
          value={waarden.titel}
          maxLength={120}
          onChange={e => zet('titel', e.target.value)}
        />
      </Field>

      <Field label="Toelichting (optioneel)">
        <Textarea
          placeholder="Korte instructie of context voor je klant"
          value={waarden.beschrijving}
          rows={2}
          maxLength={400}
          onChange={e => zet('beschrijving', e.target.value)}
        />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: waarden.frequentie === 'wekelijks' ? '1fr 1fr 1fr' : '1fr 1fr', gap: 12 }}>
        <Field label="Pijler">
          <select
            style={SELECT_STYLE}
            value={waarden.pijler}
            onChange={e => zet('pijler', e.target.value as Pijler)}
          >
            {PIJLERS.map(p => <option key={p} value={p}>{PIJLER_LABELS[p]}</option>)}
          </select>
        </Field>

        <Field label="Frequentie">
          <select
            style={SELECT_STYLE}
            value={waarden.frequentie}
            onChange={e => zet('frequentie', e.target.value as Frequentie)}
          >
            {FREQUENTIES.map(f => <option key={f} value={f}>{FREQUENTIE_LABELS[f]}</option>)}
          </select>
        </Field>

        {waarden.frequentie === 'wekelijks' && (
          <Field label="Keer per week">
            <select
              style={SELECT_STYLE}
              value={waarden.target_per_week}
              onChange={e => zet('target_per_week', Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}×</option>)}
            </select>
          </Field>
        )}
      </div>

      <div>
        <Button
          onClick={verstuur}
          loading={bezig}
          disabled={!waarden.titel.trim()}
          leftIcon={<Plus size={15} aria-hidden />}
        >
          Taak toevoegen
        </Button>
      </div>
    </div>
  )
}

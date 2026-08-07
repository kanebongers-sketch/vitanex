'use client'

import type { Dispatch, SetStateAction } from 'react'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { MAALTIJD_VOLGORDE, MAALTIJD_ICOON, MAALTIJD_KLEUR, MAALTIJD_LABEL, MAALTIJD_VOL_LABEL } from './constants'
import type { MaaltijdType, VoedingForm } from './types'

// Gedeelde formuliervelden voor het handmatig invoeren en het corrigeren van een
// foto-schatting. Geëxtraheerd uit de voeding-pagina, waar ze als inline-closures
// over `form`/`setForm` stonden en door drie schermen werden hergebruikt.

interface VeldProps {
  label: string
  veld: keyof VoedingForm
  form: VoedingForm
  setForm: Dispatch<SetStateAction<VoedingForm>>
  type?: string
  suffix?: string
}

export function VoedingVeld({ label, veld, form, setForm, type = 'text', suffix = '' }: VeldProps) {
  // Eenheid in het label (bv. "Calorieën (kcal)") houdt de label-koppeling intact
  // en is voorleesbaar — beter dan een losse, niet-gekoppelde suffix.
  const labelMetEenheid = suffix ? `${label} (${suffix})` : label
  return (
    <Field label={labelMetEenheid}>
      <Input
        type={type}
        inputMode={type === 'number' ? 'decimal' : undefined}
        value={form[veld]}
        onChange={(e) => setForm((prev) => ({ ...prev, [veld]: e.target.value }))}
        placeholder={type === 'number' ? '0' : ''}
      />
    </Field>
  )
}

export function MaaltijdSelector({ waarde, onKies }: { waarde: MaaltijdType; onKies: (mt: MaaltijdType) => void }) {
  return (
    <div role="group" aria-label="Maaltijdtype" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
      {MAALTIJD_VOLGORDE.map((mt) => {
        const actief = waarde === mt
        const Icoon = MAALTIJD_ICOON[mt]
        return (
          <button key={mt} type="button" onClick={() => onKies(mt)}
            aria-pressed={actief}
            aria-label={MAALTIJD_VOL_LABEL[mt]}
            style={{ minHeight: 44, padding: '9px 4px', borderRadius: 10,
              border: `1.5px solid ${actief ? MAALTIJD_KLEUR[mt] : 'var(--border)'}`,
              background: actief ? `color-mix(in srgb, ${MAALTIJD_KLEUR[mt]} 14%, transparent)` : 'var(--bg-card)',
              color: actief ? MAALTIJD_KLEUR[mt] : 'var(--text-3)',
              fontSize: 10, fontWeight: 700, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
            <Icoon size={16} aria-hidden strokeWidth={1.75} style={{ color: actief ? MAALTIJD_KLEUR[mt] : 'var(--text-3)' }} />
            <span>{MAALTIJD_LABEL[mt]}</span>
          </button>
        )
      })}
    </div>
  )
}

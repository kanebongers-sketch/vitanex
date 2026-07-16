'use client'

import { useId, useState, type CSSProperties, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { Knop } from '@/components/lifeos/os/Knop'
import { MAX_TITEL_LENGTE } from '@/lib/lifeos/taken/taken'

// Eén invoerveld om een taak toe te voegen. Presentationeel: het weet niet wáár
// de taak heen gaat (vandaag of "ooit") — dat bepaalt de container via `onToevoeg`.
//
// De container doet de POST en zegt met een boolean of het lukte. Alleen dán
// legen we het veld: mislukt het, dan houdt de gebruiker zijn tekst, in plaats
// van 'm kwijt te zijn aan een netwerkfout.

interface ToevoegVeldProps {
  /** Sr-only label én zichtbare placeholder. */
  label: string
  placeholder: string
  bezig: boolean
  onToevoeg: (titel: string) => Promise<boolean>
}

export function ToevoegVeld({ label, placeholder, bezig, onToevoeg }: ToevoegVeldProps) {
  const [titel, setTitel] = useState('')
  const id = useId()

  const versturen = async (e: FormEvent) => {
    e.preventDefault()
    const schoon = titel.trim()
    if (schoon.length === 0 || bezig) return
    const gelukt = await onToevoeg(schoon)
    if (gelukt) setTitel('')
  }

  return (
    <form onSubmit={(e) => void versturen(e)} style={{ display: 'flex', gap: 8 }}>
      <label htmlFor={id} style={VERBORGEN}>
        {label}
      </label>
      <input
        id={id}
        value={titel}
        onChange={(e) => setTitel(e.target.value)}
        placeholder={placeholder}
        maxLength={MAX_TITEL_LENGTE}
        disabled={bezig}
        style={INVOER}
      />
      <Knop type="submit" disabled={bezig || titel.trim().length === 0}>
        <Plus size={14} strokeWidth={2.4} aria-hidden="true" />
        Zet erbij
      </Knop>
    </form>
  )
}

/** Zichtbaar voor screenreaders, niet voor het oog. */
const VERBORGEN: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
}

const INVOER: CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: '8px 12px',
  borderRadius: 999,
  border: '1px solid var(--line)',
  background: 'var(--bg-raised)',
  color: 'var(--text-1)',
  fontFamily: 'inherit',
  fontSize: 13,
}

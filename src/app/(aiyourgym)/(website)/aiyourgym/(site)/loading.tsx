import type { CSSProperties } from 'react'
import { siteTekst } from '@/lib/aiyourgym/taal/server'
import { SCHERM } from '@/lib/aiyourgym/taal/woorden/website/scherm'

// Laadscherm van de website, binnen de kop en voet van (site)/layout.tsx. Staat
// bewust onder de poort in ../layout.tsx: wie de site niet mag zien, krijgt meteen
// een echte 404 en nooit eerst dit scherm.

const VLAK: CSSProperties = {
  minHeight: '60vh',
  display: 'grid',
  placeItems: 'center',
  alignContent: 'center',
  gap: 16,
}

const RING: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: '50%',
  border: '3px solid var(--ayg-lijn)',
  borderTopColor: 'var(--ayg-accent)',
}

export default async function AiYourGymLaden() {
  const t = await siteTekst(SCHERM)
  return (
    <div style={VLAK} role="status" aria-live="polite">
      <span className="ayg-basis-draai" style={RING} aria-hidden="true" />
      <p className="ayg-klein">{t.laden}</p>
    </div>
  )
}

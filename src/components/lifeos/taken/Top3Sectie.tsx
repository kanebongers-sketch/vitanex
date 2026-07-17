'use client'

import type { CSSProperties } from 'react'
import { top3Van, TOP3_POSITIES, type Taak } from '@/lib/lifeos/taken/taken'
import { Top3Rij } from './Top3Rij'

// De top-3 van vandaag: de enige vraag die 's ochtends telt.
//
// ─── WAAROM DIT GEEN EIGEN KAART MEER IS ────────────────────────────────────
//
//   Hier stond een losse `Top3Kaart` met een eigen fetch en een eigen kopie van
//   dezelfde taken. Die kaart hing nergens in de boom (niemand importeerde 'm),
//   dus in de draaiende app was de top-3 onbedienbaar: `top3_positie` bleef
//   altijd null. Twee containers die dezelfde taken ophalen zouden bovendien uit
//   elkaar lopen zodra je er in de één één afvinkt.
//
//   Nu is de top-3 wat hij altijd was: een LAAG OVER dezelfde taken. Eén bron
//   (`useTaken`), één lijst, drie plekken die je zelf vult.

interface Top3SectieProps {
  /** De open taken van vandaag — de top-3 wordt hieruit afgeleid, niet apart bewaard. */
  vandaag: readonly Taak[]
  onVink: (taak: Taak) => void
  onLosmaken: (taak: Taak) => void
}

export function Top3Sectie({ vandaag, onVink, onLosmaken }: Top3SectieProps) {
  const drie = top3Van(vandaag)
  const bezet = drie.filter((t) => t !== null).length

  return (
    <section>
      <h3 style={KOP}>
        Top 3 vandaag
        <span className="os-cijfer" style={{ color: 'var(--text-4)', fontWeight: 600 }}>
          {bezet}/3
        </span>
      </h3>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {drie.map((taak, i) => (
          <Top3Rij
            key={TOP3_POSITIES[i] ?? i}
            positie={TOP3_POSITIES[i] ?? 1}
            taak={taak}
            onVink={onVink}
            onLosmaken={onLosmaken}
          />
        ))}
      </ul>

      <p style={NOOT}>
        {bezet === 3
          ? 'Drie is drie. Vink er een af of haal er een uit om ruimte te maken.'
          : 'Zet een taak van vandaag hieronder met de ster in je top-3.'}
      </p>
    </section>
  )
}

const KOP: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 8,
  margin: '0 0 4px',
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--text-3)',
}

const NOOT: CSSProperties = {
  margin: '8px 0 0',
  fontSize: 12,
  lineHeight: 1.5,
  color: 'var(--text-4)',
}

'use client'

import { Flag, Smartphone, Vibrate, Volume2 } from 'lucide-react'
import type { SchermStatus, Signaal } from './toestel'
import { useTaal } from '@/lib/aiyourgym/taal/client'
import { TRAINING } from '@/lib/aiyourgym/taal/woorden/ledenapp/training'

interface TrainingMenuProps {
  signaal: Signaal
  scherm: SchermStatus
  bezig: boolean
  onAfronden: () => void
}

/** De sleutel in het woordenboek per stand van het scherm. */
const SCHERM_SLEUTEL = { aan: 'aan', 'niet-ondersteund': 'nietOndersteund', geweigerd: 'geweigerd' } as const satisfies Record<SchermStatus, string>

/** Instellingen tijdens de training: signaal aan het einde van de rust, en eerder afronden. */
export function TrainingMenu({ signaal, scherm, bezig, onAfronden }: TrainingMenuProps) {
  const { keuze, kanTrillen, kanGeluid, zet } = signaal
  const t = TRAINING[useTaal()].menu
  return (
    <section className="club-tm-menu" aria-label={t.label}>
      <p className="club-tm-menu-kop">{t.eindeRust}</p>
      {kanTrillen && (
        <label className="club-tm-schakel">
          <Vibrate aria-hidden size={18} />
          <span>{t.trillen}</span>
          <input type="checkbox" role="switch" checked={keuze.trillen} onChange={(e) => zet({ trillen: e.target.checked })} />
        </label>
      )}
      {kanGeluid && (
        <label className="club-tm-schakel">
          <Volume2 aria-hidden size={18} />
          <span>{t.geluid}</span>
          <input type="checkbox" role="switch" checked={keuze.geluid} onChange={(e) => zet({ geluid: e.target.checked })} />
        </label>
      )}
      {!kanTrillen && !kanGeluid && <p className="club-tm-menu-tekst">{t.geenSignaal}</p>}
      <p className="club-tm-menu-tekst">
        <Smartphone aria-hidden size={15} /> {t.scherm[SCHERM_SLEUTEL[scherm]]}
      </p>
      <button type="button" className="club-lidapp-knop club-lidapp-knop--breed" onClick={onAfronden} disabled={bezig}>
        <Flag aria-hidden size={17} /> {t.nuAfronden}
      </button>
    </section>
  )
}

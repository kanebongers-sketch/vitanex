'use client'

import { Flag, Smartphone, Vibrate, Volume2 } from 'lucide-react'
import type { SchermStatus, Signaal } from './toestel'

interface TrainingMenuProps {
  signaal: Signaal
  scherm: SchermStatus
  bezig: boolean
  onAfronden: () => void
}

const SCHERM_TEKST: Record<SchermStatus, string> = {
  aan: 'Je scherm blijft aan zolang de training open is.',
  'niet-ondersteund': 'Je scherm kan vanzelf uitgaan. Geen probleem: de rust telt gewoon door en je invoer blijft bewaard.',
  geweigerd: 'Je telefoon laat het scherm nu vanzelf uitgaan (bijvoorbeeld door batterijbesparing). De rust telt gewoon door.',
}

/** Instellingen tijdens de training: signaal aan het einde van de rust, en eerder afronden. */
export function TrainingMenu({ signaal, scherm, bezig, onAfronden }: TrainingMenuProps) {
  const { keuze, kanTrillen, kanGeluid, zet } = signaal
  return (
    <section className="club-tm-menu" aria-label="Instellingen training">
      <p className="club-tm-menu-kop">Einde van de rust</p>
      {kanTrillen && (
        <label className="club-tm-schakel">
          <Vibrate aria-hidden size={18} />
          <span>Trillen</span>
          <input type="checkbox" role="switch" checked={keuze.trillen} onChange={(e) => zet({ trillen: e.target.checked })} />
        </label>
      )}
      {kanGeluid && (
        <label className="club-tm-schakel">
          <Volume2 aria-hidden size={18} />
          <span>Geluid</span>
          <input type="checkbox" role="switch" checked={keuze.geluid} onChange={(e) => zet({ geluid: e.target.checked })} />
        </label>
      )}
      {!kanTrillen && !kanGeluid && <p className="club-tm-menu-tekst">Deze telefoon kan geen signaal geven; de timer in beeld laat zien wanneer je weer kunt.</p>}
      <p className="club-tm-menu-tekst">
        <Smartphone aria-hidden size={15} /> {SCHERM_TEKST[scherm]}
      </p>
      <button type="button" className="club-lidapp-knop club-lidapp-knop--breed" onClick={onAfronden} disabled={bezig}>
        <Flag aria-hidden size={17} /> Training nu afronden
      </button>
    </section>
  )
}

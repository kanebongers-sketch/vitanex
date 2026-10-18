import { AlertCircle, CheckCircle2 } from 'lucide-react'
import type { Melding } from './useActie'

// Terugkoppeling na een actie, in de stijl van de ledenapp. Altijd een
// live-regio, zodat een schermlezer de uitkomst voorleest.

export function Terugkoppeling({ melding }: { melding: Melding | null }) {
  return (
    <div role="status" aria-live="polite" className="club-cm-live">
      {melding && (
        <p className={`club-lidapp-bericht${melding.soort === 'fout' ? ' club-lidapp-bericht--fout' : ''}`}>
          {melding.soort === 'fout' ? <AlertCircle size={18} aria-hidden /> : <CheckCircle2 size={18} aria-hidden />}
          <span>{melding.tekst}</span>
        </p>
      )}
    </div>
  )
}

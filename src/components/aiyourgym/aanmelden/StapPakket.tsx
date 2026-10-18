import { Check } from 'lucide-react'
import type { PakketSleutel } from '@/lib/aiyourgym/pakketten'
import type { PakketKeuze } from './types'

// Stap 1: een pakket kiezen. Een groep keuzerondjes (pijltjestoetsen werken),
// vormgegeven als kaarten. Geen bedragen: die toont Stripe voor het betalen.

interface StapPakketProps {
  pakketten: readonly PakketKeuze[]
  gekozen: PakketSleutel | ''
  proefdagen: number
  fout?: string
  onKies: (sleutel: PakketSleutel) => void
}

function vestigingenTekst(p: PakketKeuze): string {
  if (p.onbeperkt) return 'Onbeperkt aantal vestigingen'
  return p.maxVestigingen === 1 ? 'Een vestiging' : `Tot ${p.maxVestigingen} vestigingen`
}

export function StapPakket({ pakketten, gekozen, proefdagen, fout, onKies }: StapPakketProps) {
  return (
    <fieldset className="aan-fieldset" aria-describedby={fout ? 'pakket-fout' : undefined}>
      <legend className="aan-legend">Kies je pakket</legend>
      <p className="aan-uitleg">Elk pakket heeft de ledenapp in je eigen huisstijl. In Club en Keten zit persoonlijke hulp bij het inrichten.</p>
      <div className="aan-pakketten">
        {pakketten.map((p) => (
          <label key={p.sleutel} className="aan-pakket" data-gekozen={gekozen === p.sleutel ? 'ja' : undefined}>
            <input type="radio" name="pakket" value={p.sleutel} checked={gekozen === p.sleutel} onChange={() => onKies(p.sleutel)} className="ayg-sr" />
            <span className="aan-pakket-kop">
              <span className="aan-pakket-naam">{p.naam}</span>
              {p.aanbevolen && <span className="aan-chip aan-chip--accent">Aanbevolen</span>}
            </span>
            <span className="aan-pakket-voor">{p.voorWie}</span>
            <span className="aan-pakket-meta">
              <span>{vestigingenTekst(p)}</span>
              <span aria-hidden="true">·</span>
              <span>{p.open ? `${proefdagen} dagen gratis proberen` : 'Op aanvraag'}</span>
            </span>
            <ul className="aan-pakket-lijst">
              {p.inbegrepen.map((regel) => (
                <li key={regel}>
                  <Check size={15} strokeWidth={2.4} aria-hidden="true" />
                  {regel}
                </li>
              ))}
            </ul>
            <span className="aan-pakket-vink" aria-hidden="true">
              <Check size={16} strokeWidth={3} />
            </span>
          </label>
        ))}
      </div>
      {fout && (
        <p id="pakket-fout" className="aan-fout" role="alert">
          {fout}
        </p>
      )}
    </fieldset>
  )
}

import { Check } from 'lucide-react'
import { VOORSTEL_PER_SOORT, sorteerPakketten, type PakketSleutel } from '@/lib/aiyourgym/pakketten'
import { useTaal } from '@/lib/aiyourgym/taal/client'
import { AANMELD_FORMULIER } from '@/lib/aiyourgym/taal/woorden/website/aanmelden'
import { PAKKET_TEKST, pakketTekst } from '@/lib/aiyourgym/taal/woorden/website/pakketten'
import { PAKKET_NAMEN } from '@/lib/aiyourgym/taal/woorden/algemeen/pakketten'
import type { PakketKeuze } from './types'

// Stap 1: een of meer losse pakketten kiezen (besluit Kane 29-10-2026: elk
// pakket werkt los van de andere). Selectievakjes, vormgegeven als kaarten;
// erboven een voorstel per soort sportschool dat de keuze in een klik invult.
// Geen bedragen: die toont Stripe voor het betalen.

interface StapPakketProps {
  pakketten: readonly PakketKeuze[]
  gekozen: readonly PakketSleutel[]
  fout?: string
  onWissel: (sleutel: PakketSleutel) => void
  onVoorstel: (lijst: PakketSleutel[]) => void
}

const SOORTEN = Object.keys(VOORSTEL_PER_SOORT) as (keyof (typeof PAKKET_TEKST)['nl']['soorten'])[]

export function StapPakket({ pakketten, gekozen, fout, onWissel, onVoorstel }: StapPakketProps) {
  const taal = useTaal()
  const t = AANMELD_FORMULIER[taal]
  const w = PAKKET_TEKST[taal]
  const zelfde = (lijst: readonly PakketSleutel[]) => sorteerPakketten(lijst).join() === sorteerPakketten(gekozen).join()
  return (
    <fieldset className="aan-fieldset" aria-describedby={fout ? 'pakket-fout' : 'pakket-uitleg'}>
      <legend className="aan-legend">{t.kiesPakket}</legend>
      <p className="aan-uitleg" id="pakket-uitleg">{PAKKET_NAMEN[taal].kies} {t.pakketUitleg}</p>
      <div className="aan-voorstel" role="group" aria-label={w.voorstel}>
        <span className="aan-voorstel-label">{w.voorstel}</span>
        {SOORTEN.map((soort) => (
          <button key={soort} type="button" className="aan-chip aan-voorstel-chip" aria-pressed={zelfde(VOORSTEL_PER_SOORT[soort])} onClick={() => onVoorstel(sorteerPakketten(VOORSTEL_PER_SOORT[soort]))}>
            {w.soorten[soort]}
          </button>
        ))}
      </div>
      <div className="aan-pakketten">
        {pakketten.map((p) => {
          const aan = gekozen.includes(p.sleutel)
          const tekst = pakketTekst(p.sleutel, taal)
          return (
            <label key={p.sleutel} className="aan-pakket" data-gekozen={aan ? 'ja' : undefined}>
              <input type="checkbox" name="pakketten" value={p.sleutel} checked={aan} onChange={() => onWissel(p.sleutel)} className="ayg-sr" />
              <span className="aan-pakket-kop">
                <span className="aan-pakket-naam">{tekst.naam}</span>
                {aan && <span className="aan-chip aan-chip--accent">{w.gekozen}</span>}
              </span>
              <span className="aan-pakket-voor">{tekst.voorWie}</span>
              <span className="aan-pakket-meta">
                <span>{w.perVestiging}</span>
              </span>
              <ul className="aan-pakket-lijst">
                {tekst.inbegrepen.map((regel) => (
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
          )
        })}
      </div>
      {fout && (
        <p id="pakket-fout" className="aan-fout" role="alert">
          {fout}
        </p>
      )}
    </fieldset>
  )
}

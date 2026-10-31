import { Check, Lock } from 'lucide-react'
import { isBasis, type PakketSleutel } from '@/lib/aiyourgym/pakketten'
import { useTaal } from '@/lib/aiyourgym/taal/client'
import { AANMELD_FORMULIER } from '@/lib/aiyourgym/taal/woorden/website/aanmelden'
import { PAKKET_TEKST, pakketTekst } from '@/lib/aiyourgym/taal/woorden/website/pakketten'
import { PAKKET_NAMEN, pakketWeergave } from '@/lib/aiyourgym/taal/woorden/algemeen/pakketten'
import type { PakketKeuze } from './types'

// Stap 1: basis met add-ons (besluit Kane 31-10-2026). De basis
// (Ledenadministratie) staat vast aangevinkt met een korte uitleg; de vijf
// add-ons zijn selectievakjes, vormgegeven als kaarten. Niets van de add-ons
// staat vooraf aan (besluit Kane 30-10-2026): de klant kiest zelf.
// Geen bedragen: die toont Stripe voor het betalen. Wel een regel dat de prijs
// een staffel per vestiging volgt (besluit Kane 31-10-2026), zonder bedrag.

interface StapPakketProps {
  pakketten: readonly PakketKeuze[]
  gekozen: readonly PakketSleutel[]
  fout?: string
  onWissel: (sleutel: PakketSleutel) => void
}

export function StapPakket({ pakketten, gekozen, fout, onWissel }: StapPakketProps) {
  const taal = useTaal()
  const t = AANMELD_FORMULIER[taal]
  const w = PAKKET_TEKST[taal]
  const n = PAKKET_NAMEN[taal]
  return (
    <fieldset className="aan-fieldset" aria-describedby={fout ? 'pakket-fout' : 'pakket-uitleg'}>
      <legend className="aan-legend">{t.kiesPakket}</legend>
      <p className="aan-uitleg" id="pakket-uitleg">{n.kies} {t.pakketUitleg}</p>
      <div className="aan-pakketten">
        {pakketten.map((p) => {
          const basis = isBasis(p.sleutel)
          const aan = basis || gekozen.includes(p.sleutel)
          const tekst = pakketTekst(p.sleutel, taal)
          return (
            <label key={p.sleutel} className="aan-pakket" data-gekozen={aan ? 'ja' : undefined} data-basis={basis ? 'ja' : undefined}>
              <input
                type="checkbox"
                name="pakketten"
                value={p.sleutel}
                checked={aan}
                disabled={basis}
                aria-describedby={basis ? 'pakket-basis-vast' : undefined}
                onChange={() => onWissel(p.sleutel)}
                className="ayg-sr"
              />
              <span className="aan-pakket-kop">
                <span className="aan-pakket-naam">{basis ? pakketWeergave(p.sleutel, taal) : tekst.naam}</span>
                <span className={`aan-chip${aan ? ' aan-chip--accent' : ''}`}>{basis ? n.basisLabel : aan ? w.gekozen : n.addOnLabel}</span>
              </span>
              <span className="aan-pakket-voor">{tekst.voorWie}</span>
              {basis && (
                <span className="aan-pakket-meta" id="pakket-basis-vast">
                  <span>{n.basisVast}</span>
                </span>
              )}
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
                {basis ? <Lock size={14} strokeWidth={2.6} /> : <Check size={16} strokeWidth={3} />}
              </span>
            </label>
          )
        })}
      </div>
      <p className="aan-uitleg">{w.staffel}</p>
      {fout && (
        <p id="pakket-fout" className="aan-fout" role="alert">
          {fout}
        </p>
      )}
    </fieldset>
  )
}

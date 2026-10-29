'use client'

import type { VestigingInfo } from '@/lib/club/kern/vestigingen'
import { DEELNAME_SOORTEN } from '@/lib/club/challenges/model'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { CHALLENGES } from '@/lib/aiyourgym/taal/woorden/club/challenges'
import type { FormStaat } from './ChallengeFormulier'

// Het tweede deel van het formulier: voor wie, hoe leden meedoen, en wat de
// ledenapp toont. De ranglijst toont alleen voornaam en eerste letter.

interface Props {
  staat: FormStaat
  vestigingen: readonly VestigingInfo[]
  zet: <K extends keyof FormStaat>(k: K, v: FormStaat[K]) => void
}

export function ChallengeOpties({ staat: s, vestigingen, zet }: Props) {
  const alle = s.vestigingen.length === 0
  const tc = useTekst(CHALLENGES)
  const t = tc.formulier
  const wissel = (sleutel: string, aan: boolean) => {
    const basis = alle ? vestigingen.map((v) => v.sleutel) : s.vestigingen
    const nieuw = aan ? [...new Set([...basis, sleutel])] : basis.filter((v) => v !== sleutel)
    // Alles aan = alle (ook toekomstige vestigingen); niets aan mag niet, dan blijft het alle.
    zet('vestigingen', nieuw.length === vestigingen.length || nieuw.length === 0 ? [] : nieuw)
  }

  return (
    <>
      {vestigingen.length > 1 && (
        <fieldset className="club-challenges-veldset">
          <legend className="club-label">{t.voorLeden}</legend>
          <div className="club-challenges-vinkjes">
            <label className="club-challenges-vinkje">
              <input type="checkbox" checked={alle} onChange={(e) => zet('vestigingen', e.target.checked ? [] : [vestigingen[0].sleutel])} />
              <span>{t.alleVestigingen}</span>
            </label>
            {vestigingen.map((v) => (
              <label key={v.sleutel} className="club-challenges-vinkje">
                <input type="checkbox" checked={alle || s.vestigingen.includes(v.sleutel)} onChange={(e) => wissel(v.sleutel, e.target.checked)} />
                <span>{v.naam}</span>
              </label>
            ))}
          </div>
          <p className="club-hint">{t.vestigingHint}</p>
        </fieldset>
      )}

      <fieldset className="club-challenges-veldset">
        <legend className="club-label">{t.meedoen}</legend>
        <div className="club-segment" role="group" aria-label={t.hoe}>
          {DEELNAME_SOORTEN.map((d) => (
            <button key={d} type="button" aria-pressed={s.deelname === d} onClick={() => zet('deelname', d)}>
              {tc.deelname[d]}
            </button>
          ))}
        </div>
        <p className="club-hint">{s.deelname === 'automatisch' ? t.automatischHint : t.inschrijvenHint}</p>
      </fieldset>

      <fieldset className="club-challenges-veldset">
        <legend className="club-label">{t.ledenapp}</legend>
        <label className="club-challenges-vinkje">
          <input type="checkbox" checked={s.zichtbaarApp} onChange={(e) => zet('zichtbaarApp', e.target.checked)} />
          <span>{t.tonen}</span>
        </label>
        <label className="club-challenges-vinkje">
          <input type="checkbox" checked={s.ranglijst} onChange={(e) => zet('ranglijst', e.target.checked)} />
          <span>{t.ranglijst}</span>
        </label>
      </fieldset>
    </>
  )
}

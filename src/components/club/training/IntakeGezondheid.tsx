'use client'

import { ShieldCheck } from 'lucide-react'
import { PARQ_VRAGEN, type ParqSleutel } from '@/lib/club/training/intake'
import { ZONE_LABEL, ZONES } from '@/lib/club/training/typen'
import { KeuzeChips, wissel } from './KeuzeChips'
import type { IntakeStaat } from './intake-staat'

interface IntakeGezondheidProps {
  s: IntakeStaat
  zet: (deel: Partial<IntakeStaat>) => void
}

/**
 * Gezondheid: bijzondere persoonsgegevens (AVG). De vragen verschijnen pas na
 * een expliciet aangevinkte toestemming. Vinkt de trainer hem weer uit, dan
 * gaat er niets van mee bij opslaan (en de server weigert het ook).
 */
export function IntakeGezondheid({ s, zet }: IntakeGezondheidProps) {
  function antwoord(sleutel: ParqSleutel, ja: boolean) {
    zet({
      parqJa: ja ? [...s.parqJa.filter((x) => x !== sleutel), sleutel] : s.parqJa.filter((x) => x !== sleutel),
      parqBeantwoord: s.parqBeantwoord.includes(sleutel) ? s.parqBeantwoord : [...s.parqBeantwoord, sleutel],
    })
  }

  return (
    <>
      <label className={`club-training-toestemming ${s.toestemming ? 'is-aan' : ''}`}>
        <input type="checkbox" checked={s.toestemming} onChange={(e) => zet({ toestemming: e.target.checked })} />
        <span>
          <strong><ShieldCheck aria-hidden size={16} /> Het lid geeft toestemming om gezondheidsgegevens vast te leggen</strong>
          <span className="club-hint">
            Blessures, klachten, medicatie, de gezondheidsvragen, rusthartslag en bloeddruk zijn bijzondere persoonsgegevens.
            Vraag het lid hardop of dat mag. Zonder vinkje wordt hier niets van opgeslagen.
          </span>
        </span>
      </label>

      {s.toestemming && (
        <div className="club-training-gezondheid">
          <KeuzeChips legend="Blessures of klachten aan" opties={ZONES} labels={ZONE_LABEL} gekozen={s.blessures} onWissel={(z) => zet({ blessures: wissel(s.blessures, z) })} />
          <div className="club-formrij">
            <label className="club-veld">
              <span>Toelichting blessure</span>
              <input className="club-invoer" value={s.blessureToelichting} maxLength={500} onChange={(e) => zet({ blessureToelichting: e.target.value })} placeholder="Bijvoorbeeld: meniscus links, 2024" />
            </label>
            <label className="club-veld">
              <span>Andere klachten</span>
              <input className="club-invoer" value={s.klachten} maxLength={500} onChange={(e) => zet({ klachten: e.target.value })} />
            </label>
            <label className="club-veld">
              <span>Medicatie</span>
              <input className="club-invoer" value={s.medicatie} maxLength={300} onChange={(e) => zet({ medicatie: e.target.value })} />
            </label>
          </div>
          <fieldset className="club-training-fieldset">
            <legend className="club-label">Gezondheidsvragen voor het sporten</legend>
            <ol className="club-training-parq">
              {PARQ_VRAGEN.map((v) => {
                const beantwoord = s.parqBeantwoord.includes(v.sleutel)
                const ja = s.parqJa.includes(v.sleutel)
                return (
                  <li key={v.sleutel}>
                    <span>{v.vraag}</span>
                    <span className="club-segment" role="group" aria-label={v.vraag}>
                      <button type="button" aria-pressed={beantwoord && !ja} onClick={() => antwoord(v.sleutel, false)}>Nee</button>
                      <button type="button" aria-pressed={ja} onClick={() => antwoord(v.sleutel, true)} className={ja ? 'club-training-ja' : ''}>Ja</button>
                    </span>
                  </li>
                )
              })}
            </ol>
            {s.parqJa.length > 0 && (
              <p className="club-melding club-melding--fout" role="status">
                Een of meer keer ja: laat het lid eerst met de huisarts overleggen voordat de intensiteit omhoog gaat.
              </p>
            )}
          </fieldset>
        </div>
      )}
    </>
  )
}

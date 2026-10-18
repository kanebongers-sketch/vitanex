import { DEMO_MOMENTEN, MAX_DEMO_VESTIGINGEN, type DEMO_SOORTEN, type DemoFouten } from '@/lib/aiyourgym/demo-aanvraag'
import { Veld } from '@/components/aiyourgym/aanmelden/Veld'
import type { DemoInvoer, WijzigDemo } from './types'

// Het deel van het demo-formulier met keuzes: aantal vestigingen, soort
// sportschool en wanneer het uitkomt om te bellen.

interface DemoKeuzesProps {
  invoer: DemoInvoer
  fouten: DemoFouten
  wijzig: WijzigDemo
  soorten: typeof DEMO_SOORTEN
}

export function DemoKeuzes({ invoer, fouten, wijzig, soorten }: DemoKeuzesProps) {
  return (
    <>
      <div className="aan-rij">
        <Veld
          id="dem-vestigingen"
          name="vestigingen"
          label="Aantal vestigingen"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={3}
          value={invoer.vestigingen}
          onChange={(e) => wijzig('vestigingen', e.target.value.replace(/\D/g, ''))}
          fout={fouten.vestigingen}
          hint={`1 tot ${MAX_DEMO_VESTIGINGEN}`}
          required
        />
        <div className="aan-veld" data-fout={fouten.soort ? 'ja' : undefined}>
          <label htmlFor="dem-soort" className="aan-label">
            Soort sportschool
          </label>
          <div className="aan-invoer dem-keuzelijst">
            <select id="dem-soort" name="soort" value={invoer.soort} onChange={(e) => wijzig('soort', e.target.value)} required
              aria-invalid={fouten.soort ? true : undefined} aria-describedby={fouten.soort ? 'dem-soort-fout' : undefined}>
              <option value="" disabled>
                Kies een soort
              </option>
              {soorten.map((s) => (
                <option key={s.sleutel} value={s.sleutel}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          {fouten.soort && <p id="dem-soort-fout" className="aan-fout" role="alert">{fouten.soort}</p>}
        </div>
      </div>
      <fieldset className="aan-fieldset dem-momenten" data-fout={fouten.moment ? 'ja' : undefined} aria-describedby={fouten.moment ? 'dem-moment-fout' : undefined}>
        <legend className="aan-label">Wanneer komt het je uit om te bellen?</legend>
        <div className="dem-chips">
          {DEMO_MOMENTEN.map((m, i) => (
            <label key={m.sleutel} className="dem-chip" data-gekozen={invoer.moment === m.sleutel ? '' : undefined}>
              <input type="radio" name="moment" value={m.sleutel} checked={invoer.moment === m.sleutel} onChange={() => wijzig('moment', m.sleutel)}
                aria-invalid={fouten.moment && i === 0 ? true : undefined} />
              {m.label}
            </label>
          ))}
        </div>
        {fouten.moment && <p id="dem-moment-fout" className="aan-fout" role="alert">{fouten.moment}</p>}
      </fieldset>
    </>
  )
}

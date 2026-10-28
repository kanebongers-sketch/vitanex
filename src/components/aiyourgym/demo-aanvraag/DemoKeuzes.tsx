import { DEMO_MOMENTEN, MAX_DEMO_VESTIGINGEN, type DEMO_SOORTEN, type DemoFouten } from '@/lib/aiyourgym/demo-aanvraag'
import { Veld } from '@/components/aiyourgym/aanmelden/Veld'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { DEMO_AANVRAAG } from '@/lib/aiyourgym/taal/woorden/website/demo-aanvraag'
import type { DemoInvoer, WijzigDemo } from './types'

// Het deel van het demo-formulier met keuzes: aantal vestigingen, soort
// sportschool en wanneer het uitkomt om te bellen. Labels in de taal van de
// pagina (DEMO_AANVRAAG); de waarden blijven de sleutels uit demo-aanvraag.ts.

interface DemoKeuzesProps {
  invoer: DemoInvoer
  fouten: DemoFouten
  wijzig: WijzigDemo
  soorten: typeof DEMO_SOORTEN
}

export function DemoKeuzes({ invoer, fouten, wijzig, soorten }: DemoKeuzesProps) {
  const t = useTekst(DEMO_AANVRAAG)
  return (
    <>
      <div className="aan-rij">
        <Veld
          id="dem-vestigingen"
          name="vestigingen"
          label={t.vestigingen}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={3}
          value={invoer.vestigingen}
          onChange={(e) => wijzig('vestigingen', e.target.value.replace(/\D/g, ''))}
          fout={fouten.vestigingen}
          hint={t.vestigingenHint(MAX_DEMO_VESTIGINGEN)}
          required
        />
        <div className="aan-veld" data-fout={fouten.soort ? 'ja' : undefined}>
          <label htmlFor="dem-soort" className="aan-label">
            {t.soort}
          </label>
          <div className="aan-invoer dem-keuzelijst">
            <select id="dem-soort" name="soort" value={invoer.soort} onChange={(e) => wijzig('soort', e.target.value)} required
              aria-invalid={fouten.soort ? true : undefined} aria-describedby={fouten.soort ? 'dem-soort-fout' : undefined}>
              <option value="" disabled>
                {t.kiesSoort}
              </option>
              {soorten.map((s) => (
                <option key={s.sleutel} value={s.sleutel}>
                  {t.soorten[s.sleutel]}
                </option>
              ))}
            </select>
          </div>
          {fouten.soort && <p id="dem-soort-fout" className="aan-fout" role="alert">{fouten.soort}</p>}
        </div>
      </div>
      <fieldset className="aan-fieldset dem-momenten" data-fout={fouten.moment ? 'ja' : undefined} aria-describedby={fouten.moment ? 'dem-moment-fout' : undefined}>
        <legend className="aan-label">{t.moment}</legend>
        <div className="dem-chips">
          {DEMO_MOMENTEN.map((m, i) => (
            <label key={m.sleutel} className="dem-chip" data-gekozen={invoer.moment === m.sleutel ? '' : undefined}>
              <input type="radio" name="moment" value={m.sleutel} checked={invoer.moment === m.sleutel} onChange={() => wijzig('moment', m.sleutel)}
                aria-invalid={fouten.moment && i === 0 ? true : undefined} aria-describedby={fouten.moment && i === 0 ? 'dem-moment-fout' : undefined} />
              {t.momenten[m.sleutel]}
            </label>
          ))}
        </div>
        {fouten.moment && <p id="dem-moment-fout" className="aan-fout" role="alert">{fouten.moment}</p>}
      </fieldset>
    </>
  )
}

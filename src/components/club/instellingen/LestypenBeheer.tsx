'use client'

import { useState, type FormEvent } from 'react'
import { Plus, Save } from 'lucide-react'
import { LES_SOORTEN, SOORT_LABEL, type Lestype } from '@/lib/club/rooster/typen'
import { useClubActie } from '@/components/club/rooster/vraag'
import { bewaarItem } from './opslaan'

// Lestypen gelden voor alle vestigingen: Spinning is overal Spinning. De soort
// bepaalt het kleurstreepje in het rooster.

const INTENSITEIT = ['', 'Rustig', 'Gemiddeld', 'Zwaar']

interface Velden {
  naam: string
  omschrijving: string
  soort: string
  duurMin: string
  intensiteit: string
}

function uitType(t: Lestype | null): Velden {
  return {
    naam: t?.naam ?? '',
    omschrijving: t?.omschrijving ?? '',
    soort: t?.soort ?? 'kracht',
    duurMin: String(t?.duurMin ?? 60),
    intensiteit: String(t?.intensiteit ?? 2),
  }
}

function LestypeFormulier({ type, vestiging, onKlaar }: { type: Lestype | null; vestiging: string; onKlaar?: () => void }) {
  const [v, setV] = useState<Velden>(() => uitType(type))
  const { bezig, fout, voerUit } = useClubActie()
  const zet = (k: keyof Velden) => (e: { target: { value: string } }) => setV((oud) => ({ ...oud, [k]: e.target.value }))

  async function bewaar(e: FormEvent) {
    e.preventDefault()
    const velden = { naam: v.naam, omschrijving: v.omschrijving, soort: v.soort, duurMin: Number(v.duurMin), intensiteit: Number(v.intensiteit) }
    const uit = await voerUit(() => bewaarItem('lestypen', vestiging, type?.id ?? null, velden))
    if (uit.ok && !type) setV(uitType(null))
    if (uit.ok) onKlaar?.()
  }

  return (
    <form className="club-instellingen-lestype club-rooster-soortstreep" data-soort={v.soort} onSubmit={bewaar}>
      <div className="club-formrij">
        <label className="club-veld">
          <span>Naam</span>
          <input className="club-invoer" required maxLength={60} value={v.naam} onChange={zet('naam')} />
        </label>
        <label className="club-veld">
          <span>Soort</span>
          <select className="club-invoer" value={v.soort} onChange={zet('soort')}>
            {LES_SOORTEN.map((s) => (
              <option key={s} value={s}>
                {SOORT_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="club-veld">
          <span>Duur (min)</span>
          <input className="club-invoer" type="number" min={10} max={240} required value={v.duurMin} onChange={zet('duurMin')} />
        </label>
        <label className="club-veld">
          <span>Intensiteit</span>
          <select className="club-invoer" value={v.intensiteit} onChange={zet('intensiteit')}>
            {[1, 2, 3].map((n) => (
              <option key={n} value={n}>
                {INTENSITEIT[n]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="club-veld">
        <span>Omschrijving voor leden</span>
        <textarea className="club-invoer" maxLength={600} rows={2} value={v.omschrijving} onChange={zet('omschrijving')} />
      </label>
      <div className="club-instellingen-formvoet">
        {fout && <p className="club-fout" role="alert">{fout}</p>}
        {type && (
          <label className="club-instellingen-check">
            <input type="checkbox" checked={type.actief} disabled={bezig} onChange={(e) => voerUit(() => bewaarItem('lestypen', vestiging, type.id, { actief: e.target.checked }))} />
            <span>{type.actief ? 'Op het rooster te zetten' : 'Uit'}</span>
          </label>
        )}
        <button type="submit" className={`club-knop club-knop--klein${type ? '' : ' club-knop--primair'}`} disabled={bezig}>
          {type ? <Save aria-hidden size={14} /> : <Plus aria-hidden size={14} />}
          {type ? 'Opslaan' : 'Lestype toevoegen'}
        </button>
      </div>
    </form>
  )
}

export function LestypenBeheer({ lestypen, vestiging }: { lestypen: Lestype[]; vestiging: string }) {
  return (
    <section className="club-instellingen-sectie">
      <p className="club-hint">Lestypen gelden voor alle vestigingen. De soort bepaalt het kleurstreepje in het rooster.</p>
      <div className="club-instellingen-lijst">
        {lestypen.map((t) => (
          <details key={t.id} className="club-instellingen-item" data-uit={!t.actief || undefined}>
            <summary>
              <span className="club-instellingen-item-naam">{t.naam}</span>
              <span className="club-zacht">
                {SOORT_LABEL[t.soort]} · {t.duurMin} min · {INTENSITEIT[t.intensiteit]}
              </span>
              {!t.actief && <span className="club-chip club-chip--uit">Uit</span>}
            </summary>
            <LestypeFormulier key={`${t.naam}-${t.soort}-${t.duurMin}-${t.intensiteit}-${t.omschrijving}`} type={t} vestiging={vestiging} />
          </details>
        ))}
      </div>
      <div className="club-kaart club-kaart--vlak">
        <h3 className="club-instellingen-kop">Nieuw lestype</h3>
        <LestypeFormulier type={null} vestiging={vestiging} />
      </div>
    </section>
  )
}

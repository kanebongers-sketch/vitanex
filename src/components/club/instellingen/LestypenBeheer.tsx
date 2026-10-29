'use client'

import { useState, type FormEvent } from 'react'
import { Plus, Save } from 'lucide-react'
import { LES_SOORTEN, type Lestype } from '@/lib/club/rooster/typen'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { INSTELLINGEN } from '@/lib/aiyourgym/taal/woorden/club/instellingen'
import { ROOSTER } from '@/lib/aiyourgym/taal/woorden/club/rooster'
import { useClubActie } from '@/components/club/rooster/vraag'
import { bewaarItem } from './opslaan'

// Lestypen gelden voor alle vestigingen: Spinning is overal Spinning. De soort
// bepaalt het kleurstreepje in het rooster.

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
  const t = useTekst(INSTELLINGEN)
  const soorten = useTekst(ROOSTER).soort

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
          <span>{t.algemeen.naam}</span>
          <input className="club-invoer" required maxLength={60} value={v.naam} onChange={zet('naam')} />
        </label>
        <label className="club-veld">
          <span>{t.lestypen.soort}</span>
          <select className="club-invoer" value={v.soort} onChange={zet('soort')}>
            {LES_SOORTEN.map((s) => (
              <option key={s} value={s}>
                {soorten[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="club-veld">
          <span>{t.lestypen.duur}</span>
          <input className="club-invoer" type="number" min={10} max={240} required value={v.duurMin} onChange={zet('duurMin')} />
        </label>
        <label className="club-veld">
          <span>{t.lestypen.intensiteit}</span>
          <select className="club-invoer" value={v.intensiteit} onChange={zet('intensiteit')}>
            {[1, 2, 3].map((n) => (
              <option key={n} value={n}>
                {t.lestypen.intensiteiten[n]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="club-veld">
        <span>{t.lestypen.omschrijving}</span>
        <textarea className="club-invoer" maxLength={600} rows={2} value={v.omschrijving} onChange={zet('omschrijving')} />
      </label>
      <div className="club-instellingen-formvoet">
        {fout && <p className="club-fout" role="alert">{fout}</p>}
        {type && (
          <label className="club-instellingen-check">
            <input type="checkbox" checked={type.actief} disabled={bezig} onChange={(e) => voerUit(() => bewaarItem('lestypen', vestiging, type.id, { actief: e.target.checked }))} />
            <span>{type.actief ? t.lestypen.opRooster : t.algemeen.uit}</span>
          </label>
        )}
        <button type="submit" className={`club-knop club-knop--klein${type ? '' : ' club-knop--primair'}`} disabled={bezig}>
          {type ? <Save aria-hidden size={14} /> : <Plus aria-hidden size={14} />}
          {type ? t.algemeen.opslaan : t.lestypen.toevoegen}
        </button>
      </div>
    </form>
  )
}

export function LestypenBeheer({ lestypen, vestiging }: { lestypen: Lestype[]; vestiging: string }) {
  const tekst = useTekst(INSTELLINGEN)
  const soorten = useTekst(ROOSTER).soort
  return (
    <section className="club-instellingen-sectie">
      <p className="club-hint">{tekst.lestypen.uitleg}</p>
      <div className="club-instellingen-lijst">
        {lestypen.map((t) => (
          <details key={t.id} className="club-instellingen-item" data-uit={!t.actief || undefined}>
            <summary>
              <span className="club-instellingen-item-naam">{t.naam}</span>
              <span className="club-zacht">
                {soorten[t.soort]} · {tekst.lestypen.min(t.duurMin)} · {tekst.lestypen.intensiteiten[t.intensiteit]}
              </span>
              {!t.actief && <span className="club-chip club-chip--uit">{tekst.algemeen.uit}</span>}
            </summary>
            <LestypeFormulier key={`${t.naam}-${t.soort}-${t.duurMin}-${t.intensiteit}-${t.omschrijving}`} type={t} vestiging={vestiging} />
          </details>
        ))}
      </div>
      <div className="club-kaart club-kaart--vlak">
        <h3 className="club-instellingen-kop">{tekst.lestypen.nieuw}</h3>
        <LestypeFormulier type={null} vestiging={vestiging} />
      </div>
    </section>
  )
}

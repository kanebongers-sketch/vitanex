'use client'

import { LEAD_BRONNEN, type Lead } from '@/lib/club/leads/model'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { LEADS } from '@/lib/aiyourgym/taal/woorden/club/leads'

interface LeadVeldenProps {
  /** Bestaande lead om te bewerken, of null voor een nieuwe. */
  lead: Lead | null
  medewerkers: { id: string; naam: string }[]
  standaardBron?: Lead['bron']
}

/** De velden van een lead als object voor de API (toestemming als boolean). */
export function veldenUitFormulier(form: HTMLFormElement): Record<string, unknown> {
  const data = new FormData(form)
  const tekst = (naam: string) => {
    const v = data.get(naam)
    return typeof v === 'string' ? v : ''
  }
  return {
    naam: tekst('naam'),
    telefoon: tekst('telefoon'),
    email: tekst('email'),
    bron: tekst('bron'),
    interesse: tekst('interesse'),
    medewerkerId: tekst('medewerkerId') || null,
    toestemming: data.get('toestemming') === 'ja',
  }
}

// De gegevens van een lead: zelfde velden bij nieuw en bewerken.
export function LeadVelden({ lead, medewerkers, standaardBron = 'balie' }: LeadVeldenProps) {
  const tekst = useTekst(LEADS)
  const t = tekst.velden
  return (
    <>
      <label className="club-veld">
        <span>{t.naam}</span>
        <input name="naam" className="club-invoer" required maxLength={120} autoComplete="off" defaultValue={lead?.naam ?? ''} placeholder={t.naamPlaats} />
      </label>
      <div className="club-formrij">
        <label className="club-veld">
          <span>{t.telefoon}</span>
          <input name="telefoon" type="tel" className="club-invoer" maxLength={40} autoComplete="off" defaultValue={lead?.telefoon ?? ''} />
        </label>
        <label className="club-veld">
          <span>{t.email}</span>
          <input name="email" type="email" className="club-invoer" maxLength={160} autoComplete="off" defaultValue={lead?.email ?? ''} />
        </label>
      </div>
      <div className="club-formrij">
        <label className="club-veld">
          <span>{t.bron}</span>
          <select name="bron" className="club-invoer" defaultValue={lead?.bron ?? standaardBron}>
            {LEAD_BRONNEN.map((b) => (
              <option key={b} value={b}>
                {tekst.bron[b]}
              </option>
            ))}
          </select>
        </label>
        <label className="club-veld">
          <span>{t.medewerker}</span>
          <select name="medewerkerId" className="club-invoer" defaultValue={lead?.medewerkerId ?? ''}>
            <option value="">{t.niemand}</option>
            {medewerkers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.naam}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="club-veld">
        <span>{t.interesse}</span>
        <input name="interesse" className="club-invoer" maxLength={200} defaultValue={lead?.interesse ?? ''} placeholder={t.interessePlaats} />
      </label>
      <label className="club-leads-toestemming">
        <input type="checkbox" name="toestemming" value="ja" required={lead === null} defaultChecked={lead?.toestemmingContact ?? false} />
        <span>
          {t.toestemming}
          {lead === null && <strong> {t.verplicht}</strong>}
        </span>
      </label>
    </>
  )
}

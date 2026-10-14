import { LEAD_BRONNEN, LEAD_BRON_LABEL, type Lead } from '@/lib/club/leads/model'

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
  return (
    <>
      <label className="club-veld">
        <span>Naam</span>
        <input name="naam" className="club-invoer" required maxLength={120} autoComplete="off" defaultValue={lead?.naam ?? ''} placeholder="Voornaam en achternaam" />
      </label>
      <div className="club-formrij">
        <label className="club-veld">
          <span>Telefoon</span>
          <input name="telefoon" type="tel" className="club-invoer" maxLength={40} autoComplete="off" defaultValue={lead?.telefoon ?? ''} />
        </label>
        <label className="club-veld">
          <span>E-mail</span>
          <input name="email" type="email" className="club-invoer" maxLength={160} autoComplete="off" defaultValue={lead?.email ?? ''} />
        </label>
      </div>
      <div className="club-formrij">
        <label className="club-veld">
          <span>Bron</span>
          <select name="bron" className="club-invoer" defaultValue={lead?.bron ?? standaardBron}>
            {LEAD_BRONNEN.map((b) => (
              <option key={b} value={b}>
                {LEAD_BRON_LABEL[b]}
              </option>
            ))}
          </select>
        </label>
        <label className="club-veld">
          <span>Medewerker</span>
          <select name="medewerkerId" className="club-invoer" defaultValue={lead?.medewerkerId ?? ''}>
            <option value="">Niemand</option>
            {medewerkers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.naam}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="club-veld">
        <span>Interesse</span>
        <input name="interesse" className="club-invoer" maxLength={200} defaultValue={lead?.interesse ?? ''} placeholder="Bijvoorbeeld afvallen, groepslessen, personal training" />
      </label>
      <label className="club-leads-toestemming">
        <input type="checkbox" name="toestemming" value="ja" required={lead === null} defaultChecked={lead?.toestemmingContact ?? false} />
        <span>
          Deze persoon geeft toestemming om contact op te nemen over lidmaatschap en een proefles.
          {lead === null && <strong> Verplicht.</strong>}
        </span>
      </label>
    </>
  )
}

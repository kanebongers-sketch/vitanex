import { ArrowRight, FileSpreadsheet } from 'lucide-react'
import { IMPORT_VELD_LABEL, type ImportVeld } from '@/lib/club/leden/import/kolommen'
import { Venster } from './kaders'

// Het ledenbestand inlezen: kolommen uit het CSV-bestand gekoppeld aan de velden
// van Club (de veldnamen komen uit Club zelf), met eerst een voorbeeld.

const KOPPELINGEN: readonly { kolom: string; veld: ImportVeld }[] = [
  { kolom: 'Roepnaam', veld: 'voornaam' },
  { kolom: 'Achternaam', veld: 'achternaam' },
  { kolom: 'E-mailadres', veld: 'email' },
  { kolom: 'Mobiel', veld: 'telefoon' },
  { kolom: 'Abonnement', veld: 'abonnement' },
  { kolom: 'Lid sinds', veld: 'lidSinds' },
]

export function ImportScherm() {
  const kolommen = 'minmax(0, 1fr) 18px minmax(0, 1fr)'
  return (
    <Venster actief="Leden">
      <div className="aygm-rooster-kop">
        <div>
          <p className="aygm-boven">Leden · ledenbestand inlezen</p>
          <p className="aygm-kop">
            <FileSpreadsheet size={14} aria-hidden /> leden-export.csv
          </p>
        </div>
        <span className="aygm-chip aygm-chip--ok">Kolommen herkend</span>
      </div>
      <div className="aygm-tabel">
        <div style={{ gridTemplateColumns: kolommen }}>
          <span>Kolom in je bestand</span>
          <span />
          <span>Veld</span>
        </div>
        {KOPPELINGEN.map((k) => (
          <div key={k.kolom} style={{ gridTemplateColumns: kolommen }}>
            <span>{k.kolom}</span>
            <ArrowRight size={13} aria-hidden />
            <span>
              <span className="aygm-chip">{IMPORT_VELD_LABEL[k.veld]}</span>
            </span>
          </div>
        ))}
      </div>
      <div className="aygm-tegels" style={{ marginTop: 12, marginBottom: 0 }}>
        <div className="aygm-tegel">
          <p className="aygm-boven">Nieuw</p>
          <p className="aygm-getal">214</p>
        </div>
        <div className="aygm-tegel">
          <p className="aygm-boven">Bijgewerkt</p>
          <p className="aygm-getal">37</p>
        </div>
        <div className="aygm-tegel">
          <p className="aygm-boven">Ongewijzigd</p>
          <p className="aygm-getal">412</p>
        </div>
        <div className="aygm-tegel">
          <p className="aygm-boven">Dubbel</p>
          <p className="aygm-getal">2</p>
        </div>
      </div>
    </Venster>
  )
}

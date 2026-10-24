import { ArrowRight, FileSpreadsheet } from 'lucide-react'
import { formatGetal } from '@/lib/aiyourgym/taal/formaat'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { IMPORT } from '@/lib/aiyourgym/taal/woorden/website/mockups/club'
import { Venster } from './kaders'

// Het ledenbestand inlezen: kolommen uit het CSV-bestand gekoppeld aan de velden
// van Club (de veldnamen komen in het Nederlands uit Club zelf), met eerst een
// voorbeeld. Teksten in de taal van de pagina (woordenboek IMPORT): kolom i hoort
// bij veld i.

/** Nieuw, bijgewerkt, ongewijzigd en dubbel, in de volgorde van t.tegels. */
const AANTALLEN = [214, 37, 412, 2] as const

export async function ImportScherm() {
  const taal = await getSiteTaal()
  const t = IMPORT[taal]
  const kolommen = 'minmax(0, 1fr) 18px minmax(0, 1fr)'
  return (
    <Venster actief="Leden">
      <div className="aygm-rooster-kop">
        <div>
          <p className="aygm-boven">{t.boven}</p>
          <p className="aygm-kop">
            <FileSpreadsheet size={14} aria-hidden /> {t.bestand}
          </p>
        </div>
        <span className="aygm-chip aygm-chip--ok">{t.herkend}</span>
      </div>
      <div className="aygm-tabel">
        <div style={{ gridTemplateColumns: kolommen }}>
          <span>{t.kolomInBestand}</span>
          <span />
          <span>{t.veld}</span>
        </div>
        {t.kolommen.map((kolom, i) => (
          <div key={kolom} style={{ gridTemplateColumns: kolommen }}>
            <span>{kolom}</span>
            <ArrowRight size={13} aria-hidden />
            <span>
              <span className="aygm-chip">{t.velden[i]}</span>
            </span>
          </div>
        ))}
      </div>
      <div className="aygm-tegels" style={{ marginTop: 12, marginBottom: 0 }}>
        {AANTALLEN.map((aantal, i) => (
          <div key={t.tegels[i]} className="aygm-tegel">
            <p className="aygm-boven">{t.tegels[i]}</p>
            <p className="aygm-getal">{formatGetal(aantal, taal)}</p>
          </div>
        ))}
      </div>
    </Venster>
  )
}

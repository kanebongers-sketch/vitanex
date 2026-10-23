import { Download } from 'lucide-react'
import { Venster } from './kaders'

// Beheer en planning: cijfers per kalendermaand en het personeelsrooster met uren.

const TEGELS = [
  { label: 'Nieuwe leden', waarde: '38' },
  { label: 'Bezoeken', waarde: '4.912' },
  { label: 'Bezetting lessen', waarde: '81%' },
  { label: 'Opzeggingen', waarde: '11' },
] as const

const MAANDEN = [52, 61, 48, 70, 66, 74, 69, 82, 78, 88] as const

export function CijfersScherm() {
  return (
    <Venster actief="Beheer">
      <div className="aygm-rooster-kop">
        <div>
          <p className="aygm-boven">Cijfers · 1 tot en met 31 oktober</p>
          <p className="aygm-kop">Oktober 2026</p>
        </div>
        <span className="aygm-knopje aygm-knopje--rand">
          <Download size={12} aria-hidden /> CSV
        </span>
      </div>
      <div className="aygm-tegels">
        {TEGELS.map((t) => (
          <div key={t.label} className="aygm-tegel">
            <p className="aygm-boven">{t.label}</p>
            <p className="aygm-getal">{t.waarde}</p>
          </div>
        ))}
      </div>
      <div className="aygm-staven">
        {MAANDEN.map((h, i) => (
          <span key={i} style={{ height: `${h}%` }} data-nu={i === MAANDEN.length - 1 ? '' : undefined} />
        ))}
      </div>
    </Venster>
  )
}

const DIENSTEN = [
  { ini: 'DK', naam: 'Daan', dienst: 'Ma 07:00 tot 13:00', status: 'Verwerkt', soort: 'ok' },
  { ini: 'IV', naam: 'Iris', dienst: 'Ma 13:00 tot 19:00', status: 'Goedgekeurd', soort: 'ok' },
  { ini: 'SB', naam: 'Sem', dienst: 'Di 07:00 tot 13:00', status: 'Gewerkt', soort: '' },
  { ini: 'FA', naam: 'Fleur', dienst: 'Di 17:00 tot 23:00', status: 'Gepland', soort: '' },
] as const

export function PersoneelScherm() {
  const kolommen = 'minmax(0, 0.8fr) minmax(0, 1.3fr) auto'
  return (
    <Venster actief="Planning" hier="Personeel">
      <div className="aygm-rooster-kop">
        <div>
          <p className="aygm-boven">Personeel · week 43</p>
          <p className="aygm-kop">Diensten en uren</p>
        </div>
        <span className="aygm-knopje">Export uren</span>
      </div>
      <div className="aygm-tabel">
        <div style={{ gridTemplateColumns: kolommen }}>
          <span>Medewerker</span>
          <span>Dienst</span>
          <span>Uren</span>
        </div>
        {DIENSTEN.map((d) => (
          <div key={d.dienst} style={{ gridTemplateColumns: kolommen }}>
            <span className="aygm-wie">
              <span className="aygm-avatar">{d.ini}</span>
              <span>{d.naam}</span>
            </span>
            <span>{d.dienst}</span>
            <span>
              <span className={d.soort ? `aygm-chip aygm-chip--${d.soort}` : 'aygm-chip'}>{d.status}</span>
            </span>
          </div>
        ))}
      </div>
    </Venster>
  )
}

import { Download } from 'lucide-react'
import { formatGetal, formatProcent } from '@/lib/aiyourgym/taal/formaat'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { BEHEER } from '@/lib/aiyourgym/taal/woorden/website/mockups/club'
import { Avatar } from './Avatar'
import { Venster } from './kaders'
import { COACHES } from './voorbeeld'

// Beheer en planning: cijfers per kalendermaand en het personeelsrooster met uren.
// Teksten in de taal van de pagina (woordenboek BEHEER), getallen via formaat.ts.

/** Nieuwe leden, bezoeken, bezetting (fractie) en opzeggingen, in de volgorde van t.tegels. */
const TEGELS = [
  { waarde: 38, soort: 'getal' },
  { waarde: 4912, soort: 'getal' },
  { waarde: 0.81, soort: 'procent' },
  { waarde: 11, soort: 'getal' },
] as const

const MAANDEN = [52, 61, 48, 70, 66, 74, 69, 82, 78, 88] as const

export async function CijfersScherm() {
  const taal = await getSiteTaal()
  const t = BEHEER[taal]
  return (
    <Venster actief="Beheer">
      <div className="aygm-rooster-kop">
        <div>
          <p className="aygm-boven">{t.periode}</p>
          <p className="aygm-kop">{t.maand}</p>
        </div>
        <span className="aygm-knopje aygm-knopje--rand">
          <Download size={12} aria-hidden /> CSV
        </span>
      </div>
      <div className="aygm-tegels">
        {TEGELS.map((tegel, i) => (
          <div key={t.tegels[i]} className="aygm-tegel">
            <p className="aygm-boven">{t.tegels[i]}</p>
            <p className="aygm-getal">{tegel.soort === 'procent' ? formatProcent(tegel.waarde, taal) : formatGetal(tegel.waarde, taal)}</p>
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

/** Dag is de index in t.dagen. */
const DIENSTEN = [
  { ...COACHES[0], dag: 0, van: '06:00', tot: '12:00', status: 'verwerkt', soort: 'ok' },
  { ...COACHES[1], dag: 0, van: '16:00', tot: '22:00', status: 'goedgekeurd', soort: 'ok' },
  { ...COACHES[2], dag: 1, van: '06:00', tot: '12:00', status: 'gewerkt', soort: '' },
  { ...COACHES[3], dag: 1, van: '17:00', tot: '23:00', status: 'gepland', soort: '' },
] as const

export async function PersoneelScherm() {
  const t = BEHEER[await getSiteTaal()]
  const kolommen = 'minmax(0, 0.8fr) minmax(0, 1.3fr) auto'
  return (
    <Venster actief="Planning" hier="Personeel">
      <div className="aygm-rooster-kop">
        <div>
          <p className="aygm-boven">{t.personeelBoven}</p>
          <p className="aygm-kop">{t.personeelKop}</p>
        </div>
        <span className="aygm-knopje">{t.exportUren}</span>
      </div>
      <div className="aygm-tabel">
        <div style={{ gridTemplateColumns: kolommen }}>
          {t.kolommen.map((k) => (
            <span key={k}>{k}</span>
          ))}
        </div>
        {DIENSTEN.map((d) => (
          <div key={`${d.ini}-${d.van}`} style={{ gridTemplateColumns: kolommen }}>
            <span className="aygm-wie">
              <Avatar naam={d.naam} maat={26} className="aygm-avatar" />
              <span>{d.naam}</span>
            </span>
            <span>{t.dienst(t.dagen[d.dag] ?? '', d.van, d.tot)}</span>
            <span>
              <span className={d.soort ? `aygm-chip aygm-chip--${d.soort}` : 'aygm-chip'}>{t.status[d.status]}</span>
            </span>
          </div>
        ))}
      </div>
    </Venster>
  )
}

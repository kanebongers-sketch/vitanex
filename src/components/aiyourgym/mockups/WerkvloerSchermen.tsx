import { Check, Phone, Search } from 'lucide-react'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { WERKVLOER } from '@/lib/aiyourgym/taal/woorden/website/mockups/club'
import { Venster } from './kaders'

// Werkvloer: check-in aan de balie, taken en poetslijsten, en wie je vandaag
// opvolgt. De namen van de opvolgregels komen in het Nederlands uit Club zelf;
// alle teksten staan in de taal van de pagina (woordenboek WERKVLOER).

const BINNEN = [
  { ini: 'SB', naam: 'Sanne Bakker', tijd: '09:12', status: 'actief', soort: 'ok' },
  { ini: 'MV', naam: 'Mo de Vries', tijd: '09:08', status: 'proeflid', soort: '' },
  { ini: 'LJ', naam: 'Lotte Jansen', tijd: '09:03', status: 'geenToegang', soort: 'letop' },
  { ini: 'TK', naam: 'Tim Kuijpers', tijd: '08:57', status: 'actief', soort: 'ok' },
] as const

export async function CheckinScherm() {
  const t = WERKVLOER[await getSiteTaal()]
  const kolommen = 'minmax(0, 1fr) 44px auto'
  return (
    <Venster actief="Werkvloer" hier="Vandaag">
      <div className="aygm-rooster-kop">
        <div>
          <p className="aygm-boven">{t.checkinBoven}</p>
          <p className="aygm-kop">{t.nuBinnen(23)}</p>
        </div>
        <span className="aygm-chip aygm-chip--accent">{t.qrOfNaam}</span>
      </div>
      <div className="aygm-zoek">
        <Search size={14} aria-hidden /> {t.zoek}
      </div>
      <div className="aygm-tabel">
        <div style={{ gridTemplateColumns: kolommen }}>
          {t.kolommen.map((k) => (
            <span key={k}>{k}</span>
          ))}
        </div>
        {BINNEN.map((r) => (
          <div key={r.naam} style={{ gridTemplateColumns: kolommen }}>
            <span className="aygm-wie">
              <span className="aygm-avatar">{r.ini}</span>
              <span>{r.naam}</span>
            </span>
            <span>{r.tijd}</span>
            <span>
              <span className={r.soort ? `aygm-chip aygm-chip--${r.soort}` : 'aygm-chip'}>{t.status[r.status]}</span>
            </span>
          </div>
        ))}
      </div>
    </Venster>
  )
}

/** Per taak (volgorde van t.taken) welke dagen af zijn. */
const VINKEN = [
  [1, 1, 1, 0, 0],
  [1, 1, 0, 0, 0],
  [1, 1, 1, 0, 0],
  [1, 1, 0, 0, 0],
] as const

export async function TakenScherm() {
  const t = WERKVLOER[await getSiteTaal()]
  const kolommen = 'minmax(0, 1fr) repeat(5, 26px)'
  return (
    <Venster actief="Werkvloer" hier="Vandaag">
      <div className="aygm-rooster-kop">
        <div>
          <p className="aygm-boven">{t.takenBoven}</p>
          <p className="aygm-kop">{t.takenKop}</p>
        </div>
        <span className="aygm-chip">{t.dagWeek}</span>
      </div>
      <div className="aygm-tabel">
        <div style={{ gridTemplateColumns: kolommen }}>
          <span>{t.taak}</span>
          {t.dagen.map((d) => (
            <span key={d} style={{ textAlign: 'center' }}>
              {d}
            </span>
          ))}
        </div>
        {t.taken.map((taak, rij) => (
          <div key={taak} style={{ gridTemplateColumns: kolommen }}>
            <span>{taak}</span>
            {(VINKEN[rij] ?? []).map((v, i) => (
              <span key={i} className="aygm-vakje" data-aan={v ? '' : undefined}>
                {v ? <Check size={12} aria-hidden /> : null}
              </span>
            ))}
          </div>
        ))}
      </div>
    </Venster>
  )
}

/** Wie je opvolgt; regel en wat staan in de taal van de pagina, in deze volgorde. */
const OPVOLGEN = [
  { ini: 'EH', naam: 'Eva Hendriks' },
  { ini: 'RS', naam: 'Ruud Smits' },
  { ini: 'NB', naam: 'Noor Bos' },
  { ini: 'JM', naam: 'Jesse Mulder' },
] as const

export async function OpvolgScherm() {
  const t = WERKVLOER[await getSiteTaal()]
  return (
    <Venster actief="Werkvloer" hier="Vandaag">
      <div className="aygm-rooster-kop">
        <div>
          <p className="aygm-boven">{t.opvolgBoven}</p>
          <p className="aygm-kop">{t.opvolgKop}</p>
        </div>
        <span className="aygm-chip aygm-chip--accent">{t.open(OPVOLGEN.length)}</span>
      </div>
      <div className="aygm-lijst">
        {OPVOLGEN.map((o, i) => (
          <div key={o.naam} className="aygm-rij">
            <span className="aygm-wie">
              <span className="aygm-avatar">{o.ini}</span>
              <span className="aygm-rij-tekst">
                <b>{o.naam}</b>
                <span>
                  {t.regels[i]} · {t.wat[i]}
                </span>
              </span>
            </span>
            <span className="aygm-knopje aygm-knopje--rand">
              <Phone size={12} aria-hidden /> {t.opgepakt}
            </span>
          </div>
        ))}
      </div>
    </Venster>
  )
}

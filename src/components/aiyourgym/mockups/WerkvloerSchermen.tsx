import { Check, Phone, Search } from 'lucide-react'
import { REGEL_DEFINITIES } from '@/lib/club/automatisering/regels'
import { Venster } from './kaders'

// Werkvloer: check-in aan de balie, taken en poetslijsten, en wie je vandaag
// opvolgt. De namen van de opvolgregels komen uit Club zelf.

const BINNEN = [
  { ini: 'SB', naam: 'Sanne Bakker', tijd: '09:12', status: 'Actief', soort: 'ok' },
  { ini: 'MV', naam: 'Mo de Vries', tijd: '09:08', status: 'Proeflid', soort: '' },
  { ini: 'LJ', naam: 'Lotte Jansen', tijd: '09:03', status: 'Geen toegang hier', soort: 'letop' },
  { ini: 'TK', naam: 'Tim Kuijpers', tijd: '08:57', status: 'Actief', soort: 'ok' },
] as const

export function CheckinScherm() {
  return (
    <Venster actief="Werkvloer" hier="Check-in">
      <div className="aygm-rooster-kop">
        <div>
          <p className="aygm-boven">Check-in · balie</p>
          <p className="aygm-kop">Nu binnen: 23</p>
        </div>
        <span className="aygm-chip aygm-chip--accent">QR of naam</span>
      </div>
      <div className="aygm-zoek">
        <Search size={14} aria-hidden /> Zoek een lid of scan de QR-code
      </div>
      <div className="aygm-tabel">
        <div style={{ gridTemplateColumns: 'minmax(0, 1fr) 44px auto' }}>
          <span>Lid</span>
          <span>Tijd</span>
          <span>Status</span>
        </div>
        {BINNEN.map((r) => (
          <div key={r.naam} style={{ gridTemplateColumns: 'minmax(0, 1fr) 44px auto' }}>
            <span className="aygm-wie">
              <span className="aygm-avatar">{r.ini}</span>
              <span>{r.naam}</span>
            </span>
            <span>{r.tijd}</span>
            <span>
              <span className={r.soort ? `aygm-chip aygm-chip--${r.soort}` : 'aygm-chip'}>{r.status}</span>
            </span>
          </div>
        ))}
      </div>
    </Venster>
  )
}

const TAKEN = [
  { taak: 'Toestellen afnemen', vink: [1, 1, 1, 0, 0] },
  { taak: 'Kleedkamers controleren', vink: [1, 1, 0, 0, 0] },
  { taak: 'Handdoeken aanvullen', vink: [1, 1, 1, 0, 0] },
  { taak: 'Afsluitronde: lichten en deuren', vink: [1, 1, 0, 0, 0] },
] as const

export function TakenScherm() {
  const kolommen = 'minmax(0, 1fr) repeat(5, 26px)'
  return (
    <Venster actief="Werkvloer" hier="Taken">
      <div className="aygm-rooster-kop">
        <div>
          <p className="aygm-boven">Taken · week</p>
          <p className="aygm-kop">Taken en poetslijst</p>
        </div>
        <span className="aygm-chip">Dag · Week</span>
      </div>
      <div className="aygm-tabel">
        <div style={{ gridTemplateColumns: kolommen }}>
          <span>Taak</span>
          {['Ma', 'Di', 'Wo', 'Do', 'Vr'].map((d) => (
            <span key={d} style={{ textAlign: 'center' }}>
              {d}
            </span>
          ))}
        </div>
        {TAKEN.map((t) => (
          <div key={t.taak} style={{ gridTemplateColumns: kolommen }}>
            <span>{t.taak}</span>
            {t.vink.map((v, i) => (
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

const OPVOLGEN = [
  { ini: 'EH', naam: 'Eva Hendriks', regel: REGEL_DEFINITIES.niet_gezien.titel, wat: '17 dagen niet geweest' },
  { ini: 'RS', naam: 'Ruud Smits', regel: REGEL_DEFINITIES.proefles_opvolgen.titel, wat: 'Proefles gisteren' },
  { ini: 'NB', naam: 'Noor Bos', regel: REGEL_DEFINITIES.welkom.titel, wat: 'Twee weken lid' },
  { ini: 'JM', naam: 'Jesse Mulder', regel: REGEL_DEFINITIES.verjaardag.titel, wat: 'Vandaag jarig' },
] as const

export function OpvolgScherm() {
  return (
    <Venster actief="Werkvloer" hier="Opvolgen">
      <div className="aygm-rooster-kop">
        <div>
          <p className="aygm-boven">Opvolgen · vandaag</p>
          <p className="aygm-kop">Wie spreek je vandaag aan?</p>
        </div>
        <span className="aygm-chip aygm-chip--accent">4 open</span>
      </div>
      <div className="aygm-lijst">
        {OPVOLGEN.map((o) => (
          <div key={o.naam} className="aygm-rij">
            <span className="aygm-wie">
              <span className="aygm-avatar">{o.ini}</span>
              <span className="aygm-rij-tekst">
                <b>{o.naam}</b>
                <span>
                  {o.regel} · {o.wat}
                </span>
              </span>
            </span>
            <span className="aygm-knopje aygm-knopje--rand">
              <Phone size={12} aria-hidden /> Opgepakt
            </span>
          </div>
        ))}
      </div>
    </Venster>
  )
}

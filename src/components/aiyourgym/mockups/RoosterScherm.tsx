import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { ROOSTER } from '@/lib/aiyourgym/taal/woorden/website/mockups/club'
import { Venster } from './kaders'
import { LES, VOORBEELD_VESTIGING } from './voorbeeld'

// Het groepslesrooster in Club: een week, bezetting per les, volle lessen met wachtlijst.
// Teksten in de taal van de pagina (woordenboek ROOSTER); lesnamen blijven gelijk.

const DAGNUMMERS = ['19', '20', '21', '22', '23'] as const
const UREN = ['07:00', '09:00', '12:00', '17:00', '18:30', '20:00'] as const

interface Les {
  dag: number
  uur: number
  naam: string
  /** Bezet en plekken, of het aantal op de wachtlijst als de les vol is. */
  stand: { bezet: number; plekken: number } | { wachtlijst: number }
  soort?: 'vol' | 'druk'
}

const LESSEN: readonly Les[] = [
  { dag: 0, uur: 0, naam: LES.strength, stand: { bezet: 9, plekken: 12 } },
  { dag: 0, uur: 3, naam: LES.conditioning, stand: { bezet: 12, plekken: 14 }, soort: 'druk' },
  { dag: 0, uur: 5, naam: LES.mobility, stand: { bezet: 8, plekken: 12 } },
  { dag: 1, uur: 1, naam: LES.sterk50, stand: { bezet: 10, plekken: 12 }, soort: 'druk' },
  { dag: 1, uur: 4, naam: LES.barbell, stand: { wachtlijst: 3 }, soort: 'vol' },
  { dag: 2, uur: 0, naam: LES.kettlebell, stand: { bezet: 7, plekken: 10 } },
  { dag: 2, uur: 2, naam: LES.engine, stand: { bezet: 6, plekken: 12 } },
  { dag: 2, uur: 4, naam: LES.strength, stand: { bezet: 11, plekken: 12 }, soort: 'druk' },
  { dag: 3, uur: 1, naam: LES.mobility, stand: { bezet: 9, plekken: 12 } },
  { dag: 3, uur: 3, naam: LES.strength, stand: { wachtlijst: 1 }, soort: 'vol' },
  { dag: 3, uur: 5, naam: LES.core, stand: { bezet: 7, plekken: 12 } },
  { dag: 4, uur: 0, naam: LES.conditioning, stand: { bezet: 10, plekken: 14 } },
  { dag: 4, uur: 4, naam: LES.engine, stand: { bezet: 13, plekken: 14 }, soort: 'druk' },
]

export async function RoosterScherm() {
  const t = ROOSTER[await getSiteTaal()]
  return (
    <Venster actief="Planning">
      <div className="aygm-rooster-kop">
        <div>
          <p className="aygm-boven">{t.boven}</p>
          <p className="aygm-kop">{t.kop(VOORBEELD_VESTIGING)}</p>
        </div>
        <span className="aygm-knopje">{t.nieuweLes}</span>
      </div>
      <div className="aygm-rooster">
        <span />
        {t.dagen.map((d, i) => (
          <span key={d} className="aygm-rooster-dag" data-dag={i} data-vandaag={i === 1 ? '' : undefined}>
            {`${d} ${DAGNUMMERS[i] ?? ''}`}
          </span>
        ))}
        {UREN.map((u, i) => (
          <span key={u} className="aygm-rooster-uur" style={{ gridRow: i + 2, gridColumn: 1 }}>
            {u}
          </span>
        ))}
        {LESSEN.map((l) => (
          <span
            key={`${l.dag}-${l.uur}`}
            className="aygm-les"
            data-dag={l.dag}
            style={{ gridColumn: l.dag + 2, gridRow: l.uur + 2 }}
            data-vol={l.soort === 'vol' ? '' : undefined}
            data-druk={l.soort === 'druk' ? '' : undefined}
          >
            <b>{l.naam}</b>
            <span>{'wachtlijst' in l.stand ? t.vol(l.stand.wachtlijst) : `${l.stand.bezet}/${l.stand.plekken}`}</span>
          </span>
        ))}
      </div>
    </Venster>
  )
}

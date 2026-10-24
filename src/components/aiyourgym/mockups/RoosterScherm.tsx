import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { ROOSTER } from '@/lib/aiyourgym/taal/woorden/website/mockups/club'
import { Venster } from './kaders'

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
  { dag: 0, uur: 0, naam: 'Spinning', stand: { bezet: 12, plekken: 16 } },
  { dag: 0, uur: 3, naam: 'Bootcamp', stand: { bezet: 14, plekken: 18 }, soort: 'druk' },
  { dag: 0, uur: 5, naam: 'Yoga', stand: { bezet: 9, plekken: 14 } },
  { dag: 1, uur: 1, naam: 'Pilates', stand: { bezet: 10, plekken: 12 }, soort: 'druk' },
  { dag: 1, uur: 4, naam: 'Spinning', stand: { wachtlijst: 3 }, soort: 'vol' },
  { dag: 2, uur: 0, naam: 'Kettlebell', stand: { bezet: 8, plekken: 12 } },
  { dag: 2, uur: 2, naam: 'Lunchfit', stand: { bezet: 6, plekken: 14 } },
  { dag: 2, uur: 4, naam: 'Body & core', stand: { bezet: 15, plekken: 18 }, soort: 'druk' },
  { dag: 3, uur: 1, naam: '50+ Fit', stand: { bezet: 11, plekken: 14 } },
  { dag: 3, uur: 3, naam: 'Spinning', stand: { wachtlijst: 1 }, soort: 'vol' },
  { dag: 3, uur: 5, naam: 'Yoga', stand: { bezet: 7, plekken: 14 } },
  { dag: 4, uur: 0, naam: 'Bootcamp', stand: { bezet: 13, plekken: 18 } },
  { dag: 4, uur: 4, naam: 'HIIT', stand: { bezet: 16, plekken: 18 }, soort: 'druk' },
]

export async function RoosterScherm() {
  const t = ROOSTER[await getSiteTaal()]
  return (
    <Venster actief="Planning">
      <div className="aygm-rooster-kop">
        <div>
          <p className="aygm-boven">{t.boven}</p>
          <p className="aygm-kop">{t.kop}</p>
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

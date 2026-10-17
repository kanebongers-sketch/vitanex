import { Venster } from './kaders'

// Het groepslesrooster in Club: een week, bezetting per les, volle lessen met wachtlijst.

const DAGEN = ['Ma 19', 'Di 20', 'Wo 21', 'Do 22', 'Vr 23'] as const
const UREN = ['07:00', '09:00', '12:00', '17:00', '18:30', '20:00'] as const

interface Les {
  dag: number
  uur: number
  naam: string
  stand: string
  soort?: 'vol' | 'druk'
}

const LESSEN: readonly Les[] = [
  { dag: 0, uur: 0, naam: 'Spinning', stand: '12/16' },
  { dag: 0, uur: 3, naam: 'Bootcamp', stand: '14/18', soort: 'druk' },
  { dag: 0, uur: 5, naam: 'Yoga', stand: '9/14' },
  { dag: 1, uur: 1, naam: 'Pilates', stand: '10/12', soort: 'druk' },
  { dag: 1, uur: 4, naam: 'Spinning', stand: 'Vol · wachtlijst 3', soort: 'vol' },
  { dag: 2, uur: 0, naam: 'Kettlebell', stand: '8/12' },
  { dag: 2, uur: 2, naam: 'Lunchfit', stand: '6/14' },
  { dag: 2, uur: 4, naam: 'Body & core', stand: '15/18', soort: 'druk' },
  { dag: 3, uur: 1, naam: '50+ Fit', stand: '11/14' },
  { dag: 3, uur: 3, naam: 'Spinning', stand: 'Vol · wachtlijst 1', soort: 'vol' },
  { dag: 3, uur: 5, naam: 'Yoga', stand: '7/14' },
  { dag: 4, uur: 0, naam: 'Bootcamp', stand: '13/18' },
  { dag: 4, uur: 4, naam: 'HIIT', stand: '16/18', soort: 'druk' },
]

export function RoosterScherm() {
  return (
    <Venster actief="Planning">
      <div className="aygm-rooster-kop">
        <div>
          <p className="aygm-boven">Groepslessen · week 43</p>
          <p className="aygm-kop">Lesrooster Centrum</p>
        </div>
        <span className="aygm-knopje">+ Les</span>
      </div>
      <div className="aygm-rooster">
        <span />
        {DAGEN.map((d, i) => (
          <span key={d} className="aygm-rooster-dag" data-dag={i} data-vandaag={i === 1 ? '' : undefined}>
            {d}
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
            <span>{l.stand}</span>
          </span>
        ))}
      </div>
    </Venster>
  )
}

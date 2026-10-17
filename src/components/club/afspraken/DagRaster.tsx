import type { CSSProperties } from 'react'
import { Plus } from 'lucide-react'
import { STATUS_LABEL, type AfspraakWeergave } from '@/lib/club/afspraken/model'
import { plekInRaster, tijdvak, urenIn, type Raster } from '@/lib/club/afspraken/weergave'
import { minutenNaarTijd } from '@/lib/club/rooster/tijd'
import type { Persoon } from './AfspraakFormulier'

// Een dag met een kolom per trainer en de uren van de openingstijd. Elke
// afspraak staat op zijn plek, in de kleur van zijn soort. Op de telefoon
// schuift het raster zijwaarts; de urenkolom blijft staan.

interface Props {
  datum: string
  raster: Raster
  trainers: readonly Persoon[]
  afspraken: readonly AfspraakWeergave[]
  /** Minuten van nu als het vandaag is, anders null. */
  nuMinuten: number | null
  magNieuw: boolean
  onKies: (a: AfspraakWeergave) => void
  onNieuw: (medewerkerId: string) => void
}

export function DagRaster({ datum, raster, trainers, afspraken, nuMinuten, magNieuw, onKies, onNieuw }: Props) {
  const uren = urenIn(raster)
  const hoogte = { '--club-afspraken-uren': uren.length - 1 } as CSSProperties
  const nuTop = nuMinuten !== null && nuMinuten >= raster.van && nuMinuten <= raster.tot ? ((nuMinuten - raster.van) / (raster.tot - raster.van)) * 100 : null

  if (trainers.length === 0) return <p className="club-leeg">Geen trainers om te tonen. Kies een andere trainer of vestiging.</p>

  return (
    <div className="club-afspraken-raster-wrap">
      <div className="club-afspraken-raster" style={{ ...hoogte, '--club-afspraken-kolommen': trainers.length } as CSSProperties}>
        <div className="club-afspraken-rasterkop" aria-hidden />
        {trainers.map((t) => (
          <div key={t.id} className="club-afspraken-rasterkop">
            <span>{t.naam}</span>
            {magNieuw ? (
              <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={() => onNieuw(t.id)} aria-label={`Afspraak maken bij ${t.naam}`}>
                <Plus size={14} aria-hidden />
              </button>
            ) : null}
          </div>
        ))}
        <div className="club-afspraken-uren" aria-hidden>
          {uren.slice(0, -1).map((m) => <span key={m}>{minutenNaarTijd(m)}</span>)}
        </div>
        {trainers.map((t) => (
          <div key={t.id} className="club-afspraken-kolom" role="list" aria-label={`Afspraken van ${t.naam}`}>
            {nuTop !== null ? <span className="club-afspraken-nu" style={{ top: `${nuTop}%` }} aria-hidden /> : null}
            {afspraken.filter((a) => a.medewerkerId === t.id).map((a) => {
              const plek = plekInRaster(a, datum, raster)
              if (!plek) return null
              return (
                <button
                  key={a.id}
                  type="button"
                  role="listitem"
                  className="club-afspraken-blok"
                  data-kleur={a.kleur}
                  data-status={a.status}
                  style={{ top: `${plek.boven}%`, height: `${plek.hoogte}%` }}
                  onClick={() => onKies(a)}
                  aria-label={`${tijdvak(a)}, ${a.lidNaam}, ${a.typeNaam}, ${STATUS_LABEL[a.status]}`}
                >
                  <strong>{a.lidNaam}</strong>
                  <span>{tijdvak(a)} · {a.typeNaam}</span>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

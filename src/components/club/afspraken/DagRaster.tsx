import type { CSSProperties } from 'react'
import { Plus } from 'lucide-react'
import type { AfspraakWeergave } from '@/lib/club/afspraken/model'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { AFSPRAKEN } from '@/lib/aiyourgym/taal/woorden/club/afspraken'
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
  const taal = useTaal()
  const w = useTekst(AFSPRAKEN)
  const t = w.dag
  const uren = urenIn(raster)
  const hoogte = { '--club-afspraken-uren': uren.length - 1 } as CSSProperties
  const nuTop = nuMinuten !== null && nuMinuten >= raster.van && nuMinuten <= raster.tot ? ((nuMinuten - raster.van) / (raster.tot - raster.van)) * 100 : null

  if (trainers.length === 0) return <p className="club-leeg">{t.geenTrainers}</p>

  return (
    <div className="club-afspraken-raster-wrap">
      <div className="club-afspraken-raster" style={{ ...hoogte, '--club-afspraken-kolommen': trainers.length } as CSSProperties}>
        <div className="club-afspraken-rasterkop" aria-hidden />
        {trainers.map((m) => (
          <div key={m.id} className="club-afspraken-rasterkop">
            <span>{m.naam}</span>
            {magNieuw ? (
              <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={() => onNieuw(m.id)} aria-label={t.makenBij(m.naam)}>
                <Plus size={14} aria-hidden />
              </button>
            ) : null}
          </div>
        ))}
        <div className="club-afspraken-uren" aria-hidden>
          {uren.slice(0, -1).map((m) => <span key={m}>{minutenNaarTijd(m)}</span>)}
        </div>
        {trainers.map((m) => (
          <div key={m.id} className="club-afspraken-kolom" role="list" aria-label={t.vanTrainer(m.naam)}>
            {nuTop !== null ? <span className="club-afspraken-nu" style={{ top: `${nuTop}%` }} aria-hidden /> : null}
            {afspraken.filter((a) => a.medewerkerId === m.id).map((a) => {
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
                  aria-label={`${tijdvak(a, taal)}, ${a.lidNaam}, ${a.typeNaam}, ${w.status[a.status]}`}
                >
                  <strong>{a.lidNaam}</strong>
                  <span>{tijdvak(a, taal)} · {a.typeNaam}</span>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

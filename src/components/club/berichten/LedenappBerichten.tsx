import type { Bericht } from '@/lib/club/berichten/model'
import { BerichtAppKaart } from './BerichtAppKaart'
import './berichten.css'

// Berichten op Home in de ledenapp. Verwacht de lijst van
// haalBerichtenVoorLid (al gefilterd en gesorteerd: vastgepind eerst, dan
// het nieuwste). Het eerste vastgepinde bericht staat groot en open; de rest
// compact met "Lees meer". Geen berichten = niets tonen.

const MAX_COMPACT = 4

interface Props {
  berichten: readonly Bericht[]
  /** Voor "Vandaag", "Gisteren"; standaard nu. */
  nu?: Date
}

export function LedenappBerichten({ berichten, nu = new Date() }: Props) {
  if (berichten.length === 0) return null
  const [eerste, ...rest] = berichten
  const groot = eerste.vastgepind ? eerste : null
  const compact = (groot ? rest : berichten).slice(0, MAX_COMPACT)
  return (
    <section className="club-bericht-app-lijst" aria-labelledby="lidapp-berichten">
      <h2 id="lidapp-berichten" className="club-bericht-app-titel">
        Nieuws
      </h2>
      {groot && <BerichtAppKaart bericht={groot} groot nu={nu} />}
      {compact.map((b) => (
        <BerichtAppKaart key={b.id} bericht={b} groot={false} nu={nu} />
      ))}
    </section>
  )
}

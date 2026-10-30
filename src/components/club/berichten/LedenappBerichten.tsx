import type { Bericht } from '@/lib/club/berichten/model'
import { BerichtAppKaart, type FotoBron } from './BerichtAppKaart'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { BERICHTEN } from '@/lib/aiyourgym/taal/woorden/club/berichten'
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
  /** Voor de foto van de afzender: de route voor leden. */
  fotoBron?: FotoBron
}

export function LedenappBerichten({ berichten, nu = new Date(), fotoBron = { waar: 'lid', voor: null } }: Props) {
  const t = useTekst(BERICHTEN).app
  if (berichten.length === 0) return null
  const [eerste, ...rest] = berichten
  const groot = eerste.vastgepind ? eerste : null
  const compact = (groot ? rest : berichten).slice(0, MAX_COMPACT)
  return (
    <section className="club-bericht-app-lijst" aria-labelledby="lidapp-berichten">
      <h2 id="lidapp-berichten" className="club-bericht-app-titel">
        {t.nieuws}
      </h2>
      {groot && <BerichtAppKaart bericht={groot} groot nu={nu} fotoBron={fotoBron} />}
      {compact.map((b) => (
        <BerichtAppKaart key={b.id} bericht={b} groot={false} nu={nu} fotoBron={fotoBron} />
      ))}
    </section>
  )
}

// Rustige skeleton terwijl het rapport wordt opgebouwd.

import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { RAPPORTEN_TEKST } from '@/lib/aiyourgym/taal/woorden/club/rapporten'

export default async function RapportenLaden() {
  const t = await clubTekst(RAPPORTEN_TEKST)
  return (
    <div aria-busy="true" aria-label={t.laden} style={{ display: 'grid', gap: 16 }}>
      <div className="club-skelet" style={{ minHeight: 110 }} />
      <div className="club-raster">
        <div className="club-skelet club-k4" style={{ minHeight: 420 }} />
        <div className="club-skelet club-k8" style={{ minHeight: 420 }} />
      </div>
    </div>
  )
}

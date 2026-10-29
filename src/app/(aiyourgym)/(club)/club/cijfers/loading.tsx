// Rustige skeleton terwijl de cijfers geteld worden.

import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { CIJFERS } from '@/lib/aiyourgym/taal/woorden/club/cijfers'

export default async function CijfersLaden() {
  const t = await clubTekst(CIJFERS)
  return (
    <div aria-busy="true" aria-label={t.laden} style={{ display: 'grid', gap: 16 }}>
      <div className="club-skelet" style={{ minHeight: 120 }} />
      <div className="club-skelet" style={{ minHeight: 180 }} />
      <div className="club-raster">
        <div className="club-skelet club-k8" style={{ minHeight: 320 }} />
        <div className="club-skelet club-k4" style={{ minHeight: 320 }} />
      </div>
    </div>
  )
}

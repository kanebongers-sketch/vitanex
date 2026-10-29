// Rustige skeleton terwijl de ledenkaart geladen wordt.

import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { LEDEN } from '@/lib/aiyourgym/taal/woorden/club/leden'

export default async function LidLaden() {
  const t = await clubTekst(LEDEN)
  return (
    <div aria-busy="true" aria-label={t.pagina.kaartLaden} role="status" style={{ display: 'grid', gap: 16 }}>
      <div className="club-skelet" style={{ minHeight: 150 }} />
      <div className="club-raster">
        <div className="club-k8" style={{ display: 'grid', gap: 16 }}>
          <div className="club-skelet" style={{ minHeight: 240 }} />
          <div className="club-skelet" style={{ minHeight: 280 }} />
        </div>
        <div className="club-skelet club-k4" style={{ minHeight: 360 }} />
      </div>
    </div>
  )
}

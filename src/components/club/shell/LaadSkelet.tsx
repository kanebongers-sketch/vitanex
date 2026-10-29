// Rustige skeleton terwijl een onderdeel van Club laadt. Drie vormen, zodat de
// pagina bij het laden al ongeveer de juiste plek inneemt (geen verspringing):
// 'rooster' (kop, tegels, groot raster), 'lijst' (kop, filterbalk, lijst) en
// 'kaarten' (kop en twee kolommen).

import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { MENU } from '@/lib/aiyourgym/taal/woorden/club/menu'

type Vorm = 'rooster' | 'lijst' | 'kaarten'

export async function LaadSkelet({ vorm }: { vorm: Vorm }) {
  const t = await clubTekst(MENU)
  return (
    <div aria-busy="true" aria-label={t.laden} role="status" style={{ display: 'grid', gap: 16 }}>
      <div className="club-skelet" style={{ minHeight: 96, maxWidth: 520 }} />
      {vorm === 'rooster' && (
        <>
          <div className="club-skelet" style={{ minHeight: 88 }} />
          <div className="club-skelet" style={{ minHeight: 48 }} />
          <div className="club-skelet" style={{ minHeight: 480 }} />
        </>
      )}
      {vorm === 'lijst' && (
        <>
          <div className="club-skelet" style={{ minHeight: 48 }} />
          <div className="club-skelet" style={{ minHeight: 420 }} />
        </>
      )}
      {vorm === 'kaarten' && (
        <div className="club-raster">
          <div className="club-skelet club-k8" style={{ minHeight: 360 }} />
          <div className="club-skelet club-k4" style={{ minHeight: 360 }} />
        </div>
      )}
    </div>
  )
}

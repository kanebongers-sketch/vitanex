import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { CHECKIN } from '@/lib/aiyourgym/taal/woorden/club/checkin'

// Rustige skeleton voor het baliescherm: zoekveld links, teller rechts.

export default async function CheckinLaden() {
  const t = await clubTekst(CHECKIN)
  return (
    <div aria-busy="true" aria-label={t.pagina.laden} role="status" style={{ display: 'grid', gap: 16 }}>
      <div className="club-skelet" style={{ minHeight: 72, maxWidth: 360 }} />
      <div className="club-raster">
        <div className="club-skelet club-k8" style={{ minHeight: 76 }} />
        <div className="club-skelet club-k4" style={{ minHeight: 240 }} />
      </div>
    </div>
  )
}

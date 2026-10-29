// Rustige skeleton terwijl de ledenlijst en de behoudsscores geteld worden.

import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { LEDEN } from '@/lib/aiyourgym/taal/woorden/club/leden'

export default async function LedenLaden() {
  const t = await clubTekst(LEDEN)
  return (
    <div aria-busy="true" aria-label={t.pagina.laden} role="status" style={{ display: 'grid', gap: 16 }}>
      <div className="club-skelet" style={{ minHeight: 96, maxWidth: 520 }} />
      <div className="club-skelet" style={{ minHeight: 112 }} />
      <div className="club-skelet" style={{ minHeight: 48 }} />
      <div className="club-skelet" style={{ minHeight: 420 }} />
    </div>
  )
}

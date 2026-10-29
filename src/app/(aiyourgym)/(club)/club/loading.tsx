import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { VANDAAG } from '@/lib/aiyourgym/taal/woorden/club/vandaag-scherm'

// Rustige skeleton terwijl een onderdeel van de clubsoftware laadt. Onderdelen met
// een eigen laadscherm (leden, check-in) gebruiken dat; de rest valt hierop terug.

export default async function ClubLaden() {
  const t = await clubTekst(VANDAAG)
  return (
    <div aria-busy="true" aria-label={t.laden} role="status" style={{ display: 'grid', gap: 16 }}>
      <div className="club-skelet" style={{ minHeight: 96, maxWidth: 560 }} />
      <div className="club-skelet" style={{ minHeight: 160 }} />
      <div className="club-raster">
        <div className="club-skelet club-k7" style={{ minHeight: 320 }} />
        <div className="club-skelet club-k5" style={{ minHeight: 320 }} />
      </div>
    </div>
  )
}

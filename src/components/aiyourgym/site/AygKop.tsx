import Link from 'next/link'
import { AygLogo } from '@/components/aiyourgym/merk/AygLogo'
import { AygNav } from './AygNav'
import { aygPad } from './paden'

// Kop van de verkoopwebsite: logo, de vier hoofdpagina's en "Probeer gratis".
// Inloggen komt erbij zodra /clubinloggen voor sportscholen open is.

export function AygKop() {
  return (
    <header className="ayg-kop">
      <div className="ayg-wrap ayg-kop-rij">
        <Link href={aygPad()} className="ayg-kop-logo" aria-label="AI Your Gym, naar de voorpagina">
          <AygLogo />
        </Link>
        <AygNav />
      </div>
    </header>
  )
}

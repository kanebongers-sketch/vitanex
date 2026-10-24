'use client'

import { useState } from 'react'
import { bewaarTaalVoorkeur, useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { TALEN, type Taal } from '@/lib/aiyourgym/taal/taal'
import { TAALKEUZE } from '@/lib/aiyourgym/taal/woorden/algemeen/taalkeuze'
import './taal-keuze.css'

// De taalkeuze NL | EN: klein, als een pil met twee standen. Neemt de kleur van
// de omgeving over (currentColor), zodat hij op het papier van de website, in
// de donkere voet en in Club past.
//
// Besluit Kane (24-10-2026): geen /en in adressen. Overal (website, Club,
// ledenapp) bewaart een klik de keuze in de cookie ayg-taal en laadt dezelfde
// pagina opnieuw. Een volledige paginalading, zodat <html lang>, de kop en de
// metadata meegaan. Zonder cookie is alles Nederlands.

interface TaalKeuzeProps {
  className?: string
}

export function TaalKeuze({ className }: TaalKeuzeProps) {
  const huidig = useTaal()
  const t = useTekst(TAALKEUZE)
  const [bezig, setBezig] = useState(false)
  const klasse = className ? `ayg-taalkeuze ${className}` : 'ayg-taalkeuze'
  const kies = (taal: Taal) => {
    if (taal === huidig || bezig) return
    setBezig(true)
    bewaarTaalVoorkeur(taal)
    window.location.reload()
  }
  return (
    <div className={klasse} role="group" aria-label={t.label}>
      {TALEN.map((taal) => (
        <button
          key={taal}
          type="button"
          lang={taal}
          className="ayg-taalkeuze-optie"
          aria-pressed={taal === huidig}
          aria-label={t.naam[taal]}
          disabled={bezig}
          onClick={() => kies(taal)}
        >
          {t.kort[taal]}
        </button>
      ))}
    </div>
  )
}

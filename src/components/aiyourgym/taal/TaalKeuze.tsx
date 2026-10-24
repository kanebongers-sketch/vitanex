'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { bewaarTaalVoorkeur, useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { wisselTaalPad } from '@/lib/aiyourgym/taal/pad'
import { TALEN, type Taal } from '@/lib/aiyourgym/taal/taal'
import { TAALKEUZE } from '@/lib/aiyourgym/taal/woorden/algemeen/taalkeuze'
import './taal-keuze.css'

// De taalkeuze NL | EN: klein, als een pil met twee standen. Neemt de kleur van
// de omgeving over (currentColor), zodat hij op het papier van de website, in
// de donkere voet en in Club past.
//
// - soort 'site' (website): de taal staat in het adres, dus twee gewone links
//   naar dezelfde pagina in de andere taal (een volledige paginalading, zodat
//   <html lang> en de kop meegaan). De keuze wordt ook bewaard als voorkeur.
// - soort 'voorkeur' (Club, ledenapp): bewaart de voorkeur (cookie ayg-taal)
//   en laadt de pagina opnieuw van de server. Plek: het accountmenu van Club en
//   het profiel in de ledenapp (zie docs/aiyourgym/TALEN.md).

interface TaalKeuzeProps {
  soort?: 'site' | 'voorkeur'
  className?: string
}

export function TaalKeuze({ soort = 'site', className }: TaalKeuzeProps) {
  const t = useTekst(TAALKEUZE)
  const klasse = className ? `ayg-taalkeuze ${className}` : 'ayg-taalkeuze'
  return (
    <div className={klasse} role="group" aria-label={t.label}>
      {soort === 'site' ? <SiteLinks /> : <VoorkeurKnoppen />}
    </div>
  )
}

function SiteLinks() {
  const huidig = useTaal()
  const adres = usePathname() ?? '/'
  const t = useTekst(TAALKEUZE)
  return TALEN.map((taal) => (
    <a
      key={taal}
      href={wisselTaalPad(adres, taal)}
      hrefLang={taal}
      lang={taal}
      className="ayg-taalkeuze-optie"
      aria-current={taal === huidig ? 'true' : undefined}
      aria-label={t.naam[taal]}
      onClick={() => bewaarTaalVoorkeur(taal)}
    >
      {t.kort[taal]}
    </a>
  ))
}

function VoorkeurKnoppen() {
  const huidig = useTaal()
  const router = useRouter()
  const [bezig, start] = useTransition()
  const t = useTekst(TAALKEUZE)
  const kies = (taal: Taal) => {
    if (taal === huidig) return
    bewaarTaalVoorkeur(taal)
    start(() => router.refresh())
  }
  return TALEN.map((taal) => (
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
  ))
}

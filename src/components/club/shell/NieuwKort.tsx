'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
import { allePunten, korteDatum, leesGezien, nieuwSleutel, puntTekst } from '@/lib/aiyourgym/nieuw'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { MENU } from '@/lib/aiyourgym/taal/woorden/club/menu'
import { markeerAllesGelezen, useGezienVoorOpenen, vergeetVoorOpenen } from './nieuw-gezien'
import './nieuw.css'

// Wat is nieuw als sectie bovenaan Hulp (ontwerp "Club in 10 minuten"): de
// drie nieuwste updates van AI Your Gym, met een link naar de volledige lijst
// (/club/nieuw blijft). Openen telt als gelezen, net als op /club/nieuw: de
// teller op het vraagteken springt op nul, en wat je nog niet had gezien krijgt
// het label Nieuw.

const AANTAL = 3

export function NieuwKort({ persoon, alleHref }: { persoon: string; alleHref: string }) {
  const voor = useGezienVoorOpenen(persoon)
  const taal = useTaal()
  const t = useTekst(MENU).nieuw
  useEffect(() => {
    markeerAllesGelezen(persoon)
    return () => vergeetVoorOpenen(persoon)
  }, [persoon])
  const gezien = voor === undefined ? null : leesGezien(voor)
  const punten = allePunten().slice(0, AANTAL)
  if (punten.length === 0) return null

  return (
    <section className="club-nieuw-kort" aria-labelledby="hulp-nieuw">
      <header className="club-nieuw-kort-kop">
        <div>
          <h2 id="hulp-nieuw" className="club-hulp-kop">{t.kort}</h2>
          <p>{t.kortUitleg}</p>
        </div>
        <Link href={alleHref} className="club-knop club-knop--stil club-knop--klein">
          {t.alles} <ArrowRight aria-hidden size={15} />
        </Link>
      </header>
      <ol className="club-nieuw-punten">
        {punten.map((p) => {
          const nieuw = gezien !== null && !gezien.has(nieuwSleutel(p))
          const pt = puntTekst(p, taal)
          return (
            <li key={nieuwSleutel(p)} className="club-nieuw-punt" data-nieuw={nieuw ? 'true' : undefined}>
              <time dateTime={p.datum} className="club-nieuw-datum">{korteDatum(p.datum, taal)}</time>
              <div className="club-nieuw-inhoud">
                <h3>
                  {pt.titel}
                  {nieuw && <span className="club-chip club-chip--merk club-chip--geen">{t.label}</span>}
                </h3>
                <p>{pt.tekst}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

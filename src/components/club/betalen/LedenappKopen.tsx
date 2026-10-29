'use client'

import { useState, useTransition } from 'react'
import { Check, ShoppingBag, TriangleAlert } from 'lucide-react'
import { stuur } from '@/components/club/app/verzoek'
import { LegeStaat } from '@/components/club/app/LegeStaat'
import { euro, productInhoud, type Product } from '@/lib/club/betalen/model'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { BETALEN } from '@/lib/aiyourgym/taal/woorden/club/betalen'
import './kopen.css'

// Kopen in de ledenapp: eerst wat het lid nog heeft (strippen en PT-sessies),
// dan de producten van de eigen vestiging. Afrekenen gebeurt op de pagina van
// Stripe (iDEAL of kaart); wij zien geen bank- of kaartgegevens.

interface Props {
  producten: Product[]
  strippen: number
  ptSessies: number
  /** Stripe staat klaar bij de sportschool. */
  open: boolean
  /** De url voor afrekenen (met ?voor= in de voorvertoning). */
  kopenUrl: string
  voorvertoning: boolean
  /** Terug van Stripe: betaald of geannuleerd. */
  terug: 'betaald' | 'geannuleerd' | null
  sportschool: string
}

export function LedenappKopen({ producten, strippen, ptSessies, open, kopenUrl, voorvertoning, terug, sportschool }: Props) {
  const [bezig, start] = useTransition()
  const [actief, setActief] = useState<string | null>(null)
  const [fout, setFout] = useState<string | null>(null)
  const taal = useTaal()
  const t = useTekst(BETALEN).kopen

  function koop(p: Product) {
    setActief(p.id)
    setFout(null)
    start(async () => {
      const uit = await stuur(kopenUrl, 'POST', { productId: p.id })
      const url = uit.ok ? (uit.data as { url?: unknown } | null)?.url : null
      if (typeof url === 'string' && url.startsWith('https://')) {
        window.location.assign(url)
        return
      }
      setFout(uit.ok ? t.nietGestart : uit.fout)
      setActief(null)
    })
  }

  return (
    <div className="club-lidapp-tab club-kopen">
      <h2 className="club-lidapp-kop">{t.titel}</h2>
      {terug === 'betaald' && (
        <p className="club-lidapp-bericht" role="status"><Check aria-hidden size={18} /><span>{t.betaald}</span></p>
      )}
      {terug === 'geannuleerd' && (
        <p className="club-lidapp-bericht" role="status"><span>{t.geannuleerd}</span></p>
      )}
      {(strippen > 0 || ptSessies > 0) && (
        <div className="club-kopen-tegoed" aria-label={t.tegoed}>
          {strippen > 0 && <div className="club-kopen-teller"><strong>{strippen}</strong><span>{t.strippen(strippen)}</span></div>}
          {ptSessies > 0 && <div className="club-kopen-teller"><strong>{ptSessies}</strong><span>{t.sessies(ptSessies)}</span></div>}
        </div>
      )}
      {fout && <p className="club-lidapp-bericht club-lidapp-bericht--fout" role="alert"><TriangleAlert aria-hidden size={18} /><span>{fout}</span></p>}
      {producten.length === 0 ? (
        <LegeStaat Icoon={ShoppingBag} titel={t.leegTitel}>{t.leeg(sportschool)}</LegeStaat>
      ) : (
        <ul className="club-kopen-lijst">
          {producten.map((p) => (
            <li key={p.id} className="club-kopen-product">
              <div>
                <h3>{p.naam}</h3>
                <p>{productInhoud(p, taal)}</p>
                {p.omschrijving && <p>{p.omschrijving}</p>}
              </div>
              <div className="club-kopen-prijs">{euro(p.prijsCent, taal)}</div>
              <button type="button" className="club-lidapp-knop club-lidapp-knop--primair" disabled={!open || voorvertoning || bezig} onClick={() => koop(p)}>
                {bezig && actief === p.id ? t.bezig : t.kopen}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="club-kopen-noot">
        {voorvertoning
          ? t.voorvertoning
          : open
            ? t.open(sportschool)
            : t.dicht}
      </p>
    </div>
  )
}

/** Het blok op Home dat naar Kopen leidt. */
export function KopenBlok({ href, strippen }: { href: string; strippen: number }) {
  const t = useTekst(BETALEN).kopen
  return (
    <a className="club-kopen-blok club-mijn-blok" href={href}>
      <strong>{t.titel}</strong>
      <span>{strippen > 0 ? t.blokStrippen(strippen) : t.blokLeeg}</span>
    </a>
  )
}

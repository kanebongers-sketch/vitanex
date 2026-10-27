'use client'

import { useEffect, useRef, useState } from 'react'
import { scrollPositie, volgScroll } from '@/components/aiyourgym/site/scrollpositie'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { DAG } from '@/lib/aiyourgym/taal/woorden/website/dag'
import { actiefAnker, formatKlok, klokMinuten, type Anker } from './klok'

// De signature move van de voorpagina: een vaste klok in de rand die met de
// scroll een werkdag afloopt, van 06:00 tot 22:00. De momenten zijn de secties
// met data-dag (minuten) en een id; ze zijn ook de knoppen om te springen. Alleen
// op de pc (dag.css); op de telefoon staat de tijd groot in elke sectie.
// De tijd zelf schrijven we rechtstreeks in de DOM (geen render per scrollstap);
// alleen het actieve moment is React-state (vijf mogelijke waarden).

interface Moment {
  id: string
  naam: string
  minuten: number
}

const KIJKLIJN = 0.45

function leesMomenten(): { momenten: Moment[]; elementen: HTMLElement[] } {
  const elementen = Array.from(document.querySelectorAll<HTMLElement>('[data-dag]'))
  const momenten = elementen.map((el) => ({ id: el.id, naam: el.dataset.dagNaam ?? '', minuten: Number(el.dataset.dag) }))
  return { momenten, elementen }
}

export function Dagklok() {
  const t = useTekst(DAG)
  const tijdRef = useRef<HTMLSpanElement>(null)
  const wortelRef = useRef<HTMLElement>(null)
  const [momenten, setMomenten] = useState<Moment[]>([])
  const [actief, setActief] = useState(0)

  useEffect(() => {
    const { momenten: gevonden, elementen } = leesMomenten()
    setMomenten(gevonden)
    const meet = () => {
      const { y, scherm } = scrollPositie()
      const ankers: Anker[] = elementen.map((el, i) => ({ top: el.getBoundingClientRect().top, minuten: gevonden[i].minuten }))
      const lijn = scherm * KIJKLIJN
      if (tijdRef.current) tijdRef.current.textContent = formatKlok(klokMinuten(ankers, lijn))
      setActief(Math.max(0, actiefAnker(ankers, lijn)))
      const wortel = wortelRef.current
      if (wortel) {
        const voet = document.querySelector('.ayg-voet')?.getBoundingClientRect().top ?? Infinity
        if (y > scherm * 0.3 && voet > scherm - 96) wortel.setAttribute('data-zichtbaar', '')
        else wortel.removeAttribute('data-zichtbaar')
      }
    }
    meet()
    return volgScroll(meet)
  }, [])

  if (momenten.length === 0) return null
  const eerste = momenten[0]
  return (
    <nav ref={wortelRef} className="dag-klok" aria-label={t.klokLabel}>
      <p className="dag-klok-nu">
        <span className="ayg-sr">{t.klokNu}</span>
        <span ref={tijdRef} className="dag-klok-tijd">
          {formatKlok(eerste.minuten)}
        </span>
        <span className="dag-klok-naam" aria-hidden>
          {momenten[actief]?.naam}
        </span>
      </p>
      <ol>
        {momenten.map((m, i) => (
          <li key={m.id}>
            <a href={`#${m.id}`} aria-current={i === actief ? 'step' : undefined} data-voorbij={i < actief ? '' : undefined}>
              <time dateTime={formatKlok(m.minuten)}>{formatKlok(m.minuten)}</time>
              <span className="ayg-sr">{m.naam}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

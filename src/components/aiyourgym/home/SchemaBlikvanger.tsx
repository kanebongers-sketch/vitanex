'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { renderVoor } from '@/components/aiyourgym/inhoud/oefenrenders'
import { Oefenbeeld } from '@/components/aiyourgym/mockups/Oefenbeeld'
import { laadPoster } from '@/components/aiyourgym/mockups/OefenLus'
import { posterVan } from '@/components/aiyourgym/mockups/oefenlus-logica'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { BLIKVANGER } from '@/lib/aiyourgym/taal/woorden/website/blikvanger'

// De blikvanger van de voorpagina: een echte oefening uit de bibliotheek als
// onze eigen render (besluit Kane 23-10-2026), met de kop en de genummerde
// kernpunten ernaast. Zonder render valt het beeld terug op het 3D-figuur in
// een doek dat van oefening wisselt, dus nooit meer dan een 3D-beeld tegelijk.
// Bij een render staan de werkende spieren onder de naam. Als de browser even
// niets te doen heeft, halen we de posters van de andere tabbladen alvast op
// (30 tot 60 KB per stuk, geen lussen), zodat een wissel meteen een beeld heeft.
// Teksten en spiernamen in de taal van de pagina (woordenboek BLIKVANGER).

const SIZES = '(max-width: 959px) min(90vw, 560px), 46vw'

/** Posters van de andere oefeningen ophalen als de browser rustig is. */
function useVoorladenPosters(namen: readonly string[]): void {
  const sleutel = namen.join('|')
  useEffect(() => {
    const renders = sleutel.split('|').slice(1).map(renderVoor).filter((r) => r !== undefined)
    if (renders.length === 0) return
    const laad = () => renders.forEach((r) => void laadPoster(posterVan(r, 'speelt'), SIZES))
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(laad, { timeout: 4000 })
      return () => window.cancelIdleCallback(id)
    }
    const id = window.setTimeout(laad, 1500)
    return () => window.clearTimeout(id)
  }, [sleutel])
}

type BlikTeksten = (typeof BLIKVANGER)['nl']

/** ["Bovenbenen", "Romp"] wordt "bovenbenen en romp" | "thighs and core". */
function spierZin(spieren: readonly string[], t: BlikTeksten): string {
  const vertaald: Readonly<Record<string, string | undefined>> = t.spieren
  const namen = spieren.map((s) => vertaald[s] ?? s.toLowerCase())
  if (namen.length <= 1) return namen.join('')
  return `${namen.slice(0, -1).join(', ')} ${t.laatsteVoeg} ${namen[namen.length - 1]}`
}

export interface BlikOefening {
  naam: string
  kort: string
  voorschrift: string
  kernpunten: readonly { punt: string; uitleg: string }[]
}

interface Props {
  oefeningen: readonly BlikOefening[]
  /** Label, kop en inleiding: op de pc rechts boven de kernpunten, op de telefoon boven het beeld. */
  kop: ReactNode
  /** De regel onder de kernpunten. */
  onder: ReactNode
}

export function SchemaBlikvanger({ oefeningen, kop, onder }: Props) {
  const t = useTekst(BLIKVANGER)
  const [index, setIndex] = useState(0)
  useVoorladenPosters(oefeningen.map((x) => x.naam))
  const o = oefeningen[index]
  if (!o) return null
  const spieren = renderVoor(o.naam)?.spieren
  return (
    <div className="ayg-blik">
      <div className="ayg-blik-kop">{kop}</div>
      <figure className="ayg-blik-beeld">
        <Oefenbeeld
          naam={o.naam}
          passend
          bediening
          sizes={SIZES}
          label={t.beeldLabel(o.naam)}
        />
        <figcaption>
          <b>{o.naam}</b>
          <span>{o.voorschrift}</span>
          {spieren && spieren.length > 0 && <span className="ayg-blik-spieren">{t.werktOp(spierZin(spieren, t))}</span>}
        </figcaption>
      </figure>
      <div className="ayg-blik-tekst">
        <div className="ayg-blik-keuze" role="group" aria-label={t.kiesOefening}>
          {oefeningen.map((x, i) => (
            <button key={x.naam} type="button" aria-pressed={i === index} onClick={() => setIndex(i)}>
              {x.kort}
            </button>
          ))}
        </div>
        <ol className="ayg-blik-kern" aria-label={t.kernpuntenBij(o.naam)} aria-live="polite">
          {o.kernpunten.map((k, i) => (
            <li key={k.punt}>
              <span className="ayg-blik-nr" aria-hidden>
                {i + 1}
              </span>
              <span>
                <strong>{k.punt}</strong>
                <span>{k.uitleg}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div className="ayg-blik-onder">{onder}</div>
    </div>
  )
}

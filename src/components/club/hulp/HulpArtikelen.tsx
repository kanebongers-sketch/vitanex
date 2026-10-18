'use client'

import { useId, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Search } from 'lucide-react'
import { filterArtikelen, type Artikel } from '@/lib/club/hulp/artikelen'

// De handleidingen met een zoekveld (simpel filter in de browser). Elk artikel
// is een uitklapblok met stappen en links naar de pagina's in Club.

export function HulpArtikelen({ artikelen }: { artikelen: readonly Artikel[] }) {
  const [zoek, setZoek] = useState('')
  const zoekId = useId()
  const zichtbaar = useMemo(() => filterArtikelen(artikelen, zoek), [artikelen, zoek])
  const zoekt = zoek.trim() !== ''

  return (
    <section className="club-hulp-artikelen" aria-labelledby="hulp-handleidingen">
      <div className="club-hulp-zoekrij">
        <h2 id="hulp-handleidingen" className="club-hulp-kop">Handleidingen</h2>
        <label htmlFor={zoekId} className="club-hulp-zoek">
          <Search size={18} aria-hidden />
          <span className="club-sr">Zoek in de handleidingen</span>
          <input id={zoekId} type="search" className="club-invoer club-invoer--zoek" placeholder="Zoek, bijvoorbeeld wachtlijst of uren" value={zoek} onChange={(e) => setZoek(e.target.value)} autoComplete="off" />
        </label>
      </div>
      <p className="club-sr" role="status" aria-live="polite">
        {zichtbaar.length} {zichtbaar.length === 1 ? 'handleiding' : 'handleidingen'} gevonden
      </p>
      {zichtbaar.length === 0 ? (
        <p className="club-hulp-leeg">Niets gevonden voor &quot;{zoek.trim()}&quot;. Probeer een ander woord, of meld je vraag hieronder.</p>
      ) : (
        <ol className="club-hulp-lijst" role="list">
          {zichtbaar.map((a, i) => (
            <li key={a.sleutel} id={`hulp-${a.sleutel}`}>
              <details className="club-hulp-artikel" open={zoekt && zichtbaar.length <= 2}>
                <summary>
                  <span className="club-hulp-nummer" aria-hidden>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="club-hulp-titel">
                    <strong>{a.titel}</strong>
                    <span>{a.samenvatting}</span>
                  </span>
                </summary>
                <div className="club-hulp-inhoud">
                  <ol className="club-hulp-stappen">
                    {a.stappen.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ol>
                  <ul className="club-hulp-links" role="list">
                    {a.links.map((l) => (
                      <li key={l.pad}>
                        <Link href={l.pad}>
                          {l.label} <ArrowUpRight size={14} aria-hidden />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </details>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

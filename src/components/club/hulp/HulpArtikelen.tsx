'use client'

import { useId, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Search } from 'lucide-react'
import { filterArtikelen, type Artikel } from '@/lib/club/hulp/artikelen'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { HULP } from '@/lib/aiyourgym/taal/woorden/club/hulp'

// De handleidingen met een zoekveld (simpel filter in de browser). Elk artikel
// is een uitklapblok met stappen en links naar de pagina's in Club.

export function HulpArtikelen({ artikelen }: { artikelen: readonly Artikel[] }) {
  const [zoek, setZoek] = useState('')
  const t = useTekst(HULP).artikelen
  const zoekId = useId()
  const zichtbaar = useMemo(() => filterArtikelen(artikelen, zoek), [artikelen, zoek])
  const zoekt = zoek.trim() !== ''

  return (
    <section className="club-hulp-artikelen" aria-labelledby="hulp-handleidingen">
      <div className="club-hulp-zoekrij">
        <h2 id="hulp-handleidingen" className="club-hulp-kop">{t.kop}</h2>
        <label htmlFor={zoekId} className="club-hulp-zoek">
          <Search size={18} aria-hidden />
          <span className="club-sr">{t.zoekLabel}</span>
          <input id={zoekId} type="search" className="club-invoer club-invoer--zoek" placeholder={t.zoekPlaats} value={zoek} onChange={(e) => setZoek(e.target.value)} autoComplete="off" />
        </label>
      </div>
      <p className="club-sr" role="status" aria-live="polite">
        {t.gevonden(zichtbaar.length)}
      </p>
      {zichtbaar.length === 0 ? (
        <p className="club-hulp-leeg">{t.niets(zoek.trim())}</p>
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
